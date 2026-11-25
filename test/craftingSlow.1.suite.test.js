import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import { createServer as _m0_createServer } from 'vite'
import { normalizeModuleTwo as _m0_normalizeModuleTwo } from '../src/domains/items/affixConfig.js'
import { cleanMigratedChartConfig as _m0_cleanMigratedChartConfig, cleanMigratedMapConfig as _m0_cleanMigratedMapConfig, createDefaultChartConfig as _m0_createDefaultChartConfig, createDefaultMapConfig as _m0_createDefaultMapConfig } from '../src/utils/mapPresetMigration.js'
import { CURRENCY_NAMES as _m0_CURRENCY_NAMES } from '../src/utils/constants.js'
import { CURRENCY_POSITION_KEYS as _m0_CURRENCY_POSITION_KEYS, createEmptyCurrencyPositions as _m0_createEmptyCurrencyPositions } from '../src/utils/environmentDefaults.js'
import { buildCraftingCurrencyPreflight as _m0_buildCraftingCurrencyPreflight, buildMapCurrencyPreflight as _m0_buildMapCurrencyPreflight } from '../src/utils/currencyPreflight.js'
import { collectCraftingConfigurationIssues as _m0_collectCraftingConfigurationIssues, collectMapConfigurationIssues as _m0_collectMapConfigurationIssues } from '../src/domains/configurationGuide/configurationIssues.js'
import { CraftingCurrencyUsageLedger as _m0_CraftingCurrencyUsageLedger } from '../electron/modules/python/currencyUsageLedger.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { spawnSync as _m1_spawnSync } from 'node:child_process'
import { createServer as _m1_createServer } from 'vite'
import { pythonPath as _m1_pythonPath } from './helpers/python.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { spawnSync as _m2_spawnSync } from 'node:child_process'
import { createServer as _m2_createServer } from 'vite'
import { parseItemInfo as _m2_parseItemInfo } from '../electron/modules/item/parser.js'
import { buildCraftingAffixPayload as _m2_buildCraftingAffixPayload } from '../electron/modules/item/craftingAffixPayload.js'
import { pythonPath as _m2_pythonPath } from './helpers/python.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { readFileSync as _m3_readFileSync } from 'node:fs'
import { spawnSync as _m3_spawnSync } from 'node:child_process'
import { createServer as _m3_createServer } from 'vite'
import { createPinia as _m3_createPinia, setActivePinia as _m3_setActivePinia } from 'pinia'
import { pythonPath as _m3_pythonPath } from './helpers/python.js'
import { createDefaultItemPreset as _m3_createDefaultItemPreset, normalizeItemPreset as _m3_normalizeItemPreset } from '../src/utils/itemPreset.js'
import { parseItemInfo as _m3_parseItemInfo } from '../electron/modules/item/parser.js'
import { freezeBatchConfiguration as _m3_freezeBatchConfiguration, restoreBatchConfiguration as _m3_restoreBatchConfiguration, validateBatchCategoryCompatibility as _m3_validateBatchCategoryCompatibility, validateBatchInventoryLayout as _m3_validateBatchInventoryLayout } from '../src/domains/items/batchCrafting.js'
import { ItemFootprintRegistry as _m3_ItemFootprintRegistry, ITEM_FOOTPRINT_SCHEMA_VERSION as _m3_ITEM_FOOTPRINT_SCHEMA_VERSION } from '../electron/modules/items/footprintRegistry.js'
import { useScriptStore as _m3_useScriptStore } from '../src/stores/script.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { mkdtemp as _m4_mkdtemp, readFile as _m4_readFile, rm as _m4_rm, writeFile as _m4_writeFile } from 'node:fs/promises'
import { watch as _m4_watch } from 'node:fs'
import _m4_os from 'node:os'
import _m4_path from 'node:path'
import { spawnSync as _m4_spawnSync } from 'node:child_process'
import { fileURLToPath as _m4_fileURLToPath } from 'node:url'
import { CRAFTING_CURRENCY_CATALOG as _m4_CRAFTING_CURRENCY_CATALOG, normalizeCurrencyUsage as _m4_normalizeCurrencyUsage } from '../shared/craftingCurrencyCatalog.js'
import { CraftingCurrencyUsageLedger as _m4_CraftingCurrencyUsageLedger } from '../electron/modules/python/currencyUsageLedger.js'
import { pythonPath as _m4_pythonPath } from './helpers/python.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { mkdtemp as _m5_mkdtemp, readFile as _m5_readFile, readdir as _m5_readdir, rm as _m5_rm } from 'node:fs/promises'
import _m5_os from 'node:os'
import _m5_path from 'node:path'
import { CraftingDataRepository as _m5_CraftingDataRepository, DEFAULT_BUILTIN_ROOT as _m5_DEFAULT_BUILTIN_ROOT } from '../electron/modules/crafting/dataRepository.js'
import { CraftingDataUpdater as _m5_CraftingDataUpdater } from '../electron/modules/crafting/updater.js'
import { CraftingTaskManager as _m5_CraftingTaskManager } from '../electron/modules/crafting/taskManager.js'
import { CraftingService as _m5_CraftingService } from '../electron/modules/crafting/service.js'
import { CRAFTING_SCHEMA_VERSION as _m5_CRAFTING_SCHEMA_VERSION } from '../electron/modules/crafting/model.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { fileURLToPath as _m6_fileURLToPath } from 'node:url'
import { createServer as _m6_createServer } from 'vite'
import _m6_vue from '@vitejs/plugin-vue'
import { createSSRApp as _m6_createSSRApp, h as _m6_h } from 'vue'
import { renderToString as _m6_renderToString } from '@vue/server-renderer'
import { load as _m6_load } from 'cheerio'

// === Merged from advancedAlchemy.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const createServer = _m0_createServer
  const normalizeModuleTwo = _m0_normalizeModuleTwo
  const cleanMigratedChartConfig = _m0_cleanMigratedChartConfig
  const cleanMigratedMapConfig = _m0_cleanMigratedMapConfig
  const createDefaultChartConfig = _m0_createDefaultChartConfig
  const createDefaultMapConfig = _m0_createDefaultMapConfig
  const CURRENCY_NAMES = _m0_CURRENCY_NAMES
  const CURRENCY_POSITION_KEYS = _m0_CURRENCY_POSITION_KEYS
  const createEmptyCurrencyPositions = _m0_createEmptyCurrencyPositions
  const buildCraftingCurrencyPreflight = _m0_buildCraftingCurrencyPreflight
  const buildMapCurrencyPreflight = _m0_buildMapCurrencyPreflight
  const collectCraftingConfigurationIssues = _m0_collectCraftingConfigurationIssues
  const collectMapConfigurationIssues = _m0_collectMapConfigurationIssues
  const CraftingCurrencyUsageLedger = _m0_CraftingCurrencyUsageLedger
const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('高阶点金石配置默认关闭并保留显式选择', () => {
  assert.equal(normalizeModuleTwo({ mode: 'alchemy' }).enableBinding, false)
  assert.equal(normalizeModuleTwo({ mode: 'alchemy', enableBinding: true }).enableBinding, true)

  for (const profile of [
    createDefaultMapConfig(),
    createDefaultChartConfig(),
    cleanMigratedMapConfig({ method: 'alchemy' }),
    cleanMigratedChartConfig({ method: 'alchemy' })
  ]) assert.deepEqual(profile.binding, { enabled: false })

  assert.deepEqual(cleanMigratedMapConfig({ binding: { enabled: true } }).binding, { enabled: true })
  assert.deepEqual(cleanMigratedChartConfig({ binding: { enabled: true } }).binding, { enabled: true })
})

