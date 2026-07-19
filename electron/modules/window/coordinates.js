export function toGlobalDipPoint(windowBounds, clientPoint) {
  return {
    x: Math.round(windowBounds.x + Number(clientPoint.x || 0)),
    y: Math.round(windowBounds.y + Number(clientPoint.y || 0))
  }
}
