import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import {
  buildOfficialTradeQuery,
  createPriceCheckModel,
  refreshPseudoStats,
  sanitizePriceCheckModel
} from '../electron/modules/priceCheck/query.js'
import { PRICE_CHECK_CLASSIC_INFLUENCES } from '../shared/priceCheckMetadata.js'

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
  assert.deepEqual(property, {
    id: 'misc.memoryLevel', label: '回忆束丝', value: 32, enabled: true, min: 32, max: undefined
  })
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