test('页面只在点金石模式显示高阶点金石选项', () => {
  const itemView = source('../src/domains/items/components/ModuleTwo.vue')
  const mapView = source('../src/domains/map/MapView.vue')
  assert.match(itemView, /v-if="form\.mode === 'alchemy'"[\s\S]*?v-model="form\.enableBinding"[\s\S]*?使用高阶点金石/)
  assert.match(mapView, /v-if="activeKind !== 'heist' && activeProfile\.method === 'alchemy'"[\s\S]*?v-model="activeProfile\.binding\.enabled"[\s\S]*?使用高阶点金石/)
})

test('高阶点金石拥有独立坐标和中文名称', () => {
  assert.equal(CURRENCY_POSITION_KEYS.includes('binding'), true)
  assert.deepEqual(createEmptyCurrencyPositions().binding, { x: 0, y: 0 })
  assert.equal(CURRENCY_NAMES.binding, '高阶点金石')
})

test('点金石模式预检在普通与高阶点金石之间二选一', () => {
  assert.deepEqual(buildCraftingCurrencyPreflight({
    moduleTwo: { enabled: true, mode: 'alchemy', enableBinding: true },
    moduleThree: { enabled: false }
  }), ['wisdom', 'scouring', 'binding'])
  assert.deepEqual(buildCraftingCurrencyPreflight({
    moduleTwo: { enabled: true, mode: 'alchemy', enableBinding: false },
    moduleThree: { enabled: false }
  }), ['wisdom', 'scouring', 'alchemy'])
  assert.deepEqual(buildCraftingCurrencyPreflight({
    moduleTwo: { enabled: true, mode: 'chaos', enableBinding: true },
    moduleThree: { enabled: false }
  }), ['wisdom', 'alchemy', 'scouring', 'chaos'])

  assert.deepEqual(buildMapCurrencyPreflight({ method: 'alchemy', binding: { enabled: true } }), [
    'wisdom', 'scouring', 'binding'
  ])
  assert.deepEqual(buildMapCurrencyPreflight({ method: 'chaos', binding: { enabled: true } }), [
    'wisdom', 'scouring', 'alchemy', 'chaos'
  ])
})

test('高阶点金石坐标缺失时使用结构化配置问题阻止启动', () => {
  const point = { x: 100, y: 200 }
  const currencyPositions = { wisdom: point, scouring: point, alchemy: point }
  const itemIssues = collectCraftingConfigurationIssues({
    itemPosition: point,
    currencyPositions,
    stashTabSelection: { enabled: false },
    preset: {
      moduleTwo: { enabled: true, mode: 'alchemy', enableBinding: true, affixGroups: [] },
      moduleThree: { enabled: false },
      moduleEldritch: { enabled: false }
    }
  }).issues
  assert.equal(itemIssues.some(issue => issue.id === 'currency.binding' && issue.editorId === 'currency.binding'), true)
  assert.equal(itemIssues.some(issue => issue.id === 'currency.alchemy'), false)

  const mapIssues = collectMapConfigurationIssues({
    inventory: { startPos: point, slotSize: { w: 40, h: 40 } },
    currencyPositions,
    stashTabSelection: { enabled: false },
    mapConfig: { method: 'alchemy', binding: { enabled: true } }
  }).issues
  assert.equal(mapIssues.some(issue => issue.id === 'currency.binding' && issue.editorId === 'currency.binding'), true)
  assert.equal(mapIssues.some(issue => issue.id === 'currency.alchemy'), false)
})

test('生成脚本在点金模式使用 binding，混沌模式仍保留 alchemy', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript, generateMapRollingScript } = await server.ssrLoadModule('/src/utils/python.js')
    const common = {
      globalShortcuts: { end: 'Alt+3' },
      currencyPositions: { wisdom: { x: 1, y: 1 }, scouring: { x: 2, y: 2 }, alchemy: { x: 3, y: 3 }, binding: { x: 4, y: 4 } },
      operationDelayMs: 50,
      fixedTiming: {},
      filePaths: { itemInfoFile: 'item.txt', itemInfoResultFile: 'result.json' },
      stashTabSelection: { enabled: false }
    }
    const itemScript = generatePythonScript({
      ...common,
      itemPosition: { x: 30, y: 40 },
      preset: {
        checkInitialItem: false,
        moduleTwo: { enabled: true, mode: 'alchemy', enableBinding: true, affixGroups: [] },
        moduleThree: { enabled: false }, moduleEldritch: { enabled: false }
      }
    })
    const requiredCurrencies = script => JSON.parse(JSON.parse(script.match(/^required_currency_types = json\.loads\((.+)\)/m)[1]))
    assert.deepEqual(requiredCurrencies(itemScript), ['wisdom', 'scouring', 'binding'])
    assert.match(itemScript, /apply_currency\("binding"\)/)

    const mapScript = generateMapRollingScript({
      ...common,
      inventory: { startPos: { x: 10, y: 20 }, slotSize: { w: 40, h: 40 } },
      mapConfig: { ...createDefaultMapConfig(), method: 'alchemy', binding: { enabled: true } }
    })
    assert.deepEqual(requiredCurrencies(mapScript), ['wisdom', 'scouring', 'binding'])
    assert.equal((mapScript.match(/apply_currency_and_read\(alchemy_currency/g) || []).length, 3)
    assert.equal((mapScript.match(/apply_currency_and_read\("alchemy"/g) || []).length, 1)
  } finally {
    await server.close()
  }
})

test('消耗账本接受并累计高阶点金石', () => {
  const ledger = new CraftingCurrencyUsageLedger({ createId: () => 'binding-session' })
  ledger.begin({ mode: 'items', usageSessionId: 'binding-session' })
  const snapshot = ledger.record({ event: 'crafting-currency-used', mode: 'items', currency: 'binding', amount: 1 }, {
    usageSessionId: 'binding-session', mode: 'items'
  })
  assert.deepEqual(snapshot.currencyUsage, { binding: 1 })
})
})()

// === Merged from affixItemLevelGuard.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const spawnSync = _m1_spawnSync
  const createServer = _m1_createServer
  const pythonPath = _m1_pythonPath
const catalogCondition = (id, requiredLevel, minTier = 1) => ({
  id,
  kind: 'catalog',
  keyword: id,
  displayName: id,
  effectPattern: `${id} #`,
  minTier,
  tiers: [{ tier: 1, name: 'T1', requiredLevel, text: `${id} 1` }]
})

function config(craftingKind = 'general') {
  return {
    globalShortcuts: { end: 'F12' },
    currencyPositions: {},
    operationDelayMs: 100,
    itemPosition: { x: 100, y: 200 },
    actionPosition: { x: 300, y: 400 },
    craftingKind,
    preset: {
      checkInitialItem: true,
      moduleTwo: {
        enabled: true,
        mode: 'alteration',
        affixGroups: [
          { id: 'valuable', name: '值钱', enabled: true, requiredAffixes: [catalogCondition('生命', 84)], selectedAffixes: [], selectedCount: 1 },
          { id: 'second', name: '组合 2', enabled: true, requiredAffixes: [catalogCondition('速度', 82), '未知关键词'], selectedAffixes: [], selectedCount: 1 },
          { id: 'disabled', name: '停用', enabled: false, requiredAffixes: [catalogCondition('停用高阶', 100)], selectedAffixes: [], selectedCount: 1 },
          { id: 'unknown', name: '仅未知', enabled: true, requiredAffixes: ['自由关键词'], selectedAffixes: [], selectedCount: 1 }
        ]
      },
      moduleThree: { enabled: false },
      moduleEldritch: { enabled: false }
    },
    batchConfig: {
      enabled: true,
      targets: [{ id: 'one', x: 1, y: 2, position: { x: 100, y: 200 } }]
    },
    filePaths: {}
  }
}

