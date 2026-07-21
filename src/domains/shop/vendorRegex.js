/**
 * Purpose: 将 Vendor 结构化选项转换为国服商城搜索正则
 * Inputs: Vendor 配置与可选的数据覆盖
 * Outputs: regex、length、overLimit、warnings
 * Preconditions: 数据选项包含稳定 id 与 expression/token
 * Edge cases: 空配置返回空正则；超长仅警告；无效配置先清理
 * Errors: 不抛出异常，未知选项被忽略
 */

import { VENDOR_OPTION_GROUPS } from './vendorData.js'
import { cleanVendorConfig } from './vendorConfig.js'

export const VENDOR_REGEX_LIMIT = 50
export const exceedsVendorRegexLimit = regex => regex.length > VENDOR_REGEX_LIMIT

const optionMaps = Object.fromEntries(Object.entries(VENDOR_OPTION_GROUPS).map(([key, items]) => [
  key,
  new Map(items.map(item => [item.id, item.expression]))
]))

const expressionsFor = (ids, map) => ids.map(id => map.get(id)).filter(Boolean)

export function generateExactColorExpression(exactColors) {
  if (!exactColors.enabled) return ''
  const entries = [['r', exactColors.red], ['g', exactColors.green], ['b', exactColors.blue]]
    .filter(([, count]) => count > 0)
  const total = entries.reduce((sum, [, count]) => sum + count, 0)
  if (!total || total > 6) return ''
  const lookaheads = entries.map(([color, count]) => `(?=(?:\\S*${color}){${count}})`).join('')
  return `插槽:.+${lookaheads}`
}

export function buildVendorExpressions(rawConfig) {
  const config = cleanVendorConfig(rawConfig)
  const expressions = [
    ...expressionsFor(config.anyLinks, optionMaps.anyLinks),
    ...expressionsFor(config.threeLinks, optionMaps.threeLinks),
    ...expressionsFor(config.twoLinks, optionMaps.twoLinks),
    generateExactColorExpression(config.exactColors),
    ...expressionsFor(config.movement, optionMaps.movement),
    ...expressionsFor(config.plusGems, optionMaps.plusGems),
    ...expressionsFor(config.damage, optionMaps.damage),
    ...expressionsFor(config.weaponTypes, optionMaps.weaponTypes)
  ]

  if (config.anyLinks.includes('any_three')) {
    const specificThree = new Set(expressionsFor(config.threeLinks, optionMaps.threeLinks))
    return expressions.filter(expression => !specificThree.has(expression))
  }
  return expressions
}

export function optimizeVendorExpressions(expressions) {
  return [...new Set(expressions.filter(expression => typeof expression === 'string' && expression.length > 0))]
}

export function finalizeVendorRegex(expressions) {
  let regex = optimizeVendorExpressions(expressions).join('|')
  if (/\s|"/.test(regex)) regex = `"${regex.replaceAll('"', '')}"`
  return regex
}

export function generateVendorWarnings(config, regex) {
  const warnings = []
  if (exceedsVendorRegexLimit(regex)) warnings.push(`正则长度超过商城搜索框建议上限 ${VENDOR_REGEX_LIMIT} 字符`)
  if (config.plusGems.includes('plus_any') && config.weaponTypes.includes('wand')) {
    warnings.push('同时选择 +1 法杖和法杖基底会高亮全部法杖')
  }
  if (config.exactColors.enabled) {
    const total = config.exactColors.red + config.exactColors.green + config.exactColors.blue
    if (!total) warnings.push('指定连接颜色已启用，但尚未填写颜色数量')
    if (total > 6) warnings.push('指定连接颜色总数不能超过 6')
  }
  return warnings
}

export function generateVendorRegex(rawConfig) {
  const config = cleanVendorConfig(rawConfig)
  const regex = finalizeVendorRegex(buildVendorExpressions(config))
  return {
    regex,
    length: regex.length,
    overLimit: exceedsVendorRegexLimit(regex),
    warnings: generateVendorWarnings(config, regex)
  }
}
