import { randomUUID } from 'node:crypto'

const overlaps = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
const validRect = value => value && ['x', 'y', 'width', 'height'].every(key => Number.isInteger(value[key]))
  && value.x >= 0 && value.y >= 0 && value.width > 0 && value.height > 0

// Each scan observation has an explicitly verified footprint. Unknown observations
// can be single cells; touching any part of a historical item invalidates that item.
export function mergeSanctumInventory(previous, scan, makeId = randomUUID) {
  if (!Array.isArray(previous) || typeof scan?.regionId !== 'string' || !Array.isArray(scan.observations)) throw new Error('圣物扫描无效')
  const observations = scan.observations
  for (const observation of observations) {
    if (!validRect(observation) || !['matched', 'empty', 'unknown'].includes(observation.status)) throw new Error('圣物扫描位置无效')
    if (observation.status === 'matched' && (!observation.rawText || !observation.baseId)) throw new Error('圣物文本或底材未确认')
  }
  for (let i = 0; i < observations.length; i++) for (let j = 0; j < i; j++) {
    if (overlaps(observations[i], observations[j])) throw new Error('扫描结果占格重叠')
  }
  const result = previous.filter(item => item.regionId !== scan.regionId).map(item => ({ ...item }))
  const old = previous.filter(item => item.regionId === scan.regionId)
  const matched = observations.filter(item => item.status === 'matched')
  for (const item of old) {
    if (matched.some(observation => overlaps(item, observation))) continue
    const touching = observations.filter(observation => overlaps(item, observation))
    if (!touching.length) { result.push({ ...item }); continue }
    let allEmpty = true
    for (let y = item.y; y < item.y + item.height; y++) for (let x = item.x; x < item.x + item.width; x++) {
      if (!touching.some(observation => observation.status === 'empty' && overlaps(observation, { x, y, width: 1, height: 1 }))) allEmpty = false
    }
    if (!allEmpty) result.push({ ...item, status: 'unknown', reason: '当前位置未完整确认', scannedAt: scan.scannedAt })
  }
  for (const observation of matched) {
    const prior = old.find(item => item.x === observation.x && item.y === observation.y && item.width === observation.width
      && item.height === observation.height && item.rawText === observation.rawText)
    result.push({ ...observation, id: prior?.id || makeId(), regionId: scan.regionId, scannedAt: scan.scannedAt })
  }
  for (const observation of observations.filter(item => item.status === 'unknown' && !item.disabled && !item.ignored)) {
    if (result.some(item => item.regionId === scan.regionId && overlaps(item, observation))) continue
    result.push({ ...observation, id: makeId(), regionId: scan.regionId, scannedAt: scan.scannedAt })
  }
  return result
}

export function summarizeSanctumRelics(items) {
  const totals = {}, unknown = []
  for (const item of items) {
    if (item.status !== 'matched') { unknown.push({ id: item.id, rawText: item.rawText || '圣物未识别' }); continue }
    for (const modifier of item.modifiers || []) {
      if (modifier.status !== 'matched' || !Number.isFinite(modifier.value) || typeof modifier.id !== 'string') {
        unknown.push({ id: item.id, rawText: modifier.rawText || '词缀未识别' }); continue
      }
      if (!Object.hasOwn(totals, modifier.id)) Object.defineProperty(totals, modifier.id, { value: 0, writable: true, enumerable: true })
      totals[modifier.id] += modifier.value
    }
  }
  return { totals, unknown }
}