test('普通制作停用词缀后不受旧组合物等限制，重新启用和专用制作仍拦截', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript } = await server.ssrLoadModule('/src/utils/python.js')
    for (const batchEnabled of [false, true]) {
      for (const module of ['moduleThree', 'moduleEldritch']) {
        const input = config()
        input.batchConfig.enabled = batchEnabled
        input.preset.moduleTwo.enabled = false
        input.preset[module].enabled = true
        for (const kind of ['general', 'essence', 'harvest']) {
          input.craftingKind = kind
          for (const enabled of [false, true]) {
            input.preset.moduleTwo.enabled = enabled
            const generated = generatePythonScript(input)
            const helperStart = generated.indexOf('def affix_item_level_issue(')
            const helperEnd = generated.indexOf('def batch_category_matches(', helperStart)
            const script = `import json
${generated.match(/^batch_config = .*$/m)[0]}
${generated.match(/^affix_item_level_requirements = .*$/m)[0]}
${generated.slice(helperStart, helperEnd)}
print(json.dumps(affix_item_level_issue({"level": 75})))`
            const result = spawnSync(pythonPath, ['-c', script], {
              encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' }
            })
            assert.equal(result.status, 0, result.stderr)
            const issue = JSON.parse(result.stdout.trim())
            const context = `${kind}/${module}/batch=${batchEnabled}/affix=${enabled}`
            if (kind === 'general' && !enabled) assert.equal(issue, null, context)
            else assert.match(issue, /物品等级 75 不足/, context)
          }
        }
      }
    }
  } finally { await server.close() }
})

test('词缀物等要求嵌入所有制作脚本并位于制作操作之前', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript } = await server.ssrLoadModule('/src/utils/python.js')
    for (const kind of ['general', 'essence', 'harvest']) {
      const generated = generatePythonScript(config(kind))
      assert.match(generated, /AFFIX_ITEM_LEVEL_INSUFFICIENT/)
      assert.match(generated, /值钱/)
      assert.match(generated, /组合 2/)
      assert.doesNotMatch(generated, /停用高阶|仅未知/)

      const prepareStart = generated.indexOf('def prepare_item_for_crafting(')
      const prepareGuard = generated.indexOf('validate_affix_item_level(result)', prepareStart)
      const identify = generated.indexOf('apply_currency("wisdom")', prepareStart)
      assert.ok(prepareGuard > prepareStart && identify > prepareGuard, `${kind} 应在鉴定前校验物等`)
    }

    const generated = generatePythonScript(config('general'))
    const jitStart = generated.indexOf('def prepare_batch_target_just_in_time(')
    const jitGuard = generated.indexOf('affix_item_level_issue(result, prefix)', jitStart)
    const jitIdentify = generated.indexOf('apply_currency("wisdom")', jitStart)
    const currencyPreflight = generated.indexOf('if not preflight_required_currencies():')
    assert.ok(jitGuard > jitStart && jitIdentify > jitGuard)
    assert.ok(currencyPreflight > generated.indexOf('if not preflight_batch_targets():'))
  } finally {
    await server.close()
  }
})

test('物等不足报告全部失败组合，边界物等正常通过且不产生制作操作', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript } = await server.ssrLoadModule('/src/utils/python.js')
    const generated = generatePythonScript(config())
    const batchConfig = generated.match(/^batch_config = .*$/m)?.[0]
    const requirements = generated.match(/^affix_item_level_requirements = .*$/m)?.[0]
    const helperStart = generated.indexOf('def affix_item_level_issue(')
    const helperEnd = generated.indexOf('def batch_category_matches(', helperStart)
    assert.ok(batchConfig && requirements && helperStart >= 0 && helperEnd > helperStart)
    const helpers = generated.slice(helperStart, helperEnd)
    const script = `
import json
${batchConfig}
${requirements}
failures = []
operations = []
def fail_item_runtime(reason, code):
    failures.append({"reason": reason, "code": code})
    return False
${helpers}
low = validate_affix_item_level({"level": 75})
boundary = validate_affix_item_level({"level": 84})
middle_issue = affix_item_level_issue({"level": 82})
unknown_level = validate_affix_item_level({})
print(json.dumps({"low": low, "boundary": boundary, "middleIssue": middle_issue, "unknownLevel": unknown_level, "failures": failures, "operations": operations}, ensure_ascii=False))
`
    const result = spawnSync(pythonPath, ['-c', script], {
      encoding: 'utf8',
      env: { ...process.env, PYTHONUTF8: '1' }
    })
    assert.equal(result.status, 0, result.stderr)
    const output = JSON.parse(result.stdout.trim())
    assert.equal(output.low, false)
    assert.equal(output.boundary, true)
    assert.equal(output.unknownLevel, true)
    assert.match(output.failures[0].reason, /物品等级 75 不足：值钱 需要 84、组合 2 需要 82，已停止制作/)
    assert.match(output.middleIssue, /值钱 需要 84/)
    assert.doesNotMatch(output.middleIssue, /组合 2 需要 82/)
    assert.equal(output.failures[0].code, 'AFFIX_ITEM_LEVEL_INSUFFICIENT')
    assert.deepEqual(output.operations, [])
  } finally {
    await server.close()
  }
})
})()

// === Merged from augmentationCrafting.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const spawnSync = _m2_spawnSync
  const createServer = _m2_createServer
  const parseItemInfo = _m2_parseItemInfo
  const buildCraftingAffixPayload = _m2_buildCraftingAffixPayload
  const pythonPath = _m2_pythonPath
