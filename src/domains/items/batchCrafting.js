const SOCKET_CATEGORIES = new Set([
  'helmet', 'bodyArmour', 'gloves', 'boots', 'shield', 'oneHandWeapon', 'twoHandWeapon', 'bow'
])
const ELDRITCH_CATEGORIES = new Set(['helmet', 'bodyArmour', 'gloves', 'boots'])

export function validateBatchCategoryCompatibility(preset, candidates) {
  const categories = [...new Set((candidates || []).map((item) => item.categoryId))]
  if (preset?.moduleEldritch?.enabled) {
    const invalid = categories.filter((id) => !ELDRITCH_CATEGORIES.has(id))
    if (invalid.length) return { valid: false, error: `古灵隐式制作不支持类别：${invalid.join('、')}` }
  }
  if (preset?.moduleThree?.enabled) {
    const invalid = categories.filter((id) => !SOCKET_CATEGORIES.has(id))
    if (invalid.length) return { valid: false, error: `插槽制作不支持类别：${invalid.join('、')}` }
  }
  return { valid: true, error: '' }
}

export function validateBatchInventoryLayout(candidates, inventory) {
  const rows = 5
  const nativeColumns = 12
  const configured = [inventory?.startPos?.x, inventory?.startPos?.y, inventory?.slotSize?.w, inventory?.slotSize?.h]
    .every((value) => Number.isFinite(Number(value)) && Number(value) > 0)
  if (!configured) return { valid: false, error: '请先配置背包网格' }
  for (const item of candidates || []) {
    if (item.x < 0 || item.x + item.width > nativeColumns || item.y < 0 || item.y + item.height > rows) {
      return { valid: false, error: `${item.displayName || item.baseType} 的格子超出当前背包布局` }
    }
  }
  return { valid: true, error: '' }
}

export function inventoryItemPosition(item, inventory) {
  return {
    x: Math.round(Number(inventory.startPos.x) + Number(item.x) * Number(inventory.slotSize.w)),
    y: Math.round(Number(inventory.startPos.y) + Number(item.y) * Number(inventory.slotSize.h))
  }
}

function stableFingerprint(value) {
  let hash = 2166136261
  for (const character of JSON.stringify(value)) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function freezeBatchConfiguration({ snapshot, categoryIds, preset, inventory, batchId }) {
  if (!snapshot?.scanId || !Array.isArray(snapshot.items)) return { valid: false, error: '请先扫描角色背包' }
  const selected = new Set((categoryIds || []).map(String))
  if (!selected.size) return { valid: false, error: '请至少选择一个物品类别' }
  const candidates = snapshot.items
    .filter((item) => item.selectable !== false && selected.has(item.categoryId))
    .sort((left, right) => left.x - right.x || left.y - right.y || left.id.localeCompare(right.id))
  if (!candidates.length) return { valid: false, error: '所选类别在当前背包快照中没有待制作物品' }
  const compatibility = validateBatchCategoryCompatibility(preset, candidates)
  if (!compatibility.valid) return compatibility
  const layoutCheck = validateBatchInventoryLayout(candidates, inventory)
  if (!layoutCheck.valid) return layoutCheck
  const targets = candidates.map((item) => ({
    id: String(item.id), categoryId: String(item.categoryId), baseType: String(item.baseType),
    displayName: String(item.displayName || item.baseType), x: Number(item.x), y: Number(item.y),
    width: Number(item.width), height: Number(item.height),
    footprintSource: String(item.footprintSource || ''),
    position: inventoryItemPosition(item, inventory)
  }))
  const fingerprint = stableFingerprint({ scanId: snapshot.scanId, targets })
  return {
    valid: true,
    config: {
      enabled: true,
      batchId: String(batchId || globalThis.crypto?.randomUUID?.() || `batch-${Date.now()}`),
      scanId: String(snapshot.scanId),
      snapshotFingerprint: fingerprint,
      completedIds: [],
      targets
    }
  }
}

export function restoreBatchConfiguration({ checkpoint, preset, inventory }) {
  const targets = Array.isArray(checkpoint?.targets) ? checkpoint.targets : []
  const completedIds = [...new Set((Array.isArray(checkpoint?.completedIds) ? checkpoint.completedIds : []).map(String))]
  const ids = targets.map(item => String(item?.id || ''))
  const idSet = new Set(ids)
  if (!checkpoint?.recoverable || !checkpoint.batchId || !checkpoint.scanId || !checkpoint.snapshotFingerprint) {
    return { valid: false, error: '当前批次没有有效的恢复检查点' }
  }
  if (!targets.length || ids.some(id => !id) || idSet.size !== ids.length) {
    return { valid: false, error: '批量恢复目标无效或存在重复' }
  }
  if (completedIds.some(id => !idSet.has(id)) || completedIds.length >= targets.length) {
    return { valid: false, error: '批量恢复完成进度无效' }
  }
  const compatibility = validateBatchCategoryCompatibility(preset, targets)
  if (!compatibility.valid) return compatibility
  const layoutCheck = validateBatchInventoryLayout(targets, inventory)
  if (!layoutCheck.valid) return layoutCheck
  const restoredTargets = targets.map(item => ({
    id: String(item.id),
    categoryId: String(item.categoryId),
    baseType: String(item.baseType),
    displayName: String(item.displayName || item.baseType),
    x: Number(item.x),
    y: Number(item.y),
    width: Number(item.width),
    height: Number(item.height),
    footprintSource: String(item.footprintSource || ''),
    position: inventoryItemPosition(item, inventory)
  }))
  return {
    valid: true,
    config: {
      enabled: true,
      recovering: true,
      batchId: String(checkpoint.batchId),
      scanId: String(checkpoint.scanId),
      snapshotFingerprint: String(checkpoint.snapshotFingerprint),
      completedIds,
      targets: restoredTargets
    }
  }
}
