export const STORY_GRIP_WIDTH = 52
export const STORY_GRIP_HEIGHT = 20
export const STORY_GRIP_TOP = 4

export const STORY_GRIP_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{width:100%;height:100%;margin:0;overflow:hidden;background:transparent}
body{-webkit-app-region:drag;display:flex;align-items:center;justify-content:center;cursor:move;user-select:none}
.grip{width:46px;height:16px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:5px;border:1px solid rgba(169,199,255,.86);border-radius:9px;background:rgba(42,63,96,.96);box-shadow:0 2px 8px rgba(0,0,0,.48)}
.grip i{width:4px;height:4px;border-radius:50%;background:#d9e7ff;box-shadow:0 0 4px rgba(169,199,255,.9)}
</style></head><body title="拖动剧情浮窗"><div class="grip"><i></i><i></i><i></i></div></body></html>`

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
