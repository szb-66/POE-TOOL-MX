export const DEFAULT_GAME_WINDOW_TITLES = Object.freeze(['流放之路', 'Path of Exile'])

export const DEFAULT_GAME_WINDOW_PROCESS_NAMES = Object.freeze([
  'PathOfExile.exe',
  'PathOfExile_x64.exe',
  'PathOfExileSteam.exe',
  'PathOfExile_x64Steam.exe'
])

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

export function validateGameWindowProcessNames(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return { valid: false, processNames: [], error: '至少需要保留一个游戏客户端进程名' }
  }

  const processNames = []
  const seen = new Set()
  for (const entry of value) {
    const processName = String(entry ?? '').trim()
    if (!processName) return { valid: false, processNames: [], error: '游戏客户端进程名不能为空' }
    const key = processName.toLocaleLowerCase()
    if (seen.has(key)) return { valid: false, processNames: [], error: `游戏客户端进程名“${processName}”重复` }
    seen.add(key)
    processNames.push(processName)
  }
  return { valid: true, processNames, error: '' }
}

export function normalizeGameWindowTitles(value) {
  const result = validateGameWindowTitles(value)
  return result.valid ? result.titles : [...DEFAULT_GAME_WINDOW_TITLES]
}

export function normalizeGameWindowProcessNames(value) {
  const result = validateGameWindowProcessNames(value)
  return result.valid ? result.processNames : [...DEFAULT_GAME_WINDOW_PROCESS_NAMES]
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

export function isGameWindowProcessName(processName, configuredProcessNames = DEFAULT_GAME_WINDOW_PROCESS_NAMES) {
  const normalized = String(processName || '').trim().toLocaleLowerCase().split(/[\\/]/).pop() || ''
  if (!normalized) return false
  return normalizeGameWindowProcessNames(configuredProcessNames)
    .some(expected => normalized === String(expected).trim().toLocaleLowerCase())
}

export function isGameWindowCandidate(
  title,
  processName,
  configuredTitles = DEFAULT_GAME_WINDOW_TITLES,
  configuredProcessNames = DEFAULT_GAME_WINDOW_PROCESS_NAMES
) {
  return isGameWindowTitle(title, configuredTitles) && isGameWindowProcessName(processName, configuredProcessNames)
}
