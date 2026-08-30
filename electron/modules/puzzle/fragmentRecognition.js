import { parseCopiedChartFragment } from '../priceCheck/chartRegions.js'

const MASKS_BY_TYPE = Object.freeze({
  endpoint: [1, 2, 4, 8],
  straight: [5, 10],
  corner: [3, 6, 12, 9],
  tee: [11, 7, 14, 13],
  cross: [15]
})

function validDirection(type, direction) {
  const mask = Number(direction?.mask || 0)
  return MASKS_BY_TYPE[type]?.includes(mask) ? { ...direction, mask } : null
}

export function resolveFragmentCopy(slot, copiedText) {
  const text = String(copiedText || '')
  const parsed = parseCopiedChartFragment(text)
  const direction = parsed.type ? validDirection(parsed.type, slot?.directionCandidates?.[parsed.type]) : null
  if (parsed.type) {
    const confidence = Number(direction?.confidence || 0)
    return {
      ...slot,
      candidate: true,
      occupied: true,
      type: parsed.type,
      typeSource: 'copy',
      shapeLabel: parsed.shapeLabel,
      mask: Number(direction?.mask || 0),
      orientation: Number(direction?.orientation || 0),
      orientationConfidence: confidence,
      directionConfidence: confidence,
      confidence,
      margin: 1,
      uncertain: !direction || Boolean(direction.uncertain),
      calibrated: Boolean(direction?.calibrated),
      calibrationSimilarity: Number(direction?.calibrationSimilarity || 0)
    }
  }

  const copyFailed = !text.trim()
  if (copyFailed && slot?.emptyCalibration?.matched) {
    const similarity = Number(slot.emptyCalibration.similarity || 0)
    return {
      ...slot,
      candidate: false,
      candidateState: 'calibrated-empty',
      occupied: false,
      type: null,
      typeSource: 'calibration-empty',
      shapeLabel: '',
      mask: 0,
      orientation: 0,
      orientationConfidence: similarity,
      directionConfidence: similarity,
      confidence: similarity,
      margin: 1,
      uncertain: false,
      calibrated: true,
      calibrationSimilarity: similarity
    }
  }

  return {
    ...slot,
    candidate: Boolean(slot?.candidate),
    occupied: false,
    type: null,
    typeSource: copyFailed ? 'copy-failed' : (parsed.isChart ? 'copy-unknown' : 'copy-invalid'),
    shapeLabel: parsed.shapeLabel,
    mask: 0,
    orientation: 0,
    orientationConfidence: 0,
    directionConfidence: 0,
    confidence: 0,
    margin: 0,
    uncertain: Boolean(slot?.candidate),
    calibrated: false,
    calibrationSimilarity: 0
  }
}

export function finalizeInventoryAnalysisResult(result) {
  const counts = Object.fromEntries(Object.keys(MASKS_BY_TYPE).map(type => [type, 0]))
  for (const slot of result?.slots || []) {
    if (!slot?.occupied || !slot.type || !validDirection(slot.type, slot)) continue
    counts[slot.type] += 1
  }
  result.counts = counts
  result.occupiedCount = Object.values(counts).reduce((total, count) => total + count, 0)
  result.candidateCount = (result?.slots || []).filter(slot => slot?.candidate).length
  return result
}
