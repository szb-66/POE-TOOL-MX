// Preserve each site's provenance while presenting its filters in a flat list.
export function parseLogbookMetadata(lines) {
  if (!lines.some((line) => /^物品类别:\s*先祖秘藏日志$/.test(line))) return null
  const regions = []
  const consumedIndexes = new Set()
  const modifierContexts = new Map()
  let section = []
  const flush = () => {
    const firstMod = section.findIndex(({ text }) => text.endsWith('(implicit)'))
    if (firstMod >= 2) {
      const [area, faction] = section.slice(firstMod - 2, firstMod)
      const modifiers = section.slice(firstMod).filter(({ text }) => text.endsWith('(implicit)'))
      regions.push({ area: area.text, faction: faction.text, modifiers: modifiers.map(({ text }) => text) })
      modifiers.forEach(({ index }) => modifierContexts.set(index, `${area.text} · ${faction.text}`))
      consumedIndexes.add(area.index)
      consumedIndexes.add(faction.index)
    }
    section = []
  }
  lines.forEach((text, index) => {
    if (text === '--------') flush()
    else if (!/^(?:##\s*)?(?:区域等级|物品等级)[：:]/.test(text)) section.push({ text, index })
  })
  flush()
  return { regions, consumedIndexes, modifierContexts }
}
