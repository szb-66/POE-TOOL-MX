import test from 'node:test'
import assert from 'node:assert/strict'
import {
  FAUSTUS_CURRENCY,
  createDefaultFaustusConfig,
  formatFaustusReasonCode,
  formatFaustusValidationError,
  isFaustusPriceLower,
  normalizeFaustusConfig,
  planFaustusReprice,
  validateFaustusConfig
} from '../src/utils/faustusPricing.js'
import {
  FAUSTUS_CONFIG_STORAGE_KEY,
  createFaustusConfigRepository,
  createFaustusRunSnapshot
} from '../src/utils/faustusConfig.js'

const band = (overrides = {}) => ({
  id: 'band-1',
  start: '1',
  end: '100',
  rangeCurrency: FAUSTUS_CURRENCY.chaos,
  discountPercent: '10',
  outputCurrency: FAUSTUS_CURRENCY.chaos,
  ...overrides
})

const config = (overrides = {}) => ({
  version: 1,
  chaosPerDivine: '200',
  bands: [band()],
  gridCalibration: null,
  ...overrides
})

test('浮士德分段下限包含、上限不包含且最后一段可无上限', () => {
  const value = config({
    bands: [
      band({ id: 'low', start: '1', end: '100' }),
      band({ id: 'high', start: '100', end: '', discountPercent: '20' })
    ]
  })
  assert.equal(validateFaustusConfig(value).valid, true)
  assert.equal(planFaustusReprice({ oldPrice: 99, oldCurrency: 'chaos', config: value }).bandId, 'low')
  assert.equal(planFaustusReprice({ oldPrice: 100, oldCurrency: 'chaos', config: value }).bandId, 'high')
  assert.equal(planFaustusReprice({ oldPrice: 10000, oldCurrency: 'chaos', config: value }).bandId, 'high')
})

test('浮士德分段按比例换算后拒绝重叠、倒置和非末段无上限', () => {
  const overlap = config({
    bands: [
      band({ id: 'chaos', start: '1', end: '250' }),
      band({ id: 'divine', start: '1', end: '2', rangeCurrency: 'divine' })
    ]
  })
  assert.equal(validateFaustusConfig(overlap).valid, false)
  assert.ok(validateFaustusConfig(overlap).errors.some(item => item.code === 'overlapping_bands'))
  assert.ok(validateFaustusConfig(config({ bands: [band({ start: '10', end: '10' })] })).errors.some(item => item.code === 'invalid_band_range'))
  assert.ok(validateFaustusConfig(config({ bands: [band({ end: '' }), band({ id: 'second', start: '100', end: '' })] })).errors.some(item => item.code === 'open_band_not_last'))
})

test('浮士德配置校验与运行原因显示明确中文提示', () => {
  const value = config({
    bands: [
      band({ id: 'first', end: '' }),
      band({ id: 'second', start: '50', end: '' })
    ]
  })
  const errors = validateFaustusConfig(value).errors
  const openEnded = errors.find(item => item.code === 'open_band_not_last')
  const overlap = errors.find(item => item.code === 'overlapping_bands')
  assert.equal(formatFaustusValidationError(openEnded, value), '第 1 段未设置结束价；只有最后一段可以不设上限')
  assert.equal(formatFaustusValidationError(overlap, value), '第 1 段与第 2 段的价格区间重叠，请调整起始价或结束价')
  assert.equal(formatFaustusReasonCode('no_matching_band'), '当前价格没有匹配的价格分段')
  assert.equal(formatFaustusReasonCode('item_footprint_unknown'), '无法确定物品占位，已安全跳过')
  assert.equal(formatFaustusReasonCode('item_footprint_ambiguous'), '物品占位与视觉格子不一致，已安全跳过')
  assert.equal(formatFaustusReasonCode('price_window_anchor_missing'), '价格窗口未打开，物品可能处于锁定期，已跳过')
})

