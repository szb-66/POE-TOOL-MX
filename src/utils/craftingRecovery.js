function nonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0
}

function normalizeStats(value) {
  if (value == null) return {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const normalized = {}
  for (const [key, count] of Object.entries(value)) {
    if (!key || !nonNegativeInteger(count)) return null
    normalized[key] = count
  }
  return normalized
}

export function validateMapRecovery(recovery, { targetKind, rows, cols }) {
  if (recovery == null) return { valid: true, value: null }
  const expectedTargetKind = targetKind === 'chart' ? 'chart' : 'atlas'
  const blacklistStats = normalizeStats(recovery.blacklistStats)
  const whitelistStats = normalizeStats(recovery.whitelistStats)
  const valid = recovery.targetKind === expectedTargetKind &&
    nonNegativeInteger(recovery.col) && recovery.col < cols &&
    nonNegativeInteger(recovery.row) && recovery.row < rows &&
    nonNegativeInteger(recovery.processedCount) &&
    nonNegativeInteger(recovery.qualifiedCount) &&
    recovery.qualifiedCount <= recovery.processedCount &&
    blacklistStats !== null && whitelistStats !== null

  if (!valid) {
    return { valid: false, error: '地图或海图恢复检查点无效，请重新开始本次洗练' }
  }

  return {
    valid: true,
    value: {
      targetKind: expectedTargetKind,
      col: recovery.col,
      row: recovery.row,
      processedCount: recovery.processedCount,
      qualifiedCount: recovery.qualifiedCount,
      blacklistStats,
      whitelistStats
    }
  }
}
