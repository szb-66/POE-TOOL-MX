import { DEFAULT_GAME_WINDOW_PROCESS_NAMES, isGameWindowProcessName } from './gameWindowTitles.js'
import { getServer, requireServerId } from './serverMode.js'

const INTERNATIONAL_ONLY_PROCESSES = new Set([
  'pathofexilesteam.exe',
  'pathofexile_x64steam.exe',
  'pathofexileegs.exe',
  'pathofexile_x64egs.exe'
])

const CN_PATH_PATTERNS = [
  /(?:^|[\\/])wegame(?:apps)?(?:[\\/]|$)/i,
  /(?:^|[\\/])rail_apps(?:[\\/]|$)/i,
  /(?:^|[\\/])tencent(?:[\\/]|$)/i,
  /(?:^|[\\/])tgp(?:[\\/]|$)/i,
  /流放之路/
]

const INTERNATIONAL_PATH_PATTERNS = [
  /(?:^|[\\/])steamapps(?:[\\/]|$)/i,
  /(?:^|[\\/])epic games(?:[\\/]|$)/i,
  /(?:^|[\\/])grinding gear games(?:[\\/]|$)/i
]

function normalizeProcessName(value) {
  return String(value || '').trim().toLocaleLowerCase().split(/[\\/]/).pop() || ''
}

/**
 * 根据运行中游戏窗口的进程名、窗口标题和可执行文件路径，推断其所属服务器版本。
 * 仅对已确认是《流放之路》客户端进程的窗口进行判定，无法确认时返回 null 以避免误报。
 */
export function inferGameWindowServer(candidate, {
  processNames = DEFAULT_GAME_WINDOW_PROCESS_NAMES
} = {}) {
  if (!candidate || typeof candidate !== 'object') return null
  const mergedProcesses = [...new Set([
    ...DEFAULT_GAME_WINDOW_PROCESS_NAMES,
    ...(Array.isArray(processNames) ? processNames : [])
  ])]
  const processName = normalizeProcessName(candidate.processName || candidate.executablePath)
  if (!isGameWindowProcessName(processName, mergedProcesses)) return null

  const title = String(candidate.title || '').trim()
  const lowerTitle = title.toLocaleLowerCase()
  const executablePath = String(candidate.executablePath || '').trim()

  if (INTERNATIONAL_ONLY_PROCESSES.has(processName)) return 'international'
  if (title.includes('流放之路')) return 'cn'
  if (executablePath) {
    if (CN_PATH_PATTERNS.some(pattern => pattern.test(executablePath))) return 'cn'
    if (INTERNATIONAL_PATH_PATTERNS.some(pattern => pattern.test(executablePath))) return 'international'
  }
  if (lowerTitle.includes('path of exile')) return 'international'
  return null
}

export function createEmptyGameServerMismatch(currentServerId = 'cn') {
  const current = getServer(requireServerId(currentServerId))
  return {
    mismatch: false,
    currentServerId: current.id,
    currentServerLabel: current.label,
    detectedServerId: null,
    detectedServerLabel: '',
    windowTitle: '',
    processName: '',
    message: ''
  }
}

/**
 * 检测运行中的《流放之路》客户端是否与当前助手服务器模式不一致。
 * 若同时存在与当前助手模式匹配的客户端窗口（例如双开），视为匹配正常，不误报。
 */
export function detectGameServerMismatch({
  candidates = [],
  currentServerId = 'cn',
  processNames = DEFAULT_GAME_WINDOW_PROCESS_NAMES
} = {}) {
  const current = getServer(requireServerId(currentServerId))
  const inferred = (Array.isArray(candidates) ? candidates : [])
    .map(candidate => {
      const serverId = inferGameWindowServer(candidate, { processNames })
      if (!serverId) return null
      return {
        serverId,
        title: String(candidate?.title || '').trim(),
        processName: String(candidate?.processName || '').trim(),
        minimized: Boolean(candidate?.minimized),
        foreground: Boolean(candidate?.foreground),
        area: Math.max(0, Number(candidate?.area) || 0)
      }
    })
    .filter(Boolean)

  if (inferred.length === 0) return createEmptyGameServerMismatch(current.id)
  if (inferred.some(entry => entry.serverId === current.id)) {
    return createEmptyGameServerMismatch(current.id)
  }

  const best = inferred.sort((left, right) => (
    Number(left.minimized) - Number(right.minimized)
    || Number(right.foreground) - Number(left.foreground)
    || right.area - left.area
  ))[0]
  const detected = getServer(best.serverId)
  return {
    mismatch: true,
    currentServerId: current.id,
    currentServerLabel: current.label,
    detectedServerId: detected.id,
    detectedServerLabel: detected.label,
    windowTitle: best.title,
    processName: best.processName,
    message: `检测到正在运行${detected.label}游戏客户端，当前助手为${current.label}模式`
  }
}
