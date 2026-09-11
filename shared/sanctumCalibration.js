const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max

export function validateSanctumCalibration(value) {
  if (!value || value.version !== 1 || value.scope !== 'sample' || typeof value.sampleId !== 'string'
    || !/^[\w-]+\.png$/.test(value.sampleId)) throw new Error('样本校准格式无效')
  const { imageSize, region, roomSize, pathHsv } = value
  if (!Array.isArray(imageSize) || imageSize.length !== 2 || imageSize.some(n => !integer(n, 1, 32768))) throw new Error('校准图像尺寸无效')
  if (!Array.isArray(region) || region.length !== 4 || region.some(n => !integer(n, 0, 32768))
    || region[2] < 1 || region[3] < 1 || region[0] + region[2] > imageSize[0] || region[1] + region[3] > imageSize[1]) throw new Error('校准区域越界')
  if (roomSize !== null && (!Array.isArray(roomSize) || roomSize.length !== 2
    || roomSize.some((n, i) => !integer(n, 24, Math.min(imageSize[i], 1000))))) throw new Error('房间尺寸无效')
  if (!Array.isArray(pathHsv) || pathHsv.length !== 2 || pathHsv.some(row => !Array.isArray(row) || row.length !== 3
    || row.some((n, i) => !integer(n, 0, i === 0 ? 179 : 255)))
    || pathHsv[0].some((n, i) => n > pathHsv[1][i])) throw new Error('路径颜色范围无效')
  // Offline calibration can never carry live validation or a renderer-supplied DPI.
  return { version: 1, scope: 'sample', sampleId: value.sampleId, imageSize: [...imageSize], region: [...region],
    roomSize: roomSize && [...roomSize], pathHsv: pathHsv.map(row => [...row]), dpi: null, liveValidated: false }
}

export function bindSanctumCalibration(value, sample) {
  const result = validateSanctumCalibration(value)
  if (!sample || result.sampleId !== sample.id || !Array.isArray(sample.crop)
    || result.imageSize[0] !== sample.crop[2] - sample.crop[0]
    || result.imageSize[1] !== sample.crop[3] - sample.crop[1]) throw new Error('样本或尺寸已变化，请重新校准')
  return result
}

export function validateSanctumCalibrations(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length > 100) throw new Error('校准存储无效')
  return Object.fromEntries(Object.entries(value).map(([id, calibration]) => {
    const result = validateSanctumCalibration(calibration)
    if (id !== result.sampleId) throw new Error('校准样本标识不一致')
    return [id, result]
  }))
}
