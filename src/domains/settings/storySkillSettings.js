export const DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL = true

export function normalizeStoryShowSkillRequiredLevel(value) {
  return typeof value === 'boolean' ? value : DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL
}
