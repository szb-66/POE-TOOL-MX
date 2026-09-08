import { randomUUID } from 'node:crypto'
import { normalizeMapName } from '../../../shared/mapTrackerAreaCatalog.js'

export const DEFAULT_MAP_TRACKER_SETTINGS = Object.freeze({
  schemaVersion: 1, enabled: false, paused: false,
  enhancements: { loot: false },
  overlay: { enabled: false, x: null, y: null }
})

const cleanText = (value, max = 120) => String(value || '').trim().slice(0, max)

export function normalizeMapTrackerSettings(value = {}) {
  const enhancements = value.enhancements || {}
  const overlay = value.overlay || {}
  return {
    schemaVersion: 1, enabled: value.enabled === true, paused: value.paused === true,
    selectedCharacter: value.selectedCharacter && typeof value.selectedCharacter === 'object' ? {
      name: cleanText(value.selectedCharacter.name), accountName: cleanText(value.selectedCharacter.accountName),
      league: cleanText(value.selectedCharacter.league), className: cleanText(value.selectedCharacter.className),
      level: Number.isInteger(value.selectedCharacter.level) ? value.selectedCharacter.level : null
    } : null,
    enhancements: Object.fromEntries(Object.keys(DEFAULT_MAP_TRACKER_SETTINGS.enhancements).map((key) => [key, enhancements[key] === true])),
    overlay: { enabled: overlay.enabled === true, x: Number.isFinite(overlay.x) ? Math.round(overlay.x) : null, y: Number.isFinite(overlay.y) ? Math.round(overlay.y) : null }
  }
}

export function createMapRun(input = {}) {
  const now = input.startedAt || new Date().toISOString()
  return {
    id: cleanText(input.id, 80) || randomUUID(), instanceKey: cleanText(input.instanceKey, 180), sessionKey: cleanText(input.sessionKey, 1000), areaId: cleanText(input.areaId, 160),
    areaName: normalizeMapName(input.areaId, cleanText(input.areaName, 160)), areaLevel: Number.isInteger(input.areaLevel) ? input.areaLevel : null,
    mapTier: Number.isInteger(input.mapTier) ? input.mapTier : null, startedAt: now, endedAt: input.endedAt || null,
    activeDurationMs: Math.max(0, Number(input.activeDurationMs) || 0),
    deaths: Math.max(0, Number(input.deaths) || 0), portalsUsed: Math.max(0, Number(input.portalsUsed) || 0),
    character: input.character || null,
    endReason: input.endReason || null
  }
}
