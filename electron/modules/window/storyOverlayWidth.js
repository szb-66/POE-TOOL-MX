export const STORY_TIMER_COLUMN_WIDTH = 120
export const STORY_TIMER_ONLY_WIDTH = 160

export function getStoryOverlayRequestedWidth(snapshot = {}, contentWidth = 460) {
  const storyEnabled = snapshot?.modules?.story !== false
  const skillsEnabled = snapshot?.modules?.skills !== false
  const timerEnabled = snapshot?.timer?.enabled === true
  if (!storyEnabled && !skillsEnabled) return timerEnabled ? STORY_TIMER_ONLY_WIDTH : contentWidth
  return contentWidth + (timerEnabled ? STORY_TIMER_COLUMN_WIDTH : 0)
}
