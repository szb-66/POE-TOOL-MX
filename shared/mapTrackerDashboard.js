const HOUR = 3600000
const time = value => Date.parse(value)
const quantity = item => Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0 ? Number(item.quantity) : 1
const identity = character => character ? JSON.stringify([character.accountName || '', character.league || '', character.name || '']) : null

// Merge only identified instances; an unknown seed is not evidence of re-entry.
export function mergeDashboardRuns(runs) {
  const merged = new Map()
  for (const run of runs) {
    const character = run.sessionKey || identity(run.character)
    const key = character && run.instanceKey && !run.instanceKey.endsWith(':unknown')
      ? JSON.stringify([character, run.instanceKey, run.areaId || run.areaName, run.mapTier]) : run.id
    const previous = merged.get(key)
    if (!previous) merged.set(key, { ...run })
    else {
      previous.activeDurationMs += run.activeDurationMs || 0
      if (time(run.endedAt) > time(previous.endedAt)) previous.endedAt = run.endedAt
    }
  }
  return [...merged.values()]
}

function aggregate(runs, loot, start, end, bucketMs) {
  const completed = runs.filter(run => time(run.endedAt) >= start && time(run.endedAt) <= end)
  const entries = loot.filter(entry => entry.at >= start && entry.at <= end)
  const buckets = Array.from({ length: Math.ceil((end - start) / bucketMs) }, (_, index) => ({ start: start + index * bucketMs, end: Math.min(end, start + (index + 1) * bucketMs), count: 0, loot: 0 }))
  const bucket = at => buckets[Math.min(buckets.length - 1, Math.floor((at - start) / bucketMs))]
  for (const run of completed) { const target = bucket(time(run.endedAt)); if (target) target.count += 1 }
  const items = new Map()
  for (const entry of entries) {
    const target = bucket(entry.at); if (target) target.loot += entry.quantity
    const key = JSON.stringify([entry.name, entry.baseType])
    const item = items.get(key) || { name: entry.name, baseType: entry.baseType, quantity: 0 }
    item.quantity += entry.quantity; items.set(key, item)
  }
  const groups = new Map()
  for (const run of completed) {
    const key = JSON.stringify([run.areaName, run.mapTier])
    const group = groups.get(key) || { name: run.areaName, mapTier: run.mapTier, count: 0, totalDurationMs: 0 }
    group.count += 1; group.totalDurationMs += run.activeDurationMs || 0; groups.set(key, group)
  }
  return {
    start, end, buckets, count: completed.length,
    loot: entries.reduce((total, entry) => total + entry.quantity, 0),
    items: [...items.values()].sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name)),
    durations: [...groups.values()].map(group => ({ ...group, averageDurationMs: Math.round(group.totalDurationMs / group.count) })).sort((a, b) => b.averageDurationMs - a.averageDurationMs || a.name.localeCompare(b.name)),
    averageDurationMs: groups.size ? Math.round([...groups.values()].reduce((total, group) => total + group.totalDurationMs / group.count, 0) / groups.size) : 0
  }
}

export function buildDashboardSummary({ runs = [], activeRun = null, stashEvents = [], now = Date.now() } = {}) {
  // Saved records take precedence during the transition from draft to history.
  const unique = new Map(runs.map(run => [run.id, run]))
  if (activeRun) {
    const settled = unique.get(activeRun.id)
    unique.set(activeRun.id, { ...activeRun, endedAt: settled?.endedAt || activeRun.endedAt })
  }
  const all = [...unique.values()]
  const completed = mergeDashboardRuns(all.filter(run => run.endedAt))
  const loot = stashEvents.map(item => ({
    name: item.name || item.baseType || '未知物品', baseType: item.baseType || '', quantity: quantity(item),
    at: time(item.recordedAt)
  }))
  const start = new Date(now); start.setHours(0, 0, 0, 0)
  const today = aggregate(completed, loot, start.getTime(), now, HOUR)
  const windows = Object.fromEntries([24, 6, 1].map(hours => {
    const from = now - hours * HOUR
    return [hours, { ...aggregate(completed, loot, from, now, hours === 24 ? HOUR : hours === 6 ? HOUR / 4 : HOUR / 12) }]
  }))
  return { todayCount: today.count, todayLoot: today.loot, averageDurationMs: today.averageDurationMs, windows }
}
