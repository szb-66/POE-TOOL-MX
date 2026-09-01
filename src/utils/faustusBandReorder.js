function cloneBands(bands) {
  return Array.isArray(bands) ? bands.map(band => ({ ...band })) : []
}

export function reorderFaustusBands(bands, draggedBandId, targetBandId) {
  const next = cloneBands(bands)
  const from = next.findIndex(band => band.id === draggedBandId)
  const target = next.findIndex(band => band.id === targetBandId)
  if (from < 0 || target < 0 || from === target) return null
  const [dragged] = next.splice(from, 1)
  next.splice(target, 0, dragged)
  return next
}

export function moveFaustusBand(bands, index, offset) {
  const next = cloneBands(bands)
  const target = index + offset
  if (index < 0 || index >= next.length || target < 0 || target >= next.length) return null
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

export function createFaustusBandReorderTransaction({ getBands, preview, commit, locked }) {
  let snapshot = null
  let draggedBandId = ''

  function reset() {
    snapshot = null
    draggedBandId = ''
  }

  return {
    begin(bandId) {
      if (locked() || snapshot || !getBands().some(band => band.id === bandId)) return false
      snapshot = cloneBands(getBands())
      draggedBandId = bandId
      return true
    },

    preview(targetBandId) {
      if (locked() || !snapshot) return false
      const bands = reorderFaustusBands(getBands(), draggedBandId, targetBandId)
      if (!bands) return false
      preview(bands)
      return true
    },

    commit() {
      if (!snapshot) return false
      const bands = cloneBands(getBands())
      reset()
      commit(bands)
      return true
    },

    cancel() {
      if (!snapshot) return false
      const bands = snapshot
      reset()
      preview(bands)
      return true
    }
  }
}
