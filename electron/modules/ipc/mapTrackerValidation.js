const text = (value, max) => String(value || '').trim().slice(0, max)
const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {}

export function sanitizeMapTrackerQuery(value = {}) {
  const input = object(value)
  return { league: text(input.league, 80), map: text(input.map, 120), from: text(input.from, 40), to: text(input.to, 40), page: Math.max(1, Math.floor(Number(input.page) || 1)), pageSize: Math.min(100, Math.max(1, Math.floor(Number(input.pageSize) || 25))), direction: input.direction === 'asc' ? 'asc' : 'desc' }
}

export function sanitizeMapTrackerPatch(value = {}) {
  const input = object(value); const result = {}
  if (Object.hasOwn(input, 'enabled')) result.enabled = input.enabled === true
  if (Object.hasOwn(input, 'paused')) result.paused = input.paused === true
  if (input.enhancements) result.enhancements = Object.fromEntries(['loot'].filter((key) => Object.hasOwn(input.enhancements, key)).map((key) => [key, input.enhancements[key] === true]))
  if (input.overlay) result.overlay = { ...(Object.hasOwn(input.overlay, 'enabled') ? { enabled: input.overlay.enabled === true } : {}) }
  return result
}

export const mapTrackerIpcText = text
export const mapTrackerIpcObject = object
