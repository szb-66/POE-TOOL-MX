import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'
import { pythonPath } from './helpers/python.js'
import { createDefaultItemPreset, normalizeItemPreset } from '../src/utils/itemPreset.js'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import {
  freezeBatchConfiguration,
  restoreBatchConfiguration,
  validateBatchCategoryCompatibility,
  validateBatchInventoryLayout
} from '../src/domains/items/batchCrafting.js'
import { ItemFootprintRegistry, ITEM_FOOTPRINT_SCHEMA_VERSION } from '../electron/modules/items/footprintRegistry.js'
import { useScriptStore } from '../src/stores/script.js'

const inventory = { startPos: { x: 100, y: 200 }, slotSize: { w: 50, h: 50 } }
const preset = {
  moduleTwo: { enabled: true }, moduleThree: { enabled: false }, moduleEldritch: { enabled: false }
}
const snapshot = {
  scanId: 'scan-1',
  scannedAt: '2026-09-01T10:00:00+08:00',
  layout: { columns: 12, rows: 5 },
  items: [
    { id: 'b', categoryId: 'ring', baseType: '金光戒指', displayName: '第二件', x: 2, y: 0, width: 1, height: 1, footprintSource: 'catalog', selectable: true },
    { id: 'a', categoryId: 'helmet', baseType: '铁锻重盔', displayName: '第一件', x: 0, y: 2, width: 2, height: 2, footprintSource: 'catalog', selectable: true },
    { id: 'blocked', categoryId: 'ring', baseType: '未知戒指', displayName: '占位歧义', x: 4, y: 0, width: 2, height: 1, footprintSource: 'ambiguous', selectable: false }
  ]
}

