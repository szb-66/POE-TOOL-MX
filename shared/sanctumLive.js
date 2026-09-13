import { validateSanctumCalibration } from './sanctumCalibration.js'

export function liveEnvironment(value) {
  if (!value || !Number.isInteger(value.width) || !Number.isInteger(value.height) || value.width < 100 || value.height < 100
    || value.width > 16384 || value.height > 16384 || !Number.isFinite(value.dpi) || value.dpi < 48 || value.dpi > 768) throw new Error('实时窗口环境无效')
  return { width: value.width, height: value.height, dpi: value.dpi }
}
export const RESOURCE_REGION_KEYS = ['coinsRegion', 'mapResourcesRegion', 'hudResourcesRegion']
export const CAPTURE_KEYS = ['mapRegion', 'effectIconsRegion', 'mapEffectIconsRegion', ...RESOURCE_REGION_KEYS, 'roomSize', 'pathColor']
export function region(value, environment) {
  const env = liveEnvironment(environment), r = value
  if (!r || !['x', 'y', 'width', 'height'].every(key => Number.isInteger(r[key])) || r.x < 0 || r.y < 0
    || r.width < 1 || r.height < 1 || r.x + r.width > env.width || r.y + r.height > env.height) throw new Error('实时区域越界或未填写完整')
  return { x: r.x, y: r.y, width: r.width, height: r.height }
}
export function liveRegions(value, environment) {
  const result = {}
  for (const key of ['mapRegion', 'effectIconsRegion', 'mapEffectIconsRegion', ...RESOURCE_REGION_KEYS]) if (value?.[key]) result[key] = region(value[key], environment)
  if (value?.calibration && result.mapRegion) {
    const imageSize = [result.mapRegion.width, result.mapRegion.height]
    const valid = validateSanctumCalibration({ version: 1, scope: 'sample', sampleId: 'validation.png', imageSize,
      region: [0, 0, ...imageSize], roomSize: value.calibration.roomSize ?? null, pathHsv: value.calibration.pathHsv ?? [[12, 95, 42], [40, 255, 255]] })
    result.calibration = { version: 1, scope: 'live', imageSize, region: valid.region, roomSize: valid.roomSize, pathHsv: valid.pathHsv }
  }
  return result
}
export function calibrationPng(png) {
  if (typeof png !== 'string' || png.length > 24000000 || !/^iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(png)) throw new Error('校准截图无效')
  return png
}
export function liveProfile(value) {
  if (!value || ![1, 2, 3, 4, 5, 6].includes(value.version)) throw new Error('实时校准版本无效')
  const environment = liveEnvironment(value.environment), captures = {}
  for (const key of CAPTURE_KEYS) if (value.captures?.[key]) {
    const c = value.captures[key]
    captures[key] = { ...c, environment: liveEnvironment(c.environment), region: region(c.region, c.environment), png: calibrationPng(c.png) }
  }
  // Legacy text crops cannot serve as icon locations; the whitelist discards them.
  return { version: 6, environment, ...liveRegions(value, environment), captures }
}
