import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import { spawnSync as _m0_spawnSync } from 'node:child_process'
import { fileURLToPath as _m0_fileURLToPath } from 'node:url'
import { pythonPath as _m0_pythonPath } from './helpers/python.js'
import _m0_vm from 'node:vm'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { existsSync as _m1_existsSync } from 'node:fs'
import { spawnSync as _m1_spawnSync } from 'node:child_process'
import { resolve as _m1_resolve } from 'node:path'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { createHash as _m2_createHash } from 'node:crypto'
import { spawnSync as _m2_spawnSync } from 'node:child_process'
import { createFaustusRuntimeLanguage as _m2_createFaustusRuntimeLanguage } from '../electron/modules/faustus/runtimeLanguage.js'
import { FaustusManager as _m2_FaustusManager } from '../electron/modules/faustus/manager.js'
import { normalizeFaustusStartRequest as _m2_normalizeFaustusStartRequest } from '../electron/modules/faustus/schema.js'
import { getServer as _m2_getServer } from '../shared/serverMode.js'
import { pythonPath as _m2_pythonPath } from './helpers/python.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { readFileSync as _m3_readFileSync } from 'node:fs'
import { spawnSync as _m3_spawnSync } from 'node:child_process'
import { fileURLToPath as _m3_fileURLToPath } from 'node:url'
import { pythonPath as _m3_pythonPath } from './helpers/python.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { readFileSync as _m4_readFileSync } from 'node:fs'
import { spawnSync as _m4_spawnSync } from 'node:child_process'
import { pythonPath as _m4_pythonPath } from './helpers/python.js'
import { EMPTY_SLOT_THRESHOLD as _m4_EMPTY_SLOT_THRESHOLD, normalizeEmptySlotThreshold as _m4_normalizeEmptySlotThreshold } from '../src/utils/inventorySettings.js'
import { buildBagRuntimeConfig as _m4_buildBagRuntimeConfig } from '../src/utils/bagConfig.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { readFileSync as _m5_readFileSync } from 'node:fs'
import { fileURLToPath as _m5_fileURLToPath } from 'node:url'
import { runPython as _m5_runPython } from './helpers/python.js'
import { normalizeStashPickupProfile as _m5_normalizeStashPickupProfile, normalizeStashPickupSettings as _m5_normalizeStashPickupSettings } from '../src/utils/stashPickupConfig.js'
import { migrateStashGridCalibration as _m5_migrateStashGridCalibration, normalizeStashGridRegion as _m5_normalizeStashGridRegion } from '../src/utils/stashGridCalibration.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { existsSync as _m6_existsSync, readFileSync as _m6_readFileSync } from 'node:fs'
import { spawnSync as _m6_spawnSync } from 'node:child_process'
import _m6_path from 'node:path'
import { fileURLToPath as _m6_fileURLToPath } from 'node:url'
import { DEFAULT_STASH_TAB_NAMES as _m6_DEFAULT_STASH_TAB_NAMES, STASH_TAB_TYPES as _m6_STASH_TAB_TYPES, createDefaultStashTabSelection as _m6_createDefaultStashTabSelection, normalizeStashTabSelection as _m6_normalizeStashTabSelection, validateStashTabSelection as _m6_validateStashTabSelection } from '../src/utils/stashTabSelection.js'
import { resolveCraftingPython as _m6_resolveCraftingPython } from '../electron/modules/python/launcher.js'

// === Merged from chaosRecipeAutomation.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const spawnSync = _m0_spawnSync
  const fileURLToPath = _m0_fileURLToPath
  const pythonPath = _m0_pythonPath
  const vm = _m0_vm
const scriptUrl = new URL('../src/assets/scripts/chaos_recipe_pick_template.py', import.meta.url)
const scriptPath = fileURLToPath(scriptUrl)