function runPython(script) {
  const executed = spawnSync(pythonPath, ['-c', script], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(executed.status, 0, executed.stderr)
  return JSON.parse(executed.stdout.trim().split(/\r?\n/).at(-1))
}

function currentRuntimeAffixPayload(item) {
  return {
    rarity: item.rarity,
    ...buildCraftingAffixPayload(item)
  }
}

function parsedMagicModifier(lines) {
  return currentRuntimeAffixPayload(parseItemInfo([
    '物品类别: 单手剑',
    '稀 有 度: 魔法',
    '测试之剑',
    '宝石之剑',
    '--------',
    '物品等级: 86',
    '--------',
    '{ 前缀属性 "复合测试" (等阶：1) — 攻击 }',
    ...lines
  ].join('\n')))
}

function parsedFracturedMagicModifier() {
  return currentRuntimeAffixPayload(parseItemInfo([
    '物品类别: 戒指',
    '稀 有 度: 魔法',
    '测试戒指',
    '金光戒指',
    '--------',
    '物品等级: 86',
    '--------',
    '{ 破碎的 ▲ 前缀词缀 "锁定生命" (等阶：1)— 生命 }',
    '+80 最大生命',
    '{ ▽ 后缀词缀 "抗火之" (等阶：1)— 元素, 火焰, 抗性 }',
    '+35% 火焰抗性'
  ].join('\n')))
}

test('改造模式区分汉化错误与瞬态解析失败，补读不重复使用通货且保留停止码', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript } = await server.ssrLoadModule('/src/utils/python.js')
    const generated = generatePythonScript({
      globalShortcuts: { end: 'Alt+3' },
      currencyPositions: {
        wisdom: { x: 1, y: 1 },
        alteration: { x: 2, y: 2 },
        augmentation: { x: 3, y: 3 },
        transmutation: { x: 4, y: 4 },
        scouring: { x: 5, y: 5 }
      },
      operationDelayMs: 50,
      adaptiveTiming: true,
      fixedTiming: {},
      itemPosition: { x: 30, y: 40 },
      preset: {
        checkInitialItem: false,
        moduleTwo: {
          enabled: true,
          mode: 'alteration',
          enableAugmentation: true,
          affixGroups: [{ id: 'goal', name: '目标', requiredAffixes: ['生命'], selectedAffixes: [], selectedCount: 1 }]
        },
        moduleThree: { enabled: false },
        moduleEldritch: { enabled: false }
      },
      filePaths: { itemInfoFile: 'item.txt', itemInfoResultFile: 'result.json' },
      stashTabSelection: { enabled: false }
    })

    const helperStart = generated.indexOf('def fail_item_runtime(')
    const helperEnd = generated.indexOf('def fail_item_preparation(', helperStart)
    const start = generated.indexOf('def explicit_affix_count(')
    const end = generated.indexOf('def craft_eldritch_implicits(', start)
    assert.ok(helperStart >= 0 && helperEnd > helperStart && start >= 0 && end > start)
    assert.ok(generated.indexOf('def read_current_item(', helperStart) > helperStart)

    const runReadRetry = (scenarios) => runPython(`
import json, os, time
${generated.slice(helperStart, helperEnd)}
${generated.slice(start, end)}
item_info_result_file = os.devnull
time.sleep = lambda _seconds: None

def run(initial, queue):
    global is_running, fatal_error_reason
    is_running = True
    fatal_error_reason = None
    applied = []
    pending = list(queue)
    reads = 0
    stopped = []
    stopped_codes = []
    def apply(currency):
        applied.append(currency)
        return True
    def read(allow_unchanged_text=False, **_kwargs):
        nonlocal reads
        reads += 1
        return True
    def wait(_request_id=None):
        return pending.pop(0)
    def fail(reason, code="ITEM_READ_FAILED"):
        global is_running, fatal_error_reason
        fatal_error_reason = reason
        is_running = False
        stopped.append(reason)
        stopped_codes.append(code)
        return None
    globals()["apply_currency"] = apply
    globals()["read_clipboard_to_file"] = read
    globals()["wait_for_parse_result"] = wait
    globals()["fail_item_runtime"] = fail
    success = craft_affixes(initial)
    return {"success": bool(success), "applied": applied, "reads": reads, "stopped": stopped, "stoppedCodes": stopped_codes}

scenarios = json.loads(${JSON.stringify(JSON.stringify(scenarios))})
print(json.dumps([run(entry["initial"], entry["queue"]) for entry in scenarios], ensure_ascii=False))
`)

    const plainSingle = {
      rarity: '魔法',
      affixMatch: false,
      matchedGroupName: '',
      modifiers: [],
      detailedMods: [],
      explicitMods: ['+80 最大生命']
    }
    const matched = {
      rarity: '魔法',
      affixMatch: true,
      matchedGroupName: '目标',
      modifiers: [],
      detailedMods: [],
      explicitMods: ['+80 最大生命']
    }

    const recovered = runReadRetry([{
      initial: plainSingle,
      queue: [
        { error: '等待超时' },
        { ...plainSingle },
        matched
      ]
    }])
    assert.deepEqual(recovered, [
      { success: true, applied: ['alteration', 'augmentation'], reads: 3, stopped: [], stoppedCodes: [] }
    ])

    const failed = runReadRetry([{
      initial: plainSingle,
      queue: [
        { error: '等待超时' },
        { error: '等待超时' },
        { error: '等待超时' }
      ]
    }])
    assert.deepEqual(failed, [
      { success: false, applied: ['alteration'], reads: 3, stopped: ['读取当前物品失败：等待超时'], stoppedCodes: ['ITEM_READ_FAILED'] }
    ])
    const localizedFailure = runReadRetry([{
      initial: plainSingle,
      queue: [{ error: '词缀效果无法唯一确定', errorCode: 'LOCALIZATION_AMBIGUOUS' }]
    }])[0]
    assert.equal(localizedFailure.success, false)
    assert.equal(localizedFailure.reads, 1)
    assert.deepEqual(localizedFailure.applied, ['alteration'])
    assert.deepEqual(localizedFailure.stoppedCodes, ['LOCALIZATION_AMBIGUOUS'])
    assert.match(localizedFailure.stopped[0], /当前物品汉化解析失败/)
  } finally {
    await server.close()
  }
})

test('改造模式按结构化词缀数在判断前只增幅一次并重新解析', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript } = await server.ssrLoadModule('/src/utils/python.js')
    const generate = (enableAugmentation, checkInitialItem) => generatePythonScript({
      globalShortcuts: { end: 'Alt+3' },
      currencyPositions: {
        wisdom: { x: 1, y: 1 },
        alteration: { x: 2, y: 2 },
        augmentation: { x: 3, y: 3 },
        transmutation: { x: 4, y: 4 },
        scouring: { x: 5, y: 5 }
      },
      operationDelayMs: 50,
      adaptiveTiming: true,
      fixedTiming: {},
      itemPosition: { x: 30, y: 40 },
      preset: {
        checkInitialItem,
        moduleTwo: {
          enabled: true,
          mode: 'alteration',
          enableAugmentation,
          affixGroups: [{ id: 'goal', name: '目标', requiredAffixes: ['生命'], selectedAffixes: [], selectedCount: 1 }]
        },
        moduleThree: { enabled: false },
        moduleEldritch: { enabled: false }
      },
      filePaths: { itemInfoFile: 'item.txt', itemInfoResultFile: 'result.json' },
      stashTabSelection: { enabled: false }
    })

    const runAffixes = (generated, scenarios) => {
      const helperStart = generated.indexOf('def fail_item_runtime(')
      const helperEnd = generated.indexOf('def fail_item_preparation(', helperStart)
      const start = generated.indexOf('def explicit_affix_count(')
      const end = generated.indexOf('def craft_eldritch_implicits(', start)
      assert.ok(helperStart >= 0 && helperEnd > helperStart && start >= 0 && end > start)
      return runPython(`
import json, os, time
${generated.slice(helperStart, helperEnd)}
${generated.slice(start, end)}
item_info_result_file = os.devnull
time.sleep = lambda _seconds: None

def run(initial, parsed_results):
    global is_running
    is_running = True
    applied = []
    queue = list(parsed_results)
    reads = 0
    def apply(currency):
        applied.append(currency)
        return True
    def read(allow_unchanged_text=False, **_kwargs):
        nonlocal reads
        reads += 1
        return True
    def wait(_request_id=None):
        return queue.pop(0)
    globals()["apply_currency"] = apply
    globals()["read_clipboard_to_file"] = read
    globals()["wait_for_parse_result"] = wait
    success = craft_affixes(initial)
    return {"success": bool(success), "applied": applied, "reads": reads, "remaining": len(queue)}

scenarios = json.loads(${JSON.stringify(JSON.stringify(scenarios))})
print(json.dumps([run(entry["initial"], entry["queue"]) for entry in scenarios], ensure_ascii=False))
`)
    }

    const multilineSingleMatched = {
      ...parsedMagicModifier(['物理伤害提高 120%', '+25 最大生命']),
      affixMatch: true,
      matchedGroupName: '目标'
    }
    const multilineSingleUnmatched = {
      ...multilineSingleMatched,
      affixMatch: false,
      matchedGroupName: ''
    }
    assert.equal(multilineSingleUnmatched.detailedMods.length, 1)
    assert.equal(multilineSingleUnmatched.explicitMods.length, 2)
    const plainSingle = {
      rarity: '魔法',
      affixMatch: false,
      matchedGroupName: '',
      modifiers: [],
      detailedMods: [],
      explicitMods: ['+80 最大生命']
    }
    const ambiguousPlainMultiline = {
      ...plainSingle,
      explicitMods: ['物理伤害提高 120%', '+25 最大生命']
    }
    const doubleAffix = {
      rarity: '魔法',
      affixMatch: true,
      matchedGroupName: '目标',
      modifiers: [
        { type: 'prefix', lines: ['+80 最大生命'] },
        { type: 'suffix', lines: ['+35% 火焰抗性'] }
      ],
      detailedMods: [
        { type: 'prefix', lines: ['+80 最大生命'] },
        { type: 'suffix', lines: ['+35% 火焰抗性'] }
      ],
      explicitMods: ['+80 最大生命', '+35% 火焰抗性']
    }
    const fracturedDoubleAffix = {
      ...parsedFracturedMagicModifier(),
      affixMatch: true,
      matchedGroupName: '目标'
    }

    const enabledInitial = runAffixes(generate(true, true), [
      { initial: multilineSingleUnmatched, queue: [doubleAffix] },
      { initial: multilineSingleMatched, queue: [] },
      { initial: plainSingle, queue: [doubleAffix] },
      { initial: ambiguousPlainMultiline, queue: [] },
      { initial: doubleAffix, queue: [] },
      { initial: fracturedDoubleAffix, queue: [doubleAffix] },
      { initial: multilineSingleUnmatched, queue: [{ error: '增幅后解析失败' }, { error: '增幅后解析失败' }, { error: '增幅后解析失败' }] }
    ])
    assert.deepEqual(enabledInitial, [
      { success: true, applied: ['augmentation'], reads: 1, remaining: 0 },
      { success: true, applied: [], reads: 0, remaining: 0 },
      { success: true, applied: ['augmentation'], reads: 1, remaining: 0 },
      { success: false, applied: [], reads: 0, remaining: 0 },
      { success: true, applied: [], reads: 0, remaining: 0 },
      { success: true, applied: [], reads: 0, remaining: 1 },
      { success: false, applied: ['augmentation'], reads: 3, remaining: 0 }
    ])

    assert.deepEqual(runAffixes(generate(true, false), [{
      initial: { ...multilineSingleUnmatched },
      queue: [multilineSingleUnmatched, doubleAffix]
    }]), [
      { success: true, applied: ['alteration', 'augmentation'], reads: 2, remaining: 0 }
    ])

    assert.deepEqual(runAffixes(generate(false, true), [{ initial: multilineSingleMatched, queue: [] }]), [
      { success: true, applied: [], reads: 0, remaining: 0 }
    ])
  } finally {
    await server.close()
  }
})
})()

