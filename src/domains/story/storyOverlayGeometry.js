const LAYOUT_KEYS = ['left', 'top', 'width', 'height']

function normalizeLayout(layout = {}) {
  return {
    stacked: Boolean(layout.stacked),
    left: Number(layout.left) || 0,
    top: Number(layout.top) || 0,
    width: Number(layout.width) || 0,
    height: Number(layout.height) || 0
  }
}

export function storyOverlayLayoutsEqual(first, second) {
  if (!first || !second || first.stacked !== second.stacked) return false
  return LAYOUT_KEYS.every(key => first[key] === second[key])
}

export function createStoryOverlayGeometryReporter({ resize, updateLayout }) {
  let lastHeight = null
  let lastLayout = null

  return ({ height, layout }) => {
    const nextHeight = Math.round(Number(height))
    if (Number.isFinite(nextHeight) && nextHeight > 0 && nextHeight !== lastHeight) {
      lastHeight = nextHeight
      resize(nextHeight)
    }

    if (!layout) return
    const nextLayout = normalizeLayout(layout)
    if (storyOverlayLayoutsEqual(lastLayout, nextLayout)) return
    lastLayout = nextLayout
    updateLayout(nextLayout)
  }
}