test('取件脚本只用复制结果确认原位是否还有物品，不做屏幕或身份校验', () => {
  const source = readFileSync(scriptUrl, 'utf8')
  const loop = source.slice(source.indexOf('for index, expected'))
  const transfer = source.slice(source.indexOf('def transfer_item'), source.indexOf('def run'))
  assert.doesNotMatch(source, /cv2|mss|numpy|InterfaceMatcher|source_changed|capture_source|safety_error|parse_item|matches\(/)
  assert.ok(loop.indexOf('CONTROLLER.move') < loop.indexOf('transfer_item('))
  assert.ok(loop.indexOf('transfer_item(') < loop.indexOf('emit("item-picked"'))
  assert.ok(transfer.indexOf('copy_item()') < transfer.indexOf('ctrl_click()'))
  assert.ok(transfer.indexOf('ctrl_click()') < transfer.lastIndexOf('copy_item()'))
})

function loadAutomationManager() {
  const source = readFileSync(new URL('../electron/modules/chaosRecipe/automation.js', import.meta.url), 'utf8')
  const executable = source
    .slice(source.indexOf('function parseEvents'))
    .replace('export class ChaosRecipeAutomationManager', 'class ChaosRecipeAutomationManager') +
    '\nglobalThis.AutomationManager = ChaosRecipeAutomationManager'
  const sandbox = {
    console,
    setTimeout,
    structuredClone,
    app: { isPackaged: false },
    spawn() { throw new Error('测试不应启动子进程') },
    fs: {},
    path: {},
    moduleDir: '',
    CHAOS_ERROR_CODES: {
      AUTOMATION_RUNNING: 'AUTOMATION_RUNNING',
      INVENTORY_FULL: 'INVENTORY_FULL',
      GAME_NOT_FOREGROUND: 'GAME_NOT_FOREGROUND',
      ITEM_MISMATCH: 'ITEM_MISMATCH'
    },
    ChaosRecipeError: class extends Error {},
    resolveStashGridLayout: () => ({ region: { left: 0, top: 0, right: 120, bottom: 120 } })
  }
  vm.runInNewContext(executable, sandbox)
  return sandbox.AutomationManager
}

test('取件脚本比较点击前后复制文本，原位文本相同时重试一次并报告满包', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("recipe", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class Controller:
    delay = 0.08
    def __init__(self, copies): self.clicks = 0; self.copies = iter(copies)
    def copy_item(self): return next(self.copies)
    def ctrl_click(self): self.clicks += 1

def execute(copies):
    controller = Controller(copies)
    result = module.transfer_item(controller)
    return [result[0], result[1], controller.clicks]

first = execute(["before", ""])
changed = execute(["before", "other"])
retry = execute(["before", "before", ""])
full = execute(["before", "before", "before"])
missing = execute([""])

events = []
class FakeController:
    delay = 0.08
    moves = 0
    def move(self, *_args): self.moves += 1; return True
    def release_all(self): pass
controller = FakeController()
module.InputController = lambda _delay: controller
module.is_game_foreground = lambda: True
module.transfer_item = lambda *_args: (False, ("INVENTORY_FULL", "背包空间不足，请清空背包后继续"))
module.emit = lambda event, **payload: events.append({"event": event, **payload})
exit_code = module.run({"items": [
  {"id": "first", "screen": {"x": 1, "y": 1, "width": 10, "height": 10, "clickX": 6, "clickY": 6}},
  {"id": "second", "screen": {"x": 20, "y": 1, "width": 10, "height": 10, "clickX": 25, "clickY": 6}}
]})

print(json.dumps({
  "first": first,
  "changed": changed,
  "retry": retry,
  "full": full,
  "missing": missing,
  "exit": exit_code,
  "moves": controller.moves,
  "events": events
}, ensure_ascii=False))
`
  const result = spawnSync(pythonPath, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  const values = JSON.parse(result.stdout)
  assert.deepEqual(values.first, [true, null, 1])
  assert.deepEqual(values.changed, [true, null, 1])
  assert.deepEqual(values.retry, [true, null, 2])
  assert.deepEqual(values.full, [false, ['INVENTORY_FULL', '背包空间不足，请清空背包后继续'], 2])
  assert.deepEqual(values.missing, [false, ['ITEM_MISMATCH', '目标位置没有可复制的物品'], 0])
  assert.equal(values.exit, 2)
  assert.equal(values.moves, 1)
  assert.deepEqual(values.events, [{
    event: 'aborted',
    code: 'INVENTORY_FULL',
    reason: '背包空间不足，请清空背包后继续',
    index: 0
  }])
})

test('配方脚本不再恢复或激活游戏窗口', () => {
  const source = readFileSync(scriptUrl, 'utf8')
  assert.doesNotMatch(source, /find_game_window|focus_game_window|restore_game_window_if_minimized|SetForegroundWindow/)
})

test('取件失败会关闭不可交互浮窗而不是留下卡死提示', () => {
  const source = readFileSync(
    new URL('../electron/modules/chaosRecipe/automation.js', import.meta.url),
    'utf8'
  )
  const failMethod = source.slice(source.indexOf('fail(reason'), source.indexOf('getStatus()'))
  assert.match(failMethod, /this\.overlay\.close\(\)/)
  assert.doesNotMatch(failMethod, /this\.overlay\.update/)
})

test('配方取件每次移动、复制和点击前检查前台，失焦时释放输入', () => {
  const source = readFileSync(scriptUrl, 'utf8')
  assert.match(source, /def move\(self, x, y\):\s*require_game_foreground\(\)/)
  assert.match(source, /def copy_item\(self\):\s*require_game_foreground\(\)/)
  assert.match(source, /pyperclip\.copy\(""\)[\s\S]*?require_game_foreground\(\)[\s\S]*?self\.keyboard\.press\(Key\.ctrl\)/)
  assert.match(source, /def ctrl_click\(self\):\s*require_game_foreground\(\)/)
  assert.match(source, /def copy_item\(self\):[\s\S]*?self\.keyboard\.press\(Key\.ctrl\)\s*time\.sleep\(MODIFIER_SETTLE_SECONDS\)[\s\S]*?self\.keyboard\.press\("c"\)\s*time\.sleep\(KEY_HOLD_SECONDS\)\s*self\.keyboard\.release\("c"\)\s*time\.sleep\(RELEASE_SETTLE_SECONDS\)\s*self\.keyboard\.release\(Key\.ctrl\)/)
  assert.match(source, /self\.clipboard_timeout = CLIPBOARD_RESPONSE_MIN_SECONDS/)
  assert.match(source, /time\.sleep\(self\.clipboard_timeout\)[\s\S]*?pyperclip\.paste\(\)/)
  assert.match(source, /InputController\(config\)/)
  assert.doesNotMatch(source, /timing_mode|adaptive_timeout_ms/)
  assert.match(source, /def ctrl_click\(self\):[\s\S]*?self\.keyboard\.press\(Key\.ctrl\)\s*time\.sleep\(MODIFIER_SETTLE_SECONDS\)[\s\S]*?self\.mouse\.press\(Button\.left\)\s*time\.sleep\(BUTTON_HOLD_SECONDS\)\s*self\.mouse\.release\(Button\.left\)\s*time\.sleep\(RELEASE_SETTLE_SECONDS\)\s*self\.keyboard\.release\(Key\.ctrl\)/)
  assert.match(source, /except GameNotForegroundError as error:[\s\S]*?code="GAME_NOT_FOREGROUND"/)
})

test('满包暂停保留游标、计划、锁和高亮，并从当前物品恢复', async () => {
  const AutomationManager = loadAutomationManager()
  let releases = 0
  const overlays = []
  const manager = new AutomationManager({
    getMainWindow: () => null,
    overlay: {
      create: value => overlays.push(value),
      close() {}
    },
    automationLock: { release: () => { releases += 1 } },
    windowActivation: { activateGame: async () => ({ success: true }) }
  })
  manager.plan = {
    itemCount: 2,
    tabs: [{ tabId: 'tab-1', tabName: '配方页', columns: 12, items: [{ id: 'a' }, { id: 'b' }] }]
  }
  manager.config = { calibration: {} }
  manager.status = 'running'
  const firstChild = { killed: false, exitCode: null, kill() { this.killed = true; this.exitCode = 0 } }
  manager.child = firstChild
  manager.handleEvent(firstChild, { event: 'item-picked', itemId: 'a' })

  const secondChild = { killed: false, exitCode: null, kill() { this.killed = true; this.exitCode = 0 } }
  manager.child = secondChild
  manager.handleEvent(secondChild, {
    event: 'aborted',
    code: 'INVENTORY_FULL',
    reason: '背包空间不足，请清空背包后继续'
  })

  assert.equal(manager.status, 'paused')
  assert.equal(manager.itemOffset, 1)
  assert.equal(manager.completedItems, 1)
  assert.equal(manager.plan.tabs[0].items[1].id, 'b')
  assert.equal(manager.code, 'INVENTORY_FULL')
  assert.equal(releases, 0)
  assert.equal(secondChild.killed, true)
  assert.deepEqual(overlays.at(-1).items.map(item => item.id), ['b'])

  let resumedIds = []
  manager.spawnCurrentTab = function () {
    resumedIds = this.currentTab().items.slice(this.itemOffset).map(item => item.id)
    return { success: true, status: this.status }
  }
  await manager.resume()
  assert.deepEqual(resumedIds, ['b'])
  assert.equal(manager.code, '')
})

test('游戏失焦暂停保留当前物品游标并允许继续', async () => {
  const AutomationManager = loadAutomationManager()
  const overlays = []
  const manager = new AutomationManager({
    getMainWindow: () => null,
    overlay: { create: value => overlays.push(value), close() {} },
    automationLock: { release() {} },
    windowActivation: { activateGame: async () => ({ success: true }) }
  })
  manager.plan = {
    itemCount: 2,
    tabs: [{ tabId: 'tab-1', tabName: '配方页', columns: 12, items: [{ id: 'a' }, { id: 'b' }] }]
  }
  manager.config = { calibration: {} }
  manager.status = 'running'
  manager.itemOffset = 1
  manager.completedItems = 1
  const child = { killed: false, exitCode: null, kill() { this.killed = true; this.exitCode = 0 } }
  manager.child = child
  manager.handleEvent(child, {
    event: 'aborted', code: 'GAME_NOT_FOREGROUND', reason: '游戏窗口运行中失去前台'
  })

  assert.equal(manager.status, 'paused')
  assert.equal(manager.code, 'GAME_NOT_FOREGROUND')
  assert.equal(manager.itemOffset, 1)
  assert.equal(manager.completedItems, 1)
  assert.deepEqual(overlays.at(-1).items.map(item => item.id), ['b'])

  let resumedIds = []
  manager.spawnCurrentTab = function () {
    resumedIds = this.currentTab().items.slice(this.itemOffset).map(item => item.id)
    return { success: true, status: this.status }
  }
  await manager.resume()
  assert.deepEqual(resumedIds, ['b'])
})

test('配方取件激活失败时释放锁且不创建子进程', async () => {
  const AutomationManager = loadAutomationManager()
  let releases = 0
  let spawned = 0
  const manager = new AutomationManager({
    getMainWindow: () => null,
    overlay: { create() {}, close() {} },
    automationLock: { acquire: () => ({ success: true }), release: () => { releases += 1 } },
    windowActivation: { activateGame: async () => ({ success: false, code: 'focus-refused' }) }
  })
  manager.spawnCurrentTab = () => { spawned += 1 }
  await assert.rejects(() => manager.start({ itemCount: 0, tabs: [] }, {}), /GAME_NOT_FOREGROUND/)
  assert.equal(spawned, 0)
  assert.equal(releases, 1)
})

test('手动停止、普通错误和重置会清除断点并忽略迟到事件', () => {
  const AutomationManager = loadAutomationManager()
  let releases = 0
  const manager = new AutomationManager({
    getMainWindow: () => null,
    overlay: { create() {}, close() {} },
    automationLock: { release: () => { releases += 1 } }
  })
  const setCheckpoint = () => {
    manager.plan = { itemCount: 1, tabs: [{ tabName: '页', columns: 12, items: [{ id: 'x' }] }] }
    manager.config = { calibration: {} }
    manager.status = 'running'
    manager.itemOffset = 0
    manager.completedItems = 0
    manager.child = { killed: false, exitCode: null, kill() { this.killed = true; this.exitCode = 0 } }
    return manager.child
  }

  setCheckpoint()
  manager.stop('user')
  assert.equal(manager.plan, null)
  assert.equal(manager.config, null)
  assert.equal(manager.getStatus().totalItems, 0)

  const failedChild = setCheckpoint()
  manager.handleEvent(failedChild, { event: 'aborted', code: 'ITEM_MISMATCH', reason: '物品不一致' })
  assert.equal(manager.status, 'stopped')
  assert.equal(manager.plan, null)
  assert.equal(manager.code, 'ITEM_MISMATCH')

  const staleChild = setCheckpoint()
  manager.reset('refresh')
  manager.handleEvent(staleChild, { event: 'item-picked', itemId: 'x' })
  assert.equal(manager.completedItems, 0)
  assert.equal(manager.plan, null)
  assert.ok(releases >= 3)
})

test('商城页面和控制浮窗为满包暂停提供明确续取提示', () => {
  const panel = readFileSync(new URL('../src/domains/shop/ChaosRecipePanel.vue', import.meta.url), 'utf8')
  const control = readFileSync(new URL('../electron/modules/chaosRecipe/controlOverlay.js', import.meta.url), 'utf8')
  assert.match(panel, /automation\.code === 'INVENTORY_FULL'[\s\S]*清空背包后继续/)
  assert.match(control, /inventoryFull[\s\S]*背包空间不足，请清空背包后继续/)
})

test('打包配置包含取件脚本、GPL 许可证和第三方归属', () => {
  const packageConfig = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.equal(packageConfig.license, 'GPL-3.0-or-later')
  assert.ok(packageConfig.build.extraResources.some((entry) => entry.to === 'chaos_recipe_pick_template.py'))
  assert.ok(packageConfig.build.files.includes('LICENSE.md'))
  assert.ok(packageConfig.build.files.includes('THIRD_PARTY_NOTICES.md'))
})
})()

// === Merged from faustusAutomation.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const existsSync = _m1_existsSync
  const spawnSync = _m1_spawnSync
  const resolve = _m1_resolve
test('浮士德 Python 识别与输入协议测试通过', () => {
  const python = resolve('.runtime/python-runtime/python.exe')
  assert.equal(existsSync(python), true, '缺少项目内 Python 运行时')
  const result = spawnSync(python, ['test/faustus_automation_py_test.py'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1', OC_DISABLE_DOT_ACCESS_WARNING: '1' },
    timeout: 60_000
  })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
})
})()

// === Merged from faustusInternational.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const createHash = _m2_createHash
  const spawnSync = _m2_spawnSync
  const createFaustusRuntimeLanguage = _m2_createFaustusRuntimeLanguage
  const FaustusManager = _m2_FaustusManager
  const normalizeFaustusStartRequest = _m2_normalizeFaustusStartRequest
  const getServer = _m2_getServer
  const pythonPath = _m2_pythonPath
const entry = (table, id, en, cn, tw, field = 'Text') => ({ kind: 'dat', table, id, field, en, cn, tw, sourceHash: createHash('sha256').update(en).digest('hex') })
const entries = [
  entry('clientstrings2', 'AsyncTradeStashPanelTitle', 'Merchant', '商人', '商人'),
  entry('clientstrings2', 'AsyncTradeStashTabName', 'Shop', '商店', '商店'),
  entry('clientstrings2', 'AsyncTradeStashPanelPriceItemConfirmationTitle', 'Set Item Price', '设置物品价格', '設定物品價格'),
  entry('clientstrings2', 'AsyncTradeStashPanelPriceItemConfirmationActionButton', 'List Item', '上架物品', '上架物品'),
  entry('baseitemtypes', 'Metadata/Items/Currency/CurrencyRerollRare', 'Chaos Orb', '混沌石', '混沌石', 'Name'),
  entry('baseitemtypes', 'Metadata/Items/Currency/CurrencyModValues', 'Divine Orb', '神圣石', '神聖石', 'Name'),
  entry('baseitemtypes', 'Metadata/Items/Armours/HelmetStr12', 'Royal Burgonet', '君主之盔', '皇室堅盔', 'Name')
]
const footprints = { schemaVersion: 1, strictKnownItems: true, items: { '*\u001froyal burgonet': { width: 2, height: 2 } }, categories: {} }
const profile = (extra = {}) => createFaustusRuntimeLanguage({ server: getServer('international'), entries, revision: 'active-r1', footprints, ...extra })

test('浮士德按稳定条目标识构建英文及活动简繁快照，不采用候选与错误源hash', () => {
  const active = profile()
  assert.deepEqual(active.anchors.priceTitle, ['Set Item Price', '设置物品价格', '設定物品價格'])
  assert.deepEqual(active.currencies.divine, ['Divine Orb', '神圣石', '神聖石'])
  assert.equal(active.itemBaseAliases['君主之盔'], 'royal burgonet')
  assert.equal(active.itemBaseAliases['royal burgonet'], 'royal burgonet')
  assert.deepEqual(profile({ revision: '' }).anchors.priceTitle, ['Set Item Price'])
  assert.deepEqual(profile({ entries: entries.map(item => ({ ...item, sourceHash: 'invalid' })) }).currencies.divine, ['Divine Orb'])
  const cn = createFaustusRuntimeLanguage({ entries, revision: 'active-r1', footprints })
  assert.deepEqual(cn.currencies.divine, ['神圣石'])
  assert.equal(cn.localizationRevision, '')
})

test('浮士德歧义通货译名拒绝启动，底材歧义不猜身份', () => {
  assert.throws(() => profile({ entries: [...entries, entry('baseitemtypes', 'Metadata/Items/Currency/CurrencyModValues', 'Divine Orb', '混沌石', undefined, 'Name')] }), /歧义/)
  assert.equal(profile({ entries: [...entries, entry('baseitemtypes', 'different', 'Other Helmet', '君主之盔', undefined, 'Name')] }).itemBaseAliases['君主之盔'], null)
})

test('浮士德管理器覆盖渲染端语言字段，受管资源更新后重新取得快照', () => {
  let revision = 'active-r1'
  const manager = new FaustusManager({ server: getServer('international'), fileSystem: { existsSync: () => true },
    localizationProvider: () => entries, localizationRevisionProvider: () => revision })
  const first = manager.internalRuntimeConfig({ runtime_language: { serverId: 'cn', currencies: { chaos: ['wrong'] } } })
  assert.equal(first.runtime_language.serverId, 'international')
  assert.equal(first.runtime_language.localizationRevision, 'active-r1')
  revision = ''
  assert.deepEqual(manager.internalRuntimeConfig({}).runtime_language.anchors.shop, ['Shop'])
  assert.deepEqual(first.runtime_language.anchors.shop, ['Shop', '商店'])
  assert.throws(() => normalizeFaustusStartRequest({ config: {}, runtime_language: {} }), /不支持/)
})

test('浮士德可信快照在真实Python识别和占位链路支持英文、简体、繁体且保留拒绝条件', () => {
  const script = String.raw`import importlib.util,json,sys
spec=importlib.util.spec_from_file_location('faustus','src/assets/scripts/faustus_market_repricing.py')
f=importlib.util.module_from_spec(spec);spec.loader.exec_module(f)
data=json.load(sys.stdin);language=data['language'];footprints=data['footprints']
def candidate(text,y=0):return {'text':text,'score':0.99,'box':[[0,y],[150,y],[150,y+20],[0,y+20]]}
result=[]
for title,merchant,shop,submit,currency,item in [
 ('Set Item Price','Merchant','Shop','List Item','Chaos Orb','Item Class: Helmets\nRarity: Rare\nDoom Crown\nRoyal Burgonet\n--------'),
 ('设置物品价格','商人','商店','上架物品','神圣石','物品类别: 头部\n稀有度: 稀有\n灾变\n君主之盔\n--------'),
 ('設定物品價格','商人','商店','上架物品','神聖石','物品種類：頭部\n稀有度：稀有\n災變\n皇室堅盔\n--------')]:
 adapter=f.GameAdapter.__new__(f.GameAdapter);adapter.config={'runtime_language':language}
 context=adapter._price_context_from_candidates([candidate(title),candidate(currency,40),candidate(submit,80)])
 parsed=f.parse_item_header(item.replace('\\n','\n'),language['itemBaseAliases'])
 result.append([f.validate_page_anchors([candidate(merchant),candidate(shop)],language)[0],context['currencyCode'],f.resolve_item_footprint(parsed,footprints)])
for text in ['Orb of Alchemy','神聖石碎片']:
 try:f.select_unique_currency([candidate(text)],language=language);raise AssertionError('wrong currency accepted')
 except f.ItemSkip:pass
try:f.select_unique_currency([candidate('Chaos Orb'),candidate('混沌石')],language=language);raise AssertionError('duplicate currency accepted')
except f.ItemSkip:pass
assert f.validate_page_anchors([candidate('Merchant')],language)[0] is False
magic=f.parse_item_header('Item Class: Helmets\nRarity: Magic\nStout Royal Burgonet of the Rainbow\n--------'.replace('\\n','\n'),language['itemBaseAliases'])
assert f.resolve_item_footprint(magic,footprints)=={'width':2,'height':2}
adapter=f.GameAdapter.__new__(f.GameAdapter);adapter.config={'runtime_language':language};adapter._price_open_started=None;adapter._popup_region=lambda:{};adapter.trace_timing=lambda *args,**kwargs:None
for warning in ['Cannot modify this item yet','錯誤','冷却中']:
 adapter.capture_ocr=lambda _,text=warning:[candidate(text)]
 assert adapter.submission_result()=='submit_warning'
print(json.dumps(result))`
  const result = spawnSync(pythonPath, ['-c', script], { input: JSON.stringify({ language: profile(), footprints }), encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout.trim()), [[true, 'chaos', { width: 2, height: 2 }], [true, 'divine', { width: 2, height: 2 }], [true, 'divine', { width: 2, height: 2 }]])
})
})()

// === Merged from inventoryCoordinate.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const readFileSync = _m3_readFileSync
  const spawnSync = _m3_spawnSync
  const fileURLToPath = _m3_fileURLToPath
  const pythonPath = _m3_pythonPath
const bagScriptPath = fileURLToPath(new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url))
const mapTemplate = readFileSync(new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url), 'utf8')

test('地图网格直接使用首格中心和相邻中心间距', () => {
  const start = mapTemplate.indexOf('def get_slot_position(col, row):')
  const end = mapTemplate.indexOf('def stash_item(x, y):')
  const block = mapTemplate.slice(start, end)
  const script = `${block}\ngrid_config = {"startX": 2604, "startY": 1155, "offsetX": 100, "offsetY": 100}\nprint(get_slot_position(0, 0), get_slot_position(1, 1), get_slot_position(11, 4))\n`
  const result = spawnSync(pythonPath, ['-c', script], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout.trim(), '(2604, 1155) (2704, 1255) (3704, 1555)')
})

test('自动入库遍历与地图制作使用同一中心坐标公式', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(bagScriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
text = "Item Class: Currency\\nRarity: Currency\\nChaos Orb\\n--------"
class Matcher:
    valid = True
    def __init__(self, config): pass
    def check_interface(self): return True, {}
class Controller:
    moves = []
    def __init__(self, config): self.transferred = False
    def move(self, x, y):
        Controller.moves.append([x, y])
        self.transferred = False
        return True
    def copy_item_text(self): return ("empty", "") if self.transferred else ("copied", text)
    def ctrl_click(self): self.transferred = True; return True
    def release_all(self): pass
module.InterfaceMatcher = Matcher
module.InputController = Controller
module.is_game_foreground = lambda: True
module.run_stash({"inventory": {"startPos": {"x": 2604, "y": 1155}, "slotSize": {"w": 100, "h": 100}}})
print(json.dumps([Controller.moves[0], Controller.moves[1], Controller.moves[5], Controller.moves[-1]]))
`
  const result = spawnSync(pythonPath, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  const summary = JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
  assert.deepEqual(summary, [[2604, 1155], [2604, 1255], [2704, 1155], [3704, 1555]])
})

test('设置页通过框选换算首格中心坐标', () => {
  const view = readFileSync(new URL('../src/domains/settings/SettingsView.vue', import.meta.url), 'utf8')
  assert.match(view, /deriveInventoryGridFromRegion/)
})
})()