function runBatchPreflightScenario(readResults) {
  const template = readFileSync(new URL('../src/assets/scripts/crafting_template.py', import.meta.url), 'utf8')
  const start = template.indexOf('BATCH_CATEGORY_NAMES = {')
  const end = template.indexOf('# 主函数', start)
  assert.ok(start >= 0 && end > start)
  const preflight = template.slice(start, end)
  const script = `
import json, time, unicodedata

class Clipboard:
    def __init__(self):
        self.clears = 0
    def copy(self, value):
        if value == "":
            self.clears += 1

pyperclip = Clipboard()
batch_config = {
    "enabled": True,
    "batchId": "batch-restart",
    "targets": [{
        "id": "target-1", "categoryId": "flask",
        "baseType": "宝钻药剂", "displayName": "临床师的山羊之宝钻药剂",
        "x": 3, "y": 2, "width": 1, "height": 2, "footprintSource": "catalog",
        "position": {"x": 300, "y": 400}
    }]
}
batch_completed_ids = []
batch_current_target = None
item_position = {}
is_running = True
fatal_error_reason = None
reads = list(json.loads(${JSON.stringify(JSON.stringify(readResults))}))
moves = []
failures = []

def move_mouse(x, y):
    moves.append([x, y])
    return True

def read_current_item(**_kwargs):
    return reads.pop(0)

def release_all_keys():
    pass

def play_error_sound():
    pass

${preflight}

def emit_batch_event(*_args, **_kwargs):
    pass

def fail_batch_preflight(_target, reason, code="BATCH_IDENTITY_MISMATCH"):
    failures.append({"reason": reason, "code": code})
    return False

result = preflight_batch_targets()
print(json.dumps({
    "result": result, "reads": ${readResults.length} - len(reads),
    "moves": moves, "clipboardClears": pyperclip.clears, "failures": failures
}, ensure_ascii=False))
`
  const result = spawnSync(pythonPath, ['-c', script], {
    encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

test('旧物品预设迁移后批量功能默认关闭并过滤未知类别', () => {
  assert.deepEqual(createDefaultItemPreset().batchCrafting, { enabled: false, categoryIds: [] })
  assert.deepEqual(normalizeItemPreset({
    batchCrafting: { enabled: true, categoryIds: ['ring', 'map', 'ring', 'flask'] }
  }).batchCrafting, { enabled: true, categoryIds: ['ring', 'flask'] })
})

test('冻结本地扫描批次按列优先生成坐标并排除占位歧义', () => {
  const result = freezeBatchConfiguration({
    snapshot, categoryIds: ['helmet', 'ring'], preset, inventory, batchId: 'batch-1'
  })
  assert.equal(result.valid, true)
  assert.equal(result.config.scanId, 'scan-1')
  assert.deepEqual(result.config.targets.map((item) => item.id), ['a', 'b'])
  assert.deepEqual(result.config.targets[0].position, { x: 100, y: 300 })
  assert.equal(result.config.targets[0].footprintSource, 'catalog')
  assert.equal(Object.hasOwn(result.config, 'characterName'), false)
  assert.equal(Object.hasOwn(result.config, 'memberIds'), false)
  assert.deepEqual(result.config.completedIds, [])
  assert.equal(validateBatchInventoryLayout([{ ...snapshot.items[0], x: 12 }], inventory).valid, false)
  assert.equal(validateBatchCategoryCompatibility({ moduleEldritch: { enabled: true } }, [snapshot.items[0]]).valid, false)
})

test('冻结批次必须来自新扫描且只接受原生十二乘五布局', () => {
  assert.equal(freezeBatchConfiguration({
    snapshot: { items: snapshot.items }, categoryIds: ['ring'], preset, inventory
  }).valid, false)
  assert.equal(validateBatchInventoryLayout([{ ...snapshot.items[0], y: 5 }], inventory).valid, false)
  assert.equal(validateBatchInventoryLayout([{ ...snapshot.items[1], x: 11 }], inventory).valid, false)
})

test('物品尺寸注册表按底材提供核对尺寸，冲突时失败关闭', () => {
  const registry = new ItemFootprintRegistry({ schemaVersion: ITEM_FOOTPRINT_SCHEMA_VERSION, categories: [], items: [] })
  registry.registerStashItem({ category: 'Helmets', baseType: '铁锻重盔', w: 2, h: 2 })
  assert.deepEqual(registry.resolve('头盔', '铁锻重盔'), { width: 2, height: 2, source: 'stash-api' })
  registry.registerStashItem({ category: 'Helmets', baseType: '铁锻重盔', w: 1, h: 1 })
  assert.equal(registry.resolve('头盔', '铁锻重盔'), null)
})

test('重新扫描会把词缀变化前后的魔法药剂归一为同一真实底材', () => {
  const scanner = readFileSync(new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url), 'utf8')
  const start = scanner.indexOf('def resolve_catalog_base_type(')
  const end = scanner.indexOf('\ndef ', start + 4)
  assert.ok(start >= 0 && end > start, '背包扫描缺少目录底材解析函数')
  const helper = scanner.slice(start, end)
  const catalog = {
    schemaVersion: 1,
    items: {
      '功能药剂\u001f宝钻药剂': { width: 1, height: 2 },
      '*\u001f宝钻药剂': { width: 1, height: 2 },
      '功能药剂\u001f灰岩药剂': { width: 1, height: 2 }
    },
    categories: {}
  }
  const script = `
import json, unicodedata
def normalize_footprint_text(value):
    return " ".join(unicodedata.normalize("NFKC", str(value or "")).strip().casefold().split())
${helper}
catalog = json.loads(${JSON.stringify(JSON.stringify(catalog))})
print(json.dumps([
    resolve_catalog_base_type({"category": "功能药剂", "name": "临床师的山羊之宝钻药剂", "baseName": ""}, catalog),
    resolve_catalog_base_type({"category": "功能药剂", "name": "外科医生的骡之宝钻药剂", "baseName": ""}, catalog),
    resolve_catalog_base_type({"category": "功能药剂", "name": "稀有名称", "baseName": "宝钻药剂"}, catalog)
], ensure_ascii=False))
`
  const result = spawnSync(pythonPath, ['-c', script], {
    encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout.trim()), ['宝钻药剂', '宝钻药剂', '宝钻药剂'])
  assert.match(scanner, /"baseType": resolve_catalog_base_type\(parsed, catalog\)/)
})

test('魔法药剂单行名称按完整底材后缀通过批量身份预检', () => {
  const fullName = '鞣革的鲫午鱼之黄玉药剂'
  const parsed = parseItemInfo(`物品类别: 功能药剂\n稀 有 度: 魔法\n${fullName}\n--------\n物品等级: 84`)
  assert.equal(parsed.name, fullName)
  assert.equal(parsed.baseName, '')

  const template = readFileSync(new URL('../src/assets/scripts/crafting_template.py', import.meta.url), 'utf8')
  const start = template.indexOf('def normalized_identity_text(')
  const end = template.indexOf('def emit_batch_event(', start)
  assert.ok(start >= 0 && end > start)
  const helper = template.slice(start, end)
  const script = `
import json, unicodedata
${helper}
print(json.dumps({
  "magic_flask": batch_base_type_matches("黄玉药剂", "", ${JSON.stringify(fullName)}),
  "exact_base": batch_base_type_matches("黄玉药剂", "黄玉药剂", ${JSON.stringify(fullName)}),
  "wrong_base": batch_base_type_matches("紫晶药剂", "", ${JSON.stringify(fullName)}),
  "conflicting_parsed_base": batch_base_type_matches("黄玉药剂", "紫晶药剂", ${JSON.stringify(fullName)})
}, ensure_ascii=False))
`
  const result = spawnSync(pythonPath, ['-c', script], {
    encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout.trim()), {
    magic_flask: true, exact_base: true, wrong_base: false, conflicting_parsed_base: false
  })
})

test('批量预检忽略魔法词缀名称变化并按真实底材继续', () => {
  const result = runBatchPreflightScenario([
    { category: '功能药剂', name: '外科医生的骡之宝钻药剂', baseName: '', footprint: { width: 1, height: 2 } }
  ])

  assert.equal(result.result, true)
  assert.equal(result.reads, 1)
  assert.equal(result.clipboardClears, 1)
  assert.deepEqual(result.moves, [[300, 400]])
  assert.deepEqual(result.failures, [])
})

test('批量预检真实底材不符时仍安全停止', () => {
  const wrong = { category: '功能药剂', name: '炼金的苍璧之灰岩药剂', baseName: '', footprint: { width: 1, height: 2 } }
  const result = runBatchPreflightScenario([wrong])

  assert.equal(result.result, false)
  assert.equal(result.reads, 1)
  assert.equal(result.clipboardClears, 1)
  assert.deepEqual(result.moves, [[300, 400]])
  assert.equal(result.failures.length, 1)
  assert.equal(result.failures[0].code, 'BATCH_BASE_TYPE_MISMATCH')
  assert.match(result.failures[0].reason, /底材不符/)
})

test('批量预检保留类别、尺寸和无法读取的结构化错误码', () => {
  const validIdentity = { category: '功能药剂', name: '外科医生的骡之宝钻药剂', baseName: '' }
  const scenarios = [
    {
      code: 'BATCH_CATEGORY_MISMATCH', reads: 1,
      results: [{ ...validIdentity, category: '戒指', footprint: { width: 1, height: 2 } }]
    },
    {
      code: 'BATCH_SIZE_MISMATCH', reads: 1,
      results: [{ ...validIdentity, footprint: { width: 1, height: 1 } }]
    },
    {
      code: 'BATCH_ITEM_MISSING', reads: 1,
      results: [{ error: '未复制到物品' }]
    }
  ]

  for (const scenario of scenarios) {
    const result = runBatchPreflightScenario(scenario.results)
    assert.equal(result.result, false)
    assert.equal(result.reads, scenario.reads)
    assert.equal(result.failures.length, 1)
    assert.equal(result.failures[0].code, scenario.code)
  }
})

test('生成脚本冻结扫描批次并保证候选预检早于选页、通货预检和输入', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript } = await server.ssrLoadModule('/src/utils/python.js')
    const batchConfig = freezeBatchConfiguration({
      snapshot, categoryIds: ['helmet'], preset, inventory, batchId: 'batch-1'
    }).config
    const generated = generatePythonScript({
      globalShortcuts: { end: 'Alt+3' }, currencyPositions: { alteration: { x: 10, y: 20 } },
      operationDelayMs: 50, itemPosition: batchConfig.targets[0].position, preset: {
        checkInitialItem: true,
        moduleTwo: { enabled: true, mode: 'alteration', affixGroups: [{ requiredAffixes: ['生命'] }] },
        moduleThree: { enabled: false }, moduleEldritch: { enabled: false }
      }, batchConfig, filePaths: { itemInfoFile: 'item.txt', itemInfoResultFile: 'result.json' }
    })
    assert.match(generated, /\\"scanId\\":\\"scan-1\\"/)
    assert.doesNotMatch(generated, /memberIds|characterName/)
    assert.match(generated, /\\"completedIds\\":\[\]/)
    const start = generated.slice(generated.indexOf('def start_crafting():'), generated.indexOf('def craft_one_item('))
    assert.ok(start.indexOf('preflight_batch_targets()') < start.indexOf('select_currency_stash_tab("items")'))
    assert.ok(start.indexOf('select_currency_stash_tab("items")') < start.indexOf('preflight_required_currencies()'))
    assert.ok(start.indexOf('preflight_required_currencies()') < start.indexOf('prepare_item_for_crafting('))
    const preflight = generated.slice(generated.indexOf('def preflight_batch_targets():'), generated.indexOf('# 主函数'))
    assert.doesNotMatch(preflight, /apply_currency\(/)
  } finally {
    await server.close()
  }
})