// === Merged from batchInventoryCrafting.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const readFileSync = _m3_readFileSync
  const spawnSync = _m3_spawnSync
  const createServer = _m3_createServer
  const createPinia = _m3_createPinia
  const setActivePinia = _m3_setActivePinia
  const pythonPath = _m3_pythonPath
  const createDefaultItemPreset = _m3_createDefaultItemPreset
  const normalizeItemPreset = _m3_normalizeItemPreset
  const parseItemInfo = _m3_parseItemInfo
  const freezeBatchConfiguration = _m3_freezeBatchConfiguration
  const restoreBatchConfiguration = _m3_restoreBatchConfiguration
  const validateBatchCategoryCompatibility = _m3_validateBatchCategoryCompatibility
  const validateBatchInventoryLayout = _m3_validateBatchInventoryLayout
  const ItemFootprintRegistry = _m3_ItemFootprintRegistry
  const ITEM_FOOTPRINT_SCHEMA_VERSION = _m3_ITEM_FOOTPRINT_SCHEMA_VERSION
  const useScriptStore = _m3_useScriptStore
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
batch_skipped_ids = []
batch_skipped_items = []
batch_auto_scan_total = 0
last_item_skip_info = None
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

def record_batch_skip(_target, reason, code="BATCH_IDENTITY_MISMATCH"):
    failures.append({"reason": reason, "code": code})

