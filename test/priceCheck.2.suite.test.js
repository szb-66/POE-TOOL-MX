import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { createHash as _m0_createHash } from 'node:crypto'
import _m0_path from 'node:path'
import { parseItemInfo as _m0_parseItemInfo } from '../electron/modules/item/parser.js'
import { loadTradeCatalog as _m0_loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { buildOfficialTradeQuery as _m0_buildOfficialTradeQuery, createPriceCheckModel as _m0_createPriceCheckModel, sanitizePriceCheckModel as _m0_sanitizePriceCheckModel } from '../electron/modules/priceCheck/query.js'
import { PriceCheckService as _m0_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { CHAOS_ERROR_CODES as _m0_CHAOS_ERROR_CODES } from '../electron/modules/chaosRecipe/errors.js'
import { INTERNATIONAL_THUNDERQUIVER_WARRANT as _m0_INTERNATIONAL_THUNDERQUIVER_WARRANT, MERCENARY_WARRANT_FIXTURES as _m0_MERCENARY_WARRANT_FIXTURES } from './fixtures/mercenaryWarrants.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { readFileSync as _m1_readFileSync } from 'node:fs'
import { parse as _m1_parse, compileScript as _m1_compileScript } from '@vue/compiler-sfc'
import * as _m1_Vue from 'vue'
import { createPriceCheckPreview as _m1_createPriceCheckPreview } from '../src/domains/priceCheck/priceCheckPreview.js'
import { clearSelectionForStats as _m1_clearSelectionForStats, formatPropertyTooltip as _m1_formatPropertyTooltip, formatStatTooltip as _m1_formatStatTooltip, restoreAutoSelectionForStats as _m1_restoreAutoSelectionForStats } from '../src/domains/priceCheck/priceCheckAutoSelectionUi.js'
import { PRICE_CHECK_STATE_FILTERS as _m1_PRICE_CHECK_STATE_FILTERS, PRICE_CHECK_STAT_TYPES as _m1_PRICE_CHECK_STAT_TYPES } from '../shared/priceCheckMetadata.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { readFile as _m2_readFile } from 'node:fs/promises'
import { PriceCheckService as _m2_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { priceCheckCategoryCorpus as _m2_priceCheckCategoryCorpus, priceCheckUsageCorpus as _m2_priceCheckUsageCorpus } from './fixtures/priceCheckCategoryCorpus.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { createHash as _m3_createHash } from 'node:crypto'
import { readFile as _m3_readFile } from 'node:fs/promises'
import { PriceCheckService as _m3_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { buildOfficialTradeQuery as _m3_buildOfficialTradeQuery } from '../electron/modules/priceCheck/query.js'
import { applyOriginalModifierText as _m3_applyOriginalModifierText } from '../electron/modules/priceCheck/displayText.js'
import { localizedDagger as _m3_localizedDagger } from './fixtures/priceCheckLocalizedDagger.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { readFileSync as _m4_readFileSync } from 'node:fs'
import { ChaosRecipeError as _m4_ChaosRecipeError } from '../electron/modules/chaosRecipe/errors.js'
import { PriceCheckErrorLog as _m4_PriceCheckErrorLog } from '../electron/modules/priceCheck/errorLog.js'
import { PriceCheckService as _m4_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { formatPriceCheckErrorLog as _m4_formatPriceCheckErrorLog, selectPriceCheckErrorEntries as _m4_selectPriceCheckErrorEntries } from '../src/domains/priceCheck/priceCheckErrorReport.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { createHash as _m5_createHash } from 'node:crypto'
import { readFile as _m5_readFile } from 'node:fs/promises'
import { createLocalizationTextResolver as _m5_createLocalizationTextResolver } from '../electron/modules/localization/text.js'
import { PriceCheckService as _m5_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { userLifeFlask as _m5_userLifeFlask, equivalentEnglishLifeFlask as _m5_equivalentEnglishLifeFlask, equivalentTraditionalLifeFlask as _m5_equivalentTraditionalLifeFlask, userDreadMaidenFlask as _m5_userDreadMaidenFlask, userKiaraFlask as _m5_userKiaraFlask } from './fixtures/priceCheckFlask.js'
import { statNumber as _m5_statNumber } from '../electron/modules/localization/statVariants.js'
import { applyInternationalPseudoRules as _m5_applyInternationalPseudoRules } from '../electron/modules/priceCheck/catalog.js'
import { createPriceCheckModel as _m5_createPriceCheckModel } from '../electron/modules/priceCheck/query.js'
import { flaskStructures as _m5_flaskStructures } from './fixtures/priceCheckFlaskStructures.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { parseItemInfo as _m6_parseItemInfo } from '../electron/modules/item/parser.js'
import { loadTradeCatalog as _m6_loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { createPriceCheckModel as _m6_createPriceCheckModel, buildOfficialTradeQuery as _m6_buildOfficialTradeQuery, sanitizePriceCheckModel as _m6_sanitizePriceCheckModel, refreshPseudoStats as _m6_refreshPseudoStats } from '../electron/modules/priceCheck/query.js'
import { PriceCheckService as _m6_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import { readFileSync as _m7_readFileSync } from 'node:fs'
import { createHash as _m7_createHash } from 'node:crypto'
import { createLocalizationDictionary as _m7_createLocalizationDictionary } from '../electron/modules/localization/text.js'
import { applyGameTextPresentation as _m7_applyGameTextPresentation } from '../electron/modules/priceCheck/gameText.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import _m8_path from 'node:path'
import { readFileSync as _m8_readFileSync } from 'node:fs'
import { parseItemInfo as _m8_parseItemInfo } from '../electron/modules/item/parser.js'
import { loadTradeCatalog as _m8_loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { PriceCheckService as _m8_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { buildOfficialTradeQuery as _m8_buildOfficialTradeQuery, createPriceCheckModel as _m8_createPriceCheckModel, refreshPseudoStats as _m8_refreshPseudoStats, sanitizePriceCheckModel as _m8_sanitizePriceCheckModel } from '../electron/modules/priceCheck/query.js'
import { PRICE_CHECK_CLASSIC_INFLUENCES as _m8_PRICE_CHECK_CLASSIC_INFLUENCES } from '../shared/priceCheckMetadata.js'

// === Merged from mercenaryWarrantPriceCheck.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const createHash = _m0_createHash
  const path = _m0_path
  const parseItemInfo = _m0_parseItemInfo
  const loadTradeCatalog = _m0_loadTradeCatalog
  const buildOfficialTradeQuery = _m0_buildOfficialTradeQuery
  const createPriceCheckModel = _m0_createPriceCheckModel
  const sanitizePriceCheckModel = _m0_sanitizePriceCheckModel
  const PriceCheckService = _m0_PriceCheckService
  const CHAOS_ERROR_CODES = _m0_CHAOS_ERROR_CODES
  const INTERNATIONAL_THUNDERQUIVER_WARRANT = _m0_INTERNATIONAL_THUNDERQUIVER_WARRANT
  const MERCENARY_WARRANT_FIXTURES = _m0_MERCENARY_WARRANT_FIXTURES
const catalogPath = path.resolve('electron/modules/priceCheck/catalog.json')
const catalogPromise = loadTradeCatalog(catalogPath)
const internationalCatalogPromise = loadTradeCatalog(path.resolve('electron/modules/priceCheck/catalog.international.json'))

function mercenaryLocalizationRows() {
  return [
    { table: 'activeskills', field: 'DisplayedName', id: 'wrath', en: 'Wrath', cn: '雷霆', tw: '雷霆' },
    { table: 'hideoutdoodadcategory', field: 'Name', id: 'Lightning', en: 'Lightning', cn: '闪电', tw: '雷霆' },
    { table: 'mercenarybuilds', field: 'Name', id: 'EleBowRangerLightning', en: 'Thunderquiver', cn: '雷电射手', tw: '雷鏃' }
  ].map(entry => ({ ...entry, kind: 'dat', sourceHash: createHash('sha256').update(entry.en).digest('hex') }))
}

test('三份佣兵凭证复制文本解析构建、等级和有序技能组并排除说明文字', () => {
  for (const fixture of MERCENARY_WARRANT_FIXTURES) {
    const item = parseItemInfo(fixture.text)
    assert.equal(item.category, '地图碎片')
    assert.equal(item.name, '佣兵凭证')
    assert.equal(item.mercenary.build, fixture.build)
    assert.equal(item.mercenary.level, 83)
    assert.equal(item.mercenary.skills.length, 6)
    assert.ok(item.mercenary.skills.some(({ supports }) => supports.length === 0))
    assert.deepEqual(item.modifiers, [])
    assert.equal(item.explicitMods.length, 0)
    assert.ok(item.mercenary.skills.every(({ name }) => !name.includes('右键点击') && !name.includes('个人地图装置')))
  }

  const ordinary = parseItemInfo(MERCENARY_WARRANT_FIXTURES[0].text)
  assert.deepEqual(ordinary.mercenary.skills[0].supports[0], {
    text: '武器元素伤害 (等阶：2)',
    name: '武器元素伤害',
    tier: 2
  })
  const fullWidth = parseItemInfo(MERCENARY_WARRANT_FIXTURES[0].text.replace('急冻 (等阶：2)', '急冻（等阶: 2）'))
  assert.deepEqual(fullWidth.mercenary.skills[0].supports[1], {
    text: '急冻（等阶: 2）',
    name: '急冻',
    tier: 2
  })
})

test('带价格尾标的佣兵凭证仍进入专用解析', () => {
  const text = MERCENARY_WARRANT_FIXTURES[0].text.replace(/^佣兵凭证$/m, '佣兵凭证 [1d]')
  const item = parseItemInfo(text)

  assert.equal(item.name, '佣兵凭证')
  assert.equal(item.mercenary.build, '连珠射手')
  assert.equal(item.mercenary.level, 83)
  assert.equal(item.mercenary.skills.length, 6)
  assert.deepEqual(item.explicitMods, [])
})

test('普通与恶名构建唯一映射官方身份且全部技能进入 mercenary 命名空间', async () => {
  const { catalog } = await catalogPromise
  for (const fixture of MERCENARY_WARRANT_FIXTURES) {
    const model = createPriceCheckModel(parseItemInfo(fixture.text), catalog)
    assert.equal(model.identity.type, fixture.officialType)
    assert.equal(model.identity.discriminator, 'mercenary_warrant')
    assert.equal(model.identity.displayName, `佣兵凭证（${fixture.build}）`)
    assert.equal(model.identity.category, 'map.fragment')
    assert.equal(model.item.mercenaryBuild, fixture.build)
    assert.equal(model.mercenarySkillGroups.length, 6)
    assert.ok(model.mercenarySkillGroups.every((group) => !group.enabled && group.skill.id.startsWith('mercenary.skill_')))
    assert.ok(model.mercenarySkillGroups.flatMap(({ supports }) => supports).every((support) => (
      !support.enabled && support.id.startsWith('mercenary.support_')
    )))
    assert.deepEqual(model.unknownStats, [])
  }
})

test('默认仅查询 BD，等级与技能组按选择严格序列化且同名辅助不跨组', async () => {
  const { catalog } = await catalogPromise
  const model = createPriceCheckModel(parseItemInfo(MERCENARY_WARRANT_FIXTURES[0].text), catalog)
  const level = model.properties.find(({ label }) => label === '佣兵等级')
  assert.deepEqual(
    { id: level.id, label: level.label, value: level.value, enabled: level.enabled, min: level.min, max: level.max },
    { id: 'misc.itemLevel', label: '佣兵等级', value: 83, enabled: false, min: 83, max: undefined }
  )

  const initial = buildOfficialTradeQuery(model)
  assert.deepEqual(initial.query.type, { discriminator: 'mercenary_warrant', option: 'EleBowRangerClones' })
  assert.equal(initial.query.filters.type_filters.filters.category.option, 'map.fragment')
  assert.equal(initial.query.filters.misc_filters?.filters.ilvl, undefined)
  assert.deepEqual(initial.query.stats, [{ type: 'and', filters: [] }])

  const iceShot = model.mercenarySkillGroups[0]
  const vaalIceShot = model.mercenarySkillGroups[2]
  iceShot.enabled = true
  iceShot.supports.find(({ name }) => name === '急冻').enabled = true
  vaalIceShot.enabled = true
  vaalIceShot.supports.find(({ name }) => name === '急冻').enabled = true
  level.enabled = true
  level.min = 80
  level.max = 84

  const selected = buildOfficialTradeQuery(model)
  assert.deepEqual(selected.query.filters.misc_filters.filters.ilvl, { min: 80, max: 84 })
  const groups = selected.query.stats.filter(({ type }) => type === 'mercenary')
  assert.equal(groups.length, 2)
  assert.deepEqual(groups.map(({ value }) => value), [{ min: 2 }, { min: 2 }])
  assert.equal(groups[0].filters[0].id, iceShot.skill.id)
  assert.equal(groups[1].filters[0].id, vaalIceShot.skill.id)
  assert.equal(groups[0].filters[1].id, iceShot.supports.find(({ name }) => name === '急冻').id)
  assert.equal(groups[1].filters[1].id, vaalIceShot.supports.find(({ name }) => name === '急冻').id)
})

test('trusted model 重建凭证身份和组关系，仅保留合法选择与等级范围', async () => {
  const { catalog } = await catalogPromise
  const trusted = createPriceCheckModel(parseItemInfo(MERCENARY_WARRANT_FIXTURES[0].text), catalog)
  const submitted = structuredClone(trusted)
  submitted.identity.type = '伪造底材'
  submitted.identity.discriminator = 'map'
  submitted.item.mercenaryBuild = '伪造构建'
  submitted.properties.find(({ label }) => label === '佣兵等级').min = 81
  submitted.mercenarySkillGroups[0].enabled = true
  submitted.mercenarySkillGroups[0].skill.id = trusted.mercenarySkillGroups[1].skill.id
  submitted.mercenarySkillGroups[0].supports[0].enabled = true
  submitted.mercenarySkillGroups[1].supports.push({
    ...structuredClone(submitted.mercenarySkillGroups[0].supports[1]),
    enabled: true
  })

  const clean = sanitizePriceCheckModel(submitted, catalog, trusted.facts, trusted.item.category, trusted)
  assert.equal(clean.identity.type, trusted.identity.type)
  assert.equal(clean.identity.discriminator, 'mercenary_warrant')
  assert.equal(clean.item.mercenaryBuild, '连珠射手')
  assert.equal(clean.mercenarySkillGroups[0].skill.id, trusted.mercenarySkillGroups[0].skill.id)
  assert.equal(clean.mercenarySkillGroups[0].enabled, true)
  assert.equal(clean.mercenarySkillGroups[0].supports[0].enabled, true)
  assert.equal(clean.mercenarySkillGroups[1].supports.some(({ enabled }) => enabled), false)
  assert.equal(clean.properties.find(({ label }) => label === '佣兵等级').min, 81)

  submitted.properties.find(({ label }) => label === '佣兵等级').min = -1
  submitted.properties.find(({ label }) => label === '佣兵等级').max = 101
  const invalidLevel = sanitizePriceCheckModel(submitted, catalog, trusted.facts, trusted.item.category, trusted)
  assert.equal(invalidLevel.properties.find(({ label }) => label === '佣兵等级').min, undefined)
  assert.equal(invalidLevel.properties.find(({ label }) => label === '佣兵等级').max, undefined)
})

test('未知 BD 构建返回可诊断错误', async () => {
  const { catalog } = await catalogPromise
  const item = parseItemInfo(MERCENARY_WARRANT_FIXTURES[0].text.replace('BD构建: 连珠射手', 'BD构建: 不存在的构建'))
  assert.throws(() => createPriceCheckModel(item, catalog), /没有佣兵构建“不存在的构建”/)
})

test('国际服雷电射手凭证保留简繁混合技能组，用本服目录发出佣兵条件', async () => {
  const { catalog: reference } = await catalogPromise
  const { catalog } = await internationalCatalogPromise
  const requests = []
  const service = new PriceCheckService({
    catalog,
    mercenaryReferenceCatalog: reference,
    localizationProvider: mercenaryLocalizationRows,
    auth: { getStatus: () => ({ authenticated: true }), registerCacheClearer() {} },
    allowManualQueries: true,
    client: {
      server: { id: 'international' },
      clearCache() {},
      async search(_league, body) { requests.push(body); return { id: 'test', total: 0, result: [] } },
      async fetch() { return { result: [] } }
    }
  })
  const parsed = parseItemInfo(INTERNATIONAL_THUNDERQUIVER_WARRANT)
  const model = service.parse(INTERNATIONAL_THUNDERQUIVER_WARRANT)
  assert.equal(model.identity.displayName, '佣兵凭证（雷电射手）')
  assert.equal(model.properties.find(property => property.id === 'misc.itemLevel')?.value, 83)
  assert.deepEqual(model.unknownStats, [])
  assert.deepEqual(model.mercenarySkillGroups, service.modelFromItem(parsed).mercenarySkillGroups)
  assert.deepEqual(model.mercenarySkillGroups.map(({ skill }) => skill.id), [
    'mercenary.skill_41051', 'mercenary.skill_47406', 'mercenary.skill_17216',
    'mercenary.skill_22000', 'mercenary.skill_38072', 'mercenary.skill_38326'
  ])
  assert.equal(model.mercenarySkillGroups.flatMap(group => group.supports).length, 16)
  assert.equal(model.mercenarySkillGroups[0].supports[2].id, 'mercenary.support_44886')
  assert.equal(model.mercenarySkillGroups[5].skill.text, '雷霆')
  assert.deepEqual(buildOfficialTradeQuery(model).query.stats, [{ type: 'and', filters: [] }])

  await service.checkCapturedItem({ item: parsed, league: 'Test League', execute: false })
  const edited = structuredClone(service.latest.model)
  edited.mercenarySkillGroups[5].enabled = true
  await service.rerun({ model: edited })
  assert.deepEqual(requests[0].query.type, { discriminator: 'mercenary_warrant', option: 'EleBowRangerLightning' })
  assert.deepEqual(requests[0].query.stats.at(-1), { type: 'mercenary', value: { min: 1 }, filters: [{ id: 'mercenary.skill_38326' }] })

  for (const source of [
    `Item Class: Map Fragments\nRarity: Normal\nMercenary Warrant\n--------\nBuild: Thunderquiver\nMercenary Level: 83\n--------\nWrath\n--------\nRight-click this item to view the Mercenary.`,
    `物品種類: 地圖碎片\n稀 有 度: 普通\n傭兵契約書\n--------\n流派: 雷鏃\n傭兵等級: 83\n--------\n雷霆\n--------\n右鍵點擊此物品以查看傭兵細節。`
  ]) {
    const localized = service.parse(source)
    assert.equal(localized.identity.type, 'EleBowRangerLightning')
    assert.deepEqual(localized.mercenarySkillGroups.map(({ skill }) => skill.id), ['mercenary.skill_38326'])
  }
})

test('佣兵技能无法在当前国际服目录确认时保留失败，其他翻译类型不能代替', async () => {
  const { catalog: reference } = await catalogPromise
  const { catalog } = await internationalCatalogPromise
  const rows = mercenaryLocalizationRows()
  const service = new PriceCheckService({
    catalog: { ...catalog, stats: catalog.stats.filter(row => row.ids?.mercenary !== 'mercenary.skill_38326') },
    mercenaryReferenceCatalog: reference,
    localizationProvider: () => rows,
    auth: {},
    client: { server: { id: 'international' } }
  })
  assert.throws(() => service.parse(INTERNATIONAL_THUNDERQUIVER_WARRANT), /国际服交易目录无法识别佣兵主动技能“雷霆”/)
})

test('官方复杂度拒绝返回稳定提示且保留当前技能选择', async () => {
  const { catalog, status } = await catalogPromise
  let overlayState = null
  let searches = 0
  const overlay = {
    create(snapshot) { overlayState = structuredClone(snapshot) },
    update(snapshot) { overlayState = { ...overlayState, ...structuredClone(snapshot) } },
    getState() { return overlayState }
  }
  const service = new PriceCheckService({
    auth: { getStatus: () => ({ authenticated: true, accountName: 'me' }), registerCacheClearer() {} },
    client: {
      clearCache() {},
      async search() {
        searches += 1
        const error = new Error('官方查询失败')
        error.details = { status: 400, officialMessage: 'Query is too complex' }
        throw error
      },
      async fetch() { return { result: [] } }
    },
    catalog,
    catalogStatus: status,
    overlay
  })
  service.updateRuntime({ enabled: true })
  const model = createPriceCheckModel(parseItemInfo(MERCENARY_WARRANT_FIXTURES[0].text), catalog)
  model.mercenarySkillGroups[0].enabled = true

  await assert.rejects(
    service.check({ league: 'S30', model }),
    (error) => error.code === CHAOS_ERROR_CODES.QUERY_TOO_COMPLEX && /减少启用的技能组/.test(error.message)
  )
  assert.equal(searches, 1)
  assert.equal(overlayState.status, 'error')
  assert.equal(overlayState.error.code, CHAOS_ERROR_CODES.QUERY_TOO_COMPLEX)
  assert.equal(overlayState.model.mercenarySkillGroups[0].enabled, true)
})

test('普通物品的复杂度拒绝使用通用筛选提示', async () => {
  const { catalog, status } = await catalogPromise
  const service = new PriceCheckService({
    auth: { getStatus: () => ({ authenticated: true, accountName: 'me' }), registerCacheClearer() {} },
    client: {
      clearCache() {},
      async search() {
        const error = new Error('官方查询失败')
        error.details = { status: 400, officialMessage: 'Query is too complex' }
        throw error
      },
      async fetch() { return { result: [] } }
    },
    catalog,
    catalogStatus: status,
    overlay: { create() {}, update() {} }
  })
  service.updateRuntime({ enabled: true })
  const model = createPriceCheckModel({
    category: '腰带',
    rarity: '稀有',
    name: '皮革腰带',
    baseName: '皮革腰带',
    modifiers: []
  }, catalog)

  await assert.rejects(
    service.check({ league: 'S30', model }),
    (error) => error.code === CHAOS_ERROR_CODES.QUERY_TOO_COMPLEX &&
      /减少启用的筛选条件/.test(error.message) &&
      !/佣兵/.test(error.message)
  )
})
})()

// === Merged from priceCheckActions.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const readFileSync = _m1_readFileSync
  const parse = _m1_parse
  const compileScript = _m1_compileScript
  const Vue = _m1_Vue
  const createPriceCheckPreview = _m1_createPriceCheckPreview
  const clearSelectionForStats = _m1_clearSelectionForStats
  const formatPropertyTooltip = _m1_formatPropertyTooltip
  const formatStatTooltip = _m1_formatStatTooltip
  const restoreAutoSelectionForStats = _m1_restoreAutoSelectionForStats
  const PRICE_CHECK_STATE_FILTERS = _m1_PRICE_CHECK_STATE_FILTERS
  const PRICE_CHECK_STAT_TYPES = _m1_PRICE_CHECK_STAT_TYPES
async function mountOverlay(openOfficial, initialSnapshot = null) {
  const source = readFileSync(new URL('../src/domains/priceCheck/PriceCheckOverlayView.vue', import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  const compiled = compileScript(descriptor, { id: 'price-check-test', inlineTemplate: true, genDefaultAs: 'component' }).content
    .replace(/import \{([^}]+)\} from ["']vue["'];?/g, (_, names) => `const {${names.replace(/\s+as\s+/g, ':')}} = Vue;`)
    .replace(/^import .*$/gm, '')
  let update
  const snapshot = { status: 'ready', league: 'S30', model: createPriceCheckPreview().state.model, result: { queryId: 'q-1', total: 1, listings: [{ id: 'abc', amount: 1, currency: 'chaos' }] } }
  const api = { priceCheck: {
    openOfficial, onOverlayState: callback => { update = callback; return () => {} },
    onSettingsChanged: () => () => {}, getOverlayState: async () => ({ success: true, data: initialSnapshot || snapshot })
  } }
  const component = new Function(
    'Vue', 'useSettingsStore', 'electronApi', 'ArrowDown', 'PRICE_CHECK_STATE_FILTERS', 'PRICE_CHECK_STAT_TYPES',
    'clearSelectionForStats', 'formatPropertyTooltip', 'formatStatTooltip', 'restoreAutoSelectionForStats',
    `${compiled}; return component`
  )(
    Vue, () => ({ globalShortcuts: {} }), api, { render: () => null }, PRICE_CHECK_STATE_FILTERS, PRICE_CHECK_STAT_TYPES,
    clearSelectionForStats, formatPropertyTooltip, formatStatTooltip, restoreAutoSelectionForStats
  )
  const node = (type, text = '') => ({ type, text, props: {}, children: [], parent: null })
  const renderer = Vue.createRenderer({
    createElement: type => node(type), createText: text => node('text', text), createComment: text => node('comment', text),
    setText: (target, text) => { target.text = text }, setElementText: (target, text) => { target.text = text; target.children = [] },
    patchProp: (target, key, previous, value) => { target.props[key] = value },
    insert(target, parent, anchor) {
      if (target.parent) target.parent.children.splice(target.parent.children.indexOf(target), 1)
      target.parent = parent
      const index = anchor ? parent.children.indexOf(anchor) : -1
      parent.children.splice(index < 0 ? parent.children.length : index, 0, target)
    },
    remove(target) { if (target.parent) target.parent.children.splice(target.parent.children.indexOf(target), 1) },
    parentNode: target => target.parent, nextSibling: target => target.parent?.children[target.parent.children.indexOf(target) + 1]
  })
  const root = node('root'), app = renderer.createApp(component)
  for (const name of ['el-select', 'el-option', 'el-switch', 'el-input-number', 'el-icon']) {
    app.component(name, { setup: (_, { attrs, slots }) => () => Vue.h('div', attrs, slots.default?.()) })
  }
  app.mount(root)
  await Vue.nextTick(); await Vue.nextTick()
  const flatten = target => [target, ...target.children.flatMap(flatten)]
  const text = target => target.text + target.children.map(text).join('')
  return { app, root, text, update, snapshot, button: () => flatten(root).find(n => n.type === 'button' && text(n) === '网页市集'), alerts: () => flatten(root).filter(n => n.props.role === 'alert') }
}

test('网页市集显示 IPC 失败和异常，保留结果并可重试，阻止重复点击', async t => {
  let complete, calls = 0
  const view = await mountOverlay(() => { calls++; return new Promise(resolve => { complete = resolve }) })
  t.after(() => view.app.unmount())
  const pending = view.button().props.onClick()
  await Vue.nextTick()
  assert.equal(view.button().props.disabled, true)
  await view.button().props.onClick()
  assert.equal(calls, 1)
  complete({ success: false, error: { message: '官方编号无效' } })
  await pending; await Vue.nextTick()
  assert.equal(view.text(view.alerts()[0]), '官方编号无效')
  assert.match(view.text(view.root), /共找到 1 个物品/)
  assert.equal(view.button().props.disabled, false)
  const retry = view.button().props.onClick()
  await Vue.nextTick()
  assert.equal(view.alerts().length, 0)
  complete({ success: true, data: { opened: true } })
  await retry; await Vue.nextTick()
  assert.equal(view.alerts().length, 0)
})

test('网页调用抛出异常也可见，新查询清除旧错误', async t => {
  const view = await mountOverlay(async () => { throw new Error('browser unavailable') })
  t.after(() => view.app.unmount())
  await view.button().props.onClick(); await Vue.nextTick()
  assert.equal(view.text(view.alerts()[0]), 'browser unavailable')
  assert.equal(view.button().props.disabled, false)
  assert.match(view.text(view.root), /共找到 1 个物品/)
  view.update({ ...view.snapshot, status: 'loading' }); await Vue.nextTick()
  assert.equal(view.alerts().length, 0)
})

test('查价浮窗直接展示加载状态和查询结果，不展示捕获占位文案', async t => {
  const view = await mountOverlay(async () => ({ success: true }), { status: 'loading', result: null })
  t.after(() => view.app.unmount())
  assert.match(view.text(view.root), /正在查询官方挂单…/)
  assert.doesNotMatch(view.text(view.root), /查价器已启动，请稍候|正在读取物品/)
  view.update(view.snapshot)
  await Vue.nextTick()
  assert.match(view.text(view.root), /共找到 1 个物品/)
  assert.doesNotMatch(view.text(view.root), /正在查询官方挂单/)
})
})()

// === Merged from priceCheckCategoryCorpus.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const readFile = _m2_readFile
  const PriceCheckService = _m2_PriceCheckService
  const priceCheckCategoryCorpus = _m2_priceCheckCategoryCorpus
  const priceCheckUsageCorpus = _m2_priceCheckUsageCorpus
const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
const entries = JSON.parse(await readFile(new URL('./fixtures/price-check-category-entries.json', import.meta.url), 'utf8'))
const searches = []
const service = new PriceCheckService({
  catalog,
  manualInputOnly: true,
  localizationProvider: () => entries,
  auth: { getStatus: () => ({ authenticated: true }) },
  client: {
    server: { id: 'international', label: '国际服' },
    clearCache() {},
    search: async (league, query) => {
      searches.push({ league, query })
      return { id: 'category-corpus', total: 0, result: [] }
    },
    fetch: async () => ({ result: [] })
  }
})

for (const fixture of [...priceCheckCategoryCorpus, ...priceCheckUsageCorpus]) {
  test(`国际服分类语料 ${fixture.id} 保持官方物品身份`, async () => {
    searches.length = 0
    const result = await service.check({ league: 'Covens', text: fixture.text, options: { initialSelection: 'none' } })
    assert.equal(result.model.identity.type, fixture.expectedType)
    assert.equal(searches.length, 1, '应构建并发起一次官方查询')
    const type = searches[0].query.query.type
    assert.equal(typeof type === 'object' ? type.option : type, fixture.expectedType)
    assert.equal(typeof type === 'object' ? type.discriminator || '' : '', fixture.expectedDiscriminator)
  })
}

test('中文同名传奇通过真实底材区分戒指与项链', async () => {
  for (const [name, base, itemClass] of [['Timetwist', 'Moonstone Ring', 'Rings'], ['Warped Timepiece', 'Turquoise Amulet', 'Amulets']]) {
    const translatedName = entries.find(entry => entry.table === 'words' && entry.en === name && entry.cn)?.cn
    const translatedBase = entries.find(entry => entry.table === 'baseitemtypes' && entry.en === base && entry.cn)?.cn
    const translatedClass = entries.find(entry => entry.table === 'itemclasses' && entry.en === itemClass && entry.cn)?.cn
    assert.ok(translatedName && translatedBase && translatedClass)
    assert.equal(translatedName, '时空扭曲')
    searches.length = 0
    const result = await service.check({ league: 'Covens', text: `物品类别: ${translatedClass}\n稀有度: 传奇\n${translatedName}\n${translatedBase}\n--------\n物品等级: 80` })
    assert.equal(result.model.identity.name, name)
    assert.equal(result.model.identity.type, base)
    assert.equal(searches.length, 1)
    assert.equal(searches[0].query.query.name, name)
    assert.equal(searches[0].query.query.type, base)
  }
})
})()

// === Merged from priceCheckDisplayLanguage.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const createHash = _m3_createHash
  const readFile = _m3_readFile
  const PriceCheckService = _m3_PriceCheckService
  const buildOfficialTradeQuery = _m3_buildOfficialTradeQuery
  const applyOriginalModifierText = _m3_applyOriginalModifierText
  const localizedDagger = _m3_localizedDagger
const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
const entry = (id, en, cn, extra = {}) => ({ kind: 'dat', table: 'BaseItemTypes', field: 'Name',
  id, en, cn, tw: cn, sourceHash: createHash('sha256').update(en).digest('hex'), ...extra })
const entries = [
  entry('Metadata/Items/Rings/Ring3', 'Coral Ring', '珊瑚戒指'),
  entry('base_maximum_life', '+{0} to maximum Life', '+{0} 最大生命', { kind: 'stat' }),
  entry('base_maximum_mana', '+{0} to maximum Mana', '+{0} 最大魔力', { kind: 'stat' })
]
const original = `物品类别: 戒指
稀有度: 稀有
风暴之环
珊瑚戒指
--------
物品等级: 80
--------
{ 前缀属性 "健壮的" (等阶: 1) — 生命, 魔力 }
+89(80-99) 最大生命
+23(20-29) 最大魔力`
const english = `Item Class: Rings
Rarity: Rare
Storm Circle
Coral Ring
--------
Item Level: 80
--------
{ Prefix Modifier "Healthy" (Tier: 1) — Life, Mana }
+89(80-99) to maximum Life
+23(20-29) to maximum Mana`

function fixture() {
  const searches = []
  const client = { server: { id: 'international', label: '国际服' }, clearCache() {},
    search: async (league, query) => { searches.push({ league, query }); return { id: 'fixture', total: 0, result: [] } },
    fetch: async () => ({ result: [] }) }
  const service = new PriceCheckService({ auth: { getStatus: () => ({ authenticated: true }) },
    client, catalog, manualInputOnly: true, localizationProvider: () => entries })
  return { service, searches }
}

test('中文详细词缀按原文显示，分开的效果保留数值范围，国际服查询与英文等价', () => {
  const { service } = fixture()
  const localized = service.parse(original, { initialSelection: 'all' })
  const canonical = service.parse(english, { initialSelection: 'all' })
  assert.deepEqual(localized.stats.map(stat => stat.displayText), ['+89(80-99) 最大生命', '+23(20-29) 最大魔力'])
  assert.deepEqual(localized.stats.map(stat => stat.sources[0].displayText), localized.stats.map(stat => stat.displayText))
  assert.deepEqual(localized.stats.map(stat => stat.text), canonical.stats.map(stat => stat.text))
  assert.deepEqual(localized.stats.map(stat => stat.values), [[89], [23]])
  assert.deepEqual(buildOfficialTradeQuery(localized), buildOfficialTradeQuery(canonical))
  assert.ok(canonical.stats.every(stat => !/[\u3400-\u9fff]/u.test(stat.text)))
})

test('中文词缀原文经过查询、模型净化和重试仍保留，筛选边界照常可改', async () => {
  const { service, searches } = fixture()
  const first = await service.check({ league: 'Covens', text: original, options: { initialSelection: 'all' } })
  const model = structuredClone(first.model)
  model.stats[0].min = 90
  const rerun = await service.rerun({ model })
  assert.deepEqual(rerun.model.stats.map(stat => stat.displayText), first.model.stats.map(stat => stat.displayText))
  assert.deepEqual(rerun.model.stats.map(stat => stat.sources[0].displayText), first.model.stats.map(stat => stat.sources[0].displayText))
  assert.equal(searches.length, 2)
  assert.equal(searches[1].query.query.stats[0].filters[0].value.min, 90)
  assert.equal(rerun.model.stats[0].displayText, '+89(80-99) 最大生命')
})

test('多行官方词缀与合并来源按同一多行原文显示，保留原文用词和范围', () => {
  const canonical = '+89 to maximum Life\n+23 to maximum Mana'
  const original = '+89(80-99) 最大生命\n+23(20-29) 最大魔力值'
  const model = { stats: [{ id: 'explicit.stat_3299347043', text: canonical,
    values: [89, 23], sources: [{ text: '+89 to maximum Life' }, { text: '+23 to maximum Mana' }] }] }
  applyOriginalModifierText(model, [{ canonical, original }])
  assert.equal(model.stats[0].displayText, original)
  assert.equal(model.stats[0].text, canonical)
  assert.deepEqual(model.stats[0].sources.map(source => source.displayText), original.split('\n'))
  assert.deepEqual(model.stats[0].values, [89, 23])
})

test('相同数值的不同词缀来源各保留自己的范围，一行翻译成多行仍显示原文', () => {
  const model = { stats: [
    { text: '+20 to maximum Life', sources: [{ text: '+20 to maximum Life' }] },
    { text: '+20 to maximum Life', sources: [{ text: '+20 to maximum Life' }] },
    { text: '+23 to maximum Mana', sources: [{ text: '+23 to maximum Mana' }] }
  ] }
  applyOriginalModifierText(model, [
    { canonical: '+20(20-30) to maximum Life', original: '+20(20-30) 最大生命' },
    { canonical: '+20(10-29) to maximum Life', original: '+20(10-29) 最大生命' },
    { canonical: '+23 to maximum Mana\nRegenerate 1 Life per second', original: '+23 最大魔力，且每秒回复 1 生命' }
  ])
  assert.deepEqual(model.stats.map(stat => stat.displayText), [
    '+20(20-30) 最大生命', '+20(10-29) 最大生命', '+23 最大魔力，且每秒回复 1 生命'
  ])
})

test('用户提供的蚕食之暗完整文本显示六条中文词缀，并保留实际掷值', async () => {
  const entries = JSON.parse(await readFile(new URL('./fixtures/price-check-localized-dagger-entries.json', import.meta.url), 'utf8'))
  const { service } = fixture()
  service.localizationProvider = () => entries
  const model = service.parse(localizedDagger, { initialSelection: 'all' })
  assert.deepEqual(model.stats.map(stat => stat.displayText), [
    '全域暴击率提高 52(50-55)%',
    '30% 的火焰伤害转换为混沌伤害',
    '所有火焰法术主动技能石等级 +1',
    '火焰伤害提高 46(40-60)%',
    '+23(20-40) 智慧',
    '你的混沌伤害有 60% 的几率使敌人中毒'
  ])
  assert.deepEqual(model.stats.map(stat => stat.values), [[52], [30], [1], [46], [23], [60]])
  assert.deepEqual(model.unknownStats, [])
  assert.equal(buildOfficialTradeQuery(model).query.stats[0].filters.length, 6)
})
})()

// === Merged from priceCheckErrorLog.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const readFileSync = _m4_readFileSync
  const ChaosRecipeError = _m4_ChaosRecipeError
  const PriceCheckErrorLog = _m4_PriceCheckErrorLog
  const PriceCheckService = _m4_PriceCheckService
  const formatPriceCheckErrorLog = _m4_formatPriceCheckErrorLog
  const selectPriceCheckErrorEntries = _m4_selectPriceCheckErrorEntries
const EMPTY_CATALOG = { items: [], stats: [], pseudoRules: [], currencyLabels: {} }
const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

function createService({ search = async () => ({ id: 'query-id', total: 0, result: [] }) } = {}) {
  const service = new PriceCheckService({
    appVersion: '1.9.2',
    catalog: structuredClone(EMPTY_CATALOG),
    auth: { getStatus: () => ({ authenticated: true }), registerCacheClearer() {} },
    client: {
      server: { id: 'cn', label: '国服' },
      search,
      fetch: async () => ({ result: [] }),
      clearCache() {}
    }
  })
  service.updateRuntime({ enabled: true })
  return service
}

const RING_MODEL = {
  item: { category: '戒指', rarity: '普通', name: '珊瑚戒指', baseType: '' },
  identity: { name: '', type: '珊瑚戒指', nameEnabled: false },
  stats: []
}

test('查价错误记录保留报错、完整物品文本、解析结果和查价模型', () => {
  const log = new PriceCheckErrorLog({ now: () => Date.parse('2026-11-23T12:00:00.000Z') })
  const error = Object.assign(new Error('官方接口拒绝了查询'), {
    code: 'API_INCOMPATIBLE',
    details: { status: 400, officialMessage: 'unknown item base type' }
  })
  log.record({
    stage: 'query',
    error,
    league: 'S27 测试',
    source: 'capture',
    options: { status: 'available', listed: '1day' },
    itemText: '物品类别: 戒指\n稀有度: 普通\n珊瑚戒指\n--------\n物品等级: 80',
    item: { category: '戒指', rarity: '普通', name: '珊瑚戒指' },
    model: RING_MODEL,
    query: { query: { type: '珊瑚戒指' } },
    catalog: { provider: 'poe-cn', gameVersion: '3.30.0', degraded: true }
  })

  const snapshot = log.snapshot({ appVersion: '1.9.2', server: '国服' })
  assert.equal(snapshot.count, 1)
  assert.equal(snapshot.appVersion, '1.9.2')
  assert.equal(snapshot.server, '国服')
  const entry = snapshot.entries[0]
  assert.equal(entry.stage, 'query')
  assert.equal(entry.stageLabel, '查询官方交易接口')
  assert.equal(entry.code, 'API_INCOMPATIBLE')
  assert.equal(entry.message, '官方接口拒绝了查询')
  assert.equal(entry.league, 'S27 测试')
  assert.equal(entry.itemName, '珊瑚戒指')
  assert.equal(entry.itemRarity, '普通')
  assert.equal(entry.itemCategory, '戒指')
  assert.match(entry.itemText, /物品类别: 戒指/)
  assert.equal(entry.item.name, '珊瑚戒指')
  assert.deepEqual(entry.model.identity, RING_MODEL.identity)
  assert.deepEqual(entry.query.query, { type: '珊瑚戒指' })
  assert.deepEqual(entry.details, { status: 400, officialMessage: 'unknown item base type' })
  assert.match(entry.stack, /官方接口拒绝了查询/)
  assert.equal(entry.catalog.degraded, true)
})

test('连续重复的同一错误合并为重复次数且忽略取消操作', () => {
  let now = Date.parse('2026-11-23T12:00:00.000Z')
  const log = new PriceCheckErrorLog({ now: () => now })
  const make = () => Object.assign(new Error('网络中断'), { code: 'NETWORK_ERROR' })
  log.record({ stage: 'query', error: make(), itemText: '同一件物品' })
  now += 2_000
  log.record({ stage: 'query', error: make(), itemText: '同一件物品' })
  const abort = new DOMException('查询已取消', 'AbortError')
  assert.equal(log.record({ stage: 'query', error: abort, itemText: '同一件物品' }), null)

  assert.equal(log.count(), 1)
  assert.equal(log.snapshot().entries[0].repeatCount, 2)
})

test('重复错误跨时间且非连续出现时也会去重并更新为最新时间', () => {
  let now = Date.parse('2026-11-23T12:00:00.000Z')
  const log = new PriceCheckErrorLog({ now: () => now })
  const netError = () => Object.assign(new Error('网络中断'), { code: 'NETWORK_ERROR' })
  const apiError = () => Object.assign(new Error('查询条件过多'), { code: 'QUERY_TOO_COMPLEX' })

  const first = log.record({ stage: 'query', error: netError(), itemText: '物品A\r\n稀有度: 稀有' })
  now += 60_000
  log.record({ stage: 'query', error: apiError(), itemText: '物品B' })
  now += 120_000
  const merged = log.record({ stage: 'query', error: netError(), itemText: '物品A\n稀有度: 稀有  ' })

  assert.equal(log.count(), 2)
  assert.equal(merged.id, first.id)
  const snapshot = log.snapshot()
  assert.deepEqual(snapshot.entries.map(entry => entry.code), ['QUERY_TOO_COMPLEX', 'NETWORK_ERROR'])
  assert.equal(snapshot.entries[1].repeatCount, 2)
  assert.equal(snapshot.entries[1].timestamp, new Date(now).toISOString())
})

test('不同物品相同错误不会误去重，支持手动删除单条记录并允许删后重新记录', () => {
  let now = Date.parse('2026-11-23T12:00:00.000Z')
  const log = new PriceCheckErrorLog({ now: () => now })
  const make = () => Object.assign(new Error('官方接口拒绝了查询'), { code: 'API_INCOMPATIBLE' })

  const first = log.record({ stage: 'query', error: make(), itemText: '物品一' })
  now += 1_000
  const second = log.record({ stage: 'query', error: make(), itemText: '物品二' })

  assert.equal(log.count(), 2)
  assert.equal(log.remove('not-exists'), false)
  assert.equal(log.remove(first.id), true)
  assert.equal(log.count(), 1)
  assert.deepEqual(log.snapshot().entries.map(entry => entry.id), [second.id])

  now += 1_000
  const recreated = log.record({ stage: 'query', error: make(), itemText: '物品一' })
  assert.equal(log.count(), 2)
  assert.notEqual(recreated.id, first.id)
  assert.equal(recreated.repeatCount, 1)
})

test('服务层支持删除单条错误记录并同步更新 errorCount', async () => {
  const service = createService()
  await assert.rejects(service.check({ league: '测试赛季', text: '无效文本A' }))
  await assert.rejects(service.check({ league: '测试赛季', text: '无效文本B' }))

  const before = service.getErrorLog()
  assert.equal(before.count, 2)
  assert.equal(service.getStatus().errorCount, 2)

  const after = service.deleteErrorLogEntry(before.entries[0].id)
  assert.equal(after.count, 1)
  assert.equal(after.entries[0].itemText, '无效文本B')
  assert.equal(service.getStatus().errorCount, 1)
})

test('错误记录按数量上限丢弃最早条目', () => {
  const log = new PriceCheckErrorLog({ limit: 2, now: () => Date.parse('2026-11-23T12:00:00.000Z') })
  for (const message of ['第一条', '第二条', '第三条']) {
    log.record({ stage: 'query', error: new Error(message), itemText: message })
  }
  const snapshot = log.snapshot()
  assert.equal(snapshot.count, 2)
  assert.deepEqual(snapshot.entries.map(entry => entry.message), ['第二条', '第三条'])
})

test('解析失败时记录完整物品文本', async () => {
  const service = createService()
  const text = '这不是一段可以识别的物品文本'
  await assert.rejects(service.check({ league: '测试赛季', text }), /剪贴板中没有可识别的物品/)

  const log = service.getErrorLog()
  assert.equal(log.count, 1)
  assert.equal(log.entries[0].stage, 'parse')
  assert.equal(log.entries[0].stageLabel, '解析物品文本')
  assert.equal(log.entries[0].code, 'INVALID_REQUEST')
  assert.equal(log.entries[0].itemText, text)
  assert.equal(log.entries[0].league, '测试赛季')
})

test('官方查询失败时记录物品模型和查询条件', async () => {
  const service = createService({
    search: async () => { throw new ChaosRecipeError('NETWORK_ERROR', '无法连接国服交易接口') }
  })
  await assert.rejects(service.check({ league: '测试赛季', model: RING_MODEL }), /无法连接国服交易接口/)

  const log = service.getErrorLog()
  assert.equal(log.count, 1)
  const entry = log.entries[0]
  assert.equal(entry.stage, 'query')
  assert.equal(entry.code, 'NETWORK_ERROR')
  assert.equal(entry.model.identity.type, '珊瑚戒指')
  assert.equal(entry.query.query.filters.type_filters.filters.category.option, 'accessory.ring')
  assert.equal(entry.source, 'capture')
})

test('重查失败沿用首次捕获的完整物品文本', async () => {
  let searches = 0
  const service = createService({
    search: async () => {
      searches += 1
      if (searches === 1) return { id: 'query-id', total: 0, result: [] }
      throw new ChaosRecipeError('NETWORK_ERROR', '重查失败')
    }
  })
  const text = '物品类别: 戒指\n稀有度: 普通\n珊瑚戒指\n--------\n物品等级: 80'
  await service.check({ league: '测试赛季', text })
  await assert.rejects(service.rerun({ league: '测试赛季' }), /重查失败/)

  const log = service.getErrorLog()
  assert.equal(log.count, 1)
  assert.equal(log.entries[0].source, 'rerun')
  assert.equal(log.entries[0].itemText, text)
  assert.equal(log.entries[0].item.name, '珊瑚戒指')
})

test('一键复制文本包含修复所需的完整物品信息与说明', () => {
  const report = formatPriceCheckErrorLog({
    appVersion: '1.9.2',
    server: '国服',
    startedAt: '2026-11-23T12:00:00.000Z',
    entries: [{
      id: 'price-check-error-1',
      timestamp: '2026-11-23T12:05:00.000Z',
      stage: 'query',
      stageLabel: '查询官方交易接口',
      code: 'QUERY_TOO_COMPLEX',
      message: '所选查询条件过多',
      failureCode: '',
      configurationIssueId: '',
      details: { officialMessage: 'query too complex' },
      stack: 'Error: 所选查询条件过多',
      league: 'S27 测试',
      source: 'manual',
      options: { status: 'available' },
      catalog: { provider: 'poe-cn', gameVersion: '3.30.0', degraded: false, stale: false },
      itemName: '风暴之幕',
      itemRarity: '稀有',
      itemCategory: '胸甲',
      itemBaseType: '龙鳞胸甲',
      itemText: '物品类别: 胸甲\n稀有度: 稀有\n风暴之幕\n龙鳞胸甲',
      item: { category: '胸甲', name: '风暴之幕' },
      model: RING_MODEL,
      query: { query: { type: '龙鳞胸甲' } },
      repeatCount: 2
    }]
  })

  assert.match(report, /请根据以下报错、物品完整文本、解析结果和查价模型定位问题/)
  assert.match(report, /错误数量：1/)
  assert.match(report, /查询官方交易接口 · 重复 2 次/)
  assert.match(report, /QUERY_TOO_COMPLEX/)
  assert.match(report, /手动粘贴查价/)
  assert.match(report, /物品完整文本[\s\S]*物品类别: 胸甲/)
  assert.match(report, /查价模型[\s\S]*珊瑚戒指/)
  assert.match(report, /官方查询[\s\S]*龙鳞胸甲/)
  assert.match(report, /调用栈[\s\S]*所选查询条件过多/)
})

test('按勾选 ID 仅导出所选错误记录', () => {
  const snapshot = {
    appVersion: '1.9.2',
    server: '国服',
    startedAt: '2026-11-23T12:00:00.000Z',
    entries: [
      { id: 'err-1', timestamp: '2026-11-23T12:01:00.000Z', stageLabel: '解析物品文本', code: 'E1', message: '错误一', itemText: '文本一' },
      { id: 'err-2', timestamp: '2026-11-23T12:02:00.000Z', stageLabel: '查询官方交易接口', code: 'E2', message: '错误二', itemText: '文本二' },
      { id: 'err-3', timestamp: '2026-11-23T12:03:00.000Z', stageLabel: '匹配交易词缀', code: 'E3', message: '错误三', itemText: '文本三' }
    ]
  }
  assert.deepEqual(selectPriceCheckErrorEntries(snapshot.entries, ['err-3', 'err-1']).map(e => e.id), ['err-1', 'err-3'])
  assert.deepEqual(selectPriceCheckErrorEntries(snapshot.entries, []), [])

  const report = formatPriceCheckErrorLog(snapshot, { selectedIds: ['err-2'] })
  assert.match(report, /错误数量：1/)
  assert.match(report, /错误二/)
  assert.doesNotMatch(report, /错误一/)
  assert.doesNotMatch(report, /错误三/)
})

test('错误记录入口接通主进程日志 IPC、预加载桥和页面入口', () => {
  const [ipc, preload, api, page, dialog, store] = [
    source('electron/modules/ipc/priceCheck.js'),
    source('electron/preload.cjs'),
    source('src/api/electron.js'),
    source('src/domains/priceCheck/PriceCheckView.vue'),
    source('src/domains/priceCheck/PriceCheckErrorLogDialog.vue'),
    source('src/stores/priceCheck.js')
  ]
  assert.match(ipc, /price-check-error-log[\s\S]*service\.getErrorLog\(\)/)
  assert.match(ipc, /price-check-error-log-delete[\s\S]*service\.deleteErrorLogEntry\(/)
  assert.match(preload, /getPriceCheckErrorLog: \(\) => ipcRenderer\.invoke\('price-check-error-log'\)/)
  assert.match(preload, /deletePriceCheckErrorLogEntry: \(id\) => ipcRenderer\.invoke\('price-check-error-log-delete'/)
  assert.match(api, /getErrorLog: \(\) => window\.electronAPI\.getPriceCheckErrorLog\?\.\(\)/)
  assert.match(api, /deleteErrorLogEntry: \(id\) => window\.electronAPI\.deletePriceCheckErrorLogEntry\?\.\(/)
  assert.match(store, /async function refreshErrorLog\(\)[\s\S]*priceCheck\.getErrorLog\(\)/)
  assert.match(store, /async function deleteErrorLogEntry\(id\)[\s\S]*priceCheck\.deleteErrorLogEntry\(id\)/)
  assert.match(page, /错误记录（\{\{ store\.errorCount \}\}）/)
  assert.match(page, /<PriceCheckErrorLogDialog v-model="errorLogVisible" \/>/)
  assert.match(dialog, /el-checkbox/)
  assert.match(dialog, /导出所选/)
  assert.match(dialog, /一键复制全部/)
  assert.match(dialog, /removeEntry\(entry\)/)
  assert.match(dialog, /formatPriceCheckErrorLog/)
  assert.match(dialog, /物品完整文本/)
  assert.match(dialog, /查价模型/)
})
})()

// === Merged from priceCheckFlasks.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const createHash = _m5_createHash
  const readFile = _m5_readFile
  const createLocalizationTextResolver = _m5_createLocalizationTextResolver
  const PriceCheckService = _m5_PriceCheckService
  const userLifeFlask = _m5_userLifeFlask
  const equivalentEnglishLifeFlask = _m5_equivalentEnglishLifeFlask
  const equivalentTraditionalLifeFlask = _m5_equivalentTraditionalLifeFlask
  const userDreadMaidenFlask = _m5_userDreadMaidenFlask
  const userKiaraFlask = _m5_userKiaraFlask
  const statNumber = _m5_statNumber
  const createPriceCheckModel = _m5_createPriceCheckModel
  const flaskStructures = _m5_flaskStructures
const entries = JSON.parse(await readFile(new URL('./fixtures/price-check-flask-entries.json', import.meta.url)))
const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url)))
const currentFlaskRows = JSON.parse(await readFile(new URL('./fixtures/price-check-current-unique-flasks.json', import.meta.url)))
const replacementKeys = new Set(currentFlaskRows.stats.map(row => row.key))
const currentFlaskCatalog = { ...catalog, items: [...catalog.items, ...currentFlaskRows.items],
  stats: [...catalog.stats.filter(row => !replacementKeys.has(row.key)), ...currentFlaskRows.stats] }
const bases = { 'Life Flasks': 'Divine Life Flask', 'Mana Flasks': 'Divine Mana Flask', 'Hybrid Flasks': 'Hallowed Hybrid Flask', 'Utility Flasks': 'Granite Flask' }

function fixture(dictionary = entries, tradeCatalog = catalog) {
  const searches = []
  const service = new PriceCheckService({ catalog: tradeCatalog, localizationProvider: () => dictionary, manualInputOnly: true,
    auth: { getStatus: () => ({ authenticated: true }) },
    client: { server: { id: 'international' }, clearCache() {},
      async search(league, query) { searches.push(query); return { id: 'flask', total: 0, result: [] } },
      async fetch() { return { result: [] } } }
  })
  return { service, searches }
}

function clipboard(structure, language) {
  const itemClass = entries.find(entry => entry.table === 'itemclasses' && entry.en === structure.className)
  const base = entries.find(entry => entry.table === 'baseitemtypes' && entry.en === bases[structure.className])
  const label = language === 'en' ? 'Item Class' : language === 'tw' ? '物品種類' : '物品类别'
  const rarity = language === 'en' ? 'Rarity: Normal' : '稀有度: 普通'
  const itemLevel = language === 'en' ? 'Item Level: 64' : language === 'tw' ? '物品等級: 64' : '物品等级: 64'
  return `${label}: ${itemClass[language]}\n${rarity}\n${base[language]}\n--------\n${structure.localized[language]}\n--------\n${itemLevel}`
}

test('用户完整魔法生命药剂保留正确底材、最大充能和两种七秒免疫', async () => {
  const { service, searches } = fixture()
  const { model } = await service.check({ text: userLifeFlask, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(searches.length, 1)
  assert.equal(searches[0].query.type, 'Divine Life Flask')
  assert.equal(model.identity.type, 'Divine Life Flask')
  assert.deepEqual(model.unknownStats, [])
  assert.equal(model.stats.length, 2)
  const charges = model.stats.find(stat => stat.id === 'explicit.stat_1437957544')
  const immunity = model.stats.find(stat => stat.id === 'explicit.stat_182714578')
  assert.deepEqual(charges.values, [22])
  assert.deepEqual(immunity.values, [7, 7])
  assert.equal(charges.displayText, '最大充能 +22(20-23)')
  assert.match(immunity.displayText, /在流血时使用可以在接下来 7\(6-8\) 秒免疫流血/)
  assert.match(immunity.displayText, /被腐化之血影响时使用可以在接下来 7\(6-8\) 秒免疫腐化之血/)
  const filters = JSON.parse(JSON.stringify(searches[0])).query.stats.flatMap(group => group.filters)
  assert.deepEqual(filters.find(filter => filter.id === charges.id).value, { min: 22 })
  assert.deepEqual(filters.find(filter => filter.id === immunity.id).value, { min: 7 })
  await service.rerun({ model })
  assert.equal(searches.length, 2)
  assert.deepEqual(JSON.parse(JSON.stringify(searches[1])), JSON.parse(JSON.stringify(searches[0])))
})

test('恐惧仕女的圣礼完整文本按当前官方目录提交四条词缀，受击充能保留6', async () => {
  const { service, searches } = fixture(entries, currentFlaskCatalog)
  const { model } = await service.check({ text: userDreadMaidenFlask, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(searches[0].query.name, "Dreadmaidens' Sacrament")
  assert.equal(searches[0].query.type, 'Basalt Flask')
  assert.deepEqual(model.unknownStats, [])
  assert.deepEqual(model.stats.map(stat => [stat.id, stat.values]), [
    ['implicit.stat_2005503156', [3]],
    ['explicit.stat_1582728645', [6]],
    ['explicit.stat_3860231079', [15]],
    ['explicit.stat_86321750', [6]]
  ])
  assert.match(model.stats[1].displayText, /6\(4-6\)/)
  const filters = searches[0].query.stats.flatMap(group => group.filters)
  for (const stat of model.stats) assert.ok(filters.some(filter => filter.id === stat.id && filter.value.min === stat.values[0]))
  await service.rerun({ model })
  assert.deepEqual(JSON.parse(JSON.stringify(searches[1])), JSON.parse(JSON.stringify(searches[0])))
})

test('奇亚拉的决心保留反向范围原文与64缩短值，提交负数持续时间过滤', async () => {
  const { service, searches } = fixture()
  const { model } = await service.check({ text: userKiaraFlask, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(searches[0].query.name, "Kiara's Determination")
  assert.equal(searches[0].query.type, 'Silver Flask')
  assert.deepEqual(model.unknownStats, [])
  assert.deepEqual(model.stats.map(stat => [stat.id, stat.values]), [
    ['explicit.stat_803730540', []], ['explicit.stat_1256719186', [-64]]
  ])
  assert.equal(model.stats[1].displayText, '生效时间缩短 64(80-60)%')
  const duration = searches[0].query.stats.flatMap(group => group.filters).find(filter => filter.id === 'explicit.stat_1256719186')
  assert.equal(duration.value.min, -64)
  assert.equal(duration.value.max, undefined)
  await service.rerun({ model })
  assert.deepEqual(JSON.parse(JSON.stringify(searches[1])), JSON.parse(JSON.stringify(searches[0])))
})

test('升序、降序及缩放超界显示范围均正确提取掷值，损坏范围仍拒绝', () => {
  for (const [text, expected] of [
    ['64(80-60)', 64], ['64(60-80)', 64], ['60(80-60)', 60], ['80(80-60)', 80], ['-64(-60--80)', -64],
    ['+90(40-44)', 90], ['41(17-19)', 41], ['-35(13-16)', -35], ['1.6(0.6-0.8)', 1.6], ['+63(25-29)', 63],
    ['59(80-60)', 59], ['81(80-60)', 81]
  ]) assert.equal(statNumber(text), expected, text)
  for (const text of ['64(80-)', '64(未知范围)', '64(80-60)7']) assert.equal(statNumber(text), null, text)
  assert.throws(() => fixture().service.parse(userKiaraFlask.replace('64(80-60)', '64(80-)')), /未匹配|已阻止/)
})

test('反射迷雾镜像项链的超界缩放与负向反转词缀均可完整匹配并保持重查一致', async () => {
  const sourceHash = value => createHash('sha256').update(value).digest('hex')
  const mirroredEntries = [
    { kind: 'dat', table: 'baseitemtypes', id: 'Metadata/Items/Amulets/Amulet3', field: 'Name',
      en: 'Amber Amulet', cn: '琥珀护身符', tw: '琥珀護身符', sourceHash: sourceHash('Amber Amulet') },
    { kind: 'dat', table: 'remindertext', id: 'ReminderTextAttributes', field: 'Text',
      en: '(Attributes are Strength, Dexterity, and Intelligence)',
      cn: '(属性分为力量，敏捷和智慧三种)',
      tw: '(能力為力量、敏捷及智慧)',
      sourceHash: sourceHash('(Attributes are Strength, Dexterity, and Intelligence)') },
    { kind: 'dat', table: 'remindertext', id: 'ReminderTextManaLeech', field: 'Text',
      en: '(Leeched Mana is recovered over time. Multiple Leeches can occur simultaneously, up to a maximum rate)',
      cn: '(吸取的魔力会随时间逐渐回复。多个吸取效果可以同时发生, 但有一个上限)',
      tw: '(偷取魔力會隨時間逐漸回復。多個偷取可以同時發生，直至達到上限)',
      sourceHash: sourceHash('(Leeched Mana is recovered over time. Multiple Leeches can occur simultaneously, up to a maximum rate)') },
    { kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd', id: 'additional_strength', field: 'variant:0',
      en: '{0:+d} to Strength', cn: '{0:+d} 力量', tw: '{0:+d} 力量', sourceHash: sourceHash('{0:+d} to Strength'),
      stats: { ids: ['additional_strength'], variants: [{ condition: '#', handlers: '', placeholders: ['{0:+d}'] }] } },
    { kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd', id: 'base_maximum_mana', field: 'variant:0',
      en: '{0:+d} to maximum Mana', cn: '{0:+d} 最大魔力', tw: '{0:+d} 最大魔力', sourceHash: sourceHash('{0:+d} to maximum Mana'),
      stats: { ids: ['base_maximum_mana'], variants: [{ condition: '#', handlers: '', placeholders: ['{0:+d}'] }] } },
    { kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd', id: 'maximum_energy_shield_+%', field: 'variant:0',
      en: '{0}% increased maximum Energy Shield', cn: '能量护盾上限提高 {0}%', tw: '增加 {0}% 最大能量護盾',
      sourceHash: sourceHash('{0}% increased maximum Energy Shield'),
      stats: { ids: ['maximum_energy_shield_+%'], variants: [
        { condition: '1|#', handlers: '', placeholders: ['%', '{0}'] },
        { condition: '#|-1', handlers: 'negate 1', placeholders: ['%', '{0}'] }
      ] } },
    { kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd', id: 'additional_all_attributes', field: 'variant:0',
      en: '{0:+d} to all Attributes', cn: '{0:+d} 全属性', tw: '{0:+d} 全能力', sourceHash: sourceHash('{0:+d} to all Attributes'),
      stats: { ids: ['additional_all_attributes'], variants: [{ condition: '#', handlers: 'reminderstring ReminderTextAttributes', placeholders: ['{0:+d}'] }] } },
    { kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd', id: 'enemy_mana_leech_from_physical_attack_damage_permyriad', field: 'variant:0',
      en: '{0}% of Physical Attack Damage Leeched by Enemy as Mana',
      cn: '{0}%的物理攻击伤害被敌人吸取为魔力',
      tw: '{0}% 物理攻擊傷害被敵人偷取為魔力',
      sourceHash: sourceHash('{0}% of Physical Attack Damage Leeched by Enemy as Mana'),
      stats: { ids: ['enemy_mana_leech_from_physical_attack_damage_permyriad'], variants: [{ condition: '1|#', handlers: 'divide_by_one_hundred 1 reminderstring ReminderTextManaLeech', placeholders: ['%', '{0}'] }] } },
    { kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd', id: 'base_critical_strike_multiplier_+', field: 'variant:0',
      en: '{0:+d}% to Global Critical Strike Multiplier', cn: '{0:+d}% 全域暴击伤害加成', tw: '{0:+d}% 全域暴擊加成',
      sourceHash: sourceHash('{0:+d}% to Global Critical Strike Multiplier'),
      stats: { ids: ['base_critical_strike_multiplier_+'], variants: [{ condition: '#', handlers: '', placeholders: ['%', '{0:+d}'] }] } }
  ]
  const text = `物品类别: 项链
稀 有 度: 稀有
迷途 颈饰
琥珀护身符
--------
需求:
等级: 56
--------
物品等级: 83
--------
{ 基底属性— 能力 }
+27(20-30) 力量
--------
{ 前缀属性 "水星的" (等阶：8)— 魔力 }
+90(40-44) 最大魔力
{ 前缀属性 "无法征服的" (等阶：2)— 防禦,能量護盾 }
能量护盾上限提高 41(17-19)%
{ 后缀属性 "彗星之" (等阶：6)— 能力 }
-35(13-16) 全属性
(属性分为力量，敏捷和智慧三种)
{ 后缀属性 "焦渴之"— 魔力,物理,攻擊 }
1.6(0.6-0.8)%的物理攻击伤害被敌人吸取为魔力
(吸取的魔力会随时间逐渐回复。多个吸取效果可以同时发生, 但有一个上限)
{ 后缀属性 "狂暴之" (等阶：3)— 傷害,暴擊 }
+63(25-29)% 全域暴击伤害加成
--------
已复制`
  const baseCatalog = (await _m6_loadTradeCatalog()).catalog
  const mirroredCatalog = _m5_applyInternationalPseudoRules(structuredClone(catalog), baseCatalog)
  const { service, searches } = fixture(mirroredEntries, mirroredCatalog)
  const { model } = await service.check({ text, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(searches.length, 1)
  assert.equal(model.identity.type, 'Amber Amulet')
  assert.equal(model.flags.mirrored, true)
  assert.deepEqual(model.unknownStats, [])
  const byId = new Map(model.stats.map(stat => [stat.id, stat]))
  assert.deepEqual(byId.get('implicit.stat_4080418644')?.values, [27])
  assert.deepEqual(byId.get('explicit.stat_1050105434')?.values, [90])
  assert.equal(byId.get('explicit.stat_1050105434')?.displayText, '+90(40-44) 最大魔力')
  assert.deepEqual(byId.get('explicit.stat_2482852589')?.values, [41])
  assert.equal(byId.get('explicit.stat_2482852589')?.displayText, '能量护盾上限提高 41(17-19)%')
  assert.deepEqual(byId.get('explicit.stat_1379411836')?.values, [-35])
  assert.equal(byId.get('explicit.stat_1379411836')?.displayText, '-35(13-16) 全属性')
  assert.deepEqual(byId.get('explicit.stat_407390981')?.values, [1.6])
  assert.equal(byId.get('explicit.stat_407390981')?.displayText, '1.6(0.6-0.8)%的物理攻击伤害被敌人吸取为魔力')
  assert.deepEqual(byId.get('explicit.stat_3556824919')?.values, [63])
  assert.equal(byId.get('explicit.stat_3556824919')?.displayText, '+63(25-29)% 全域暴击伤害加成')
  const filters = new Map(searches[0].query.stats.flatMap(group => group.filters).map(filter => [filter.id, filter.value]))
  assert.equal(filters.get('explicit.stat_1050105434')?.min, 90)
  assert.equal(filters.get('explicit.stat_2482852589')?.min, 41)
  assert.equal(filters.get('explicit.stat_1379411836')?.min, -35)
  assert.equal(filters.get('explicit.stat_1379411836')?.max, undefined)
  assert.equal(filters.get('explicit.stat_407390981')?.min, 1.6)
  assert.equal(filters.get('explicit.stat_3556824919')?.min, 63)
  assert.equal(byId.get('pseudo.pseudo_total_strength')?.valueMultiplier, -1)
  assert.equal(filters.get('pseudo.pseudo_total_strength')?.min, -8)
  assert.equal(filters.get('pseudo.pseudo_total_strength')?.max, undefined)
  assert.equal(byId.get('pseudo.pseudo_total_dexterity')?.valueMultiplier, -1)
  assert.equal(filters.get('pseudo.pseudo_total_dexterity')?.min, -35)
  assert.equal(filters.get('pseudo.pseudo_total_dexterity')?.max, undefined)
  await service.rerun({ model })
  assert.deepEqual(JSON.parse(JSON.stringify(searches[1])), JSON.parse(JSON.stringify(searches[0])))
})

test('药剂十二种真实基础模板的英简繁单复数、零充能和内嵌增幅均可形成精确身份查询', async () => {
  assert.equal(new Set(flaskStructures.map(structure => structure.id)).size, 12)
  const resolver = createLocalizationTextResolver(entries)
  for (const structure of flaskStructures) for (const language of ['en', 'cn', 'tw']) {
    const text = clipboard(structure, language)
    const canonical = resolver.resolve(text, { catalog }).text
    assert.ok(canonical.includes(structure.canonical), `${structure.id}/${language}: ${canonical}`)
    const { service, searches } = fixture()
    const { model } = await service.check({ text, league: 'Covens' })
    assert.equal(searches.length, 1)
    assert.equal(searches[0].query.type, bases[structure.className])
    assert.deepEqual(model.stats, [])
    assert.deepEqual(model.unknownStats, [])
  }
})

test('完整英简繁魔法药剂得到相同官方身份与词缀条件，英文后缀不会混入底材', async () => {
  const queries = []
  for (const [language, text] of [['cn', userLifeFlask], ['en', equivalentEnglishLifeFlask], ['tw', equivalentTraditionalLifeFlask]]) {
    const { service, searches } = fixture()
    const { model } = await service.check({ text, league: 'Covens', options: { initialSelection: 'all' } })
    assert.equal(model.presentation.language, language)
    assert.equal(model.identity.type, 'Divine Life Flask')
    assert.deepEqual(model.stats.map(stat => stat.values), [[22], [7, 7]])
    queries.push(JSON.parse(JSON.stringify(searches[0])))
  }
  assert.deepEqual(queries[1], queries[0])
  assert.deepEqual(queries[2], queries[0])
})

test('国际服多 stat 描述行内的降低充能次数词缀转为负向官方过滤', async () => {
  const sourceHash = value => createHash('sha256').update(value).digest('hex')
  const chargesEntry = (field, en, cn, tw) => ({
    kind: 'stat',
    table: 'metadata/statdescriptions/stat_descriptions.csd',
    // The game prints both charge stats with this one reduced/increased wording.
    id: 'local_charges_used_+% local_flask_consume_charges_used_+%_when_used',
    field,
    en,
    cn,
    tw,
    sourceHash: sourceHash(en),
    stats: {
      ids: ['local_charges_used_+%', 'local_flask_consume_charges_used_+%_when_used'],
      variants: [
        { condition: '1|# 0', handlers: '', placeholders: ['%', '{0}'] },
        { condition: '#|-1 0', handlers: 'negate 1', placeholders: ['%', '{0}'] },
        { condition: '1|# !0', handlers: '', placeholders: ['%', '%', '{0}'] },
        { condition: '#|-1 !0', handlers: 'negate 1', placeholders: ['%', '%', '{0}'] }
      ]
    }
  })
  const chargesEntries = [
    { kind: 'dat', table: 'baseitemtypes', id: 'Metadata/Items/Flasks/FlaskUtility1', field: 'Name',
      en: 'Quicksilver Flask', cn: '水银药剂', tw: '水銀藥劑', sourceHash: sourceHash('Quicksilver Flask') },
    chargesEntry('variant:0', '{0}% increased Charges per use', '每次使用消耗的充能次数提高 {0}%', '每次使用增加 {0}% 充能'),
    chargesEntry('variant:1', '{0}% reduced Charges per use', '每次使用消耗的充能次数降低 {0}%', '每次使用減少 {0}% 充能')
  ]
  const { service, searches } = fixture(chargesEntries)
  const text = `物品类别: 功能药剂
稀 有 度: 魔法
水银药剂
--------
物品等级: 84
--------
{ 前缀属性 (等阶：1) }
每次使用消耗的充能次数降低 28(28-26)%`
  const { model } = await service.check({ text, league: 'Covens', options: { initialSelection: 'all' } })
  assert.deepEqual(model.unknownStats, [])
  assert.equal(searches.length, 1)
  const charges = model.stats.find(stat => stat.id === 'explicit.stat_388617051')
  assert.deepEqual(charges.values, [-28])
  assert.equal(charges.text, '-28% increased Charges per use')
  assert.equal(charges.displayText, '每次使用消耗的充能次数降低 28(28-26)%')
  const filter = searches[0].query.stats.flatMap(group => group.filters).find(entry => entry.id === charges.id)
  assert.deepEqual(JSON.parse(JSON.stringify(filter.value)), { min: -28 })
})

test('英文魔法底材只接受同类完整词，嵌套底材取最长，多底材仍阻断', () => {
  const model = name => createPriceCheckModel({ rarity: '魔法', category: '匕首', name }, catalog)
  assert.equal(model('Shimmering Imperial Skean of the Rainbow').identity.type, 'Imperial Skean')
  assert.equal(model('Shimmering IMPERIAL SKEAN of the Rainbow').identity.type, 'Imperial Skean')
  assert.equal(model('Shimmering Imperial Skeanling').identity.type, 'Shimmering Imperial Skeanling')
  assert.throws(() => model('Imperial Skean and Skean'), /多个底材候选/)
})

test('药剂结构识别严格限定类别和首属性段，未知词缀与不可信模板仍阻断', () => {
  const { service, searches } = fixture()
  assert.throws(() => service.parse(userLifeFlask.replace('最大充能 +22(20-23)', '最大充能 +22(20-23)\n充能会神秘消失')), /未匹配|已阻止/)
  assert.throws(() => service.parse(userLifeFlask.replace('最大充能 +22(20-23)', '3.50 秒内回复 2400 生命')), /多个国际服候选/)
  const structure = flaskStructures.find(value => value.id === 'ItemDisplayFlaskLifeRecoveryNSeconds' && value.parameters[1] === '3.50')
  assert.ok(structure)
  const wrongClass = clipboard(structure, 'cn').replace('生命药剂', '戒指')
  assert.throws(() => service.parse(wrongClass), /多个国际服候选/)
  const badRows = entries.map(entry => /^ItemDisplayFlaskLifeRecovery/.test(entry.id) ? { ...entry, sourceHash: '0'.repeat(64) } : entry)
  assert.throws(() => fixture(badRows).service.parse(userLifeFlask), /未匹配|已阻止/)
  assert.equal(searches.length, 0)
})

test('带品质或忆境前缀的普通药剂、装备与地图在简繁英查价下均精确映射底材并保留原名显示', async () => {
  const hash = value => createHash('sha256').update(value).digest('hex')
  const row = (table, id, field, en, cn, tw, extra = {}) => ({
    kind: extra.kind || 'dat', table, id, field, en, cn, tw, sourceHash: hash(en), ...extra
  })
  const superiorEntries = [
    ...entries,
    row('clientstrings', 'QualityItem', 'Text', 'Superior {0}', '精良的 {0}', '精良的 {0}'),
    row('clientstrings', 'SynthesisedItem', 'Text', 'Synthesised {0}', '忆境 {0}', '追憶之 {0}'),
    row('baseitemtypes', 'Metadata/Items/Flasks/FlaskUtility13', 'Name', 'Sulphur Flask', '硫磺药剂', '硫磺藥劑'),
    row('baseitemtypes', 'Metadata/Items/Rings/Ring6', 'Name', 'Sapphire Ring', '蓝玉戒指', '藍玉戒指'),
    row('baseitemtypes', 'Metadata/Items/Maps/MapWorldsSynthesisedWorld', 'Name', 'Synthesised Map', '幻境地图', '尋夢追憶'),
    row('remindertext', 'ReminderTextConsecratedGround', 'Text',
      '(Allies on your Consecrated Ground Regenerate a percentage of their Maximum Life per second, and Curses have 50% reduced effect on them)',
      '（友军在你产生的奉献地面上按照生命上限百分比每秒再生生命，并且他们身上的诅咒效果降低 50%）',
      '（ 站在奉獻地面上的友方每秒回復他們最大生命的百分比，且減少 50% 他們身上的詛咒效果 ）'),
    row('metadata/statdescriptions/stat_descriptions.csd', 'damage_+%', 'variant:0',
      '{0}% increased Damage', '伤害提高 {0}%', '增加 {0}% 傷害', { kind: 'stat' }),
    row('metadata/statdescriptions/stat_descriptions.csd', 'local_consecrate_ground_on_flask_use_radius', 'variant:0',
      'Creates Consecrated Ground on Use', '使用时产生奉献地面', '使用時製造奉獻地面', { kind: 'stat' })
  ]
  const reportedSulphurCn = `物品类别: 功能药剂
稀 有 度: 普通
精良的 硫磺药剂
--------
品质: +16% (augmented)
持续 9.30 (augmented) 秒
每次使用会从 60 充能次数中消耗 40 次
目前有 0 充能次数
伤害提高 40%
--------
需求:
等级: 27
--------
物品等级: 83
--------
{ 基底属性 }
使用时产生奉献地面
（友军在你产生的奉献地面上按照生命上限百分比每秒再生生命，并且他们身上的诅咒效果降低 50%）
--------
点击右键以喝下药剂。只有装备于腰带上时才会充能。击败怪物时会回复充能次数。`
  const reportedSulphurTw = `物品種類: 功能藥劑
稀有度: 普通
精良的 硫磺藥劑
--------
品質: +16% (augmented)
持續 9.30 (augmented) 秒
每次使用會從 60 充能次數中消耗 40 次
目前有 0 充能次數
增加 40% 傷害
--------
需求:
等級: 27
--------
物品等級: 83
--------
{ 固定詞綴 }
使用時製造奉獻地面
（ 站在奉獻地面上的友方每秒回復他們最大生命的百分比，且減少 50% 他們身上的詛咒效果 ）
--------
點擊右鍵以喝下藥劑。只有裝備於腰帶上時才會充能。殺死怪物時會回復充能次數。`
  const reportedSulphurEn = `Item Class: Utility Flasks
Rarity: Normal
Superior Sulphur Flask
--------
Quality: +16% (augmented)
Lasts 9.30 (augmented) Seconds
Consumes 40 of 60 Charges on use
Currently has 0 Charges
40% increased Damage
--------
Requirements:
Level: 27
--------
Item Level: 83
--------
{ Implicit Modifier }
Creates Consecrated Ground on Use
(Allies on your Consecrated Ground Regenerate a percentage of their Maximum Life per second, and Curses have 50% reduced effect on them)
--------
Right click to drink. Can only hold charges while in belt. Refills as you kill monsters.`

  const queries = []
  for (const [language, text, originalName, localizedBase] of [
    ['cn', reportedSulphurCn, '精良的 硫磺药剂', '硫磺药剂'],
    ['tw', reportedSulphurTw, '精良的 硫磺藥劑', '硫磺藥劑'],
    ['en', reportedSulphurEn, 'Superior Sulphur Flask', 'Sulphur Flask']
  ]) {
    const { service, searches } = fixture(superiorEntries)
    const { model } = await service.check({ text, league: 'Covens', options: { initialSelection: 'all' } })
    assert.equal(model.presentation.language, language)
    assert.equal(model.item.name, 'Superior Sulphur Flask')
    assert.equal(model.item.baseType, 'Sulphur Flask')
    assert.equal(model.identity.type, 'Sulphur Flask')
    assert.equal(model.item.quality, 16)
    assert.equal(model.item.itemLevel, 83)
    assert.equal(model.presentation.texts['Superior Sulphur Flask'], originalName)
    assert.equal(model.presentation.texts['Sulphur Flask'], localizedBase)
    assert.deepEqual(model.unknownStats, [])
    assert.deepEqual(model.stats.map(stat => stat.id), ['implicit.stat_2146730404'])
    assert.equal(searches[0].query.type, 'Sulphur Flask')
    await service.rerun({ model })
    assert.deepEqual(JSON.parse(JSON.stringify(searches[1])), JSON.parse(JSON.stringify(searches[0])))
    queries.push(JSON.parse(JSON.stringify(searches[0])))
  }
  assert.deepEqual(queries[1], queries[0])
  assert.deepEqual(queries[2], queries[0])

  // Stacked prefixes: Quality + Synthesised
  for (const text of [
    '物品类别: 戒指\n稀 有 度: 普通\n精良的 忆境 蓝玉戒指\n--------\n品质: +20% (augmented)\n--------\n物品等级: 85\n--------\n忆境物品',
    '物品種類: 戒指\n稀有度: 普通\n精良的 追憶之 藍玉戒指\n--------\n品質: +20% (augmented)\n--------\n物品等級: 85\n--------\n追憶之物',
    'Item Class: Rings\nRarity: Normal\nSuperior Synthesised Sapphire Ring\n--------\nQuality: +20% (augmented)\n--------\nItem Level: 85\n--------\nSynthesised Item'
  ]) {
    const { service, searches } = fixture(superiorEntries)
    const { model } = await service.check({ text, league: 'Covens' })
    assert.equal(model.identity.type, 'Sapphire Ring')
    assert.equal(model.facts.synthesised, true)
    assert.equal(searches[0].query.type, 'Sapphire Ring')
  }

  // Quality tiered map
  {
    const { service, searches } = fixture(superiorEntries)
    const { model } = await service.check({
      text: '物品类别: 异界地图\n稀 有 度: 普通\n精良的 地图（16 阶）\n--------\n地图阶级: 16\n品质: +20% (augmented)\n--------\n物品等级: 83',
      league: 'Covens'
    })
    assert.equal(model.item.mapTier, 16)
    assert.deepEqual(searches[0].query.type, { discriminator: 'map', option: 'Map' })
  }

  // Negative & trust checks: missing/unsigned template, unknown base, duplicate prefix must reject.
  for (const [text, dictionary] of [
    [reportedSulphurCn, superiorEntries.filter(entry => entry.id !== 'QualityItem')],
    [reportedSulphurCn, superiorEntries.map(entry => entry.id === 'QualityItem' ? { ...entry, sourceHash: '0'.repeat(64) } : entry)],
    [reportedSulphurCn.replace('精良的 硫磺药剂', '精良的 未知药剂'), superiorEntries],
    [reportedSulphurCn.replace('精良的 硫磺药剂', '精良的 精良的 硫磺药剂'), superiorEntries]
  ]) {
    const { service, searches } = fixture(dictionary)
    await assert.rejects(service.check({ text, league: 'Covens' }), error => error.code === 'LOCALIZATION_UNRESOLVED')
    assert.equal(searches.length, 0)
  }
})
})()

// === Merged from priceCheckFoulborn.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const parseItemInfo = _m6_parseItemInfo
  const loadTradeCatalog = _m6_loadTradeCatalog
  const createPriceCheckModel = _m6_createPriceCheckModel
  const buildOfficialTradeQuery = _m6_buildOfficialTradeQuery
  const sanitizePriceCheckModel = _m6_sanitizePriceCheckModel
  const refreshPseudoStats = _m6_refreshPseudoStats
  const PriceCheckService = _m6_PriceCheckService
const { catalog } = await loadTradeCatalog()
const foulbornLeap = `物品类别: 珠宝
稀 有 度: 传奇
秽生直觉之跃
翠绿珠宝
--------
范围: 巨大
--------
物品等级: 83
--------
{ 秽生传奇词缀 }
范围内的基石天赋技能无需连接到你的天赋树即可配置
通途 — 数值不可调整
--------
拔刀而战的木匠并非疯汉，他只是不甘平凡。
--------
放置到一个天赋树的珠宝插槽中以产生效果。右键点击以移出插槽。`

const create = (text = foulbornLeap, options = {}, currentCatalog = catalog) =>
  createPriceCheckModel(parseItemInfo(text), currentCatalog, options)
const filters = (model) => buildOfficialTradeQuery(model).query.stats.flatMap(group => group.filters)

test('真实秽生直觉之跃保留名称和来源，默认精准查询且可信校验不丢失', () => {
  const parsed = parseItemInfo(foulbornLeap)
  assert.equal(parsed.name, '秽生直觉之跃')
  assert.equal(parsed.baseName, '翠绿珠宝')
  assert.equal(parsed.isMutated, true)
  assert.equal(parsed.modifiers.length, 1)
  assert.equal(parsed.modifiers[0].type, 'unique')
  assert.equal(parsed.modifiers[0].sourceSubtype, 'foulborn')
  const model = create()
  assert.equal(model.item.name, parsed.name)
  assert.equal(model.identity.displayName, parsed.name)
  assert.deepEqual(model.unknownStats, [])
  assert.equal(model.stats.length, 1)
  assert.match(model.stats[0].text, /\n通途 — 数值不可调整/)
  const submitted = structuredClone(model)
  submitted.identity.name = '伪造名称'
  submitted.identity.type = '伪造底材'
  const trusted = sanitizePriceCheckModel(submitted, catalog, model.facts, model.item.category, model)
  const query = buildOfficialTradeQuery(trusted).query
  assert.equal(query.name, '直觉之跃')
  assert.equal(query.type, '翠绿珠宝')
  assert.equal(trusted.identity.displayName, parsed.name)
  assert.equal(query.filters.misc_filters.filters.mutated.option, 'true')
  const wireFilters = JSON.parse(JSON.stringify(filters(trusted)))
  assert.deepEqual(wireFilters, [{ id: 'explicit.stat_1211779989', value: {}, disabled: false }])
})

test('全不选、普通复制和普通传奇保留既有词缀默认，价格尾标不污染身份', () => {
  assert.deepEqual(filters(create(foulbornLeap, { initialSelection: 'none' })), [])
  const plain = create(foulbornLeap.replace('{ 秽生传奇词缀 }\n', ''))
  assert.equal(plain.identity.name, '直觉之跃')
  assert.equal(plain.stateFilters.mutated, 'true')
  assert.ok(plain.stats.every(stat => !stat.enabled))
  const regular = create(foulbornLeap.replaceAll('秽生', ''))
  assert.equal(regular.identity.name, '直觉之跃')
  assert.equal(regular.stateFilters.mutated, 'any')
  assert.ok(regular.stats.every(stat => !stat.enabled))
  assert.equal(create(foulbornLeap.replace('秽生直觉之跃', '秽生直觉之跃[5d]')).identity.name, '直觉之跃')
  for (const name of ['秽生崇高石', '秽生增幅石', '秽生富豪石']) {
    const item = parseItemInfo(`物品类别: 通货\n稀 有 度: 普通\n${name}\n--------`)
    assert.equal(item.name, name)
    assert.equal(item.isMutated, false)
    assert.equal(createPriceCheckModel(item, catalog).identity.type, name)
  }
})

test('非珠宝秽生传奇及多个秽生词缀通用支持，未知词缀不被快照隐藏', () => {
  const text = `物品类别: 项链\n稀 有 度: 传奇\n秽生测试项链\n黑曜护身符\n--------\n物品等级: 83\n--------\n{ 秽生传奇词缀 }\n+20 最大生命\n{ 秽生传奇词缀 }\n+30 最大魔力\n{ 秽生传奇词缀 }\n这是目录未收录的秽生效果\n--------\n背景故事`
  const currentCatalog = { ...catalog, items: [...catalog.items, {
    unique: true, name: '测试项链', baseType: '黑曜护身符',
    uniqueSnapshotCovered: true, uniqueModifierMatchers: []
  }] }
  const model = create(text, {}, currentCatalog)
  assert.equal(model.identity.name, '测试项链')
  const explicit = model.stats.filter(stat => stat.type === 'explicit')
  assert.equal(explicit.length, 2)
  assert.ok(explicit.every(stat => stat.enabled))
  assert.equal(model.unknownStats.length, 1)
  assert.equal(model.unknownStats[0].text, '这是目录未收录的秽生效果')
  assert.equal(model.unknownStats[0].candidates.length, 0)
  assert.equal(filters(model).length, 2)
  const edited = structuredClone(model)
  edited.stats.filter(stat => stat.type === 'explicit').forEach(stat => { stat.enabled = false })
  const trusted = sanitizePriceCheckModel(edited, currentCatalog, model.facts, model.item.category, model)
  refreshPseudoStats(trusted, currentCatalog)
  assert.deepEqual(filters(trusted), [])
  assert.ok(trusted.stats.filter(stat => stat.type === 'explicit').every(stat => stat.sourceSubtype === 'foulborn'))
})

test('秽生身份完整名称优先，未知和歧义身份阻止查询', () => {
  const entry = { unique: true, name: '秽生直觉之跃', baseType: '翠绿珠宝' }
  assert.equal(create(foulbornLeap, {}, { ...catalog, items: [...catalog.items, entry] }).identity.name, entry.name)
  assert.throws(() => create(foulbornLeap.replace('秽生直觉之跃', '秽生未知传奇')), /无法识别秽生传奇/)
  assert.throws(() => create(foulbornLeap.replace('翠绿珠宝', '赤红珠宝')), /无法识别秽生传奇/)
  assert.throws(() => create(foulbornLeap, {}, { ...catalog, items: [...catalog.items, entry, entry] }), /无法识别秽生传奇/)
})

test('服务浮窗与连续重查保留用户取消词缀和秽生状态选择，未知身份不发请求', async () => {
  const requests = []
  const states = []
  const service = new PriceCheckService({
    catalog,
    auth: { getStatus: () => ({ authenticated: true }), registerCacheClearer() {} },
    client: {
      clearCache() {},
      search: async (_league, body) => { requests.push(body); return { id: 'test', total: 0, result: [] } },
      fetch: async () => ({ result: [] })
    },
    overlay: { create: state => states.push(state), update: state => states.push(state) }
  })
  service.updateRuntime({ enabled: true })
  await service.check({ text: foulbornLeap, league: '测试赛季', execute: false })
  assert.equal(states.at(-1).status, 'ready-to-query')
  assert.equal(requests.length, 0)
  await service.rerun()
  assert.equal(requests.at(-1).query.name, '直觉之跃')
  assert.equal(requests.at(-1).query.stats[0].filters[0].id, 'explicit.stat_1211779989')
  const edited = structuredClone(service.latest.model)
  edited.stats[0].enabled = false
  edited.stateFilters.mutated = 'false'
  await service.rerun({ model: edited })
  await service.rerun()
  assert.deepEqual(requests.at(-1).query.stats[0].filters, [])
  assert.equal(requests.at(-1).query.filters.misc_filters.filters.mutated.option, 'false')
  const before = requests.length
  await assert.rejects(service.check({ text: foulbornLeap.replace('秽生直觉之跃', '秽生未知传奇'), league: '测试赛季', execute: true }), /无法识别秽生传奇/)
  assert.equal(requests.length, before)
  service.updateRuntime({ enabled: false })
})
})()

// === Merged from priceCheckGameText.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const readFileSync = _m7_readFileSync
  const createHash = _m7_createHash
  const createLocalizationDictionary = _m7_createLocalizationDictionary
  const applyGameTextPresentation = _m7_applyGameTextPresentation
const entries = JSON.parse(readFileSync(new URL('./fixtures/price-check-game-text-entries.json', import.meta.url), 'utf8'))
const catalog = { currencyLabels: { chaos: 'Chaos Orb', divine: 'Divine Orb', transmute: 'Orb of Transmutation' } }
const text = {
  cn: '物品类别: 头部\n稀 有 度: 传奇\n节庆之面\n--------\n闪避值: 80\n能量护盾: 18\n--------\n物品等级: 84\n--------\n未鉴定',
  tw: '物品種類: 頭部\n稀有度: 傳奇\n節慶之面\n--------\n閃避值: 80\n能量護盾: 18\n--------\n物品等級: 84\n--------\n未鑑定',
  en: 'Item Class: Helmets\nRarity: Unique\nFestival Mask\n--------\nEvasion Rating: 80\nEnergy Shield: 18\n--------\nItem Level: 84\n--------\nUnidentified'
}
function model() {
  return {
    item: { name: 'Festival Mask', baseType: 'Festival Mask', category: '头部', rarity: '传奇' },
    identity: { name: '', type: 'Festival Mask', categoryLabel: '头盔' },
    identityResolution: { required: true, baseType: 'Festival Mask', candidates: [
      { key: 'a', name: 'Leer Cast', baseType: 'Festival Mask' },
      { key: 'b', name: 'Replica Leer Cast', baseType: 'Festival Mask' }
    ] },
    properties: [{ id: 'misc.itemLevel', label: '物品等级', min: 84 }, { label: '闪避' }, { label: '能量护盾' }],
    stats: [{ text: '+10 to maximum Life', displayText: '+10 最大生命', tags: ['Life', '護甲'] }]
  }
}

test('综合词缀按照查价文本语言显示简繁英文标签', () => {
  const resolver = createLocalizationDictionary(entries)
  for (const language of ['cn', 'tw', 'en']) {
    const resolved = resolver.resolve(text[language])
    const value = model()
    value.stats.push({
      type: 'pseudo',
      id: 'pseudo.pseudo_total_life',
      ref: '+# total maximum Life',
      text: '+# total maximum Life',
      label: '+数值 total maximum Life',
      displayText: '+# total maximum Life',
      values: [120]
    })
    applyGameTextPresentation(value, { source: text[language], lineMappings: resolved.lineMappings, resolver, catalog })
    const pseudo = value.stats.at(-1)
    assert.equal(pseudo.displayText, {
      cn: '+# 总最大生命',
      tw: '+# 總最大生命',
      en: '+# total maximum Life'
    }[language])
    assert.equal(value.presentation.texts['+# total maximum Life'], pseudo.displayText)
  }
})

test('未鉴定传奇的实际游戏名、底材和全部通货按简体/繁体原文分别显示', () => {
  const resolver = createLocalizationDictionary(entries)
  for (const language of ['cn', 'tw']) {
    const resolved = resolver.resolve(text[language])
    const value = model()
    const before = structuredClone(value)
    applyGameTextPresentation(value, { source: text[language], lineMappings: resolved.lineMappings, resolver, catalog })
    const map = value.presentation.texts
    assert.equal(value.presentation.language, language)
    assert.equal(map['Festival Mask'], language === 'cn' ? '节庆之面' : '節慶之面')
    assert.equal(map['Leer Cast'], language === 'cn' ? '共鸣之面' : '共鳴之面')
    assert.equal(map['Replica Leer Cast'], language === 'cn' ? '共鸣之面【仿品】' : '贗品．共鳴之面')
    assert.equal(map['Divine Orb'], language === 'cn' ? '神圣石' : '神聖石')
    assert.equal(map['Orb of Transmutation'], language === 'cn' ? '蜕变石' : '蛻變石')
    assert.equal(map['物品等级'], language === 'cn' ? '物品等级' : '物品等級')
    assert.equal(map['闪避'], language === 'cn' ? '闪避值' : '閃避值')
    assert.equal(map['头盔'], language === 'cn' ? '头部' : '頭部')
    delete value.presentation
    assert.deepEqual(value, before, '展示适配不改官方身份、候选、数值或标签')
  }
})

test('英文物品将内部中文稀有度/类别/属性恢复为游戏英文，中文详细标签不改变主体语言', () => {
  const resolver = createLocalizationDictionary(entries)
  const value = model()
  applyGameTextPresentation(value, { source: text.en + '\n{ Prefix Modifier "Healthy" — 生命 }\n+10 to maximum Life', resolver, catalog })
  assert.equal(value.presentation.language, 'en')
  assert.equal(value.presentation.texts['传奇'], 'Unique')
  assert.equal(value.presentation.texts['头盔'], 'Helmets')
  assert.equal(value.presentation.texts['物品等级'], 'Item Level')
  assert.equal(value.presentation.texts['闪避'], 'Evasion Rating')
  assert.equal(value.presentation.texts['Festival Mask'], 'Festival Mask')
  assert.equal(value.presentation.texts['混沌石'], 'Chaos Orb')
  assert.deepEqual(value.stats[0].tags, ['Life', '護甲'])
})

test('选定传奇再净化重查时沿用源语言，新增名称不被旧底材标题覆盖', () => {
  const resolver = createLocalizationDictionary(entries)
  const value = model()
  applyGameTextPresentation(value, { source: text.tw, lineMappings: resolver.resolve(text.tw).lineMappings, resolver, catalog })
  assert.equal(value.presentation.texts['闪避'], '閃避值')
  value.identity.name = 'Leer Cast'
  value.identityResolution.required = false
  applyGameTextPresentation(value, { resolver, catalog })
  assert.equal(value.presentation.language, 'tw')
  assert.equal(value.presentation.texts[value.identity.name], '共鳴之面')
  assert.equal(value.presentation.texts[value.identity.type], '節慶之面')
  assert.equal(value.presentation.texts['闪避'], '閃避值')
  applyGameTextPresentation(value, { resolver, catalog })
  assert.equal(value.presentation.texts['闪避'], '閃避值')
})

test('精确locale按语义表排除同名异译，缺词、坏hash和真正冲突不会猜译', () => {
  const row = (table, id, en, cn, tw) => ({ kind: 'dat', table, id, field: 'Name', en, cn, tw,
    sourceHash: createHash('sha256').update(en).digest('hex') })
  const wrong = { ...row('words', 'invalid', 'Absent Name', '错误译名', '錯誤譯名'), sourceHash: '0'.repeat(64) }
  const resolver = createLocalizationDictionary([...entries, wrong,
    row('achievementitems', 'different-chaos', 'Chaos Orb', '任务混沌', '任務混沌'),
    row('words', 'collision', 'Leer Cast', '别的译名', '別的譯名')])
  assert.equal(resolver.localize('Chaos Orb', { locale: 'tw', tables: ['baseitemtypes'] }), '混沌石')
  assert.equal(resolver.localize('Absent Name', { locale: 'cn', tables: ['words'] }), 'Absent Name')
  assert.equal(resolver.localize('Leer Cast', { locale: 'cn', tables: ['words'] }), 'Leer Cast')
  assert.equal(resolver.localize('Unknown Name', { locale: 'tw', tables: ['words'] }), 'Unknown Name')
  assert.equal(resolver.localize('Replica Leer Cast', { locale: 'tw', tables: ['words'] }), '贗品．共鳴之面')
})
})()

// === Merged from priceCheckInfluenceMemory.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const path = _m8_path
  const readFileSync = _m8_readFileSync
  const parseItemInfo = _m8_parseItemInfo
  const loadTradeCatalog = _m8_loadTradeCatalog
  const PriceCheckService = _m8_PriceCheckService
  const buildOfficialTradeQuery = _m8_buildOfficialTradeQuery
  const createPriceCheckModel = _m8_createPriceCheckModel
  const refreshPseudoStats = _m8_refreshPseudoStats
  const sanitizePriceCheckModel = _m8_sanitizePriceCheckModel
  const PRICE_CHECK_CLASSIC_INFLUENCES = _m8_PRICE_CHECK_CLASSIC_INFLUENCES
const catalogPath = path.resolve('electron/modules/priceCheck/catalog.json')
const copiedItem = (...details) => [
  '物品类别: 腰带',
  '稀 有 度: 稀有',
  '皮革腰带',
  '--------',
  ...details,
  '--------',
  '物品等级: 85'
].join('\n')

test('六种经典势力的当前与兼容尾标均解析为稳定标识', () => {
  for (const definition of PRICE_CHECK_CLASSIC_INFLUENCES) {
    for (const alias of definition.aliases) {
      const item = parseItemInfo(copiedItem(alias))
      assert.deepEqual(item.influences, [definition.key], alias)
    }
  }

  const dual = parseItemInfo(copiedItem('塑界之器', '裂界之器'))
  assert.deepEqual(dual.influences, ['shaper', 'elder'])
  assert.deepEqual(parseItemInfo(copiedItem('未知势力之器')).influences, [])
})

test('回忆束丝仅接受完整非负整数格式', () => {
  assert.equal(parseItemInfo(copiedItem('回忆束丝: 32')).memoryLevel, 32)
  assert.equal(parseItemInfo(copiedItem('回忆束丝：0')).memoryLevel, 0)
  for (const invalid of ['回忆束丝:', '回忆束丝: -1', '回忆束丝: abc', '回忆束丝: 1.5']) {
    const item = parseItemInfo(copiedItem(invalid))
    assert.equal(item.memoryLevel, null, invalid)
    assert.equal(item.explicitMods.includes(invalid), false, invalid)
  }
})

test('六种经典势力生成默认启用的官方无数值 pseudo 条件', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  for (const definition of PRICE_CHECK_CLASSIC_INFLUENCES) {
    const item = parseItemInfo(copiedItem(definition.aliases[0]))
    const model = createPriceCheckModel(item, catalog, { initialSelection: 'none' })
    const influence = model.stats.find((stat) => stat.id === definition.statId)
    assert.ok(influence, definition.key)
    assert.equal(influence.type, 'pseudo')
    assert.equal(influence.enabled, true)
    assert.deepEqual(influence.values, [])
    assert.equal(influence.min, undefined)
    assert.equal(influence.max, undefined)
    assert.ok(buildOfficialTradeQuery(model).query.stats[0].filters.some(({ id }) => id === definition.statId))
  }
})

test('双势力条件同时保留，用户取消后仅不提交对应条件', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const item = parseItemInfo(copiedItem('塑界之器', '裂界之器'))
  const model = createPriceCheckModel(item, catalog, { initialSelection: 'none' })
  const shaperId = 'pseudo.pseudo_has_shaper_influence'
  const elderId = 'pseudo.pseudo_has_elder_influence'
  assert.deepEqual(model.item.influences, ['shaper', 'elder'])
  assert.deepEqual(
    model.stats.filter(({ id }) => [shaperId, elderId].includes(id)).map(({ id }) => id),
    [shaperId, elderId]
  )

  model.stats.find(({ id }) => id === elderId).enabled = false
  const ids = buildOfficialTradeQuery(model).query.stats[0].filters.map(({ id }) => id)
  assert.ok(ids.includes(shaperId))
  assert.equal(ids.includes(elderId), false)

  refreshPseudoStats(model, catalog, { initialSelection: 'none' })
  assert.equal(model.stats.find(({ id }) => id === shaperId).enabled, true)
  assert.equal(model.stats.find(({ id }) => id === elderId).enabled, false)
})

test('主进程以可信模型重建势力条件并拒绝伪造势力', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const trusted = createPriceCheckModel(parseItemInfo(copiedItem('塑界之器')), catalog, { initialSelection: 'none' })
  const hunter = PRICE_CHECK_CLASSIC_INFLUENCES.find(({ key }) => key === 'hunter')
  const injected = structuredClone(trusted)
  injected.stats.push({
    key: 'injected', id: hunter.statId, type: 'pseudo', label: hunter.label, text: hunter.label,
    enabled: true, values: [], sources: []
  })
  const clean = sanitizePriceCheckModel(injected, catalog, trusted.facts, trusted.item.category, trusted)
  const influenceIds = clean.stats.filter(({ id }) => id.includes('pseudo_has_')).map(({ id }) => id)
  assert.deepEqual(influenceIds, ['pseudo.pseudo_has_shaper_influence'])
  assert.deepEqual(clean.item.influences, ['shaper'])

  const tampered = structuredClone(trusted)
  tampered.stats.find(({ id }) => id.includes('pseudo_has_')).id = hunter.statId
  const rebuilt = sanitizePriceCheckModel(tampered, catalog, trusted.facts, trusted.item.category, trusted)
  assert.equal(rebuilt.stats.some(({ id }) => id === hunter.statId), false)
  assert.equal(rebuilt.stats.find(({ id }) => id === 'pseudo.pseudo_has_shaper_influence').enabled, false)
})

test('回忆束丝默认按至少当前值查询并允许编辑合法范围', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const trusted = createPriceCheckModel(parseItemInfo(copiedItem('回忆束丝: 32')), catalog, { initialSelection: 'none' })
  const property = trusted.properties.find(({ id }) => id === 'misc.memoryLevel')
  assert.deepEqual(
    { id: property.id, label: property.label, value: property.value, enabled: property.enabled, min: property.min, max: property.max },
    { id: 'misc.memoryLevel', label: '回忆束丝', value: 32, enabled: true, min: 32, max: undefined }
  )
  assert.deepEqual(buildOfficialTradeQuery(trusted).query.filters.misc_filters.filters.memory_level, { min: 32 })

  const edited = structuredClone(trusted)
  Object.assign(edited.properties.find(({ id }) => id === 'misc.memoryLevel'), { min: 40, max: 50 })
  const clean = sanitizePriceCheckModel(edited, catalog, trusted.facts, trusted.item.category, trusted)
  assert.deepEqual(buildOfficialTradeQuery(clean).query.filters.misc_filters.filters.memory_level, { min: 40, max: 50 })
})

test('回忆束丝属性拒绝伪造及非法边界', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const withoutMemory = createPriceCheckModel(parseItemInfo(copiedItem()), catalog, { initialSelection: 'none' })
  const injected = structuredClone(withoutMemory)
  injected.properties.push({ id: 'misc.memoryLevel', label: '伪造', value: 99, enabled: true, min: 99 })
  const rejected = sanitizePriceCheckModel(injected, catalog, withoutMemory.facts, withoutMemory.item.category, withoutMemory)
  assert.equal(rejected.properties.some(({ id }) => id === 'misc.memoryLevel'), false)

  const trusted = createPriceCheckModel(parseItemInfo(copiedItem('回忆束丝: 32')), catalog, { initialSelection: 'none' })
  const changed = structuredClone(trusted)
  Object.assign(changed.properties.find(({ id }) => id === 'misc.memoryLevel'), { min: -5, max: -1 })
  const clean = sanitizePriceCheckModel(changed, catalog, trusted.facts, trusted.item.category, trusted)
  const property = clean.properties.find(({ id }) => id === 'misc.memoryLevel')
  assert.equal(property.min, undefined)
  assert.equal(property.max, undefined)
  assert.equal(buildOfficialTradeQuery(clean).query.filters.misc_filters?.filters.memory_level, undefined)
})

