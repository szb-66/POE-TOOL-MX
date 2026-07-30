import { access } from 'node:fs/promises'
import { constants } from 'node:fs'
import os from 'node:os'

const SUPPORTED_SCALE_FACTORS = new Set([1, 1.25, 1.5, 2])

function item(id, label, status, text, details = {}) {
  return { id, label, status, text, ...details }
}

export function evaluateWindowsSupport({
  platform = process.platform,
  arch = process.arch,
  release = os.release()
} = {}) {
  if (platform !== 'win32') {
    return item('platform', '系统', 'error', '仅支持 Windows 10/11 x64', { platform, arch, release })
  }
  if (arch !== 'x64') {
    return item('platform', '系统', 'error', `不支持 ${arch} 架构，仅支持 x64`, { platform, arch, release })
  }
  const build = Number(String(release).split('.').at(-1))
  if (!Number.isFinite(build) || build < 10240) {
    return item('platform', '系统', 'error', `Windows 版本过旧（${release}）`, { platform, arch, release })
  }
  return item('platform', '系统', 'ready', `Windows x64 · ${release}`, { platform, arch, release })
}

export function evaluateDisplays(displays = []) {
  if (!displays.length) return item('displays', '显示器', 'error', '未检测到显示器', { count: 0 })
  const scaleFactors = displays.map((display) => Number(display?.scaleFactor) || 1)
  const unusual = scaleFactors.filter((scale) => !SUPPORTED_SCALE_FACTORS.has(scale))
  const hasNegativeCoordinates = displays.some((display) => (
    Number(display?.bounds?.x) < 0 || Number(display?.bounds?.y) < 0
  ))
  const summary = `${displays.length} 台 · ${scaleFactors.map((scale) => `${Math.round(scale * 100)}%`).join(' / ')}`
  return item(
    'displays',
    '显示器',
    unusual.length ? 'attention' : 'ready',
    unusual.length ? `${summary} · 建议重新校准非标准缩放` : summary,
    { count: displays.length, scaleFactors, hasNegativeCoordinates }
  )
}

export function evaluateNetworkInterfaces(interfaces = os.networkInterfaces()) {
  const activeCount = Object.values(interfaces || {})
    .flat()
    .filter((entry) => entry && !entry.internal && ['IPv4', 'IPv6', 4, 6].includes(entry.family))
    .length
  return activeCount
    ? item('network', '网络接口', 'ready', `已检测到 ${activeCount} 个可用接口`, { activeCount })
    : item('network', '网络接口', 'attention', '未检测到可用网络接口，在线功能可能不可用', { activeCount: 0 })
}

export function evaluateAdministrator(administrator) {
  if (administrator === true) return item('administrator', '管理员权限', 'ready', '已以管理员权限运行')
  if (administrator === false) return item('administrator', '管理员权限', 'attention', '未以管理员权限运行')
  return item('administrator', '管理员权限', 'attention', '无法确认管理员权限')
}

export function evaluateRuntime(runtime = {}) {
  return runtime.ready || runtime.found
    ? item('runtime', 'Python', 'ready', `${runtime.source || 'Python'} · ${runtime.version || '版本未知'}`)
    : item('runtime', 'Python', 'error', runtime.error || '内置 Python 运行时不可用')
}

export function evaluateGameWindow(gameDpi = {}) {
  return gameDpi.found
    ? item('game', '游戏窗口 / DPI', 'ready', `${gameDpi.dpi || '未知'} DPI · ${gameDpi.scaleFactor || 1}x`)
    : item('game', '游戏窗口 / DPI', 'attention', gameDpi.error || '未检测到游戏窗口')
}

export async function evaluateUserDataDirectory(userDataPath) {
  try {
    await access(userDataPath, constants.W_OK)
    return item('userData', '配置目录', 'ready', '用户数据目录可写')
  } catch {
    return item('userData', '配置目录', 'error', '用户数据目录不可写')
  }
}

export async function createStartupHealth({
  userDataPath,
  displays = [],
  runtime = {},
  gameDpi = {},
  administrator = null,
  platform = process.platform,
  arch = process.arch,
  release = os.release(),
  networkInterfaces = os.networkInterfaces()
} = {}) {
  return {
    checkedAt: new Date().toISOString(),
    items: [
      evaluateWindowsSupport({ platform, arch, release }),
      await evaluateUserDataDirectory(userDataPath),
      evaluateAdministrator(administrator),
      evaluateDisplays(displays),
      evaluateNetworkInterfaces(networkInterfaces),
      evaluateRuntime(runtime),
      evaluateGameWindow(gameDpi)
    ]
  }
}
