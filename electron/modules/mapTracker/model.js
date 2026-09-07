import { randomUUID } from 'node:crypto'

export const DEFAULT_MAP_TRACKER_SETTINGS = Object.freeze({
  schemaVersion: 1, enabled: false, paused: false,
  enhancements: { character: false, loot: false },
  overlay: { enabled: true, x: null, y: null }
})

const cleanText = (value, max = 120) => String(value || '').trim().slice(0, max)

export function normalizeMapTrackerSettings(value = {}) {
  const enhancements = value.enhancements || {}
  const overlay = value.overlay || {}
  return {
    schemaVersion: 1, enabled: value.enabled === true, paused: value.paused === true,
    experienceObservation: value.experienceObservation && Number.isSafeInteger(value.experienceObservation.first) && Number.isSafeInteger(value.experienceObservation.latest) ? {
      date: cleanText(value.experienceObservation.date, 60), identity: cleanText(value.experienceObservation.identity, 500),
      first: value.experienceObservation.first, latest: value.experienceObservation.latest,
      points: (Array.isArray(value.experienceObservation.points) ? value.experienceObservation.points : []).filter(point => Number.isSafeInteger(point?.experience) && point.experience >= 0 && Number.isFinite(Date.parse(point.at))).map(point => ({ at: cleanText(point.at, 50), experience: point.experience })),
      samples: Math.max(1, Number(value.experienceObservation.samples) || 1), sampledAt: cleanText(value.experienceObservation.sampledAt, 50)
    } : null,
    selectedCharacter: value.selectedCharacter && typeof value.selectedCharacter === 'object' ? {
      name: cleanText(value.selectedCharacter.name), accountName: cleanText(value.selectedCharacter.accountName),
      league: cleanText(value.selectedCharacter.league), className: cleanText(value.selectedCharacter.className),
      level: Number.isInteger(value.selectedCharacter.level) ? value.selectedCharacter.level : null
    } : null,
    enhancements: Object.fromEntries(Object.keys(DEFAULT_MAP_TRACKER_SETTINGS.enhancements).map((key) => [key, enhancements[key] === true])),
    overlay: { enabled: overlay.enabled !== false, x: Number.isFinite(overlay.x) ? Math.round(overlay.x) : null, y: Number.isFinite(overlay.y) ? Math.round(overlay.y) : null }
  }
}

export function calculateExperienceEfficiency(characterLevel, areaLevel) {
  if (!Number.isInteger(characterLevel) || !Number.isInteger(areaLevel)) return null
  const effectiveAreaLevel = areaLevel <= 70 ? areaLevel : 70 + Math.floor((areaLevel - 70) / 3)
  const safeZone = 3 + Math.floor(characterLevel / 16)
  const difference = Math.max(0, Math.abs(characterLevel - effectiveAreaLevel) - safeZone)
  if (difference === 0) return 1
  return Math.max(0.01, Math.min(1, Math.pow((characterLevel + 5) / (characterLevel + 5 + difference), 2.5) * Math.pow(0.95, difference)))
}

export function createMapRun(input = {}) {
  const now = input.startedAt || new Date().toISOString()
  return {
    id: cleanText(input.id, 80) || randomUUID(), instanceKey: cleanText(input.instanceKey, 180), sessionKey: cleanText(input.sessionKey, 1000), areaId: cleanText(input.areaId, 160),
    areaName: cleanText(input.areaName, 160), areaLevel: Number.isInteger(input.areaLevel) ? input.areaLevel : null,
    mapTier: Number.isInteger(input.mapTier) ? input.mapTier : null, startedAt: now, endedAt: input.endedAt || null,
    activeDurationMs: Math.max(0, Number(input.activeDurationMs) || 0), experienceEfficiency: input.experienceEfficiency ?? null,
    deaths: Math.max(0, Number(input.deaths) || 0), portalsUsed: Math.max(0, Number(input.portalsUsed) || 0),
    experienceStart: Number.isSafeInteger(input.experienceStart) ? input.experienceStart : null,
    experienceEnd: Number.isSafeInteger(input.experienceEnd) ? input.experienceEnd : null,
    experienceGain: Number.isSafeInteger(input.experienceGain) ? input.experienceGain : null,
    experienceSampleCount: Math.max(0, Number(input.experienceSampleCount) || 0),
    experienceFirstSampleAt: typeof input.experienceFirstSampleAt === 'string' ? input.experienceFirstSampleAt : null,
    experienceLastSampleAt: typeof input.experienceLastSampleAt === 'string' ? input.experienceLastSampleAt : null,
    character: input.character || null,
    endReason: input.endReason || null
  }
}
