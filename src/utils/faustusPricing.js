export const FAUSTUS_CONFIG_VERSION = 1
export const FAUSTUS_CURRENCY = Object.freeze({ chaos: 'chaos', divine: 'divine' })
export const FAUSTUS_CURRENCY_LABELS = Object.freeze({ chaos: '混沌石', divine: '神圣石' })

export const FAUSTUS_REASON_LABELS = Object.freeze({
  repriced: '改价成功',
  completed: '处理完成',
  aborted: '操作已中止',
  user: '用户已停止',
  game_not_foreground: '游戏窗口不在前台',
  game_activation_failed: '无法将游戏窗口切换到前台',
  no_market_item_found: '当前市集页未找到可处理物品',
  item_footprint_unknown: '无法确定物品占位，已安全跳过',
  item_footprint_ambiguous: '物品占位与视觉格子不一致，已安全跳过',
  price_window_anchor_missing: '未识别到价格设置窗口',
  price_clipboard_invalid: '无法读取完整价格数字',
  currency_ocr_uncertain: '无法确定当前价格单位',
  currency_option_uncertain: '无法在单位列表中确定目标单位',
  currency_unsupported: '当前价格单位不受支持',
  no_matching_band: '当前价格没有匹配的价格分段',
  result_below_one: '降价结果小于 1，已跳过',
  not_lower: '计算结果没有真正降低价格',
  verification_mismatch: '提交前复核的价格或单位不一致',
  submit_warning: '游戏提示警告，本物品未重试',
  submit_abnormal: '游戏提交结果异常，本物品未重试'
})

const SUPPORTED_CURRENCIES = new Set(Object.values(FAUSTUS_CURRENCY))
const POWERS_OF_TEN = [1n]

function powerOfTen(size) {
  while (POWERS_OF_TEN.length <= size) POWERS_OF_TEN.push(POWERS_OF_TEN.at(-1) * 10n)
  return POWERS_OF_TEN[size]
}

function gcd(left, right) {
  let a = left < 0n ? -left : left
  let b = right < 0n ? -right : right
  while (b) [a, b] = [b, a % b]
  return a || 1n
}

function fraction(numerator, denominator = 1n) {
  if (denominator === 0n) return null
  const sign = denominator < 0n ? -1n : 1n
  const divisor = gcd(numerator, denominator)
  return { numerator: numerator / divisor * sign, denominator: denominator / divisor * sign }
}

function parseDecimal(value) {
  const text = String(value ?? '').trim()
  if (!/^\d+(?:\.\d+)?$/.test(text)) return null
  const [whole, decimal = ''] = text.split('.')
  return fraction(BigInt(`${whole}${decimal}`), powerOfTen(decimal.length))
}

function multiply(left, right) {
  return fraction(left.numerator * right.numerator, left.denominator * right.denominator)
}

function divide(left, right) {
  if (right.numerator === 0n) return null
  return fraction(left.numerator * right.denominator, left.denominator * right.numerator)
}

function compare(left, right) {
  const difference = left.numerator * right.denominator - right.numerator * left.denominator
  return difference < 0n ? -1 : difference > 0n ? 1 : 0
}

function floorFraction(value) {
  return value.numerator / value.denominator
}

function isPositive(value) {
  return Boolean(value && value.numerator > 0n)
}

function decimalText(value) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function normalizeGridCalibration(value) {
  const [left, top, right, bottom] = ['left', 'top', 'right', 'bottom'].map(key => Number(value?.[key]))
  if (![left, top, right, bottom].every(Number.isFinite) || right <= left || bottom <= top) return null
  const scaleFactor = Number(value?.scaleFactor)
  return {
    left, top, right, bottom,
    displayId: String(value?.displayId || ''),
    scaleFactor: Number.isFinite(scaleFactor) ? scaleFactor : 0,
    capturedAt: String(value?.capturedAt || '')
  }
}

export function createDefaultFaustusConfig() {
  return { version: FAUSTUS_CONFIG_VERSION, chaosPerDivine: '', bands: [], gridCalibration: null }
}

