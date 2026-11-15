import { catalogVariants } from '../../utils/localizedCatalog.js'
import { escapeRegexText } from './compactExpression.js'

const numericToken = '[+\\-]?\\d+(?:\\.\\d+)?'
export function localizedTemplateExpression(text) {
  return String(text).split(/(\{\d+(?::[^}]+)?\}|#)/g).map(part => /^(?:\{\d+(?::[^}]+)?\}|#)$/.test(part) ? numericToken : escapeRegexText(part).replaceAll('\n', '\\n')).join('')
}

export function localizedExpression(expression, texts, catalog, { includeTemplates = false, suffix = '' } = {}) {
  if (includeTemplates && texts.every(text => catalog?.get(text)?.searchExpression)) {
    const compiled = texts.map(text => catalog.get(text).searchExpression)
    const english = compiled.length === 1 && compiled[0].complete && compiled[0].englishExpression || expression
    const alternatives = [...new Set([english, ...compiled.filter(item => item.complete && item.mapped).map(item => item.expression + suffix)].filter(Boolean))]
    return { expression: alternatives.length === 1 ? alternatives[0] : `(?:${alternatives.join('|')})`, mapped: compiled.every(item => item.complete && item.mapped) }
  }
  const aliases = texts.flatMap(text => [
    ...catalogVariants(text, catalog).slice(1),
    ...(includeTemplates ? (catalog?.get(text)?.templates || []).flatMap(template => template.aliases) : [])
  ])
  const alternatives = [...new Set([expression, ...aliases.map(text => localizedTemplateExpression(text) + suffix)].filter(Boolean))]
  return { expression: alternatives.length === 1 ? alternatives[0] : `(?:${alternatives.join('|')})`, mapped: aliases.length > 0 }
}

export function finalizeLocalizedResult(result, missing = [], managed = false) {
  if (!managed) return result
  const warnings = [...result.warnings]
  if (missing.length) warnings.push(`当前汉化资源缺少这些条件的完整映射，无法生成兼容正则：${[...new Set(missing)].join('、')}`)
  if (result.overLimit) warnings.push('完整中英文正则超过 250 字符，请减少条件；未截断任何条件')
  return missing.length || result.overLimit ? { ...result, regex: '', warnings } : result
}

export function localizedResultState(result, state) {
  const warning = state.loading.value ? '正在读取当前汉化资源，请稍候' : state.error.value
  return warning ? { ...result, regex: '', warnings: [warning, ...result.warnings] } : result
}