_item, status = prepare_batch_target_just_in_time(batch_config["targets"][0], eldritch_enabled=False)
print(json.dumps({
    "result": status == "ok", "reads": ${readResults.length} - len(reads),
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
    assert.match(generated, /handled = set\(batch_completed_ids\) \| set\(batch_skipped_ids\)/)
    assert.match(generated, /pending_targets = \[target for target in list\(batch_config\.get\("targets"\) or \[\]\) if target\.get\("id"\) not in handled\]/)
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

test('每次重新扫描都会保留已选类别、重置排除项并清除异常批次恢复检查点', () => {
  const source = readFileSync(new URL('../src/stores/batchCrafting.js', import.meta.url), 'utf8')
  const scanBody = source.slice(source.indexOf('async function scanInventory'), source.indexOf('async function stopScan'))
  assert.match(scanBody, /snapshot\.value = null/)
  assert.match(scanBody, /excludedItemIds\.value = \[\]/)
  assert.doesNotMatch(scanBody, /categoryIds: \[\]/)
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
})()

// === Merged from craftingCurrencyUsage.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const mkdtemp = _m4_mkdtemp
  const readFile = _m4_readFile
  const rm = _m4_rm
  const writeFile = _m4_writeFile
  const watch = _m4_watch
  const os = _m4_os
  const path = _m4_path
  const spawnSync = _m4_spawnSync
  const fileURLToPath = _m4_fileURLToPath
  const CRAFTING_CURRENCY_CATALOG = _m4_CRAFTING_CURRENCY_CATALOG
  const normalizeCurrencyUsage = _m4_normalizeCurrencyUsage
  const CraftingCurrencyUsageLedger = _m4_CraftingCurrencyUsageLedger
  const pythonPath = _m4_pythonPath
const dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(dirname, '..')
const source = async relativePath => (
  await readFile(path.join(projectRoot, relativePath), 'utf8')
).replace(/\r\n?/g, '\n')

function block(text, start, end) {
  const from = text.indexOf(start)
  const to = text.indexOf(end, from)
  assert.ok(from >= 0 && to > from, `找不到代码块: ${start} -> ${end}`)
  return text.slice(from, to)
}

function currencyNames(template) {
  const namesBlock = block(template, 'CURRENCY_NAMES = {', '}\n\n')
  return [...namesBlock.matchAll(/^\s*"([^"]+)":/gm)].map(match => match[1])
}

function runApplyCurrency(template, mode, failureStage = null) {
  const definitions = mode === 'items'
    ? `${block(template, 'CURRENCY_NAMES = {', 'def copied_item_header(')}\n${block(template, 'def apply_currency(', 'def move_mouse(')}`
    : `${block(template, 'CURRENCY_NAMES = {', 'def copied_item_header(')}\n${block(template, 'def apply_currency(', 'def send_copy_command(')}`
  const call = mode === 'items' ? 'apply_currency("alteration")' : 'apply_currency("alteration", 30, 40)'
  const script = `
import json
import time
${definitions}
crafting_operation_session_id = "test-session"
item_position = {"x": 30, "y": 40}
def release_shift_if_held(): pass
def right_click_currency(currency): return ${failureStage === 'right' ? 'False' : 'True'}
def move_mouse(x, y): return ${failureStage === 'move' ? 'False' : 'True'}
def click_mouse(button): return ${failureStage === 'click' ? 'False' : 'True'}
result = ${call}
print("RESULT " + json.dumps({"result": result}))
`
  const result = spawnSync(pythonPath, ['-c', script], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(result.status, 0, result.stderr)
  const lines = result.stdout.trim().split(/\r?\n/)
  return {
    result: JSON.parse(lines.find(line => line.startsWith('RESULT ')).slice(7)).result,
    events: lines.filter(line => line.startsWith('EVENT ')).map(line => JSON.parse(line.slice(6)))
  }
}

test('固定目录覆盖物品和地图模板的全部通货且图标完整', async () => {
  const [itemTemplate, mapTemplate, iconModule] = await Promise.all([
    source('src/assets/scripts/crafting_template.py'),
    source('src/assets/scripts/map_rolling_template.py'),
    source('src/domains/overlay/craftingCurrencyIcons.js')
  ])
  const catalogKeys = CRAFTING_CURRENCY_CATALOG.map(currency => currency.key)
  assert.deepEqual(new Set(currencyNames(itemTemplate)), new Set(catalogKeys))
  assert.ok(currencyNames(mapTemplate).every(key => catalogKeys.includes(key)))
  assert.equal(new Set(catalogKeys).size, catalogKeys.length)
  assert.equal(new Set(CRAFTING_CURRENCY_CATALOG.map(currency => currency.name)).size, catalogKeys.length)

  for (const currency of CRAFTING_CURRENCY_CATALOG) {
    const icon = await readFile(path.join(projectRoot, 'src', 'assets', 'images', 'crafting-currency', currency.iconFile))
    assert.deepEqual([...icon.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
    assert.match(iconModule, new RegExp(`['"]?${currency.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]?`))
  }
})

for (const [label, file, mode] of [
  ['物品', 'src/assets/scripts/crafting_template.py', 'items'],
  ['地图/海图', 'src/assets/scripts/map_rolling_template.py', 'map']
]) {
  test(`${label}只在目标点击成功后记一次通货`, async () => {
    const template = await source(file)
    for (const stage of ['right', 'move', 'click']) {
      const failed = runApplyCurrency(template, mode, stage)
      assert.equal(failed.result, false)
      assert.deepEqual(failed.events.filter(event => event.event === 'crafting-currency-used'), [])
      assert.deepEqual(
        failed.events.filter(event => event.event === 'crafting-operation').map(event => event.outcome),
        ['started', 'failed']
      )
    }
    const succeeded = runApplyCurrency(template, mode)
    assert.equal(succeeded.result, true)
    assert.deepEqual(succeeded.events.filter(event => event.event === 'crafting-currency-used'), [{
      event: 'crafting-currency-used', mode,
      ...(mode === 'items' ? { craftingKind: 'general' } : {}),
      currency: 'alteration', amount: 1
    }])
    assert.deepEqual(
      succeeded.events.filter(event => event.event === 'crafting-operation').map(event => ({
        mode: event.mode,
        sessionId: event.sessionId,
        phase: event.phase,
        action: event.action,
        outcome: event.outcome
      })),
      [
        { mode, sessionId: 'test-session', phase: 'input', action: 'alteration', outcome: 'started' },
        { mode, sessionId: 'test-session', phase: 'input', action: 'alteration', outcome: 'dispatched' }
      ]
    )
  })
}

test('孔连颜色在左键成功后计数，点击后解析失败与三次补读不会重计', async () => {
  const generator = await source('src/utils/pythonScriptGenerator.js')
  for (const [functionName, currency] of [
    ['craft_socket_count', 'jewellers'],
    ['craft_links', 'fusing'],
    ['craft_colors', 'chromic']
  ]) {
    const start = generator.indexOf(`def ${functionName}(`)
    const end = functionName === 'craft_socket_count'
      ? generator.indexOf('def craft_links(', start)
      : functionName === 'craft_links'
        ? generator.indexOf('def craft_colors(', start)
        : generator.indexOf('\n`', start)
    assert.ok(start >= 0 && end > start)
    const body = generator.slice(start, end)
    assert.match(body, new RegExp(`if not left_click_item\\(\\):[\\s\\S]*record_currency_usage\\("${currency}"\\)[\\s\\S]*read_current_item`))
    assert.equal((body.match(/record_currency_usage\(/g) || []).length, 1)
  }
  const itemTemplate = await source('src/assets/scripts/crafting_template.py')
  const readBlock = block(itemTemplate, 'def read_current_item(', 'def prepare_item_for_crafting(')
  assert.doesNotMatch(readBlock, /record_currency_usage/)
  assert.match(block(itemTemplate, 'def apply_currency(', 'def move_mouse('), /record_currency_usage\(currency_type\)[\s\S]*return True/)
})

test('主进程账本校验事件并按逻辑会话续算或清零', () => {
  let nextId = 0
  const ledger = new CraftingCurrencyUsageLedger({ createId: () => `generated-${++nextId}` })
  assert.deepEqual(ledger.begin({ mode: 'items', usageSessionId: 'items-1' }), {
    usageSessionId: 'items-1', currencyUsage: {}
  })
  assert.deepEqual(ledger.record({ event: 'crafting-currency-used', mode: 'items', currency: 'chaos', amount: 1 }, {
    usageSessionId: 'items-1', mode: 'items'
  }).currencyUsage, { chaos: 1 })
  assert.equal(ledger.record({ event: 'crafting-currency-used', mode: 'items', currency: 'unknown', amount: 1 }, {
    usageSessionId: 'items-1', mode: 'items'
  }), null)
  assert.equal(ledger.record({ event: 'crafting-currency-used', mode: 'items', currency: 'chaos', amount: 2 }, {
    usageSessionId: 'items-1', mode: 'items'
  }), null)
  assert.equal(ledger.record({ event: 'crafting-currency-used', mode: 'items', currency: 'chaos', amount: 1 }, {
    usageSessionId: 'other-process', mode: 'items'
  }), null)

  assert.deepEqual(ledger.begin({ mode: 'items', usageSessionId: 'items-1', continueCurrencyUsage: true }).currencyUsage, { chaos: 1 })
  assert.deepEqual(ledger.begin({ mode: 'items', usageSessionId: 'items-2' }), {
    usageSessionId: 'items-2', currencyUsage: {}
  })
  assert.deepEqual(ledger.begin({ mode: 'map', usageSessionId: 'items-2', continueCurrencyUsage: true }), {
    usageSessionId: 'generated-1', currencyUsage: {}
  })
  assert.deepEqual(normalizeCurrencyUsage({ chaos: 3, unknown: 9, vaal: -1, wisdom: 1.5 }), { chaos: 3 })
})

test('浮窗实时与终态快照都携带账本，旧跳数通道已移除', async () => {
  const [ipc, view, content, generator, fileIpc, itemView, restart] = await Promise.all([
    source('electron/modules/ipc/python.js'),
    source('src/domains/overlay/OverlayView.vue'),
    source('src/domains/overlay/components/OverlayContent.vue'),
    source('src/utils/pythonScriptGenerator.js'),
    source('electron/modules/ipc/file.js'),
    source('src/domains/items/ItemsView.vue'),
    source('src/utils/craftingRestart.js')
  ])
  assert.match(ipc, /crafting-currency-used[\s\S]*send\('update-overlay', updatedUsage\)/)
  assert.ok((ipc.match(/\.\.\.currencyUsageLedger\.snapshot\(\)/g) || []).length >= 4)
  assert.match(view, /applyCurrencyUsageSnapshot\(data\)/)
  assert.match(view, /usageSessionId: usageSessionId\.value/)
  assert.match(restart, /usageSessionId, continueCurrencyUsage: true/)
  assert.match(content, />本次消耗</)
  assert.match(content, /本次未消耗通货/)
  assert.match(content, /aria-label="`\$\{entry\.name\} \$\{entry\.amount\} 次`"/)
  for (const text of [view, content, generator, fileIpc, itemView]) {
    assert.doesNotMatch(text, /已循环次数|scriptIteration|iteration-fixed|currentIteration|existingData\.iteration/)
  }
  assert.doesNotMatch(view, /\[进度\][\s\S]*match/)
  assert.doesNotMatch(generator, /current_result\[['"]iteration['"]\]/)
})

test('旧 iteration 快速覆盖回放只能观察到最终快照', async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'poe-iteration-replay-'))
  const resultFile = path.join(tempRoot, 'result.json')
  await writeFile(resultFile, '{}', 'utf8')
  const observed = []
  let lastContent = ''
  let timer = null
  const watcher = watch(resultFile, { persistent: false }, () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(async () => {
      timer = null
      const content = await readFile(resultFile, 'utf8')
      if (content === lastContent) return
      lastContent = content
      observed.push(JSON.parse(content).iteration)
    }, 300)
  })
  try {
    for (let iteration = 1; iteration <= 20; iteration += 1) {
      await writeFile(resultFile, JSON.stringify({ iteration }), 'utf8')
    }
    await new Promise(resolve => setTimeout(resolve, 700))
    assert.deepEqual(observed, [20])
  } finally {
    watcher.close()
    if (timer) clearTimeout(timer)
    await rm(tempRoot, { recursive: true, force: true })
  }
})
})()

// === Merged from craftingIntegration.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const mkdtemp = _m5_mkdtemp
  const readFile = _m5_readFile
  const readdir = _m5_readdir
  const rm = _m5_rm
  const os = _m5_os
  const path = _m5_path
  const CraftingDataRepository = _m5_CraftingDataRepository
  const DEFAULT_BUILTIN_ROOT = _m5_DEFAULT_BUILTIN_ROOT
  const CraftingDataUpdater = _m5_CraftingDataUpdater
  const CraftingTaskManager = _m5_CraftingTaskManager
  const CraftingService = _m5_CraftingService
  const CRAFTING_SCHEMA_VERSION = _m5_CRAFTING_SCHEMA_VERSION
const fixtureRoot = path.resolve('test/fixtures/crafting')

async function fixtureFetch(url) {
  if (url.includes('Crafting_Bench')) return new Response(await readFile(path.join(fixtureRoot, 'bench.html'), 'utf8'))
  if (url.includes('Horticrafting')) return new Response(await readFile(path.join(fixtureRoot, 'harvest.html'), 'utf8'))
  if (url.includes('Eldritch_implicit')) return new Response(await readFile(path.join(fixtureRoot, 'eldritch.html'), 'utf8'))
  if (url.includes('cdn.poedb.tw')) throw new Error('纯文字更新不应请求图片 CDN')
  const items = await readFile(path.join(fixtureRoot, 'items.html'), 'utf8')
  const modifiers = await readFile(path.join(fixtureRoot, 'modifiers.html'), 'utf8')
  return new Response(`${items}${modifiers}`)
}

test('手动更新只请求文字数据，并在核心页面失败时保留活动快照', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crafting-update-'))
  const repository = new CraftingDataRepository({ builtinRoot: DEFAULT_BUILTIN_ROOT, userDataRoot: root })
  await repository.initialize()
  const updater = new CraftingDataUpdater({ repository, storageRoot: root, fetchImpl: fixtureFetch })
  const activated = await updater.update()
  assert.equal(activated.source, 'updated')
  assert.equal(activated.counts.bases, 2)
  const activeImages = await readdir(path.join(root, JSON.parse(await readFile(path.join(root, 'active.json'), 'utf8')).directory, 'images'))
  assert.deepEqual(activeImages, ['placeholder.svg'])
  assert.ok(repository.getDataset().bases.every((base) => base.imageId === 'placeholder'))
  assert.equal(repository.getDataset().crafts.filter((craft) => craft.provider === 'fossil').length, 29)
  assert.equal(repository.getDataset().crafts.filter((craft) => craft.provider === 'harvest').length, 2)
  assert.equal(repository.getDataset().crafts.find((craft) => craft.provider === 'harvest').params.tag, 'life')
  assert.equal(repository.getDataset().eldritchImplicitFamilies.length, 2)
  assert.ok(repository.getDataset().manifest.sources.some((source) => source.url === 'https://poedb.tw/cn/Fossil'))
  assert.ok(repository.getDataset().manifest.sources.some((source) => source.url === 'https://poedb.tw/cn/Horticrafting'))
  assert.ok(repository.getDataset().manifest.sources.some((source) => source.url === 'https://poedb.tw/cn/Eldritch_implicit'))
  const activeBefore = JSON.parse(await readFile(path.join(root, 'active.json'), 'utf8'))

  const failingUpdater = new CraftingDataUpdater({
    repository, storageRoot: root,
    fetchImpl: async (url, options) => url.endsWith('/Claws') ? new Response('bad', { status: 503 }) : fixtureFetch(url, options)
  })
  await assert.rejects(failingUpdater.update(), /Claws.*HTTP 503/)
  const activeAfter = JSON.parse(await readFile(path.join(root, 'active.json'), 'utf8'))
  assert.deepEqual(activeAfter, activeBefore)
  assert.equal((await readdir(root)).some((name) => name.startsWith('.staging-')), false)
  await rm(root, { recursive: true, force: true })
})

const workerDataset = {
  manifest: { schemaVersion: CRAFTING_SCHEMA_VERSION, game: 'poe1', locale: 'zh-CN', league: 'Test', patch: 'worker', generatedAt: '2026-07-21T00:00:00Z', checksum: 'test', sources: [] },
  bases: [{ id: 'base:ring', sourceId: 'Ring', name: '测试戒指', category: '首饰', itemClass: '戒指', modifierProfileId: 'Ring', imageId: 'placeholder', requiredLevel: 1, requirements: { level: 1, strength: 0, dexterity: 0, intelligence: 0 }, qualityType: 'none', socketLimit: 0, baseStats: [], implicitModifiers: [], tags: ['ring'], maxAffixes: { prefix: 3, suffix: 3 }, allowedVariants: ['normal'] }],
  modifierFamilies: [
    { id: 'family:life', modifierProfileId: 'Ring', groupId: 'life', name: '生命', affixType: 'prefix', source: 'natural', influences: [], entries: [{ id: 'mod:life', sourceId: 'Life', modifierProfileId: 'Ring', groupId: 'life', name: '生命', affixType: 'prefix', source: 'natural', tags: ['life'], spawnTags: ['ring'], influences: [], tiers: [{ id: 'mod:life:t1', tier: 1, name: 'T1', requiredLevel: 1, weight: 1, text: '+10 最大生命', values: [] }] }] },
    { id: 'family:mana', modifierProfileId: 'Ring', groupId: 'mana', name: '魔力', affixType: 'prefix', source: 'natural', influences: [], entries: [{ id: 'mod:mana', sourceId: 'Mana', modifierProfileId: 'Ring', groupId: 'mana', name: '魔力', affixType: 'prefix', source: 'natural', tags: ['mana'], spawnTags: ['ring'], influences: [], tiers: [{ id: 'mod:mana:t1', tier: 1, name: 'T1', requiredLevel: 1, weight: 9, text: '+10 最大魔力', values: [] }] }] }
  ],
  crafts: [], images: { placeholder: 'images/placeholder.svg' }
}

test('Worker 按任务 ID 发布快速/精算结果并可清理', async () => {
  const manager = new CraftingTaskManager()
  const events = []
  const complete = new Promise((resolve, reject) => {
    manager.start({
      request: { baseId: 'base:ring', itemLevel: 84, variant: { kind: 'normal' }, targets: [{ goalId: 'mod:life', minTierId: 'mod:life:t1' }] },
      dataset: workerDataset,
      priceMap: { 'currency:transmutation': 0.1, 'currency:alteration': 0.2, 'currency:chaos': 1, 'currency:alchemy': 0.2, 'currency:scouring': 0.5, 'currency:exalted': 10 },
      priceTime: 'test', options: { quickSamples: 100, refineMinimum: 100, refineMaximum: 100 },
      onEvent: (message) => {
        events.push(message)
        if (message.type === 'complete') resolve()
        if (message.type === 'error') reject(new Error(message.error))
      }
    })
  })
  await complete
  assert.ok(events.some((entry) => entry.type === 'result' && entry.result.phase === 'quick'))
  assert.ok(events.some((entry) => entry.type === 'result' && entry.result.phase === 'refined'))
  assert.equal(manager.tasks.size, 0)
})

test('取消任务立即发布 cancelled 且丢弃后续 Worker 事件', async () => {
  const manager = new CraftingTaskManager()
  const events = []
  const taskId = manager.start({
    request: { baseId: 'base:ring', itemLevel: 84, variant: { kind: 'normal' }, targets: [{ goalId: 'mod:life', minTierId: 'mod:life:t1' }] },
    dataset: workerDataset, priceMap: {}, priceTime: 'test', options: { quickSamples: 500000 },
    onEvent: (message) => events.push(message)
  })
  assert.equal(manager.cancel(taskId), true)
  await new Promise((resolve) => setTimeout(resolve, 350))
  assert.deepEqual(events.map((entry) => entry.type), ['cancelled'])
  assert.equal(manager.tasks.size, 0)
})

test('做装图片协议首次并发请求按需复用初始化并保留失败响应', async () => {
  let handler = null
  let initializeCalls = 0
  let releaseInitialization
  const initializationGate = new Promise((resolve) => { releaseInitialization = resolve })
  const fetched = []
  const service = new CraftingService({
    storageRoot: os.tmpdir(),
    protocol: { handle: (_scheme, candidate) => { handler = candidate } },
    net: {
      fetch: async (url) => {
        fetched.push(url)
        return new Response('image', { status: 200 })
      }
    }
  })
  service.repository = {
    initialize: async () => {
      initializeCalls += 1
      await initializationGate
      return { source: 'builtin' }
    },
    imageInfo: async (imageId) => ({ file: path.join(os.tmpdir(), `${imageId}.webp`) })
  }

  service.registerImageProtocol()
  assert.equal(initializeCalls, 0)
  assert.equal(typeof handler, 'function')

  const first = handler({ url: 'crafting-image://snapshot/first' })
  const second = handler({ url: 'crafting-image://snapshot/second' })
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(initializeCalls, 1)
  assert.equal(fetched.length, 0)

  releaseInitialization()
  const responses = await Promise.all([first, second])
  assert.deepEqual(responses.map((response) => response.status), [200, 200])
  assert.equal(fetched.length, 2)

  let failureHandler = null
  let imageLookupCalled = false
  const failingService = new CraftingService({
    storageRoot: os.tmpdir(),
    protocol: { handle: (_scheme, candidate) => { failureHandler = candidate } },
    net: { fetch: async () => new Response('unexpected') }
  })
  failingService.repository = {
    initialize: async () => { throw new Error('模拟数据损坏') },
    imageInfo: async () => { imageLookupCalled = true; return null }
  }
  failingService.registerImageProtocol()

  const failure = await failureHandler({ url: 'crafting-image://snapshot/failure' })
  assert.equal(failure.status, 400)
  assert.equal(imageLookupCalled, false)
})

test('CraftingService 跨层返回加密目录并完成通货与揭露状态序列化', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crafting-veiled-service-'))
  const service = new CraftingService({ storageRoot: root, protocol: { handle() {} }, net: { fetch() {} }, fetchImpl: fixtureFetch })
  await service.initialize()
  const base = service.repository.getDataset().bases.find((entry) => entry.itemClass === 'Wand' && entry.allowedVariants.includes('normal'))
  let result = service.createManualSession({ baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 991 })
  result = service.applyManualCurrency(result.session, 'currency:alchemy')
  result = service.applyManualVeiledCraft(result.session, 'veiled:chaos')
  assert.equal(result.veiled.pending.affix.veiled, true)
  assert.equal(result.veiled.options.length, 3)
  const option = result.veiled.options[0]
  result = service.selectManualVeiledOption(result.session, option.modifierId, option.tierId)
  assert.equal(result.veiled.pending, null)
  assert.equal([...result.session.state.prefixes, ...result.session.state.suffixes].some((affix) => affix.source === 'veiled'), true)
  service.cleanup()
  await rm(root, { recursive: true, force: true })
})

test('CraftingService 跨层返回野兽目录并保持希内科拉预览一致', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crafting-beast-service-'))
  const service = new CraftingService({ storageRoot: root, protocol: { handle() {} }, net: { fetch() {} }, fetchImpl: fixtureFetch })
  await service.initialize()
  const base = service.repository.getDataset().bases.find((entry) => entry.itemClass === 'Wand' && entry.allowedVariants.includes('normal'))
  let result = service.createManualSession({ baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 992 })
  assert.equal(result.beastcraft.total, 27)
  result = service.applyManualCurrency(result.session, 'currency:transmutation')
  result = service.applyManualBeastcraft(result.session, 'apply-hinekora-lock', { beastLevel: 83 })
  assert.equal(result.session.foreseeing, true)
  const preview = service.previewManualCurrency(result.session, 'currency:alteration')
  result = service.applyManualCurrency(result.session, 'currency:alteration')
  assert.deepEqual(result.session.state, preview.state)
  assert.equal(result.session.foreseeing, false)
  service.cleanup()
  await rm(root, { recursive: true, force: true })
})
})()

