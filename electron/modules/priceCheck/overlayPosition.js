const CURSOR_OFFSET = 18
const ANCHOR_RADIUS = 64

export function getPriceCheckOverlayBounds(cursor, workArea, width, height) {
  const minX = workArea.x
  const minY = workArea.y
  const maxX = workArea.x + workArea.width - width
  const maxY = workArea.y + workArea.height - height
  const preferredX = cursor.x + CURSOR_OFFSET
  const preferredY = cursor.y + CURSOR_OFFSET
  const flippedX = cursor.x - width - CURSOR_OFFSET
  const flippedY = cursor.y - height - CURSOR_OFFSET
  return {
    x: Math.round(Math.max(minX, Math.min(
      preferredX + width <= workArea.x + workArea.width ? preferredX : flippedX,
      maxX
    ))),
    y: Math.round(Math.max(minY, Math.min(
      preferredY + height <= workArea.y + workArea.height ? preferredY : flippedY,
      maxY
    ))),
    width,
    height
  }
}

export function cursorInsideBounds(cursor, bounds) {
  return cursor.x >= bounds.x &&
    cursor.x <= bounds.x + bounds.width &&
    cursor.y >= bounds.y &&
    cursor.y <= bounds.y + bounds.height
}

export function hasLeftPriceCheckIntent(cursor, anchor, bounds, enteredWindow = false) {
  if (cursorInsideBounds(cursor, bounds)) return false
  if (enteredWindow) return true
  const deltaX = cursor.x - anchor.x
  const deltaY = cursor.y - anchor.y
  return deltaX * deltaX + deltaY * deltaY > ANCHOR_RADIUS * ANCHOR_RADIUS
}
