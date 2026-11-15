import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { buildOfficialTradeQuery, createPriceCheckModel, sanitizePriceCheckModel } from '../electron/modules/priceCheck/query.js'
import { resolveSpecialItemIdentity } from '../electron/modules/priceCheck/specialItems.js'

const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
const variants = catalog.items.filter(({ discriminator }) =>
  ['alt_x', 'alt_y', 'alt_z', 'blighted', 'uberblighted', 'scrying_orb'].includes(discriminator))
const variantCategory = { gem: '技能宝石', map: '地图', currency: '通货' }

test('国际目录所有宝石、菌潮和窥视宝珠显示名均保留真实类型与判别符', () => {
  for (const entry of variants) {
    const category = variantCategory[entry.category]
    const rarity = entry.category === 'gem' ? '宝石' : entry.category === 'currency' ? '通货' : '普通'
    const copied = `物品类别: ${category}\n稀 有 度: ${rarity}\n${entry.text}\n--------`
    const parsed = parseItemInfo(copied)
    const model = createPriceCheckModel(parsed, catalog)
    const expected = { discriminator: entry.discriminator, option: entry.baseType }
    assert.deepEqual(buildOfficialTradeQuery(model).query.type, expected, entry.text)
    const trusted = sanitizePriceCheckModel(structuredClone(model), catalog, model.facts, category, model)
    assert.deepEqual(buildOfficialTradeQuery(trusted).query.type, expected, `${entry.text}: trusted recheck`)
    const submitted = sanitizePriceCheckModel(structuredClone(model), catalog)
    assert.deepEqual(buildOfficialTradeQuery(submitted).query.type, expected, `${entry.text}: catalog-validated recheck`)
    assert.equal(model.identity.displayName, entry.text)
  }
  assert.equal(variants.length, 645, '目录变更后重新审计完整变体清单')
})

test('特殊身份仅接受相同类别的完整显示名，普通版本与历史版本不被猜测为变体', () => {
  const altered = variants.find(({ discriminator }) => discriminator === 'alt_x')
  assert.equal(resolveSpecialItemIdentity({ category: '通货', name: altered.text }, catalog), null)
  assert.equal(resolveSpecialItemIdentity({ category: '技能宝石', name: altered.baseType }, catalog), null)
  assert.throws(() => resolveSpecialItemIdentity({ category: '技能宝石', name: altered.baseType, gemVariant: true }, catalog), /特殊物品/)
  const ambiguous = { items: [altered, { ...altered, baseType: 'Different Query Type' }] }
  assert.throws(() => resolveSpecialItemIdentity({ category: '技能宝石', name: altered.text }, ambiguous), /无法唯一识别/)
  const duplicate = { items: [altered, { ...altered }] }
  assert.equal(resolveSpecialItemIdentity({ category: '技能宝石', name: altered.text }, duplicate).type, altered.baseType)
  for (const entry of catalog.items.filter(({ discriminator }) => discriminator === 'legacy')) {
    assert.equal(resolveSpecialItemIdentity({ category: '饰品', name: entry.name, baseName: entry.baseType }, catalog), null, entry.text)
  }
})

test('地图区域元数据可恢复中英文菌潮身份，并拒绝未知区域和错类目录项', () => {
  for (const discriminator of ['blighted', 'uberblighted']) {
    const entry = variants.find((candidate) => candidate.discriminator === discriminator)
    const areaName = entry.text.match(/\((.+)\)$/)[1]
    assert.equal(resolveSpecialItemIdentity({ category: '地图', name: 'Map', blightType: discriminator, areaName }, catalog).type, entry.baseType)
    assert.throws(() => resolveSpecialItemIdentity({ category: '地图', name: 'Map', blightType: discriminator, areaName: 'Unknown Region' }, catalog), /特殊物品/)
    assert.throws(() => resolveSpecialItemIdentity({ category: '地图', name: entry.text, blightType: discriminator }, {
      items: [{ ...entry, category: 'currency' }]
    }), /特殊物品/)
  }
})

test('国际目录全部可信身份序列化保留精确名称、类型及受支持判别符，历史版单独标记限制', () => {
  // This is a wire-format audit, not evidence that every game clipboard format
  // has been observed. Legacy versions share copyable names with current items.
  let exact = 0
  let legacy = 0
  for (const entry of catalog.items) {
    const model = {
      item: { category: '', rarity: entry.unique ? '传奇' : '普通' },
      identity: { name: entry.unique ? entry.name : '', type: entry.baseType, discriminator: entry.discriminator },
      properties: [], stats: []
    }
    const query = buildOfficialTradeQuery(model).query
    if (entry.discriminator === 'legacy') {
      assert.equal(query.type, entry.baseType, entry.text)
      assert.equal(query.name, entry.name, entry.text)
      legacy++
      continue
    }
    const expected = (value) => entry.discriminator ? { discriminator: entry.discriminator, option: value } : value
    assert.deepEqual(query.type, expected(entry.baseType), entry.text || entry.key)
    assert.deepEqual(query.name, entry.unique ? expected(entry.name) : undefined, entry.text || entry.key)
    exact++
  }
  assert.equal(exact, 5921, '目录变更后重新审计可精确序列化身份')
  assert.equal(legacy, 85, '历史版本需要额外身份信息，不能用同名剪贴板自动判定')
  assert.equal(exact + legacy, 6006)
})