// === Merged from craftingOverlayLanguage.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const fileURLToPath = _m6_fileURLToPath
  const createServer = _m6_createServer
  const vue = _m6_vue
  const createSSRApp = _m6_createSSRApp
  const h = _m6_h
  const renderToString = _m6_renderToString
  const load = _m6_load
const canonical = {
  name: 'Plentiful Diamond Flask', baseName: 'Diamond Flask', category: '功能药剂', rarity: '魔法', level: 84,
  implicitMods: ['20% increased Critical Strike Chance'],
  explicitMods: ['+22 to Maximum Charges'],
  modifiers: [{ type: 'prefix', name: 'Plentiful', tier: 4, text: '+22 to Maximum Charges', tags: [] }],
  affixMatch: true, matchedModTexts: ['+22 to Maximum Charges'],
  eldritchImplicitMatch: true, matchedEldritchText: '20% increased Critical Strike Chance'
}
const displays = [
  { displayName: 'Plentiful Diamond Flask', displayBaseName: 'Diamond Flask',
    displayImplicitMods: ['20% increased Critical Strike Chance'], displayExplicitMods: ['+22(20-23) to Maximum Charges'] },
  { displayName: '丰富的宝钻药剂', displayBaseName: '宝钻药剂',
    displayImplicitMods: ['暴击率提高 20%'], displayExplicitMods: ['最大充能 +22(20-23)'] },
  { displayName: '豐產的寶鑽藥劑', displayBaseName: '寶鑽藥劑',
    displayImplicitMods: ['增加 20% 暴擊率'], displayExplicitMods: ['+22(20-23) 最大充能'] }
]

