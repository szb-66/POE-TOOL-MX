import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const runFile = promisify(execFile)
export const STEAM_POE_APP_ID = '238960'

export function parseValveKeyValues(text) {
  const tokens = String(text).match(/"(?:\\.|[^"\\])*"|[{}]/g) || []
  let position = 0
  const unquote = token => token.slice(1, -1).replace(/\\([\\"])/g, '$1')
  const read = nested => {
    const result = Object.create(null)
    while (position < tokens.length) {
      const key = tokens[position++]
      if (key === '}') { if (!nested) throw new Error('Steam 清单结构无效'); return result }
      if (!key.startsWith('"')) throw new Error('Steam 清单键无效')
      const value = tokens[position++]
      if (!value || value === '}') throw new Error('Steam 清单值缺失')
      result[unquote(key)] = value === '{' ? read(true) : unquote(value)
    }
    if (nested) throw new Error('Steam 清单未闭合')
    return result
  }
  return read(false)
}

export function inspectSteamGame(gameDirectory, { readFile = fs.readFileSync, exists = fs.existsSync } = {}) {
  if (typeof gameDirectory !== 'string' || !path.isAbsolute(gameDirectory)) throw new Error('请选择有效的 Steam 游戏安装目录')
  const gameRoot = path.resolve(gameDirectory)
  const steamapps = path.resolve(gameRoot, '..', '..')
  if (path.basename(path.dirname(gameRoot)).toLowerCase() !== 'common' || path.basename(steamapps).toLowerCase() !== 'steamapps') throw new Error('请选择 Steam steamapps/common 下的 Path of Exile 安装目录')
  const manifestPath = path.join(steamapps, `appmanifest_${STEAM_POE_APP_ID}.acf`)
  const app = parseValveKeyValues(readFile(manifestPath, 'utf8')).AppState
  if (!app || app.appid !== STEAM_POE_APP_ID || !app.installdir || path.resolve(steamapps, 'common', app.installdir).toLowerCase() !== gameRoot.toLowerCase()) throw new Error('该目录与 Steam 的流放之路安装清单不一致')
  if (!/^\d+$/.test(app.buildid || '')) throw new Error('无法确定 Steam 游戏版本')
  const indexPath = path.join(gameRoot, 'Bundles2', '_.index.bin')
  if (!exists(indexPath) || !exists(path.join(gameRoot, 'PathOfExileSteam.exe'))) throw new Error('Steam 国际服游戏资源不完整')
  return { gameDirectory: gameRoot, indexPath, manifestPath, buildId: app.buildid, stateFlags: Number(app.StateFlags), appId: STEAM_POE_APP_ID }
}

export async function discoverSteamGames({ platform = process.platform, execFileImpl = runFile, exists = fs.existsSync, readFile = fs.readFileSync } = {}) {
  if (platform !== 'win32') return []
  const roots = new Set()
  for (const key of ['HKCU\\Software\\Valve\\Steam', 'HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam']) {
    try {
      const { stdout } = await execFileImpl('reg.exe', ['query', key], { windowsHide: true, timeout: 5000 })
      for (const line of stdout.split(/\r?\n/)) {
        const match = line.match(/^\s*(?:SteamPath|InstallPath)\s+REG_SZ\s+(.+?)\s*$/i)
        if (match) roots.add(path.resolve(match[1]))
      }
    } catch { /* 另一注册表位置可能仍有效 */ }
  }
  const libraries = new Set(roots)
  for (const root of roots) {
    try {
      const folders = parseValveKeyValues(readFile(path.join(root, 'steamapps', 'libraryfolders.vdf'), 'utf8')).libraryfolders
      for (const folder of Object.values(folders || {})) if (folder?.path) libraries.add(path.resolve(folder.path))
    } catch { /* 单个库配置失败，不推断未知目录 */ }
  }
  const games = []
  for (const library of libraries) {
    try {
      const file = path.join(library, 'steamapps', `appmanifest_${STEAM_POE_APP_ID}.acf`)
      if (!exists(file)) continue
      const app = parseValveKeyValues(readFile(file, 'utf8')).AppState
      games.push(inspectSteamGame(path.join(library, 'steamapps', 'common', app.installdir), { readFile, exists }))
    } catch { /* 页面仍允许用户明确选择并显示扫描错误 */ }
  }
  return [...new Map(games.map(game => [game.gameDirectory.toLowerCase(), game])).values()]
}

export async function probeGameProcesses({ execFileImpl = runFile } = {}) {
  try {
    const command = "$ErrorActionPreference='Stop'; [Console]::OutputEncoding=[System.Text.Encoding]::UTF8; $items=@(Get-CimInstance Win32_Process -Filter \"Name LIKE 'PathOfExile%'\" | Select-Object Name,ProcessId); ConvertTo-Json -InputObject $items -Compress"
    const { stdout } = await execFileImpl('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { windowsHide: true, timeout: 10000 })
    const items = JSON.parse(stdout)
    if (!Array.isArray(items) || items.some(item => !Number.isInteger(item?.ProcessId) || !/^PathOfExile.*\.exe$/i.test(item?.Name || ''))) return null
    return items.map(item => item.ProcessId)
  } catch { return null }
}

export async function assertSteamWritable(gameDirectory, { platform = process.platform, processProbe = probeGameProcesses, inspect = inspectSteamGame, exists = fs.existsSync } = {}) {
  if (platform !== 'win32') throw new Error('游戏汉化仅支持 Windows x64 Steam 国际服')
  const game = inspect(gameDirectory)
  const processes = await processProbe()
  if (!Array.isArray(processes)) throw new Error('无法确认游戏进程状态，请重试；未修改游戏文件')
  if (processes.length) throw new Error('请先完全退出流放之路再应用或还原汉化')
  if (game.stateFlags !== 4) throw new Error('Steam 正在更新、验证或游戏安装状态不明，请等待完成')
  const steamapps = path.dirname(game.manifestPath)
  if (exists(path.join(steamapps, 'downloading', STEAM_POE_APP_ID)) || exists(path.join(steamapps, 'temp', STEAM_POE_APP_ID))) throw new Error('检测到 Steam 更新暂存目录，请等待更新完成')
  return game
}