// === Merged from inventoryEmptyThreshold.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const readFileSync = _m4_readFileSync
  const spawnSync = _m4_spawnSync
  const pythonPath = _m4_pythonPath
  const EMPTY_SLOT_THRESHOLD = _m4_EMPTY_SLOT_THRESHOLD
  const normalizeEmptySlotThreshold = _m4_normalizeEmptySlotThreshold
  const buildBagRuntimeConfig = _m4_buildBagRuntimeConfig
const source = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const mapTemplate = source('../src/assets/scripts/map_rolling_template.py')

function runMapScan(emptySlotThreshold, statuses, cols = 8) {
  const start = mapTemplate.indexOf('def start_map_rolling():')
  const end = mapTemplate.indexOf('def process_single_map(')
  const block = mapTemplate.slice(start, end)
  const code = `
import json, types
${mapTemplate.slice(mapTemplate.indexOf('def rolling_item_level_label('), mapTemplate.indexOf('def completed_map_result('))}
${block}
grid_config = {"startX": 0, "startY": 0, "offsetX": 1, "offsetY": 1, "rows": 1, "cols": ${cols}, "emptySlotThreshold": ${emptySlotThreshold}}
map_config = {"targetKind": "atlas"}
recovery_config = {}
current_recovery_checkpoint = None
fatal_error_reason = None
GetClipboardSequenceNumber = None
keyboard = types.SimpleNamespace(GlobalHotKeys=lambda mapping: types.SimpleNamespace(start=lambda: None))
pyperclip = types.SimpleNamespace(paste=lambda: "Item Class: Maps")
time = types.SimpleNamespace(sleep=lambda value: None)
statuses = iter(${JSON.stringify(statuses).replaceAll('true', 'True').replaceAll('false', 'False')})
moves = []
def move_mouse(x, y): moves.append([x, y]); return True
def is_game_foreground(): return True
def select_currency_stash_tab(mode): return True
def preflight_required_currencies(): return True
def get_slot_position(col, row): return col, row
def rolling_transaction_context(col, row): return {"targetKind": "atlas", "targetId": f"atlas:{col}:{row}", "column": col, "row": row}
def read_current_rolling_target(*args, **kwargs):
    return {"category": "地图", "name": "测试地图", "mapTier": 1} if next(statuses) else {"empty": True}
def process_single_map(result, x, y): return {"status": "completed-qualified", "qualified": True}
def count_affix_stats(result): return {}, {}
def complete_crafting_target(*args): return {"ok": True}
def update_map_stats(*args): pass
def update_map_recovery_checkpoint(*args): pass
def release_all_keys(): pass
def play_success_sound(): pass
def play_error_sound(): pass
start_map_rolling()
print(json.dumps(moves))
`
  const result = spawnSync(pythonPath, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

test('连续空格阈值使用默认值、取整并限制在 1–60', () => {
  assert.deepEqual(EMPTY_SLOT_THRESHOLD, { min: 1, max: 60, default: 3 })
  assert.equal(normalizeEmptySlotThreshold(undefined), 3)
  assert.equal(normalizeEmptySlotThreshold('invalid'), 3)
  assert.equal(normalizeEmptySlotThreshold(0), 1)
  assert.equal(normalizeEmptySlotThreshold(8.9), 8)
  assert.equal(normalizeEmptySlotThreshold(99), 60)
})

test('设置页持久化共享阈值并支持旧值补全和重置', () => {
  const view = source('../src/domains/settings/SettingsView.vue')
  const store = source('../src/domains/settings/settingsStore.js')
  const defaults = source('../src/utils/environmentDefaults.js')
  assert.match(view, /连续空格判空/)
  assert.match(view, /v-model="inventory\.emptySlotThreshold"/)
  assert.match(view, /:min="EMPTY_SLOT_THRESHOLD\.min"/)
  assert.match(view, /:max="EMPTY_SLOT_THRESHOLD\.max"/)
  assert.match(defaults, /emptySlotThreshold: EMPTY_SLOT_THRESHOLD\.default/)
  assert.match(store, /createDefaultInventorySettings\(\)/)
  assert.match(store, /normalizeEmptySlotThreshold\(data\.inventory\.emptySlotThreshold\)/)
  assert.equal((store.match(/bag\.updateEmptySlotThreshold\(inventory\.value\.emptySlotThreshold\)/g) || []).length, 2)
})

test('地图和自动入库运行配置使用规范化后的共享阈值', () => {
  const config = buildBagRuntimeConfig({}, {
    inventory: {
      startPos: { x: 10, y: 20 },
      slotSize: { w: 30, h: 40 },
      emptySlotThreshold: 7.8
    }
  })
  assert.equal(config.inventory.emptySlotThreshold, 7)

  const generator = source('../src/utils/pythonScriptGenerator.js')
  assert.match(generator, /emptySlotThreshold: normalizeEmptySlotThreshold\(inventory\?\.emptySlotThreshold\)/)
})

test('地图扫描按阈值结束，成功复制会打断零散空格计数', () => {
  assert.deepEqual(runMapScan(3, [false, false, true, false, false, false, true]), [
    [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]
  ])
  assert.deepEqual(runMapScan(1, [false, true]), [[0, 0]])
  assert.deepEqual(runMapScan(4, [false, false, false, false, true]), [
    [0, 0], [1, 0], [2, 0], [3, 0]
  ])
})

test('连续空格阈值运行时同步只更新下一轮配置', () => {
  const ipc = source('../electron/modules/ipc/bag.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  const handler = ipc.match(/ipcMain\.handle\('update-bag-empty-slot-threshold'[\s\S]*?\n  \}\)/)?.[0] || ''
  assert.match(handler, /normalizeEmptySlotThreshold\(value\)/)
  assert.match(handler, /latestConfig\.inventory\.emptySlotThreshold = emptySlotThreshold/)
  assert.doesNotMatch(handler, /startDetectionProcess|session\.reset/)
  assert.match(preload, /updateBagEmptySlotThreshold/)
  assert.match(api, /updateEmptySlotThreshold/)
  assert.match(api, /updateEmptySlotThreshold: \(emptySlotThreshold\) => Promise\.resolve/)
})
})()

// === Merged from stashPickup.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const readFileSync = _m5_readFileSync
  const fileURLToPath = _m5_fileURLToPath
  const runPython = _m5_runPython
  const normalizeStashPickupProfile = _m5_normalizeStashPickupProfile
  const normalizeStashPickupSettings = _m5_normalizeStashPickupSettings
  const migrateStashGridCalibration = _m5_migrateStashGridCalibration
  const normalizeStashGridRegion = _m5_normalizeStashGridRegion
const pythonScript = new URL('../src/assets/scripts/stash_pickup_template.py', import.meta.url)
const managerScript = new URL('../electron/modules/stashPickup/manager.js', import.meta.url)
const fixtureDir = new URL('./fixtures/stashPickup/', import.meta.url)
const pythonScriptPath = fileURLToPath(pythonScript)
const fixtureDirPath = fileURLToPath(fixtureDir)

test('检测配置按普通与大型仓库保存独立默认值并限制参数范围', () => {
  const settings = normalizeStashPickupSettings()
  assert.equal(settings.profiles.normal.thresholds.variance, 1500)
  assert.equal(settings.profiles.quad.thresholds.variance, 3000)
  assert.equal(settings.profiles.normal.sampleRatio, 0.6)
  assert.deepEqual(
    normalizeStashPickupProfile({ method: 'brightness', brightnessThreshold: 999, sampleRatio: 0 }, 'normal'),
    { method: 'brightness', thresholds: { variance: 1500, brightness: 255, saturation: 50 }, sampleRatio: 0.1 }
  )
})

test('取件启动异常会撤销前台切换宽限状态', () => {
  const source = readFileSync(managerScript, 'utf8')
  assert.match(
    source,
    /catch \(error\) \{\s*this\.allowingFocusTransition = false\s*this\.automationLock\?\.release\(OWNER\)/
  )
})

test('公共仓库校准保留物理元数据并只在公共值为空时迁移旧值', () => {
  const legacy = { normal: { left: 1, top: 2, right: 101, bottom: 102 }, folderQuad: { left: 3, top: 4, right: 103, bottom: 104 } }
  const current = { root: { region: { left: 10, top: 20, right: 210, bottom: 220 }, displayId: 7, scaleFactor: 1.5 } }
  const result = migrateStashGridCalibration(current, legacy)
  assert.equal(result.root.left, 10)
  assert.equal(result.root.displayId, '7')
  assert.equal(result.folder.left, 3)
  assert.equal(normalizeStashGridRegion({ left: 1, top: 1, right: 1, bottom: 2 }), null)
})

test('固定截图按网格周期识别布局', () => {
  const code = `
import importlib.util, cv2, json, os, numpy as np
spec=importlib.util.spec_from_file_location("hp", ${JSON.stringify(pythonScriptPath)})
hp=importlib.util.module_from_spec(spec); spec.loader.exec_module(hp)
root=${JSON.stringify(fixtureDirPath)}
cases=[("normal-unsearched.jpg",12),("normal-highlight.jpg",12),("normal-no-match.jpg",12),("quad-highlight.jpg",24)]
out=[]
for name,columns in cases:
 image=cv2.imdecode(np.fromfile(os.path.join(root,name),dtype=np.uint8),cv2.IMREAD_COLOR)
 out.append([hp.detect_grid_layout(image)[0],round(hp.grid_confidence(image,12),2),round(hp.grid_confidence(image,24),2)])
print(json.dumps(out))
`
  assert.deepEqual(runPython(code), [
    [12, 3.38, 3.64],
    [12, 5.54, 5.14],
    [12, 4.91, 4.97],
    [24, 1.29, 1.45]
  ])
})

test('布局识别容忍校准边缘和起点偏移', () => {
  const code = `
import importlib.util, cv2, json, os, numpy as np
spec=importlib.util.spec_from_file_location("hp", ${JSON.stringify(pythonScriptPath)})
hp=importlib.util.module_from_spec(spec); spec.loader.exec_module(hp)
root=${JSON.stringify(fixtureDirPath)}

quad=cv2.imdecode(np.fromfile(os.path.join(root,"quad-highlight.jpg"),dtype=np.uint8),cv2.IMREAD_COLOR)
quad=cv2.copyMakeBorder(quad,4,4,4,4,cv2.BORDER_CONSTANT,value=(15,15,15))
normal=cv2.imdecode(np.fromfile(os.path.join(root,"normal-unsearched.jpg"),dtype=np.uint8),cv2.IMREAD_COLOR)
normal=normal[38:,38:]

class Grabber:
 def __init__(self,image): self.image=cv2.cvtColor(image,cv2.COLOR_BGR2BGRA)
 def grab(self,_rect): return self.image

def layout_for(image):
 layout=hp.choose_layout({"root":{"left":0,"top":0,"right":image.shape[1],"bottom":image.shape[0]}},Grabber(image),1.15)
 return [layout["columns"],round(layout["confidence"],2)]

print(json.dumps([layout_for(quad),layout_for(normal)]))
`
  const result = runPython(code)
  assert.equal(result[0][0], 24)
  assert.ok(result[0][1] >= 1.15)
  assert.equal(result[1][0], 12)
  assert.ok(result[1][1] >= 1.15)
})

test('密集重复物品纹理不会把12格仓库误判为24格', () => {
  const code = `
import importlib.util, base64, cv2, json, numpy as np
spec=importlib.util.spec_from_file_location("hp", ${JSON.stringify(pythonScriptPath)})
hp=importlib.util.module_from_spec(spec); spec.loader.exec_module(hp)
tile_data=base64.b64decode("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDACgcHiMeGSgjISMtKygwPGRBPDc3PHtYXUlkkYCZlo+AjIqgtObDoKrarYqMyP/L2u71////m8H////6/+b9//j/2wBDASstLTw1PHZBQXb4pYyl+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj/wAARCABkAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDMTc67BjHc0/ykHBfmkU7YGYdahJ56ZpWuMseVH/eNAijHRjVbPsKXPsKfKwuWSkZIO88UY65kz+FVt3sKM+wo5WFywY4yclyaPLj/AL5qHY+zf5Z2+uOKbn2FHKwuWPLj/vmjy4/75qvn2FGfYUuULljy4/75o8uP++ar7vYUbvYUcrC5Y8qP++aKr7vYUUcrC5Mv/Hu1QHrU6/8AHu1QHrTiDCiiiqEFXtPt1YmaZN0S8Y9TVJVLsFUZJOBW2irGUELKUjGGHTn1oYILlrhF4UJHnPqR7VnyRIw3g5z6EZq9cOzH5mUheSgPLVnO2SXI69aHboMa9s6oXUhkBxkHOKkt7IybXlYJGTj3P0FRrI0YO04B9Kvx3qZ3cO4AAYjGKaVxFK8tlhkPlFivowwRVatO4uvOJ3Dco6/SqU4h8wmEnYemetElyiIaKUqQaKQyZf8Aj3aoD1qdf+PdqgPWpiNhRRRVCLdhtzLnG/b8mf1q2Yg8RmkHJ6Y/nWZErvIqx/eJwK1lSQw7GIBRcOT2HrVK19QKRbIZeCR0YCmSglQzbQM44PWpXiMMbBnG9+i98VCyqI1O4Eg8pioY0rigKY+cZpqoI5VbAPPQ+tWJo0VGYZLlQyY6bfWqYJ3Kx555puVwJ5CN+4ADj5sd/anXV3FM3yW4UAEDnB+tKMFZoAMk4ZD/ADqqV4zjik3cErhuPrRQFoqR2JF/492qA9anH/Hu1QHrTiJhV20s94Dyg4PCr3als7OOWIyzMyjOFUD71PlZvPDMCrLx6ce1UImWNVnCxRKGB2deppm6SB5VYqVlG0sTwKheTJcnJCtnBPQ/1ps0/nqqZAHoKpWs7gTJG0pa6lJCE8EDNQNJu/12CD0OOaFlcQmLeQncdqjnnaTYpxhBgYFZX1NHGyJAxUmPn5ejegqF1Ybefl7ZpVbAyRxSNukbcf8A61DBK6JCzEjYcOORSSSl/nIweh+tMY4cEHGO/vTpj5gDBQC3UD1p2IvYhLEmikoqrCJ1/wCPdqZDGJJ1RjgE8n2p6/8AHu1NgcJcKxzgHtUxGzZjdFZlACBBhFPp61nXUvmT5zwO/pUk4EmX3BT1DdiPSqrgAevpV83u2EEjh2BXqByfWmoQXHmHCZ5K05PvDBA45oSFixUj7wyKkY9njkHzEpjgNj+dRrGN5IfcB3xSAlOOueMUrkLhF4IHJ9aSsnqU3daCsdsuNwaniQLwFG7tg8U2dYzJ+4BCY79c1H3HIPem9XoK9kMbJb5qmDiMFfTsPWmAb32gZJPFE+PNIByB3ppW1IZHRRRQMnX/AI92qxb7YrR5QFLk45GeKrr/AMe7VGrlD6ipRS8y3ZR+Zcxxy52SEkBTjsaiuUWG6miXO0NxmpNMIOpQ4OeTx+BqG7P+mzg9PMb+dOxLEQDfhu44NW1iVbU3VxvYbtiohx+ZqFVgFq/myOJR/qwBwR+VW7GUR2bfaRutpGwoIySe/wCFGysBBcRRJBDcxbwjEjYxyQR/+o08WMuRGxgWR/m2F/mP6Uup27KsTxMptcYTb/Dn/H1pmmAS3YeWXMifdDE5Y49aQFaYOGMTKVYH5h3qIjselWLwv9qlM3EpbkDoPSoSFXk4J7AdBQMVZjGSQo39A1RHk0Hk0VRIUUUUDJ1/492qA9aKKmI2W9K/5CUP1P8AI02VRJqro33WnIP/AH1RRTYhwgH2W4k3NmJwFHbrU1yAuk2zj7yyMo+hJ/woooAc7FdChx/HLz+Z/wAKhg/10K9hKv8AOiimtmJhrDFtRkB/hAA/L/69UqKKEMKKKKACiiigD//Z")
tile=cv2.imdecode(np.frombuffer(tile_data,dtype=np.uint8),cv2.IMREAD_COLOR)
image=np.tile(tile,(12,12,1))
print(json.dumps(hp.detect_grid_layout(image)[0]))
`
  assert.equal(runPython(code), 12)
})

test('根仓库区域无效时会选择文件夹内仓库校准', () => {
  const code = `
import importlib.util, json, numpy as np
spec=importlib.util.spec_from_file_location("hp", ${JSON.stringify(pythonScriptPath)})
hp=importlib.util.module_from_spec(spec); spec.loader.exec_module(hp)
root=np.zeros((120,120,4),dtype=np.uint8)
folder=np.zeros((120,120,4),dtype=np.uint8)
folder[:,:,3]=255
for index in range(1,12):
 folder[:,index*10-1:index*10+1,:3]=220
 folder[index*10-1:index*10+1,:,:3]=220
class Grabber:
 def grab(self, rect): return root if rect["left"] == 0 else folder
layout=hp.choose_layout({
 "root":{"left":0,"top":0,"right":120,"bottom":120},
 "folder":{"left":200,"top":0,"right":320,"bottom":120}
}, Grabber(), 1.15)
print(json.dumps([layout["calibration"],layout["columns"]]))
`
  assert.deepEqual(runPython(code), ['folder', 12])
})

test('文件夹内外都呈现周期时选择格线对齐的校准', () => {
  const code = `
import importlib.util, cv2, json, os, numpy as np
spec=importlib.util.spec_from_file_location("hp", ${JSON.stringify(pythonScriptPath)})
hp=importlib.util.module_from_spec(spec); spec.loader.exec_module(hp)
image=cv2.imdecode(np.fromfile(os.path.join(${JSON.stringify(fixtureDirPath)},"quad-highlight.jpg"),dtype=np.uint8),cv2.IMREAD_COLOR)
shifted=np.vstack([image[71:],np.zeros((71,image.shape[1],3),dtype=np.uint8)])
root=cv2.cvtColor(image,cv2.COLOR_BGR2BGRA)
folder=cv2.cvtColor(shifted,cv2.COLOR_BGR2BGRA)
class Grabber:
 def grab(self,rect): return root if rect["top"] == 0 else folder
layout=hp.choose_layout({
 "root":{"left":0,"top":0,"right":image.shape[1],"bottom":image.shape[0]},
 "folder":{"left":0,"top":71,"right":image.shape[1],"bottom":image.shape[0]+71}
},Grabber(),1.15)
print(json.dumps([layout["calibration"],layout["columns"]]))
`
  assert.deepEqual(runPython(code), ['root', 24])
})

test('密集大型仓库优先选择结构格线更对齐的文件夹校准', () => {
  const code = `
import importlib.util, cv2, json, os, numpy as np
spec=importlib.util.spec_from_file_location("hp", ${JSON.stringify(pythonScriptPath)})
hp=importlib.util.module_from_spec(spec); spec.loader.exec_module(hp)
image=cv2.imdecode(np.fromfile(os.path.join(${JSON.stringify(fixtureDirPath)},"quad-highlight.jpg"),dtype=np.uint8),cv2.IMREAD_COLOR)
height,width=image.shape[:2]
root=np.vstack([np.zeros((45,width,3),dtype=np.uint8),image[:-45]])
folder=np.vstack([np.zeros((6,width,3),dtype=np.uint8),image[:-6]])
root=cv2.cvtColor(root,cv2.COLOR_BGR2BGRA)
folder=cv2.cvtColor(folder,cv2.COLOR_BGR2BGRA)
class Grabber:
 def grab(self,rect): return root if rect["top"] == 0 else folder
layout=hp.choose_layout({
 "root":{"left":0,"top":0,"right":width,"bottom":height},
 "folder":{"left":0,"top":100,"right":width,"bottom":height+100}
},Grabber(),1.15)
print(json.dumps([layout["calibration"],layout["columns"]]))
`
  assert.deepEqual(runPython(code), ['folder', 24])
})

test('取件脚本不再包含画面变化确认代码', () => {
  const source = readFileSync(pythonScript, 'utf8')
  assert.doesNotMatch(source, /wait_for_patch_change|patch_changed|changed_item_cells|detect_candidates|def run\(|emit_with/)
  assert.doesNotMatch(source, /clipboard|pyperclip|copy_item/i)
  assert.match(source, /def choose_layout\(/)
  assert.match(source, /def capture\(/)
})
})()

// === Merged from stashTabSelection.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const existsSync = _m6_existsSync
  const readFileSync = _m6_readFileSync
  const spawnSync = _m6_spawnSync
  const path = _m6_path
  const fileURLToPath = _m6_fileURLToPath
  const DEFAULT_STASH_TAB_NAMES = _m6_DEFAULT_STASH_TAB_NAMES
  const STASH_TAB_TYPES = _m6_STASH_TAB_TYPES
  const createDefaultStashTabSelection = _m6_createDefaultStashTabSelection
  const normalizeStashTabSelection = _m6_normalizeStashTabSelection
  const validateStashTabSelection = _m6_validateStashTabSelection
  const resolveCraftingPython = _m6_resolveCraftingPython
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('仓库页配置为十一种官方类型且旧设置默认关闭', () => {
  const defaults = createDefaultStashTabSelection()
  assert.equal(STASH_TAB_TYPES.length, 11)
  assert.equal(defaults.enabled, false)
  assert.equal(defaults.hasScrollbar, false)
  assert.equal(defaults.rootRegion, null)
  assert.deepEqual(defaults.names, DEFAULT_STASH_TAB_NAMES)
  assert.equal(defaults.names.currency, '通货')
})

test('配置迁移保留有效名称与物理框选元数据并补齐缺省映射', () => {
  const migrated = normalizeStashTabSelection({
    enabled: true,
    hasScrollbar: true,
    names: { currency: ' 通货2 ', blight: '旧寄生菌草页' },
    rootRegion: {
      x: 61.4, y: 20.6, width: 188.9, height: 640.2,
      displayId: 7, scaleFactor: 1.5,
      displayPhysicalBounds: { x: 0, y: 0, width: 3840, height: 2160 },
      capturedAt: '2026-08-01T00:00:00.000Z'
    }
  })
  assert.equal(migrated.names.currency, '通货2')
  assert.equal(migrated.names.gems, '宝石')
  assert.equal('blight' in migrated.names, false)
  assert.deepEqual(migrated.rootRegion, {
    x: 61, y: 21, width: 189, height: 640,
    displayId: '7', scaleFactor: 1.5,
    displayPhysicalBounds: { x: 0, y: 0, width: 3840, height: 2160 },
    capturedAt: '2026-08-01T00:00:00.000Z'
  })
})

test('实际名称输入会在键入时回写受控值', () => {
  const source = readFileSync(
    path.join(projectRoot, 'src', 'domains', 'settings', 'StashTabSelectionSettings.vue'),
    'utf8'
  )
  const mappingInput = source.match(
    /<el-input\s+v-for="definition in STASH_TAB_TYPES"[\s\S]*?<\/el-input>/
  )?.[0]

  assert.ok(mappingInput, '缺少仓库实际名称映射输入框')
  assert.match(
    mappingInput,
    /@update:model-value="updateName\(definition\.key, \$event\)"/,
    '受控输入必须在 update:modelValue 时同步配置，否则键入内容会被旧值覆盖'
  )
})

test('功能开启时必须具有根目录区域，关闭时保持兼容', () => {
  assert.equal(validateStashTabSelection({ enabled: false }).valid, true)
  const enabled = validateStashTabSelection({ enabled: true })
  assert.equal(enabled.valid, false)
  assert.match(enabled.error, /框选/)
})

test('OCR 依赖只在仓库页自动选择开启时加入制作解释器探测', () => {
  const calls = []
  const python = { detectPythonPathWithModules(modules) { calls.push(modules); return 'python' } }
  resolveCraftingPython(python, false)
  resolveCraftingPython(python, true)
  assert.deepEqual(calls[0], ['pynput', 'pyperclip'])
  assert.deepEqual(calls[1], ['pynput', 'pyperclip', 'rapidocr', 'onnxruntime', 'cv2', 'mss', 'numpy'])
})

test('物品与地图模板均严格先选择仓库页再执行通货预检', () => {
  for (const filename of ['crafting_template.py', 'map_rolling_template.py']) {
    const source = readFileSync(path.join(projectRoot, 'src/assets/scripts', filename), 'utf8')
    const call = source.lastIndexOf('if not select_currency_stash_tab(')
    const preflight = source.lastIndexOf('if not preflight_required_currencies():')
    assert.ok(call > 0, `${filename} 缺少仓库页选择调用`)
    assert.ok(preflight > call, `${filename} 必须先选仓库页再预检`)
    assert.match(source, /stash-tab-selection-succeeded/)
    assert.match(source, /stash-tab-selection-failed/)
  }
})

test('仓库页选择器在截图、滚动和点击前重复验证游戏前台', () => {
  const source = readFileSync(path.join(projectRoot, 'src/assets/scripts/stash_tab_selector.py'), 'utf8')
  assert.match(source, /def capture\(self\)[\s\S]*?self\.require_environment\(\)[\s\S]*?capture\.grab/)
  assert.match(source, /def scroll\(self, notches[\s\S]*?self\._position_mouse\(\)[\s\S]*?self\.require_environment\(\)[\s\S]*?\.scroll/)
  assert.match(source, /self\.require_environment\(\)\s*mouse\.position[\s\S]*?self\.require_environment\(\)\s*mouse\.press[\s\S]*?mouse\.release/)
})

test('制作模板持续排空 OCR 输出并对仓库选择设置硬超时', () => {
  for (const filename of ['crafting_template.py', 'map_rolling_template.py']) {
    const source = readFileSync(path.join(projectRoot, 'src/assets/scripts', filename), 'utf8')
    const start = source.indexOf('def select_currency_stash_tab(mode):')
    const end = source.indexOf('CURRENCY_NAMES =', start)
    const selectorCall = source.slice(start, end)

    assert.ok(start > 0 && end > start, `${filename} 缺少仓库选择器调用`)
    assert.doesNotMatch(
      selectorCall,
      /stdout=subprocess\.PIPE,\s*stderr=subprocess\.PIPE/,
      `${filename} 不得在轮询退出时让 OCR 日志堵塞匿名管道`
    )
    assert.match(selectorCall, /selector_output_path/, `${filename} 应将本次 OCR 输出持续写入诊断文件`)
    assert.match(selectorCall, /selector_timeout_seconds/, `${filename} 应为选择器设置硬超时`)
  }
})

function runSelectorParent(filename, childSource, timeoutOverride = null) {
  const source = readFileSync(path.join(projectRoot, 'src/assets/scripts', filename), 'utf8')
  const start = source.indexOf('def select_currency_stash_tab(mode):')
  const end = source.indexOf('CURRENCY_NAMES =', start)
  let selectorCall = source.slice(start, end)
  if (timeoutOverride !== null) {
    selectorCall = selectorCall.replace(
      /selector_timeout_seconds = .*$/m,
      `selector_timeout_seconds = ${timeoutOverride}`
    )
  }
  const code = `
import json, os, sys, tempfile, time
TIMING_MODE = "fixed"
STASH_TAB_SETTLE_SECONDS = 0.25
SELECTOR_PROCESS_POLL_INTERVAL_SECONDS = 0.05
${selectorCall}
is_running = True
fatal_error_reason = None
stash_tab_selection = {
    "enabled": True, "hasScrollbar": False,
    "names": {"currency": "通货"}
}
events = []
def release_all_keys(): events.append("release")
def play_error_sound(): events.append("sound")
with tempfile.TemporaryDirectory(prefix="stash-selector-parent-") as root:
    __file__ = os.path.join(root, "crafting.py")
    stash_tab_selector_path = os.path.join(root, "noisy_selector.py")
    with open(stash_tab_selector_path, "w", encoding="utf-8") as handle:
        handle.write(${JSON.stringify(childSource)})
    selected = select_currency_stash_tab("items")
    print(json.dumps({"selected": bool(selected), "fatal": fatal_error_reason, "events": events}, ensure_ascii=False))
`
  const pythonPath = path.join(projectRoot, '.runtime', 'python-runtime', 'python.exe')
  const result = spawnSync(existsSync(pythonPath) ? pythonPath : 'python', ['-c', code], {
    encoding: 'utf8', timeout: 6000,
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(result.status, 0, `${filename}: ${result.error || ''}\n${result.stderr}`)
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

test('大量 OCR 初始化日志不会堵塞制作父进程', () => {
  const noisySuccess = `
import json, sys
sys.stderr.write("x" * 262144 + "\\n")
sys.stderr.flush()
print("RESULT " + json.dumps({"success": True, "targetName": "通货", "scrollStep": 0}, ensure_ascii=False), flush=True)
`
  for (const filename of ['crafting_template.py', 'map_rolling_template.py']) {
    const result = runSelectorParent(filename, noisySuccess)
    assert.equal(result.selected, true, filename)
    assert.equal(result.fatal, null, filename)
  }
})

test('OCR 子进程不返回时在硬超时后失败关闭', () => {
  const result = runSelectorParent('crafting_template.py', 'import time\ntime.sleep(5)\n', 0.2)
  assert.equal(result.selected, false)
  assert.match(result.fatal, /识别超过 0 秒/)
  assert.deepEqual(result.events, ['release', 'sound'])
})

test('仓库页配置注入后的两类 Python 模板保持可解析且关闭路径直接放行', () => {
  const pythonPath = path.join(projectRoot, '.runtime', 'python-runtime', 'python.exe')
  if (!existsSync(pythonPath)) return
  const common = {
    GEN_DATE: 'test', DPI_AWARENESS: '', ITEM_INFO_FILE: 'item.txt', ITEM_INFO_RESULT_FILE: 'result.json',
    DELAY_MOUSE_MOVE: '0.08', DELAY_CLIPBOARD: '80',
    TIMING_MODE: 'adaptive',
    MODIFIER_SETTLE_MS: '50', KEY_HOLD_MS: '20', BUTTON_HOLD_MS: '20', RELEASE_SETTLE_MS: '20',
    ADAPTIVE_TIMEOUT_MS: '1000',
    CLIPBOARD_CONFIRM_MS: '250', STASH_TAB_SETTLE_MS: '250', STASH_SETTLE_MS: '200',
    CURRENCY_POSITIONS: '{}', REQUIRED_CURRENCY_TYPES: '[]', CURRENCY_EXPECTED_NAMES: '{}', LOCALIZATION_SNAPSHOT_JSON: '"{}"', DPI_SCALE_FACTOR: '1',
    STOP_SHORTCUT: 'Alt+3', PYNPUT_STOP_SHORTCUT: '<alt>+3',
    BATCH_CONFIG_JSON: JSON.stringify(JSON.stringify({ enabled: false, targets: [], completedIds: [], memberIds: [] })),
    STASH_TAB_SELECTION_JSON: JSON.stringify(JSON.stringify({ enabled: false, names: { currency: '通货' } }))
  }
  const variants = [
    ['crafting_template.py', {
      ...common,
      ITEM_POSITION: "{'x': 1, 'y': 1}",
      ACTION_POSITION: "{'x': 0, 'y': 0}",
      CRAFTING_KIND: 'general',
      ENABLE_AFFIX: 'False',
      ENABLE_ELDRITCH: 'False',
      ENABLE_SOCKET: 'False',
      AFFIX_CRAFTING_FUNC: 'def craft_affixes():\n    return True',
      SPECIALIZED_CRAFTING_FUNC: 'def craft_specialized():\n    return True',
      ELDRITCH_CRAFTING_FUNC: 'def craft_eldritch_implicits():\n    return True',
      SOCKET_CRAFTING_FUNC: 'def craft_sockets():\n    return True'
    }],
    ['map_rolling_template.py', { ...common, GRID_CONFIG: "{'rows': 5, 'cols': 12, 'startX': 1, 'startY': 1, 'offsetX': 1, 'offsetY': 1}", MAP_CONFIG: '{}', RECOVERY_CONFIG: '{}' }]
  ]
  for (const [filename, replacements] of variants) {
    let generated = readFileSync(path.join(projectRoot, 'src/assets/scripts', filename), 'utf8')
    for (const [key, value] of Object.entries(replacements)) generated = generated.split(`{{${key}}}`).join(value)
    assert.doesNotMatch(generated, /\{\{[A-Z0-9_]+\}\}/)
    assert.match(generated, /if not stash_tab_selection\.get\("enabled"\):\s+return True/)
    const parsed = spawnSync(pythonPath, ['-c', 'import ast,sys; ast.parse(sys.stdin.read())'], {
      input: generated, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' }
    })
    assert.equal(parsed.status, 0, `${filename}: ${parsed.stderr}`)
  }
})

test('独立选择器纯逻辑、滚动序列与真实截图 OCR', { timeout: 120000 }, (t) => {
  const pythonPath = path.join(projectRoot, '.runtime', 'python-runtime', 'python.exe')
  if (!existsSync(pythonPath)) return t.skip('尚未准备内置 Python 运行时')
  const check = spawnSync(pythonPath, [
    path.join(projectRoot, 'test', 'python', 'stash_tab_selector_checks.py'),
    path.join(projectRoot, 'src', 'assets', 'scripts', 'stash_tab_selector.py'),
    path.join(projectRoot, 'test', 'fixtures', 'stash-tabs', 'with-scrollbar.png'),
    path.join(projectRoot, 'test', 'fixtures', 'stash-tabs', 'without-scrollbar.png')
  ], {
    encoding: 'utf8', timeout: 110000,
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', OC_DISABLE_DOT_ACCESS_WARNING: '1' }
  })
  assert.equal(check.status, 0, `${check.stdout}\n${check.stderr}`)
  const report = JSON.parse(check.stdout.trim().split(/\r?\n/).at(-1))
  assert.equal(report.withScrollbar.currency, 1)
  assert.equal(report.withScrollbar.currency2, 1)
  assert.equal(report.withoutScrollbar.currency, 1)
  assert.equal(report.withoutScrollbar.currency2, 1)
  assert.equal(report.withScrollbar.currencyBoxes.length, 2)
  assert.equal(report.withoutScrollbar.currencyBoxes.length, 2)
  assert.equal(report.pureChecks, true)
})
})()
