export function shouldShowMapTrackerOverlay(snapshot) {
  return Boolean(snapshot?.foreground && snapshot?.settings?.enabled && snapshot?.settings?.overlay?.enabled !== false)
}

export function defaultMapTrackerOverlayBounds(workArea, size = { width: 240, height: 88 }) {
  return { ...size, x: workArea.x + workArea.width - size.width - 24, y: workArea.y + 24 }
}
