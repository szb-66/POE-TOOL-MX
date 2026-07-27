export const BAG_OVERLAY_SIZE = Object.freeze({ width: 188, height: 64 })

function intersectsWorkArea(bounds, workArea) {
  return bounds.x + bounds.width > workArea.x &&
    bounds.x < workArea.x + workArea.width &&
    bounds.y + bounds.height > workArea.y &&
    bounds.y < workArea.y + workArea.height
}

export function getBagOverlayBounds(savedBounds, displays, size = BAG_OVERLAY_SIZE) {
  const width = Math.round(size.width)
  const height = Math.round(size.height)
  const normalizedSaved = savedBounds && {
    x: Math.round(Number(savedBounds.x)),
    y: Math.round(Number(savedBounds.y)),
    width,
    height
  }
  if (normalizedSaved && Number.isFinite(normalizedSaved.x) && Number.isFinite(normalizedSaved.y) &&
      displays.some((display) => intersectsWorkArea(normalizedSaved, display.workArea))) {
    return normalizedSaved
  }

  const primary = displays.find((display) => display.primary) || displays[0]
  const workArea = primary?.workArea || { x: 0, y: 0, width: 1920, height: 1080 }
  return {
    x: Math.round(workArea.x + workArea.width - width - 24),
    y: Math.round(workArea.y + workArea.height / 2 - height / 2),
    width,
    height
  }
}