export function normalizeFaustusConfig(value = {}) {
  const bands = Array.isArray(value?.bands) ? value.bands : []
  return {
    version: FAUSTUS_CONFIG_VERSION,
    chaosPerDivine: decimalText(value?.chaosPerDivine),
    bands: bands.map((item, index) => ({
      id: String(item?.id || `band-${index + 1}`),
      start: decimalText(item?.start),
      end: decimalText(item?.end),
      rangeCurrency: SUPPORTED_CURRENCIES.has(item?.rangeCurrency) ? item.rangeCurrency : String(item?.rangeCurrency || ''),
      discountPercent: decimalText(item?.discountPercent),
      outputCurrency: SUPPORTED_CURRENCIES.has(item?.outputCurrency) ? item.outputCurrency : String(item?.outputCurrency || '')
    })),
    gridCalibration: normalizeGridCalibration(value?.gridCalibration)
  }
}

function toChaos(value, currency, ratio) {
  return currency === FAUSTUS_CURRENCY.divine ? multiply(value, ratio) : value
}

function error(code, field, bandId = '') {
  return { code, field, bandId }
}

function bandNumber(config, bandId) {
  const index = config?.bands?.findIndex(item => item.id === bandId) ?? -1
  return index >= 0 ? `第 ${index + 1} 段` : '价格分段'
}

export function formatFaustusValidationError(item, input) {
  const config = normalizeFaustusConfig(input)
  const band = bandNumber(config, item?.bandId)
  const labels = {
    invalid_ratio: '“神圣石兑混沌石”必须填写大于 0 的数字',
    missing_bands: '请至少添加一个价格分段',
    unsupported_currency: `${band}使用了不支持的通货单位`,
    invalid_band_start: `${band}的起始价必须大于 0`,
    invalid_band_end: `${band}的结束价必须大于 0，或仅在最后一段留空`,
    invalid_band_range: `${band}的结束价必须大于起始价`,
    open_band_not_last: `${band}未设置结束价；只有最后一段可以不设上限`,
    invalid_discount: `${band}的降价百分比必须大于 0 且小于 100`
  }
  if (item?.code === 'overlapping_bands') {
    const numbers = String(item.bandId || '').split(',').map(id => bandNumber(config, id))
    return numbers.length === 2
      ? `${numbers[0]}与${numbers[1]}的价格区间重叠，请调整起始价或结束价`
      : '价格分段存在区间重叠，请调整起始价或结束价'
  }
  return labels[item?.code] || `配置无效（${item?.code || '未知原因'}）`
}

export function formatFaustusReasonCode(code) {
  return FAUSTUS_REASON_LABELS[code] || `操作未完成（${code || '未知原因'}）`
}