test('批量恢复固定原成员并按最新背包网格重算位置', () => {
  const initial = freezeBatchConfiguration({
    snapshot, categoryIds: ['helmet', 'ring'], preset, inventory, batchId: 'batch-resume'
  }).config
  const checkpoint = {
    ...initial,
    recoverable: true,
    usageSessionId: 'usage-resume',
    completedIds: [initial.targets[0].id],
    currentItemId: initial.targets[1].id
  }
  const latestInventory = { startPos: { x: 300, y: 400 }, slotSize: { w: 40, h: 60 } }
  const restored = restoreBatchConfiguration({ checkpoint, preset, inventory: latestInventory })

  assert.equal(restored.valid, true)
  assert.equal(restored.config.batchId, 'batch-resume')
  assert.deepEqual(restored.config.completedIds, [initial.targets[0].id])
  assert.deepEqual(restored.config.targets.map(item => item.id), initial.targets.map(item => item.id))
  assert.deepEqual(restored.config.targets[1].position, {
    x: 300 + restored.config.targets[1].x * 40,
    y: 400 + restored.config.targets[1].y * 60
  })
  assert.equal(restoreBatchConfiguration({
    checkpoint,
    preset,
    inventory: { startPos: { x: 300, y: 400 }, slotSize: { w: 0, h: 60 } }
  }).valid, false)
})

