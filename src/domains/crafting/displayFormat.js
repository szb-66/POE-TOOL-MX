export const formatProbability = (value, digits = 3) => {
  const percent = Math.max(0, Number(value) || 0) * 100
  return `${percent.toFixed(digits)}%`
}

export const effectLines = (entry) => {
  return String(entry?.displayText || entry?.rolledText || entry?.text || '')
    .split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
}

export const formatValueRanges = (ranges = []) => {
  return ranges.map((range) => `[${range.min}-${range.max}]`).join(' 到 ')
}

export const affixTierSummary = (affix) => {
  if (affix?.veiled) return affix.name || '未揭露'
  const rawName = String(affix?.tierName || affix?.name || '').trim()
  const tierLabel = /^T\d+\b/.test(rawName) ? rawName : `T${affix?.tier ?? '?'} ${rawName}`.trim()
  const ranges = formatValueRanges(affix?.valueRanges || affix?.values || [])
  return ranges ? `${tierLabel} ${ranges}` : tierLabel
}

export const rolledTextWithRanges = (entry) => {
  let text = String(entry?.displayText || entry?.rolledText || entry?.text || '')
  const values = entry?.displayValues || entry?.rolledValues || []
  const ranges = entry?.valueRanges || entry?.values || []
  values.forEach((value, index) => {
    const range = ranges[index]
    if (!range || Number(range.min) === Number(range.max)) return
    const escaped = String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    text = text.replace(new RegExp(`(?<![\\d.])${escaped}(?![\\d.])`), `${value}(${range.min}-${range.max})`)
  })
  return text
}