export function validateFaustusConfig(input) {
  const config = normalizeFaustusConfig(input)
  const errors = []
  const ratio = parseDecimal(config.chaosPerDivine)
  if (!isPositive(ratio)) errors.push(error('invalid_ratio', 'chaosPerDivine'))
  if (config.bands.length === 0) errors.push(error('missing_bands', 'bands'))

  const normalizedBands = config.bands.map((band, index) => {
    const start = parseDecimal(band.start)
    const end = band.end === '' ? null : parseDecimal(band.end)
    const discount = parseDecimal(band.discountPercent)
    if (!SUPPORTED_CURRENCIES.has(band.rangeCurrency) || !SUPPORTED_CURRENCIES.has(band.outputCurrency)) {
      errors.push(error('unsupported_currency', `bands.${index}.currency`, band.id))
    }
    if (!isPositive(start)) errors.push(error('invalid_band_start', `bands.${index}.start`, band.id))
    if (band.end !== '' && !isPositive(end)) errors.push(error('invalid_band_end', `bands.${index}.end`, band.id))
    if (start && end && compare(end, start) <= 0) errors.push(error('invalid_band_range', `bands.${index}.end`, band.id))
    if (end === null && index !== config.bands.length - 1) errors.push(error('open_band_not_last', `bands.${index}.end`, band.id))
    const hundred = fraction(100n)
    if (!isPositive(discount) || compare(discount, hundred) >= 0) {
      errors.push(error('invalid_discount', `bands.${index}.discountPercent`, band.id))
    }
    return {
      ...band,
      startChaos: start && ratio && SUPPORTED_CURRENCIES.has(band.rangeCurrency) ? toChaos(start, band.rangeCurrency, ratio) : null,
      endChaos: end && ratio && SUPPORTED_CURRENCIES.has(band.rangeCurrency) ? toChaos(end, band.rangeCurrency, ratio) : null,
      discount
    }
  })

  if (isPositive(ratio)) {
    for (let leftIndex = 0; leftIndex < normalizedBands.length; leftIndex += 1) {
      const left = normalizedBands[leftIndex]
      if (!left.startChaos) continue
      for (let rightIndex = leftIndex + 1; rightIndex < normalizedBands.length; rightIndex += 1) {
        const right = normalizedBands[rightIndex]
        if (!right.startChaos) continue
        const leftBeforeRightEnd = !right.endChaos || compare(left.startChaos, right.endChaos) < 0
        const rightBeforeLeftEnd = !left.endChaos || compare(right.startChaos, left.endChaos) < 0
        if (leftBeforeRightEnd && rightBeforeLeftEnd) {
          errors.push(error('overlapping_bands', 'bands', `${left.id},${right.id}`))
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, config, ratio, bands: normalizedBands }
}

export function isFaustusPriceLower({ oldPrice, oldCurrency, newPrice, newCurrency, chaosPerDivine }) {
  const ratio = parseDecimal(chaosPerDivine)
  const oldValue = parseDecimal(oldPrice)
  const newValue = parseDecimal(newPrice)
  if (!isPositive(ratio) || !isPositive(oldValue) || !isPositive(newValue) ||
      !SUPPORTED_CURRENCIES.has(oldCurrency) || !SUPPORTED_CURRENCIES.has(newCurrency)) return false
  return compare(toChaos(newValue, newCurrency, ratio), toChaos(oldValue, oldCurrency, ratio)) < 0
}

function skipped(reasonCode, extra = {}) {
  return { success: false, skipped: true, reasonCode, ...extra }
}

export function planFaustusReprice({ oldPrice, oldCurrency, config: input }) {
  if (!Number.isSafeInteger(Number(oldPrice)) || Number(oldPrice) <= 0 || !SUPPORTED_CURRENCIES.has(oldCurrency)) {
    return skipped('invalid_old_price')
  }
  const validation = validateFaustusConfig(input)
  if (!validation.valid) return skipped('invalid_configuration', { errors: validation.errors })
  const oldValue = fraction(BigInt(Number(oldPrice)))
  const oldChaos = toChaos(oldValue, oldCurrency, validation.ratio)
  const matched = validation.bands.find(item => (
    item.startChaos && compare(oldChaos, item.startChaos) >= 0 && (!item.endChaos || compare(oldChaos, item.endChaos) < 0)
  ))
  if (!matched) return skipped('no_matching_band')

  const remainingPercent = fraction(100n * matched.discount.denominator - matched.discount.numerator, 100n * matched.discount.denominator)
  const discountedChaos = multiply(oldChaos, remainingPercent)
  const outputValue = matched.outputCurrency === FAUSTUS_CURRENCY.divine
    ? divide(discountedChaos, validation.ratio)
    : discountedChaos
  const newPriceBigInt = floorFraction(outputValue)
  if (newPriceBigInt < 1n) return skipped('result_below_one', { bandId: matched.id })
  if (newPriceBigInt > BigInt(Number.MAX_SAFE_INTEGER)) return skipped('result_unrepresentable', { bandId: matched.id })

  if (!isFaustusPriceLower({
    oldPrice, oldCurrency, newPrice: newPriceBigInt.toString(), newCurrency: matched.outputCurrency,
    chaosPerDivine: validation.config.chaosPerDivine
  })) return skipped('not_lowered', { bandId: matched.id })
  return {
    success: true,
    skipped: false,
    reasonCode: 'repriced',
    bandId: matched.id,
    oldPrice: Number(oldPrice),
    oldCurrency,
    newPrice: Number(newPriceBigInt),
    newCurrency: matched.outputCurrency
  }
}