test('恢复脚本只预检和制作未完成目标并保留原总进度', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript } = await server.ssrLoadModule('/src/utils/python.js')
    const batchConfig = freezeBatchConfiguration({
      snapshot, categoryIds: ['helmet', 'ring'], preset, inventory, batchId: 'batch-resume'
    }).config
    batchConfig.recovering = true
    batchConfig.completedIds = [batchConfig.targets[0].id]
    const generated = generatePythonScript({
      globalShortcuts: { end: 'Alt+3' }, currencyPositions: { alteration: { x: 10, y: 20 } },
      operationDelayMs: 50, itemPosition: batchConfig.targets[1].position,
      preset: {
        checkInitialItem: true,
        moduleTwo: { enabled: true, mode: 'alteration', affixGroups: [{ requiredAffixes: ['生命'] }] },
        moduleThree: { enabled: false }, moduleEldritch: { enabled: false }
      }, batchConfig, filePaths: { itemInfoFile: 'item.txt', itemInfoResultFile: 'result.json' }
    })
    assert.match(generated, /batch_completed_ids = list\(dict\.fromkeys\(batch_config\.get\("completedIds"\)/)
    assert.match(generated, /targets = \[[\s\S]*target\.get\("id"\) not in batch_completed_ids/)
    assert.match(generated, /pending_targets = \[target for target in targets if target\.get\("id"\) not in batch_completed_ids\]/)
    assert.match(generated, /\\"completedIds\\":\[\\"[^\"]+\\"\]/)
    const startCrafting = generated.slice(generated.indexOf('def start_crafting():'), generated.indexOf('def craft_one_item('))
    assert.ok(startCrafting.indexOf('preflight_batch_targets()') < startCrafting.indexOf('preflight_required_currencies()'))
    const preflight = generated.slice(generated.indexOf('def preflight_batch_targets():'), generated.indexOf('# 主函数'))
    assert.doesNotMatch(preflight, /apply_currency\(/)
  } finally {
    await server.close()
  }
})

test('制作页提示用户自行打开页面并以跨格矩形展示扫描结果', () => {
  const source = readFileSync(new URL('../src/domains/items/components/ModuleBatch.vue', import.meta.url), 'utf8')
  assert.match(source, /请先在游戏中打开角色背包和通货仓库页面/)
  assert.match(source, /不会主动打开或切换页面/)
  assert.match(source, /stashTabSelection\?\.enabled/)
  assert.match(source, /扫描背包/)
  assert.match(source, /重新扫描/)
  assert.match(source, /repeat\(12, 1fr\)/)
  assert.match(source, /repeat\(5, 1fr\)/)
  assert.match(source, /width: `\$\{item\.width \/ 12 \* 100\}%`/)
  assert.match(source, /height: `\$\{item\.height \/ 5 \* 100\}%`/)
  assert.match(source, /repeating-linear-gradient/)
  assert.match(source, /gridIssues/)
  assert.match(source, /issue-region/)
  assert.match(source, /尺寸来源/)
  assert.doesNotMatch(source, /账号|赛季|角色列表|重新同步/)
})

test('扫描 IPC 受自动化互斥、主窗口权限和临时配置清理保护', () => {
  const source = readFileSync(new URL('../electron/modules/ipc/bag.js', import.meta.url), 'utf8')
  assert.match(source, /automationLock\?\.acquire\('批量背包扫描'\)/)
  assert.match(source, /if \(!isMainWindowSender\(event\)\)/)
  assert.match(source, /itemFootprintRegistry\.snapshot\(\)/)
  assert.match(source, /pythonAutomationTiming\(config\)/)
  assert.match(source, /mode === 'scan' \? \[\.\.\.requiredModules, 'onnxruntime'\]/)
  assert.match(source, /resolveHighlightModelPaths\(\)/)
  assert.match(source, /fs\.rmSync\(configPath, \{ force: true \}\)/)
  assert.match(source, /automationLock\?\.release\('批量背包扫描'\)/)
})

test('用户停止扫描只在子进程关闭时生成一次取消终态', () => {
  const source = readFileSync(new URL('../electron/modules/ipc/bag.js', import.meta.url), 'utf8')
  const stopBody = source.slice(source.indexOf('export function stopBatchInventoryScan'), source.indexOf('function effectiveDetectionReady'))
  const closeBody = source.slice(source.indexOf("child.on('close', async code => {", source.indexOf('async function startBatchInventoryScan')), source.indexOf('const TEMPLATE_RUNTIME_KEYS'))
  assert.match(stopBody, /batchScanStopRequests\.set\(child/)
  assert.doesNotMatch(stopBody, /batch-crafting-scan-stopped|automationLock\?\.release/)
  assert.match(closeBody, /const stopRequest = batchScanStopRequests\.get\(child\)/)
  assert.match(closeBody, /cancelled: true[\s\S]*?errorCode: 'USER_STOPPED'/)
  assert.ok(closeBody.indexOf('const result = stopRequest') < closeBody.indexOf(': terminal ||'))

  const store = readFileSync(new URL('../src/stores/batchCrafting.js', import.meta.url), 'utf8')
  const view = readFileSync(new URL('../src/domains/items/components/ModuleBatch.vue', import.meta.url), 'utf8')
  assert.match(store, /caught\?\.code !== 'USER_STOPPED'/)
  assert.match(view, /error\?\.code === 'USER_STOPPED'/)
})

test('背包扫描复用取点的主窗口最小化与恢复生命周期', () => {
  const ipcSource = readFileSync(new URL('../electron/modules/ipc/bag.js', import.meta.url), 'utf8')
  const scanBody = ipcSource.slice(ipcSource.indexOf('async function startBatchInventoryScan'), ipcSource.indexOf('const TEMPLATE_RUNTIME_KEYS'))
  assert.ok(scanBody.indexOf('await bagWindowApi.minimizeMainWindowForAutomation()') < scanBody.indexOf("spawnPython(python, 'scan', configPath)"))
  const closeHandler = ipcSource.slice(
    ipcSource.indexOf("child.on('close', async code => {", ipcSource.indexOf('function startBatchInventoryScan')),
    ipcSource.indexOf('const TEMPLATE_RUNTIME_KEYS')
  )
  assert.match(closeHandler, /await bagWindowApi\.restoreMainWindowToForeground\(\)/)
  assert.ok(closeHandler.indexOf("automationLock?.release('批量背包扫描')") < closeHandler.indexOf('await bagWindowApi.restoreMainWindowToForeground()'))
  assert.ok(closeHandler.indexOf('await bagWindowApi.restoreMainWindowToForeground()') < closeHandler.indexOf('resolve(result)'))
  assert.doesNotMatch(ipcSource, /batch-crafting-focus-after-scan/)

  const windowManager = readFileSync(new URL('../electron/modules/window/manager.js', import.meta.url), 'utf8')
  assert.match(windowManager, /export function minimizeMainWindowForAutomation\(\)/)
  assert.match(windowManager, /function preparePickerSession\(\)[\s\S]*?minimizeMainWindowForAutomation\(\)/)
})

test('每次重新扫描都会清空旧类别选择，异常批次不能直接复用', () => {
  const source = readFileSync(new URL('../src/stores/batchCrafting.js', import.meta.url), 'utf8')
  const scanBody = source.slice(source.indexOf('async function scanInventory'), source.indexOf('async function stopScan'))
  assert.match(scanBody, /snapshot\.value = null/)
  assert.match(scanBody, /categoryIds: \[\]/)
  assert.match(scanBody, /batchCrafting\.clearRecovery\(\)/)
})

test('批量逐件完成事件按稳定 ID 去重并由新批次清空', () => {
  setActivePinia(createPinia())
  const store = useScriptStore()
  store.beginBatch({ targets: [{ id: 'a' }, { id: 'b' }] }, 'usage-1')
  const completed = {
    event: 'crafting-batch-item-completed', total: 2, completed: 1, remaining: 1,
    currentItem: { id: 'a', displayName: '第一件' }
  }
  store.applyItemResult(completed)
  store.applyItemResult(completed)
  assert.deepEqual(store.batchRuntime.completedIds, ['a'])
  store.applyItemResult({ event: 'crafting-batch-completed', total: 2, completed: 2, remaining: 0 })
  assert.deepEqual(store.batchRuntime.completedIds, ['a'])
  store.beginBatch({ targets: [{ id: 'c' }] }, 'usage-2')
  assert.deepEqual(store.batchRuntime.completedIds, [])
})

test('批量预览展示完成勾选并提供可持久关闭的扫描确认', () => {
  const source = readFileSync(new URL('../src/domains/items/components/ModuleBatch.vue', import.meta.url), 'utf8')
  assert.match(source, /completedSet/)
  assert.match(source, /completion-mark/)
  assert.match(source, /<Check \/>/)
  assert.match(source, /batchScanConfirmationSuppressed/)
  assert.match(source, /不再显示/)
  assert.ok(source.indexOf('await ElMessageBox.confirm') < source.indexOf('updateBatchScanConfirmationSuppressed(true)'))
})
