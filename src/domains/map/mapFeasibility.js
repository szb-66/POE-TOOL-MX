// Pure, bounded, deterministic solver. No game access or automation dependencies.
export const STAT_LABELS = Object.freeze({ quantity: '物品数量', rarity: '物品稀有度', packSize: '怪物群大小', moreMaps: '更多地图', moreScarabs: '更多圣甲虫', moreCurrency: '更多通货', deadmanSulphur: '亡者硫磺', alertLevelReduction: '警报等级衰减', timeBeforeLockdown: '封锁前的时间', maximumAliveReinforcements: '最大存活援军' })
const KEYS = {
  atlas: ['quantity', 'rarity', 'packSize', 'moreMaps', 'moreScarabs', 'moreCurrency'],
  chart: ['quantity', 'rarity', 'packSize', 'deadmanSulphur'],
  heist: ['quantity', 'rarity', 'alertLevelReduction', 'timeBeforeLockdown', 'maximumAliveReinforcements']
}
const STAT_IDS = {
  'map_item_drop_quantity_+%': ['quantity', 1], 'map_item_drop_rarity_+%': ['rarity', 1],
  'map_pack_size_+%': ['packSize', 1], 'map_currency_drop_chance_+%_final_from_uber_mod': ['moreCurrency', 1],
  'map_scarab_drop_chance_+%_final_from_uber_mod': ['moreScarabs', 1],
  'map_map_drop_chance_+%_final_from_uber_mod': ['moreMaps', 1],
  'map_deepwater_league_resource_found_+%': ['deadmanSulphur', 1],
  'heist_contract_alert_level_+%_final': ['alertLevelReduction', -1],
  'heist_contract_lockdown_timer_+%': ['timeBeforeLockdown', 1],
  'heist_monster_spawner_alive_limit_+%': ['maximumAliveReinforcements', 1]
}
const terms = list => [...new Set((Array.isArray(list) ? list : []).filter(x => typeof x === 'string' && x.length))]

export function normalizeConditions(kind, match = {}) {
  if (!KEYS[kind]) throw new Error('未知洗图类别')
  const mandatory = [], optional = []
  for (const key of KEYS[kind]) {
    const m = match.mandatoryStats?.[key], o = match.optionalStats?.[key]
    const value = x => {
      const n = Number(x.value)
      if (!Number.isFinite(n) || n < 0) throw new Error('数值条件无效')
      return n
    }
    if (m?.enabled) mandatory.push({ key, value: Math.max(value(m), o?.enabled ? value(o) : 0) })
    else if (o?.enabled) optional.push({ key, value: value(o) })
  }
  const selectedCount = Number(match.selectedCount ?? 1)
  if (!Number.isInteger(selectedCount) || selectedCount < 1) throw new Error('挑选数量无效')
  return { mandatory, optional, selectedCount, blacklist: terms(match.blacklist),
    whitelist: kind === 'heist' ? terms(match.whitelist).filter(x => x.trim()) : [] }
}

function meets(stats, conditions) {
  return conditions.mandatory.every(c => (stats[c.key] ?? 0) >= c.value) &&
    (!conditions.optional.length || conditions.optional.filter(c => (stats[c.key] ?? 0) >= c.value).length >= conditions.selectedCount)
}

function statsOf(mod) {
  const stats = {}
  let fixed = true
  for (const s of mod.stats || []) {
    if (!Number.isFinite(s.min) || !Number.isFinite(s.max) || s.min > s.max) throw new Error('词缀数值范围无效')
    const mapping = STAT_IDS[s.id]
    if (!mapping) continue
    const [key, sign] = mapping
    // A varying target needs explicit correlated outcomes; never combine independent maxima.
    if (s.min !== s.max) fixed = false
    stats[key] = (stats[key] ?? 0) + s.max * sign
  }
  return { stats, fixed }
}

/** Only one variable range can be expanded without stat-to-text correlation evidence. */
export function expandDescription(lines, limit = 4096) {
  const text = lines.join('\n')
  const ranges = [...text.matchAll(/\((-?\d+)[—–-](-?\d+)\)/g)]
  if (!ranges.length) return /[—–]/.test(text) ? null : [lines]
  if (ranges.length !== 1) return null
  const r = ranges[0], min = Number(r[1]), max = Number(r[2])
  if (max < min || max - min + 1 > limit) return null
  return Array.from({ length: max - min + 1 }, (_, i) => (text.slice(0, r.index) + (min + i) + text.slice(r.index + r[0].length)).split('\n'))
}

