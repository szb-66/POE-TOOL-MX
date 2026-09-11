import { parseSanctumRelic } from './relicParser.js'
import { mergeSanctumInventory } from './inventory.js'

// This boundary accepts collector observations, never renderer-supplied item
// dimensions or calculated effects. Origin confirmation belongs to the collector.
export function mergeSanctumTextScan(previous, scan, catalog) {
  if (scan?.scanId !== undefined && (typeof scan.scanId !== 'string' || !scan.scanId || scan.scanId.length > 100)) throw new Error('圣物扫描批次无效')
  if (!scan || typeof scan.regionId !== 'string' || !scan.regionId || scan.regionId.length > 100
    || !Number.isInteger(scan.width) || !Number.isInteger(scan.height) || scan.width < 1 || scan.height < 1
    || scan.width > 24 || scan.height > 24 || !Array.isArray(scan.observations) || scan.observations.length > scan.width * scan.height) throw new Error('圣物扫描范围无效')
  const observations = scan.observations.map(observation => {
    if (!observation || !Number.isInteger(observation.x) || !Number.isInteger(observation.y)
      || observation.x < 0 || observation.y < 0 || observation.x >= scan.width || observation.y >= scan.height
      || !['copied', 'empty', 'unknown', 'locked', 'disabled', 'ignored'].includes(observation.status)) throw new Error('圣物扫描格子无效')
    const cell = { x: observation.x, y: observation.y, width: 1, height: 1 }
    if (['disabled', 'ignored', 'locked'].includes(observation.status)) return { ...cell, status: 'unknown', disabled: observation.status !== 'ignored', ignored: observation.status === 'ignored' }
    if (observation.status !== 'copied') return { ...cell, status: observation.status }
    const parsed = parseSanctumRelic(observation.rawText, catalog)
    if (parsed.status !== 'matched' || observation.originConfirmed !== true) return { ...cell, ...parsed,
      width: 1, height: 1, status: 'unknown', reason: parsed.reason || '物品左上角位置未确认' }
    if (cell.x + parsed.width > scan.width || cell.y + parsed.height > scan.height) throw new Error('圣物占格超出扫描范围')
    return { ...cell, ...parsed, ...(scan.scanId ? { scanId: scan.scanId } : {}) }
  })
  const inventory = mergeSanctumInventory(previous, { regionId: scan.regionId, observations, scannedAt: scan.scannedAt })
  let covered = 0
  const unlocked = []
  for (const observation of observations) if ((observation.status !== 'unknown' || observation.disabled)) {
    covered += observation.width * observation.height
    if (!observation.locked && !observation.disabled) for (let y = observation.y; y < observation.y + observation.height; y++) {
      for (let x = observation.x; x < observation.x + observation.width; x++) unlocked.push(y * scan.width + x)
    }
  }
  return { inventory, observations, unlocked: unlocked.sort((a, b) => a - b), complete: covered === scan.width * scan.height && !inventory.some(item => item.regionId === scan.regionId && item.status === 'unknown' && previous.some(old => old.id === item.id)) }
}
