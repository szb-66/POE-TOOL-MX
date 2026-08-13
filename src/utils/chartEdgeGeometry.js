// 大海图 3×3 外边缘 12 段的屏幕目标点计算。
// 每段目标点 = 段中点向外部偏移 offsetPx 像素,超出屏幕边界时钳制。
export const BORDER_EDGE_IDS = Object.freeze([
  'N0', 'N1', 'N2',
  'E0', 'E1', 'E2',
  'S0', 'S1', 'S2',
  'W0', 'W1', 'W2'
])

export const DEFAULT_EDGE_OFFSET_PX = 50

function finite(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export function computeBorderEdgeTargets(region, offsetPx = DEFAULT_EDGE_OFFSET_PX, screenBounds = null) {
  const left = finite(region?.left)
  const top = finite(region?.top)
  const width = finite(region?.right) - left
  const height = finite(region?.bottom) - top
  if (!(width > 0) || !(height > 0)) return []
  const offset = Math.max(0, finite(offsetPx))
  const bounds = screenBounds?.width > 0 && screenBounds?.height > 0
    ? {
        minX: finite(screenBounds.x ?? screenBounds.left),
        minY: finite(screenBounds.y ?? screenBounds.top),
        maxX: finite(screenBounds.x ?? screenBounds.left) + finite(screenBounds.width) - 1,
        maxY: finite(screenBounds.y ?? screenBounds.top) + finite(screenBounds.height) - 1
      }
    : null
  const clamp = (x, y) => bounds
    ? {
        x: Math.round(Math.min(bounds.maxX, Math.max(bounds.minX, x))),
        y: Math.round(Math.min(bounds.maxY, Math.max(bounds.minY, y)))
      }
    : { x: Math.round(x), y: Math.round(y) }
  const segmentCenter = index => Math.round(top + (index + 0.5) * height / 3)
  const edges = []
  for (let index = 0; index < 3; index++) {
    const x = left + (index + 0.5) * width / 3
    edges.push({ id: `N${index}`, direction: 'north', ...clamp(x, top - offset) })
  }
  for (let index = 0; index < 3; index++) {
    edges.push({ id: `E${index}`, direction: 'east', ...clamp(left + width + offset, segmentCenter(index)) })
  }
  for (let index = 0; index < 3; index++) {
    const x = left + (index + 0.5) * width / 3
    edges.push({ id: `S${index}`, direction: 'south', ...clamp(x, top + height + offset) })
  }
  for (let index = 0; index < 3; index++) {
    edges.push({ id: `W${index}`, direction: 'west', ...clamp(left - offset, segmentCenter(index)) })
  }
  return edges
}
