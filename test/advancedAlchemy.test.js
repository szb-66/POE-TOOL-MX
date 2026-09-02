import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'
import { normalizeModuleTwo } from '../src/domains/items/affixConfig.js'
import {
  cleanMigratedChartConfig,
  cleanMigratedMapConfig,
  createDefaultChartConfig,
  createDefaultMapConfig
} from '../src/utils/mapPresetMigration.js'
import { CURRENCY_NAMES } from '../src/utils/constants.js'
import { CURRENCY_POSITION_KEYS, createEmptyCurrencyPositions } from '../src/utils/environmentDefaults.js'
import { buildCraftingCurrencyPreflight, buildMapCurrencyPreflight } from '../src/utils/currencyPreflight.js'
import { collectCraftingConfigurationIssues, collectMapConfigurationIssues } from '../src/domains/configurationGuide/configurationIssues.js'
import { CraftingCurrencyUsageLedger } from '../electron/modules/python/currencyUsageLedger.js'

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
  assert.match(mapView, /v-if="activeProfile\.method === 'alchemy'"[\s\S]*?v-model="activeProfile\.binding\.enabled"[\s\S]*?使用高阶点金石/)
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
    assert.match(itemScript, /required_currency_types = \["wisdom","scouring","binding"\]/)
    assert.match(itemScript, /apply_currency\("binding"\)/)

    const mapScript = generateMapRollingScript({
      ...common,
      inventory: { startPos: { x: 10, y: 20 }, slotSize: { w: 40, h: 40 } },
      mapConfig: { ...createDefaultMapConfig(), method: 'alchemy', binding: { enabled: true } }
    })
    assert.match(mapScript, /required_currency_types = \["wisdom","scouring","binding"\]/)
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
