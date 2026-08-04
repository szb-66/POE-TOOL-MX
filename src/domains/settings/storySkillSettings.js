export const DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL = true
export const DEFAULT_STORY_OVERLAY_OPACITY = 100
export const DEFAULT_STORY_OVERLAY_WIDTH = 460
export const MIN_STORY_OVERLAY_WIDTH = 320
export const MAX_STORY_OVERLAY_WIDTH = 1200
export const STORY_OVERLAY_LAYOUT_VERSION = 1
const LEGACY_STORY_OVERLAY_WIDTH = 560

export function normalizeStoryShowSkillRequiredLevel(value) {
  return typeof value === 'boolean' ? value : DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL
}

export function normalizeStoryOverlayOpacity(value) {
  const number = Number(value)
  return Number.isFinite(number)
    ? Math.max(0, Math.min(100, Math.round(number)))
    : DEFAULT_STORY_OVERLAY_OPACITY
}

export function normalizeStoryOverlayWidth(value) {
  const number = Number(value)
  return Number.isFinite(number)
    ? Math.max(MIN_STORY_OVERLAY_WIDTH, Math.min(MAX_STORY_OVERLAY_WIDTH, Math.round(number)))
    : DEFAULT_STORY_OVERLAY_WIDTH
}

export function migrateStoryOverlayLayout({ width, layoutVersion } = {}) {
  const normalizedWidth = normalizeStoryOverlayWidth(width)
  if (Number(layoutVersion) >= STORY_OVERLAY_LAYOUT_VERSION) {
    return { width: normalizedWidth, layoutVersion: STORY_OVERLAY_LAYOUT_VERSION, migrated: false }
  }
  return {
    width: Number(width) === LEGACY_STORY_OVERLAY_WIDTH ? DEFAULT_STORY_OVERLAY_WIDTH : normalizedWidth,
    layoutVersion: STORY_OVERLAY_LAYOUT_VERSION,
    migrated: true
  }
}
