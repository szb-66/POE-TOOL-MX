const modifierKey = value => String(value || '')
  .replace(/^[▲▽]\s*/gm, '')
  .replace(/(?:\s*(?:\[[^\]]*\]|\([^()\]]*★[^()\]]*\)))+\s*$/gm, '')
  .replace(/(-?\d+(?:\.\d+)?)[（(](-?\d+(?:\.\d+)?)\s*[-–—]\s*(-?\d+(?:\.\d+)?)[）)]/g, '$1')
  .replace(/[（(](-?\d+(?:\.\d+)?)\s*[-–—]\s*(-?\d+(?:\.\d+)?)[）)]/g, '')
  .replace(/[（(](?:\.\.\.|…)[）)]/g, '')
  .replace(/\s*\((?:implicit|crafted|enchant|fractured)\)\s*$/gim, '')
  .replace(/\s+/g, ' ').trim()

// Matching and values have already been resolved against the official catalog.
export function applyOriginalModifierText(model, lineMappings = []) {
  if (!lineMappings.length) return model
  const originals = new Map()
  const remember = (canonical, original) => {
    const key = modifierKey(canonical)
    if (!key) return
    if (!originals.has(key)) originals.set(key, [])
    originals.get(key).push(String(original || '').trim())
  }
  for (const { canonical, original } of lineMappings) {
    remember(canonical, original)
    const sourceLines = String(original || '').split(/\r?\n/)
    const translatedLines = String(canonical || '').split(/\r?\n/)
    if (translatedLines.length > 1) {
      translatedLines.forEach((line, index) => remember(line,
        sourceLines.length === translatedLines.length ? sourceLines[index] : original))
    }
  }
  const occurrences = new Map()
  const display = text => {
    const key = modifierKey(text)
    const choices = originals.get(key)
    if (!choices?.length) return text
    const index = occurrences.get(key) || 0
    occurrences.set(key, index + 1)
    return choices[Math.min(index, choices.length - 1)] || text
  }
  for (const stat of [...(model.stats || []), ...(model.unknownStats || [])]) {
    const sources = stat.sources || []
    for (const source of sources) source.displayText = display(source.text)
    const matching = sources.find(source => modifierKey(source.text) === modifierKey(stat.text))
    stat.displayText = matching ? matching.displayText : display(stat.text)
  }
  return model
}