const paladinHauberk = `物品类别: 胸甲
稀 有 度: 稀有
符纹 救赎者
圣骑士链甲
--------
护甲: 1327 (augmented)
能量护盾: 267 (augmented)
回忆束丝: 23
--------
需求:
等级: 78
力量: 151
智慧: 151
--------
插槽: W-W R
--------
物品等级: 85
--------
{ 前缀属性 "鼓舞的" (等阶：2)— 防禦,護甲,能量護盾 }
该装备的护甲与能量护盾提高 92(92-100)%
{ 后缀属性 "神技之" (等阶：2)— 能力 }
+47(43-50) 智慧
{ 后缀属性 "艾菲吉之" (等阶：1)— 元素,閃電,抗性 }
+47(46-48)% 闪电抗性
{ 后缀属性 "火山之" (等阶：3)— 元素,火焰,抗性 }
+39(36-41)% 火焰抗性`
const memoryEntries = JSON.parse(readFileSync(new URL('./fixtures/price-check-memory-strands-entries.json', import.meta.url)))

test('国际服完整圣骑士链甲保留四条词缀，简繁回忆束丝进入可重查的数值筛选', async () => {
  const { catalog } = await loadTradeCatalog(path.resolve('electron/modules/priceCheck/catalog.international.json'))
  for (const label of ['回忆束丝', '## 記憶絲縷', 'Memory Strands']) {
    const searches = []
    const service = new PriceCheckService({
      catalog, manualInputOnly: true, localizationProvider: () => memoryEntries,
      auth: { getStatus: () => ({ authenticated: true }) },
      client: { server: { id: 'international' }, clearCache() {},
        async search(_league, query) { searches.push(query); return { id: 'memory-strands', total: 0, result: [] } } }
    })
    const text = paladinHauberk.replace('回忆束丝: 23', label + ': 23')
    const { model } = await service.check({ text, league: 'Covens', options: { initialSelection: 'all' } })
    assert.equal(model.identity.type, "Paladin's Hauberk")
    assert.deepEqual(model.unknownStats, [])
    assert.deepEqual(model.stats.map(stat => stat.values), [[92], [47], [47], [39]])
    const memory = model.properties.find(property => property.id === 'misc.memoryLevel')
    assert.equal(memory.value, 23)
    assert.equal(memory.enabled, true)
    assert.deepEqual(searches[0].query.filters.misc_filters.filters.memory_level, { min: 23 })
    Object.assign(memory, { min: 24, max: 30 })
    await service.rerun({ model })
    assert.deepEqual(searches[1].query.filters.misc_filters.filters.memory_level, { min: 24, max: 30 })
    assert.deepEqual(searches[1].query.stats, searches[0].query.stats)
  }
})

test('纯英文物品无需词库即可识别原生回忆束丝字段', () => {
  const text = "Item Class: Body Armours\nRarity: Rare\nPaladin's Hauberk\n--------\nMemory Strands: 0\n--------\nItem Level: 85"
  assert.equal(parseItemInfo(text).memoryLevel, 0)
})
})()