test('制作浮窗渲染英简繁原文、数值范围并继续按规范词缀高亮，兼容旧数据', async t => {
  const vite = await createServer({ configFile: false, plugins: [vue()],
    optimizeDeps: { noDiscovery: true, include: [] },
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  t.after(() => vite.close())
  const { default: Overlay } = await vite.ssrLoadModule('/src/domains/overlay/components/OverlayContent.vue')
  const render = async itemInfo => {
    const app = createSSRApp(Overlay, { itemInfo, isCompleted: true, settings: { backgroundMode: 'none' } })
    for (const name of ['el-button', 'el-icon']) app.component(name, { render() { return h('div', this.$slots.default?.()) } })
    return load(await renderToString(app))
  }
  for (const display of displays) {
    for (const detailed of [true, false]) {
      const item = { ...canonical, ...display,
        modifiers: detailed ? [{ ...canonical.modifiers[0], displayText: display.displayExplicitMods[0] }] : [] }
      const $ = await render(item)
      assert.equal($('.item-header > span').text(), display.displayName)
      assert.equal($('.item-base').text().trim(), `${display.displayBaseName}-84`)
      assert.equal($('.implicit-section .mod-text').text(), display.displayImplicitMods[0])
      const explicit = $('.mod-line').filter((_, node) => $(node).find('.mod-text').text() === display.displayExplicitMods[0])
      assert.equal(explicit.length, 1)
      assert.ok(explicit.hasClass('matched-highlight'))
      assert.ok($('.implicit-section .mod-line').hasClass('matched-highlight'))
      if (detailed) assert.equal(explicit.find('.mod-tier').text().trim(), 'P4')
    }
  }
  const legacy = await render(canonical)
  assert.equal(legacy('.item-header > span').text(), canonical.name)
  assert.equal(legacy('.item-base').text().trim(), `${canonical.baseName}-84`)
  assert.equal(legacy('.implicit-section .mod-text').text(), canonical.implicitMods[0])
  assert.equal(legacy('.mod-line .mod-text').last().text(), canonical.explicitMods[0])
})
})()
