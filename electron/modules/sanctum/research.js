// Research text is a separate observation, never proof that a displayed floor
// belongs to the same run. Effects remain unresolved until matched to a catalog.
import { normalizeSanctumText } from './localization.js'

export function parseSanctumResearch(rawText, catalog) {
  if (typeof rawText !== 'string' || rawText.length > 100000) throw new Error('禁域研究文本无效')
  const lines = rawText.replace(/\r/g, '').split('\n').map(line => normalizeSanctumText(line.replace(/^\s*##\s*/, '').trim(), catalog))
  const aliases = { 物品类别:['物品種類','物品類別','Item Class'], 稀有度:['Rarity'], 坚毅:['堅毅','Resolve'], 启迪:['啟迪','Inspiration'], 耀金币:['耀金幣','Aureus','Aureus Coins'], 区域等级:['區域等級','Area Level'], 次要恩赐:['次要恩賜','Minor Boons'], 主要恩赐:['主要恩賜','Major Boons'], 次要痛苦:['Minor Afflictions'], 主要痛苦:['Major Afflictions'] }
  const field = name => lines.filter(line => [name,...(aliases[name] || [])].some(alias => line.startsWith(`${alias}:`) || line.startsWith(`${alias}：`)))
    .map(line => line.slice(line.search(/[:：]/) + 1).trim())
  if (!['禁域研究','Sanctum Research','Sanctum Researches'].includes(field('物品类别')[0])) return { status: 'unknown', reason: 'NOT_SANCTUM_RESEARCH', rawText }
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
  const rarityIndex = lines.findIndex(line => /^(?:稀\s*有\s*度|Rarity)\s*[:：]/i.test(line))
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
