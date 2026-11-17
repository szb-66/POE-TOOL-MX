import { applyOriginalModifierText } from '../priceCheck/displayText.js'

export function applyCraftingDisplay(item, { source, lineMappings = [], dictionary } = {}) {
  const lines = String(source || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  const separator = lines.findIndex(line => /^-{3,}$/.test(line))
  const names = lines.slice(0, separator < 0 ? lines.length : separator)
    .filter(line => !/[:：]/.test(line)).map(line => line.replace(/\[[^\[\]]*\]/g, '').trim())
  item.displayName = names[0] || item.name
  const baseAliases = dictionary?.aliasesFor(item.baseName) || [item.baseName]
  item.displayBaseName = names.length > 1 ? names.at(-1) : baseAliases.filter(Boolean)
    .sort((a, b) => b.length - a.length).find(alias => item.displayName.includes(alias)) || item.baseName

  // 只恢复显示原文；制作匹配继续使用已经校验的规范文本。
  const mappings = lineMappings.length ? lineMappings : lines.map(line => ({ canonical: line, original: line }))
  applyOriginalModifierText({ stats: item.modifiers }, mappings)
  for (const modifier of item.modifiers || []) {
    if (!modifier.text.includes('\n') || modifier.displayText !== modifier.text) continue
    const stats = modifier.text.split('\n').map(text => ({ text }))
    applyOriginalModifierText({ stats }, mappings)
    modifier.displayText = stats.map(stat => stat.displayText || stat.text).join('\n')
  }
  for (const [canonical, display] of [['implicitMods', 'displayImplicitMods'], ['explicitMods', 'displayExplicitMods']]) {
    const stats = (item[canonical] || []).map(text => ({ text }))
    applyOriginalModifierText({ stats }, mappings)
    item[display] = stats.map(stat => stat.displayText || stat.text)
  }
  return item
}
