export const DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL = true
export const DEFAULT_STORY_OVERLAY_OPACITY = 100

export function normalizeStoryShowSkillRequiredLevel(value) {
  return typeof value === 'boolean' ? value : DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL
}

export function normalizeStoryOverlayOpacity(value) {
  const number = Number(value)
  return Number.isFinite(number)
    ? Math.max(0, Math.min(100, Math.round(number)))
    : DEFAULT_STORY_OVERLAY_OPACITY
}
