export const DEFAULT_GAME_WINDOW_TITLES = Object.freeze(['流放之路', 'Path of Exile'])

export function validateGameWindowTitles(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return { valid: false, titles: [], error: '至少需要保留一个游戏窗口名称' }
  }

  const titles = []
  const seen = new Set()
  for (const entry of value) {
    const title = String(entry ?? '').trim()
    if (!title) return { valid: false, titles: [], error: '游戏窗口名称不能为空' }
    const key = title.toLocaleLowerCase()
    if (seen.has(key)) return { valid: false, titles: [], error: `游戏窗口名称“${title}”重复` }
    seen.add(key)
    titles.push(title)
  }
  return { valid: true, titles, error: '' }
}

export function normalizeGameWindowTitles(value) {
  const result = validateGameWindowTitles(value)
  return result.valid ? result.titles : [...DEFAULT_GAME_WINDOW_TITLES]
}

export function gameWindowTitlePriority(title, configuredTitles = DEFAULT_GAME_WINDOW_TITLES) {
  const normalizedTitle = String(title || '').trim().toLocaleLowerCase()
  if (!normalizedTitle) return -1
  const titles = normalizeGameWindowTitles(configuredTitles)
  return titles.findIndex(expected => normalizedTitle.includes(expected.toLocaleLowerCase()))
}

export function isGameWindowTitle(title, configuredTitles = DEFAULT_GAME_WINDOW_TITLES) {
  return gameWindowTitlePriority(title, configuredTitles) >= 0
}
