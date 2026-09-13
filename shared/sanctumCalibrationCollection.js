import { liveEnvironment } from './sanctumLive.js'

export const COLLECTION_ELEMENTS = [
  { key: 'sanctum-map', label: '地图标题', layout: 'map', example: 1 },
  { key: 'mapRegion', label: '完整房间与连线', layout: 'map', example: 1 },
  { key: 'roomSize', label: '房间内框', layout: 'map', example: 1 },
  { key: 'pathColor', label: '路径颜色', layout: 'map', example: 1 },
  { key: 'coinsRegion', label: '地图内金币面板', layout: 'map', example: 1 },
  { key: 'mapResourcesRegion', label: '地图内坚毅与启迪', layout: 'map', example: 1 },
  { key: 'sanctum-map-hud', label: '地图内状态栏装饰锚点', layout: 'map', example: 1 },
  { key: 'mapEffectIconsRegion', label: '地图内状态及奖励图标范围', layout: 'map', example: 1 },
  { key: 'hudResourcesRegion', label: '独立完整资源状态栏', layout: 'standalone', example: 2 },
  { key: 'effectIconsRegion', label: '独立状态及奖励图标范围', layout: 'standalone', example: 2 },
  { key: 'sanctum-map-entry', label: '禁域地图入口', layout: 'standalone', example: 2 }
]
export const COLLECTION_KEYS = COLLECTION_ELEMENTS.map(item => item.key)
export function compatibleCalibrationEnvironment(a, b) {
  if (!a || !b) return false
  try {
    const first = liveEnvironment(a), second = liveEnvironment(b)
    return Object.keys(first).every(key => first[key] === second[key])
      && ['windowId', 'processId'].every(key => !a[key] || !b[key] || a[key] === b[key])
  } catch { return false }
}

export function savedCollection(profile, titles, environment) {
  environment ||= profile?.environment || Object.values(titles || {})[0]?.environment
  const items = {}
  for (const key of COLLECTION_KEYS) {
    const value = key.startsWith('sanctum-') ? titles?.[key] : profile?.captures?.[key]
    if (!value || environment && !compatibleCalibrationEnvironment(value.environment, environment)) continue
    const pathHsv = profile?.calibration?.pathHsv || value.pathHsv
    if (key === 'pathColor' && !pathHsv) continue
    items[key] = { ...value, ...(key === 'pathColor' ? { pathHsv } : {}), saved: true }
  }
  return items
}