function modOptions(mod, conditions) {
  const matches = (lines, list) => lines.some(line => list.some(term => line.includes(term)))
  const outcomes = mod.outcomes
  if (outcomes) return { options: outcomes.filter(o => !matches(o.lines, conditions.blacklist)).map(o => ({ stats: o.stats, white: matches(o.lines, conditions.whitelist) })), unknown: false }
  const { stats, fixed } = statsOf(mod)
  const numericTerms = [...conditions.blacklist, ...conditions.whitelist].some(x => /\d/.test(x))
  // Non-numeric terms must match a literal segment, never across a variable range.
  const lines = numericTerms ? expandDescription(mod.lines) : [mod.lines]
  if (!lines || !fixed) return { options: [], unknown: true }
  const options = []
  for (const rendered of lines) {
    if (!matches(rendered, conditions.blacklist)) options.push({ stats, white: matches(rendered, conditions.whitelist) })
  }
  return { options, unknown: false }
}

function plus(a, b) {
  const result = { ...a }
  for (const [k, v] of Object.entries(b)) result[k] = (result[k] ?? 0) + v
  return result
}

function validStats(stats) { return stats && Object.values(stats).every(v => Number.isFinite(v)) }

export function searchPool(pool, conditions, budget, forceSix = false) {
  if (!pool.complete || !Array.isArray(pool.mods) || !pool.mods.length) return { state: 'unknown', reasons: ['词缀池不完整'] }
  let unknown = false
  const candidates = [], seen = new Set()
  const consumedTags = new Set(pool.mods.flatMap(m => [...(m.spawnWeights || []), ...(m.generationWeights || [])].map(w => w.tag)))
  const producedTags = new Set(pool.mods.flatMap(m => m.addsTags || []))
  const requested = [...new Set([...conditions.mandatory, ...conditions.optional].map(c => c.key))]
  for (const mod of pool.mods) {
    if (!['prefix', 'suffix'].includes(mod.side) || !mod.id || !mod.groups?.length || !mod.lines?.length || !Number.isFinite(mod.level)) return { state: 'unknown', reasons: ['缺少词缀身份、互斥组或描述'] }
    if (mod.level > pool.maxLevel) continue
    if (mod.generationWeights?.length || mod.addsTags?.some(tag => consumedTags.has(tag)) || mod.spawnWeights?.some(w => producedTags.has(w.tag))) {
      // Dynamic generation dependencies require an ordered generator, not a combination proof.
      unknown = true
      continue
    }
    const result = modOptions(mod, conditions)
    unknown ||= result.unknown
    for (const option of result.options) {
      if (!validStats(option.stats)) return { state: 'unknown', reasons: ['词缀贡献数据无效'] }
      const stats = Object.fromEntries(requested.map(k => [k, option.stats[k] ?? 0]))
      const key = JSON.stringify([mod.side, [...mod.groups].sort(), stats, option.white])
      if (seen.has(key)) continue
      seen.add(key)
      candidates.push({ ...mod, stats, white: option.white })
    }
  }
  candidates.sort((a, b) => Number(b.white) - Number(a.white) || requested.reduce((n, k) => n + b.stats[k] - a.stats[k], 0) || a.id.localeCompare(b.id))
  const limits = { prefix: pool.prefixLimit, suffix: pool.suffixLimit }
  const counts = forceSix ? pool.counts?.filter(n => n === 6) : pool.counts
  if (!counts?.length || Object.values(limits).some(v => !Number.isInteger(v) || v < 0 || v > 3) || counts.some(n => !Number.isInteger(n) || n < 1 || n > 6)) return { state: 'unknown', reasons: ['缺少合法词缀数量规则'] }
  const maxCount = Math.max(...counts)
  const initial = pool.baseStats || {}
  if (!validStats(initial)) return { state: 'unknown', reasons: ['缺少底子属性修正规则'] }
  const upper = (start, used, current) => {
    const result = { ...current }
    for (const k of requested) {
      for (const side of ['prefix', 'suffix']) {
        const values = candidates.slice(start).filter(m => m.side === side).map(m => Math.max(0, m.stats[k])).sort((a, b) => b - a)
        result[k] = (result[k] ?? 0) + values.slice(0, limits[side] - used[side]).reduce((a, b) => a + b, 0)
      }
    }
    return result
  }
  const upperBounds = upper(0, { prefix: 0, suffix: 0 }, initial)
  let witness = null, exhausted = false
  function visit(start, used, groups, ids, stats, white) {
    if (--budget.remaining < 0 || (budget.remaining % 128 === 0 && budget.deadline && performance.now() > budget.deadline)) { exhausted = true; return false }
    if (counts.includes(ids.length) && (!conditions.whitelist.length || white) && meets(stats, conditions)) { witness = { poolId: pool.id, mods: ids, stats }; return true }
    if (ids.length >= maxCount || candidates.length - start < Math.min(...counts) - ids.length) return false
    if (!meets(upper(start, used, stats), conditions)) return false
    if (conditions.whitelist.length && !white && !candidates.slice(start).some(m => m.white)) return false
    for (let i = start; i < candidates.length; i++) {
      const m = candidates[i]
      if (used[m.side] >= limits[m.side] || m.groups.some(g => groups.has(g)) || ids.includes(m.id)) continue
      if (visit(i + 1, { ...used, [m.side]: used[m.side] + 1 }, new Set([...groups, ...m.groups]), [...ids, m.id], plus(stats, m.stats), white || m.white)) return true
      if (exhausted) return false
    }
    return false
  }
  visit(0, { prefix: 0, suffix: 0 }, new Set(), [], initial, false)
  return witness ? { state: 'possible', witness } : {
    state: unknown || exhausted ? 'unknown' : 'impossible', upperBounds,
    reasons: [...(unknown ? ['存在尚未解析的数值关联或动态生成规则'] : []), ...(exhausted ? ['组合搜索达到计算上限'] : [])]
  }
}