test('浮士德配置拒绝非法比例、折扣、零边界和不支持单位', () => {
  assert.ok(validateFaustusConfig(config({ chaosPerDivine: '0' })).errors.some(item => item.code === 'invalid_ratio'))
  assert.ok(validateFaustusConfig(config({ bands: [band({ discountPercent: '0' })] })).errors.some(item => item.code === 'invalid_discount'))
  assert.ok(validateFaustusConfig(config({ bands: [band({ discountPercent: '100' })] })).errors.some(item => item.code === 'invalid_discount'))
  assert.ok(validateFaustusConfig(config({ bands: [band({ start: '0' })] })).errors.some(item => item.code === 'invalid_band_start'))
  assert.ok(validateFaustusConfig(config({ bands: [band({ outputCurrency: 'exalted' })] })).errors.some(item => item.code === 'unsupported_currency'))
})

test('同单位和跨单位折扣使用精确换算并向下取整', () => {
  const same = planFaustusReprice({ oldPrice: 101, oldCurrency: 'chaos', config: config({ bands: [band({ end: '200' })] }) })
  assert.deepEqual({ price: same.newPrice, currency: same.newCurrency, reason: same.reasonCode }, { price: 90, currency: 'chaos', reason: 'repriced' })

  const cross = planFaustusReprice({
    oldPrice: 2,
    oldCurrency: 'divine',
    config: config({ bands: [band({ start: '1', end: '', rangeCurrency: 'divine', outputCurrency: 'chaos' })] })
  })
  assert.deepEqual({ price: cross.newPrice, currency: cross.newCurrency }, { price: 360, currency: 'chaos' })
})

test('无匹配、零价、结果不足 1 和折后未真正降低均跳过', () => {
  const value = config({ bands: [band({ start: '10', end: '20' })] })
  assert.equal(planFaustusReprice({ oldPrice: 5, oldCurrency: 'chaos', config: value }).reasonCode, 'no_matching_band')
  assert.equal(planFaustusReprice({ oldPrice: 0, oldCurrency: 'chaos', config: value }).reasonCode, 'invalid_old_price')

  const belowOne = config({ bands: [band({ start: '1', end: '', outputCurrency: 'divine', discountPercent: '10' })] })
  assert.equal(planFaustusReprice({ oldPrice: 100, oldCurrency: 'chaos', config: belowOne }).reasonCode, 'result_below_one')

  assert.equal(isFaustusPriceLower({ oldPrice: 1, oldCurrency: 'divine', newPrice: 100, newCurrency: 'chaos', chaosPerDivine: 100 }), false)
  assert.equal(isFaustusPriceLower({ oldPrice: 1, oldCurrency: 'divine', newPrice: 99, newCurrency: 'chaos', chaosPerDivine: 100 }), true)
})

test('配置归一化产生独立安全默认值并清理损坏校准', () => {
  const first = createDefaultFaustusConfig()
  const second = createDefaultFaustusConfig()
  first.bands.push(band())
  assert.equal(second.bands.length, 0)

  const normalized = normalizeFaustusConfig({
    version: 99,
    chaosPerDivine: 200,
    bands: [band({ id: '', start: 1, end: null })],
    gridCalibration: { left: 10, top: 20, right: 10, bottom: 40 }
  })
  assert.equal(normalized.version, 1)
  assert.equal(normalized.chaosPerDivine, '200')
  assert.equal(normalized.bands[0].end, '')
  assert.ok(normalized.bands[0].id)
  assert.equal(normalized.gridCalibration, null)
})

test('浮士德配置独立持久化且运行快照不受后续编辑影响', () => {
  const values = new Map()
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  }
  const repository = createFaustusConfigRepository(storage)
  const current = config({ gridCalibration: { left: 10, top: 20, right: 1210, bottom: 1220, displayId: '1', scaleFactor: 1.5 } })
  repository.save(current)
  assert.ok(values.has(FAUSTUS_CONFIG_STORAGE_KEY))
  assert.deepEqual(repository.load(), normalizeFaustusConfig(current))

  const snapshot = createFaustusRunSnapshot(current)
  current.bands[0].discountPercent = '50'
  assert.equal(snapshot.bands[0].discountPercent, '10')
  assert.equal(Object.isFrozen(snapshot), true)
  assert.equal(Object.isFrozen(snapshot.bands[0]), true)

  values.set(FAUSTUS_CONFIG_STORAGE_KEY, '{bad json')
  assert.deepEqual(repository.load(), createDefaultFaustusConfig())
})
