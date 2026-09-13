// Disk snapshots contain observations, never reusable native-session evidence.
const object = value => value && typeof value === 'object' && !Array.isArray(value)
const transient = new Set(['captureSessionId', 'logContextKey', 'sessionId', 'png', 'pngBase64', 'imageBase64', 'dataUrl', 'buffer', 'rewardLedger', 'rewardGroups', 'altar', 'inventory', 'loadoutPreferences', 'loadouts', 'relicCalibrations', 'relicScore'])
export function withoutSanctumEvidence(value) {
  if (Array.isArray(value)) return value.filter(item => item?.source !== 'relic').map(withoutSanctumEvidence)
  if (!object(value)) return value
  return Object.fromEntries(Object.entries(value).filter(([key,item]) => !transient.has(key)
    && (key !== 'evidenceId' || /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(item)))
    .map(([key, item]) => [key, withoutSanctumEvidence(item)]))
}

export function savedSanctumFloor(value) {
  if (!object(value) || !Array.isArray(value.rooms) || value.rooms.length > 200
    || !Array.isArray(value.edges) || value.edges.length > 2000
    || value.rooms.some(room => !object(room) || typeof room.id !== 'string')
    || new Set(value.rooms.map(room => room.id)).size !== value.rooms.length) return null
  const ids = new Set(value.rooms.map(room => room.id))
  if (value.edges.some(edge => !object(edge) || !ids.has(edge.from) || !ids.has(edge.to))) return null
  const floor = withoutSanctumEvidence(value)
  floor.rooms = floor.rooms.map(room => {
    const stages = Object.fromEntries(Object.entries(object(room.readStages) ? room.readStages : {})
      .map(([key, status]) => [key, ['capturing', 'queued', 'reading'].includes(status) ? 'failed' : status]))
    return { ...room, readStages: stages, ...(room.detailsStatus === 'reading'
      ? { detailsStatus: 'failed', failureReason: '读取已中断' } : {}) }
  })
  if (Array.isArray(floor.effectScan?.targets)) floor.effectScan.targets = floor.effectScan.targets.filter(object).map(target =>
    ['capturing', 'queued', 'reading'].includes(target.stage) ? { ...target, stage: 'failed', reason: '读取已中断' } : target)
  return floor
}

export function savedSanctumResult(value, { overlay = false } = {}) {
  if (!object(value)) return null
  const floor = savedSanctumFloor(value.floor)
  if (!floor || floor.sampleId || !floor.identityConfirmed || typeof floor.runId !== 'string' || typeof floor.floorId !== 'string') return null
  const recommendation = value.recommendation
  const ids = new Set(floor.rooms.map(room => room.id))
  if (recommendation && (!object(recommendation) || !['runId', 'floorId', 'revision'].every(key => recommendation[key] === floor[key])
    || !Array.isArray(recommendation.paths) || recommendation.paths.some(route => !object(route) || !Array.isArray(route.rooms)
      || route.rooms.some(id => !ids.has(id)) || (route.nextRoomId && !ids.has(route.nextRoomId))))) return null
  const result = withoutSanctumEvidence({ floor, recommendation: recommendation || null,
    marks: { targets: Array.isArray(value.marks?.targets) ? value.marks.targets.filter(id => ids.has(id)) : [],
      avoid: Array.isArray(value.marks?.avoid) ? value.marks.avoid.filter(id => ids.has(id)) : [] },
    currentEffects: Array.isArray(value.currentEffects) ? value.currentEffects : [],
    runObservation: object(value.runObservation) ? value.runObservation : null,
    savedAt: Number.isFinite(value.savedAt) ? value.savedAt : null,
    reason: typeof value.reason === 'string' ? value.reason : '上次保存的路线', incomplete: value.incomplete === true })
  if (overlay) {
    const rect = r => object(r) && ['x', 'y', 'width', 'height'].every(key => Number.isFinite(r[key])) && r.width > 0 && r.height > 0
    const bounds = value.observation?.clientBounds, map = value.observation?.mapRegion, environment = value.environment
    if (!rect(bounds) || !rect(map) || !Number.isFinite(environment?.dpi) || environment.dpi <= 0
      || map.x < 0 || map.y < 0 || map.x + map.width > bounds.width || map.y + map.height > bounds.height
      || floor.width !== map.width || floor.height !== map.height) return null
    const pickRect = r => Object.fromEntries(['x', 'y', 'width', 'height'].map(key => [key, r[key]]))
    result.observation = { clientBounds: pickRect(bounds), mapRegion: pickRect(map) }
    result.environment = { width: bounds.width, height: bounds.height, dpi: environment.dpi }
    result.progress = { stage: result.incomplete ? 'partial' : 'complete' }
    result.clearOnMapClose = value.clearOnMapClose === true
  }
  return result
}