export function analyzeMapFeasibility({ kind, profile = {}, catalog, maxNodes = 200000 }) {
  const meta = { snapshotDate: catalog?.snapshotDate, gameVersion: catalog?.gameVersion }
  const unknown = reasons => ({ status: 'unknown', reasons, ...meta })
  try {
    if (!Number.isInteger(maxNodes) || maxNodes < 0 || maxNodes > 1000000) return unknown(['计算预算无效'])
    const conditions = normalizeConditions(kind, profile.match)
    const pools = catalog?.pools?.filter(p => p.kind === kind)
    if (!pools?.length) return unknown(['当前类别缺少离线词缀目录'])
    const forceSix = kind !== 'heist' && Boolean(profile.exalted?.enabled)
    const search = c => {
      const budget = { remaining: maxNodes, deadline: performance.now() + 2000 }, results = []
      for (const pool of pools) {
        const result = searchPool(pool, c, budget, forceSix)
        if (result.state === 'possible') return result
        results.push(result)
      }
      const coverage = catalog.coverage?.[kind]
      const reasons = [...new Set(results.flatMap(r => r.reasons || []))]
      if (!coverage?.complete) reasons.push(...(coverage?.reasons || ['当前类别覆盖范围未经核实']))
      if (reasons.length || results.some(r => r.state === 'unknown')) return { state: 'unknown', reasons }
      const requested = [...new Set([...c.mandatory, ...c.optional].map(x => x.key))]
      return { state: 'impossible', upperBounds: Object.fromEntries(requested.map(k => [k, Math.max(...results.map(r => r.upperBounds?.[k] ?? 0))])) }
    }
    const filtered = search(conditions)
    if (filtered.state === 'possible') return { status: 'possible', witness: filtered.witness, reasons: ['已找到符合当前条件的普通词缀组合'], ...meta }
    const unfiltered = conditions.blacklist.length ? search({ ...conditions, blacklist: [] }) : filtered
    const details = { conditions: [...conditions.mandatory.map(c => ({ ...c, mode: 'mandatory' })), ...conditions.optional.map(c => ({ ...c, mode: 'optional' }))], selectedCount: conditions.selectedCount, blacklist: conditions.blacklist, ...meta }
    if (unfiltered.state === 'impossible') return { status: 'conditions-impossible', reasons: ['移除黑名单后，仍没有合法组合能同时满足当前条件'], upperBounds: unfiltered.upperBounds, ...details }
    if (filtered.state === 'impossible' && unfiltered.state === 'possible') return { status: 'blacklist-impossible', reasons: ['黑名单排除后，没有合法组合能同时满足当前条件'], upperBounds: filtered.upperBounds, ...details }
    return { ...unknown([...new Set([...(filtered.reasons || []), ...(unfiltered.reasons || [])])]), ...details }
  } catch (error) { return unknown([error.message || '判定数据无效']) }
}
