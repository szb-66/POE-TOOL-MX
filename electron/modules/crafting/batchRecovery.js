const MAX_BATCH_TARGETS = 60

function finiteNumber(value, { integer = false, min = 0, max = 100000 } = {}) {
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max) return null
  return integer ? Math.trunc(number) : number
}

function safeText(value, maxLength = 160) {
  const text = String(value || '').trim()
  return text && text.length <= maxLength ? text : ''
}

function normalizeTarget(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const id = safeText(value.id, 120)
  const categoryId = safeText(value.categoryId, 80)
  const baseType = safeText(value.baseType, 160)
  const displayName = safeText(value.displayName || value.baseType, 160)
  const x = finiteNumber(value.x, { integer: true, min: 0, max: 11 })
  const y = finiteNumber(value.y, { integer: true, min: 0, max: 4 })
  const width = finiteNumber(value.width, { integer: true, min: 1, max: 12 })
  const height = finiteNumber(value.height, { integer: true, min: 1, max: 5 })
  if (!id || !categoryId || !baseType || !displayName || x === null || y === null || width === null || height === null) return null
  if (x + width > 12 || y + height > 5) return null
  return {
    id,
    categoryId,
    baseType,
    displayName,
    x,
    y,
    width,
    height,
    footprintSource: safeText(value.footprintSource, 80)
  }
}

export function normalizeBatchRecoveryCheckpoint(value, { requireRecoverable = false } = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { valid: false, error: '批量恢复检查点无效' }
  }
  const batchId = safeText(value.batchId, 120)
  const scanId = safeText(value.scanId, 120)
  const snapshotFingerprint = safeText(value.snapshotFingerprint, 120)
  const usageSessionId = safeText(value.usageSessionId, 120)
  const targets = Array.isArray(value.targets) && value.targets.length <= MAX_BATCH_TARGETS
    ? value.targets.map(normalizeTarget)
    : []
  if (!batchId || !scanId || !snapshotFingerprint || !usageSessionId || !targets.length || targets.some(target => !target)) {
    return { valid: false, error: '批量恢复检查点字段不完整' }
  }
  const targetIds = targets.map(target => target.id)
  const idSet = new Set(targetIds)
  if (idSet.size !== targetIds.length) return { valid: false, error: '批量恢复目标存在重复 ID' }

  const completedIds = [...new Set((Array.isArray(value.completedIds) ? value.completedIds : []).map(entry => safeText(entry, 120)).filter(Boolean))]
  if (completedIds.some(id => !idSet.has(id))) return { valid: false, error: '批量恢复完成集合包含未知目标' }
  const currentItemId = safeText(value.currentItemId, 120)
  if (currentItemId && !idSet.has(currentItemId)) return { valid: false, error: '批量恢复当前目标无效' }
  const recoverable = value.recoverable === true && completedIds.length < targets.length
  if (requireRecoverable && !recoverable) return { valid: false, error: '当前批次不可继续' }
  return {
    valid: true,
    value: {
      batchId,
      scanId,
      snapshotFingerprint,
      usageSessionId,
      targets,
      completedIds,
      currentItemId,
      recoverable,
      reason: safeText(value.reason, 300),
      code: safeText(value.code, 100)
    }
  }
}

export function cloneBatchRecoveryCheckpoint(value, options) {
  const result = normalizeBatchRecoveryCheckpoint(value, options)
  return result.valid ? result.value : null
}

export function createBatchRecoveryStore() {
  let checkpoint = null

  return {
    begin(batchConfig, usageSessionId) {
      const normalized = normalizeBatchRecoveryCheckpoint({
        ...batchConfig,
        usageSessionId,
        completedIds: batchConfig?.completedIds || [],
        currentItemId: '',
        recoverable: false
      })
      if (!normalized.valid) return normalized
      checkpoint = normalized.value
      return { valid: true, value: cloneBatchRecoveryCheckpoint(checkpoint) }
    },
    applyEvent(event = {}) {
      if (!checkpoint || safeText(event.batchId, 120) !== checkpoint.batchId) return false
      const currentId = safeText(event.currentItem?.id || event.currentItemId, 120)
      if (currentId && checkpoint.targets.some(target => target.id === currentId)) checkpoint.currentItemId = currentId
      if (event.event === 'crafting-batch-item-completed' && currentId && !checkpoint.completedIds.includes(currentId)) {
        checkpoint.completedIds.push(currentId)
      }
      if (event.event === 'crafting-batch-completed') checkpoint = null
      return true
    },
    markAbnormal({ reason = '', code = '' } = {}) {
      if (!checkpoint) return null
      checkpoint.recoverable = checkpoint.completedIds.length < checkpoint.targets.length
      checkpoint.reason = safeText(reason, 300)
      checkpoint.code = safeText(code, 100)
      return cloneBatchRecoveryCheckpoint(checkpoint)
    },
    clear() {
      checkpoint = null
    },
    snapshot({ requireRecoverable = false } = {}) {
      return cloneBatchRecoveryCheckpoint(checkpoint, { requireRecoverable })
    }
  }
}

export const batchRecoveryStore = createBatchRecoveryStore()
