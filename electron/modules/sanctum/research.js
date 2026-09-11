// Research text is a separate observation, never proof that a displayed floor
// belongs to the same run. Effects remain unresolved until matched to a catalog.
export function parseSanctumResearch(rawText) {
  if (typeof rawText !== 'string' || rawText.length > 100000) throw new Error('禁域研究文本无效')
  const lines = rawText.replace(/\r/g, '').split('\n').map(line => line.replace(/^\s*##\s*/, '').trim())
  const field = name => lines.filter(line => line.startsWith(`${name}:`) || line.startsWith(`${name}：`))
    .map(line => line.slice(line.search(/[:：]/) + 1).trim())
  if (field('物品类别')[0] !== '禁域研究') return { status: 'unknown', reason: 'NOT_SANCTUM_RESEARCH', rawText }
  const issues = []
  const single = name => {
    const values = field(name)
    if (values.length !== 1) { issues.push(`${name}缺失或重复`); return null }
    return values[0]
  }
  const number = name => {
    const value = single(name)
    if (value === null) return null
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) { issues.push(`${name}数值无效`); return null }
    return Number(value)
  }
  const resolveText = single('坚毅')
  const resolveMatch = resolveText?.match(/^(\d+)\s*\/\s*(\d+)$/)
  let resolve = null
  if (resolveMatch && Number.isSafeInteger(Number(resolveMatch[2])) && Number(resolveMatch[1]) <= Number(resolveMatch[2])) {
    resolve = { current: Number(resolveMatch[1]), maximum: Number(resolveMatch[2]) }
  } else issues.push('坚毅数值无效')
  const effects = []
  for (const [name, kind] of [['次要恩赐', 'boon'], ['主要恩赐', 'boon'], ['次要痛苦', 'affliction'], ['主要痛苦', 'affliction']]) {
    for (const value of field(name)) for (const label of value.split(/[,，、]/).map(item => item.trim()).filter(Boolean)) {
      effects.push({ kind, category: name, rawText: label, status: 'unknown', rule: null })
    }
  }
  const rarityIndex = lines.findIndex(line => /^稀\s*有\s*度\s*[:：]/.test(line))
  const name = rarityIndex < 0 ? null : lines[rarityIndex + 1] || null
  // Advanced-copy modifier descriptions are delimited by a brace metadata line
  // and the next separator. Flavor text and instructions are not modifiers.
  const modifiers = []
  let inModifier = false
  for (const line of lines) {
    if (/^-{3,}$/.test(line)) { inModifier = false; continue }
    if (/^\{.*\}$/.test(line)) { inModifier = true; continue }
    if (inModifier && line) modifiers.push({ rawText: line, status: 'unknown', rule: null, source: 'research' })
  }
  const areaLevel = number('区域等级'), inspiration = number('启迪'), coins = number('耀金币')
  return { status: issues.length ? 'partial' : 'parsed', kind: 'research', name,
    areaLevel, resolve, inspiration, coins, effects, modifiers, issues, rawText,
    runId: null, floorId: null, bindingStatus: 'unconfirmed' }
}
