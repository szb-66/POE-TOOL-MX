export const STORY_GRIP_WIDTH = 52
export const STORY_GRIP_HEIGHT = 20
export const STORY_GRIP_TOP = 4
export const STORY_DIVIDER_GRIP_WIDTH = 14
export const DEFAULT_STORY_DIVIDER_RATIO = 0.64
export const MIN_STORY_DIVIDER_RATIO = 0.4
export const MAX_STORY_DIVIDER_RATIO = 0.75

export const STORY_GRIP_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{width:100%;height:100%;margin:0;overflow:hidden;background:transparent}
body{-webkit-app-region:drag;display:flex;align-items:center;justify-content:center;cursor:move;user-select:none}
.grip{width:46px;height:16px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:5px;border:1px solid rgba(169,199,255,.86);border-radius:9px;background:rgba(42,63,96,.96);box-shadow:0 2px 8px rgba(0,0,0,.48)}
.grip i{width:4px;height:4px;border-radius:50%;background:#d9e7ff;box-shadow:0 0 4px rgba(169,199,255,.9)}
</style></head><body title="拖动剧情浮窗"><div class="grip"><i></i><i></i><i></i></div></body></html>`

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

export const getStoryGripBounds = (overlayBounds) => {
  return {
    x: Math.round(overlayBounds.x + (overlayBounds.width - STORY_GRIP_WIDTH) / 2),
    y: Math.round(overlayBounds.y + STORY_GRIP_TOP),
    width: STORY_GRIP_WIDTH,
    height: STORY_GRIP_HEIGHT
  }
}

export const getStoryOverlayPositionFromGrip = (gripBounds, overlayBounds) => {
  return {
    x: Math.round(gripBounds.x - (overlayBounds.width - STORY_GRIP_WIDTH) / 2),
    y: Math.round(gripBounds.y - STORY_GRIP_TOP)
  }
}

export const getStoryOverlayBoundsFromGrip = (gripBounds, overlayBounds, canonicalSize) => {
  return {
    ...getStoryOverlayPositionFromGrip(gripBounds, { ...overlayBounds, ...canonicalSize }),
    ...canonicalSize
  }
}
