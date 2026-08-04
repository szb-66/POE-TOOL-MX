export const STORY_DIVIDER_GRIP_WIDTH = 14
export const DEFAULT_STORY_DIVIDER_RATIO = 0.64
export const MIN_STORY_DIVIDER_RATIO = 0.4
export const MAX_STORY_DIVIDER_RATIO = 0.75

export const STORY_DIVIDER_GRIP_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{width:100%;height:100%;margin:0;overflow:hidden;background:transparent}
body{-webkit-app-region:drag;display:flex;align-items:stretch;justify-content:center;cursor:col-resize;user-select:none}
.line{width:3px;height:100%;border-radius:2px;background:rgba(169,199,255,.72);box-shadow:0 0 6px rgba(109,158,255,.65)}
</style></head><body title="拖动调整剧情与技能栏宽"><div class="line"></div></body></html>`

export function normalizeStoryDividerRatio(value) {
  const ratio = Number(value)
  if (!Number.isFinite(ratio)) return DEFAULT_STORY_DIVIDER_RATIO
  return Math.max(MIN_STORY_DIVIDER_RATIO, Math.min(MAX_STORY_DIVIDER_RATIO, ratio))
}

export function getStoryDividerGripBounds(overlayBounds, layout, ratio) {
  if (!layout || layout.stacked || layout.width <= 0 || layout.height <= 0) return null
  const normalized = normalizeStoryDividerRatio(ratio)
  return {
    x: Math.round(overlayBounds.x + layout.left + layout.width * normalized - STORY_DIVIDER_GRIP_WIDTH / 2),
    y: Math.round(overlayBounds.y + layout.top),
    width: STORY_DIVIDER_GRIP_WIDTH,
    height: Math.max(1, Math.round(layout.height))
  }
}

export function getStoryDividerRatioFromGrip(gripBounds, overlayBounds, layout) {
  if (!layout || layout.width <= 0) return DEFAULT_STORY_DIVIDER_RATIO
  const centerX = gripBounds.x + STORY_DIVIDER_GRIP_WIDTH / 2
  return normalizeStoryDividerRatio((centerX - overlayBounds.x - layout.left) / layout.width)
}

export function storyOverlayBoundsEqual(first, second) {
  return first.x === second.x && first.y === second.y &&
    first.width === second.width && first.height === second.height
}
