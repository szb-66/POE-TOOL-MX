export function toGlobalDipPoint(windowBounds, clientPoint) {
  return {
    x: Math.round(windowBounds.x + Number(clientPoint.x || 0)),
    y: Math.round(windowBounds.y + Number(clientPoint.y || 0))
  }
}

export const MIN_REGION_SIZE = Object.freeze({ width: 20, height: 10 })
export const TEMPLATE_SEARCH_MARGIN = 12

function finite(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function normalizeRectangle(start, end) {
  const startX = finite(start?.x)
  const startY = finite(start?.y)
  const endX = finite(end?.x)
  const endY = finite(end?.y)
  return {
    left: Math.min(startX, endX),
    top: Math.min(startY, endY),
    right: Math.max(startX, endX),
    bottom: Math.max(startY, endY)
  }
}

export function clampRectangle(rectangle, bounds) {
  const leftEdge = finite(bounds?.x ?? bounds?.left)
  const topEdge = finite(bounds?.y ?? bounds?.top)
  const rightEdge = finite(bounds?.right, leftEdge + finite(bounds?.width))
  const bottomEdge = finite(bounds?.bottom, topEdge + finite(bounds?.height))
  const left = Math.max(leftEdge, Math.min(rightEdge, finite(rectangle?.left)))
  const top = Math.max(topEdge, Math.min(bottomEdge, finite(rectangle?.top)))
  const right = Math.max(leftEdge, Math.min(rightEdge, finite(rectangle?.right)))
  const bottom = Math.max(topEdge, Math.min(bottomEdge, finite(rectangle?.bottom)))
  return normalizeRectangle({ x: left, y: top }, { x: right, y: bottom })
}

export function getRectangleSize(rectangle) {
  return {
    width: Math.max(0, Math.round(finite(rectangle?.right) - finite(rectangle?.left))),
    height: Math.max(0, Math.round(finite(rectangle?.bottom) - finite(rectangle?.top)))
  }
}

export function isRegionLargeEnough(rectangle, minimum = MIN_REGION_SIZE) {
  const size = getRectangleSize(rectangle)
  return size.width >= minimum.width && size.height >= minimum.height
}

export function dipRectangleToPhysical(windowDipBounds, clientRectangle, dipToScreenPoint) {
  const topLeft = dipToScreenPoint(toGlobalDipPoint(windowDipBounds, {
    x: clientRectangle.left,
    y: clientRectangle.top
  }))
  const bottomRight = dipToScreenPoint(toGlobalDipPoint(windowDipBounds, {
    x: clientRectangle.right,
    y: clientRectangle.bottom
  }))
  return normalizeRectangle(topLeft, bottomRight)
}

export function getDisplayPhysicalBounds(display, platform, dipToScreenPoint = (point) => point) {
  const bounds = display?.bounds || {}
  const windows = platform === 'win32'
  const topLeft = windows
    ? dipToScreenPoint({ x: finite(bounds.x), y: finite(bounds.y) })
    : { x: finite(bounds.x), y: finite(bounds.y) }
  const scaleFactor = windows ? finite(display?.scaleFactor, 1) : 1
  return {
    x: finite(topLeft?.x),
    y: finite(topLeft?.y),
    width: Math.round(finite(bounds.width) * scaleFactor),
    height: Math.round(finite(bounds.height) * scaleFactor)
  }
}

export function expandSearchRegion(selectedRegion, displayPhysicalBounds, margin = TEMPLATE_SEARCH_MARGIN) {
  return clampRectangle({
    left: finite(selectedRegion?.left) - margin,
    top: finite(selectedRegion?.top) - margin,
    right: finite(selectedRegion?.right) + margin,
    bottom: finite(selectedRegion?.bottom) + margin
  }, displayPhysicalBounds)
}

export function physicalRectangleToImageCrop(selectedRegion, displayPhysicalBounds, imageSize) {
  const displayWidth = finite(displayPhysicalBounds?.width)
  const displayHeight = finite(displayPhysicalBounds?.height)
  const imageWidth = finite(imageSize?.width)
  const imageHeight = finite(imageSize?.height)
  if (displayWidth <= 0 || displayHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    throw new Error('截图或显示器尺寸无效')
  }
  const local = clampRectangle({
    left: finite(selectedRegion?.left) - finite(displayPhysicalBounds?.x),
    top: finite(selectedRegion?.top) - finite(displayPhysicalBounds?.y),
    right: finite(selectedRegion?.right) - finite(displayPhysicalBounds?.x),
    bottom: finite(selectedRegion?.bottom) - finite(displayPhysicalBounds?.y)
  }, { x: 0, y: 0, width: displayWidth, height: displayHeight })
  const scaleX = imageWidth / displayWidth
  const scaleY = imageHeight / displayHeight
  const x = Math.max(0, Math.floor(local.left * scaleX))
  const y = Math.max(0, Math.floor(local.top * scaleY))
  return {
    x,
    y,
    width: Math.max(1, Math.min(imageWidth - x, Math.ceil(local.right * scaleX) - x)),
    height: Math.max(1, Math.min(imageHeight - y, Math.ceil(local.bottom * scaleY) - y)),
    targetSize: getRectangleSize(local)
  }
}

export function hasUsefulPixelVariance(bitmap, minimumRange = 8) {
  if (!bitmap || bitmap.length < 4) return false
  let minimum = 255
  let maximum = 0
  const stride = Math.max(4, Math.floor(bitmap.length / 4096 / 4) * 4)
  for (let index = 0; index < bitmap.length; index += stride) {
    for (let channel = 0; channel < 3 && index + channel < bitmap.length; channel += 1) {
      const value = bitmap[index + channel]
      minimum = Math.min(minimum, value)
      maximum = Math.max(maximum, value)
    }
  }
  return maximum - minimum >= minimumRange
}
