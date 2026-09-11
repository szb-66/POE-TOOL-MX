import { applySanctumEffects } from '../../../shared/sanctum.js'

export function solveSanctumLoadouts(input, { cancelled = () => false, now = Date.now } = {}) {
  if (!input || typeof input !== 'object') throw new Error('圣物求解参数无效')
  const { width, height, unlocked, items, fixed = [], excluded = [], selectedUniques = [] } = input
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > 100
    || !Array.isArray(unlocked) || !Array.isArray(items) || items.length > 200) throw new Error('圣物网格或库存无效')
  const allIds = new Set()
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || allIds.has(item.id)
      || !Number.isInteger(item.width) || !Number.isInteger(item.height) || item.width < 1 || item.height < 1
      || ['score', 'recoveryScore', 'recoveryPreferenceScore', 'inspirationScore'].some(key => !Number.isFinite(item[key] ?? 0))
      || (item.minAreaLevel !== undefined && (!Number.isInteger(item.minAreaLevel) || item.minAreaLevel < 0))) throw new Error('圣物实例无效')
    allIds.add(item.id)
  }
  for (const list of [fixed, excluded, selectedUniques]) {
    if (!Array.isArray(list) || list.some(id => !allIds.has(id))) throw new Error('指定的圣物不存在')
  }
  if (selectedUniques.some(id => !items.find(item => item.id === id).unique)) throw new Error('指定传奇包含普通圣物')
  for (const key of ['nodeBudget', 'timeBudgetMs']) {
    if (input[key] !== undefined && (!Number.isFinite(input[key]) || input[key] < 1)) throw new Error('搜索预算无效')
  }
  const required = new Set([...fixed, ...selectedUniques]), banned = new Set(excluded)
  if ([...required].some(id => banned.has(id))) return { status: 'blocked', reason: '固定与排除冲突', candidates: [], optimal: true }
  let openMask = 0n
  for (const cell of unlocked) {
    if (!Number.isInteger(cell) || cell < 0 || cell >= width * height) throw new Error('解锁格无效')
    openMask |= 1n << BigInt(cell)
  }
  if (input.areaLevel !== undefined && input.areaLevel !== null && (!Number.isInteger(input.areaLevel) || input.areaLevel < 1 || input.areaLevel > 100)) throw new Error('禁域区域等级无效')
  const unmetLevel = items.find(item => required.has(item.id) && item.minAreaLevel > 0 && (!input.areaLevel || input.areaLevel < item.minAreaLevel))
  if (unmetLevel) return { status: 'blocked', reason: `指定圣物要求禁域区域等级至少 ${unmetLevel.minAreaLevel}；当前等级${input.areaLevel || '未确认'}`, candidates: [], optimal: true }
  const eligible = items.filter(item => item.status === 'matched' && !banned.has(item.id)
    && (!(item.minAreaLevel > 0) || input.areaLevel >= item.minAreaLevel)
    && (!item.unique || selectedUniques.includes(item.id)))
  if ([...required].some(id => !eligible.some(item => item.id === id))) {
    return { status: 'blocked', reason: '固定圣物未确认或传奇未指定', candidates: [], optimal: true }
  }
  const choices = eligible.map(item => {
    const placements = []
    for (let y = 0; y + item.height <= height; y++) for (let x = 0; x + item.width <= width; x++) {
      let mask = 0n
      for (let dy = 0; dy < item.height; dy++) for (let dx = 0; dx < item.width; dx++) mask |= 1n << BigInt((y + dy) * width + x + dx)
      if ((mask & openMask) === mask) placements.push({ x, y, mask })
    }
    return { item, placements }
  }).sort((a, b) => Number(required.has(b.item.id)) - Number(required.has(a.item.id)) || b.item.width * b.item.height - a.item.width * a.item.height)
  const maxRecoveryMultiplier = 1 + eligible.flatMap(item => item.effects || [])
    .filter(effect => effect.status !== 'unknown' && effect.rule === 'recoveryIncrease')
    .reduce((sum, effect) => sum + Math.max(0, Number(effect.value) || 0) / 100, 0)
  const upperValue = item => Math.max(0, item.score || 0) + Math.max(0, item.recoveryScore || 0) * maxRecoveryMultiplier
    + Math.max(0, item.recoveryPreferenceScore || 0) + Math.max(0, item.inspirationScore || 0)
  const suffix = Array(choices.length + 1).fill(0)
  for (let i = choices.length - 1; i >= 0; i--) suffix[i] = suffix[i + 1] + upperValue(choices[i].item)
  const nodeBudget = Math.min(2000000, Math.max(1, input.nodeBudget || 100000))
  const deadline = now() + Math.min(30000, Math.max(1, input.timeBudgetMs || 2000))
  let nodes = 0, stopped = null
  const candidates = [], seen = new Set(), chosen = [], placements = []
  function retain() {
    const key = JSON.stringify(chosen.map(item => item.id).sort())
    if (seen.has(key)) return
    seen.add(key)
    const rules = applySanctumEffects(chosen.flatMap(item => item.effects || []))
    const base = chosen.reduce((sum, item) => sum + (item.score || 0), 0)
    const recovery = rules.cannotRecover ? 0 : chosen.reduce((sum, item) => sum + (item.recoveryScore || 0), 0) * rules.recoveryMultiplier
      + chosen.reduce((sum, item) => sum + (item.recoveryPreferenceScore || 0), 0)
    const inspiration = rules.cannotGainInspiration ? 0 : chosen.reduce((sum, item) => sum + (item.inspirationScore || 0), 0)
    candidates.push({ itemIds: chosen.map(item => item.id), placements: placements.map(p => ({ ...p })),
      score: base + recovery + inspiration, breakdown: { base, recovery, inspiration }, unknown: rules.unknown,
      scoringComplete: rules.unknown.length === 0 })
    candidates.sort((a, b) => b.score - a.score || JSON.stringify(a.itemIds).localeCompare(JSON.stringify(b.itemIds)))
    if (candidates.length > 3) candidates.pop()
  }
  function visit(index, occupied, bound) {
    if (stopped) return
    if (cancelled()) { stopped = 'cancelled'; return }
    if (nodes >= nodeBudget || now() >= deadline) { stopped = 'budget'; return }
    nodes++
    if (candidates.length === 3 && bound + suffix[index] < candidates[2].score) return
    if (index === choices.length) { retain(); return }
    const { item, placements: options } = choices[index]
    for (const position of options) {
      if (position.mask & occupied) continue
      chosen.push(item)
      placements.push({ id: item.id, x: position.x, y: position.y, width: item.width, height: item.height })
      visit(index + 1, occupied | position.mask, bound + upperValue(item))
      placements.pop(); chosen.pop()
      if (stopped) break
    }
    if (!required.has(item.id)) visit(index + 1, occupied, bound)
  }
  visit(0, 0n, 0)
  return { status: stopped || (candidates.length ? 'complete' : 'blocked'),
    reason: stopped === 'budget' ? '搜索预算已用尽，尚未证明最优' : stopped === 'cancelled' ? '已取消' : candidates.length ? '' : '固定圣物没有合法摆放',
    candidates, optimal: stopped === null, nodes }
}
