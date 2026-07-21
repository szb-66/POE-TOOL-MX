import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  buildBagRuntimeConfig,
  findBagBlacklistMatch,
  normalizeBagBlacklist,
  normalizeBagSettings,
  parseBagItemHeader
} from '../src/utils/bagConfig.js'
import { BagSessionController, createEventLineParser } from '../electron/modules/bag/orchestrator.js'

const scriptUrl = new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url)
const scriptPath = fileURLToPath(scriptUrl)

test('旧背包设置补齐空黑名单并忽略废弃按钮位置', () => {
  const settings = normalizeBagSettings({
    moduleEnabled: true,
    buttonPosition: { x: 1, y: 2 },
    templates: { stashTitle: 'stash.png', inventoryTitle: 'inventory.png' }
  })
  assert.equal(settings.moduleEnabled, true)
  assert.deepEqual(settings.blacklist, [])
  assert.equal('buttonPosition' in settings, false)
  assert.equal(settings.templates.stashTitle, 'stash.png')
})

test('黑名单规范化仅保留名称、基底和类别的非空规则', () => {
  assert.deepEqual(normalizeBagBlacklist([
    { field: 'name', keyword: '  神圣石 ' },
    { field: 'baseName', keyword: '戒指' },
    { field: 'category', keyword: '通货' },
    { field: 'rarity', keyword: '传奇' },
    { field: 'name', keyword: ' ' }
  ]), [
    { field: 'name', keyword: '神圣石' },
    { field: 'baseName', keyword: '戒指' },
    { field: 'category', keyword: '通货' }
  ])
})

test('物品头解析支持中文和英文复制格式', () => {
  assert.deepEqual(parseBagItemHeader('物品类别: 饰品\n稀 有 度: 稀有\n风暴之眼\n紫晶戒指\n--------\n物品等级: 84'), {
    category: '饰品', name: '风暴之眼', baseName: '紫晶戒指'
  })
  assert.deepEqual(parseBagItemHeader('Item Class: Stackable Currency\nRarity: Currency\nChaos Orb\n--------'), {
    category: 'Stackable Currency', name: 'Chaos Orb', baseName: ''
  })
  assert.equal(parseBagItemHeader('普通剪贴板文本'), null)
})

test('黑名单按指定字段做不区分大小写的包含匹配', () => {
  const item = { name: 'Chaos Orb', baseName: '', category: 'Stackable Currency' }
  assert.deepEqual(findBagBlacklistMatch(item, [{ field: 'name', keyword: ' chaos ' }]), { field: 'name', keyword: 'chaos' })
  assert.equal(findBagBlacklistMatch(item, [{ field: 'baseName', keyword: 'orb' }]), null)
  assert.deepEqual(findBagBlacklistMatch(item, [{ field: 'category', keyword: 'CURRENCY' }]), { field: 'category', keyword: 'CURRENCY' })
})

test('运行配置包含模板区域、网格、黑名单和三类延迟', () => {
  const config = buildBagRuntimeConfig({
    templates: {
      stashTitle: 's.png', inventoryTitle: 'i.png',
      stashRegion: { left: 1, top: 2, right: 3, bottom: 4 },
      inventoryRegion: { left: 5, top: 6, right: 7, bottom: 8 }
    },
    blacklist: [{ field: 'category', keyword: '通货' }]
  }, {
    inventory: { startPos: { x: 10, y: 20 }, slotSize: { w: 30, h: 40 } },
    delays: { mouseMove: 50, action: 60, clipboardRead: 70 }
  })
  assert.equal(config.templates.inventoryRegion.left, 5)
  assert.deepEqual(config.inventory.slotSize, { w: 30, h: 40 })
  assert.equal(config.blacklist[0].keyword, '通货')
  assert.deepEqual(config.delays, { mouseMove: 50, action: 60, clipboardRead: 70 })
})

test('结构化事件解析器支持跨 chunk 行并忽略普通日志', () => {
  const events = []
  const logs = []
  const parse = createEventLineParser((event) => events.push(event), (line) => logs.push(line))
  parse('普通日志\nEVENT {"event":"stash-pro')
  parse('gress","progress":50}\n')
  assert.deepEqual(events, [{ event: 'stash-progress', progress: 50 }])
  assert.deepEqual(logs, ['普通日志'])
})

test('单会话只自动执行一次，not-ready 后重新解锁，手动补扫校验互斥', () => {
  const state = new BagSessionController()
  assert.equal(state.setReady(true), true)
  assert.equal(state.beginAutomatic().success, true)
  state.finishStash()
  assert.equal(state.setReady(true), false)
  assert.equal(state.beginManual().success, true)
  assert.equal(state.beginManual().success, false)
  state.finishStash()
  state.setReady(false)
  assert.equal(state.setReady(true), true)
})

test('失去前台不会解锁当前界面会话，返回前台也不会重复自动执行', () => {
  const state = new BagSessionController()
  assert.equal(state.setReady(true, true), true)
  assert.equal(state.beginAutomatic().success, true)
  state.finishStash()
  assert.equal(state.setReady(true, false), false)
  assert.equal(state.beginManual().success, false)
  assert.equal(state.setReady(true, true), false)
  state.setReady(false, false)
  assert.equal(state.setReady(true, true), true)
})

test('Python 检测状态需要连续三次命中或丢失才切换', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
state = (False, 0, 0)
changes = []
for matched in [True, True, True, False, False, False]:
    ready, hits, misses, changed = module.advance_detection_state(*state, matched)
    state = (ready, hits, misses)
    changes.append([ready, changed])
print(json.dumps(changes))
`
  const result = spawnSync('python', ['-c', code], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), [
    [false, false], [false, false], [true, true],
    [true, false], [true, false], [false, true]
  ])
})

test('Python 入库对空格、无效文本和安全门禁采用失败关闭策略', () => {
  const source = readFileSync(scriptUrl, 'utf8')
  assert.match(source, /clipboard_sequence_number\(\)/)
  assert.match(source, /copy_status == "empty"[\s\S]*emptySlots/)
  assert.match(source, /item is None:[\s\S]*unreadableSlots/)
  assert.match(source, /if not is_game_foreground\(\):[\s\S]*game-not-foreground/)
  assert.match(source, /if not interface_ready:[\s\S]*interface-lost/)
  assert.match(source, /finally:[\s\S]*controller\.release_all\(\)/)
  assert.ok(source.indexOf('if not is_game_foreground():') < source.indexOf('elif controller.ctrl_click():'))
  assert.ok(source.indexOf('if not interface_ready:') < source.indexOf('elif controller.ctrl_click():'))
})
