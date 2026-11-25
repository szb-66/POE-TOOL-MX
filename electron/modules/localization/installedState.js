import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { inspectSteamGame } from './steam.js'

function ordinaryPath(filename) {
  for (let current = path.resolve(filename); ; current = path.dirname(current)) {
    if (fs.lstatSync(current).isSymbolicLink()) throw new Error('路径含链接')
    if (path.dirname(current) === current) break
  }
}
function identity(filename) {
  const info = fs.statSync(filename)
  if (!info.isFile()) throw new Error('文件类型无效')
  return [info.dev, info.ino, info.size, info.mtimeMs, info.ctimeMs].join(':')
}
function hashFile(filename) {
  const hash = createHash('sha256')
  const buffer = Buffer.allocUnsafe(1024 * 1024)
  const descriptor = fs.openSync(filename, 'r')
  try {
    let length
    while ((length = fs.readSync(descriptor, buffer, 0, buffer.length, null)) > 0) hash.update(buffer.subarray(0, length))
    return hash.digest('hex')
  } finally { fs.closeSync(descriptor) }
}

function directoryKey(directory) {
  let resolved = path.resolve(directory)
  if (process.platform !== 'win32') return resolved
  // Read the actual spelling on disk before applying the same ASCII case map as the helper.
  try { resolved = fs.realpathSync.native(resolved) } catch { /* An unavailable path is validated separately. */ }
  resolved = resolved.replace(/^\\\\\?\\UNC\\/i, '\\\\').replace(/^\\\\\?\\/, '')
  return path.resolve(resolved).replace(/[a-z]/g, unit => unit.toUpperCase())
}

export function localizationInstallationRoot(storageRoot, gameDirectory) {
  const key = createHash('sha256').update(directoryKey(gameDirectory)).digest('hex')
  return path.join(storageRoot, 'installations', key)
}

export function resolveInstalledLocalizationRoot(storageRoot, gameDirectory) {
  const scoped = localizationInstallationRoot(storageRoot, gameDirectory)
  if (fs.existsSync(scoped)) return scoped
  const marker = path.join(storageRoot, 'transaction-installation.json')
  if (!fs.existsSync(marker)) return storageRoot // The legacy record still needs its index hash verified.
  ordinaryPath(marker)
  if (fs.statSync(marker).size > 65536) throw new Error('旧版汉化事务目录记录无效')
  const owner = JSON.parse(fs.readFileSync(marker, 'utf8')).gameDirectory
  if (typeof owner !== 'string' || !path.isAbsolute(owner)) throw new Error('旧版汉化事务目录记录无效')
  return directoryKey(owner) === directoryKey(gameDirectory) ? storageRoot : scoped
}

// Local reads only: verify on startup, then reuse a hash while all file identities
// remain unchanged. A Steam update or external replacement invalidates the cache.
export function createInstalledLocalizationVerifier({ inspect = inspectSteamGame } = {}) {
  let memo = null
  return ({ storageRoot, gameDirectory, releaseId, allowTraditional = false }) => {
    const unavailable = reason => ({ ready: false, reason })
    if (!gameDirectory || (!releaseId && !allowTraditional)) return unavailable('尚未核实已应用汉化与当前游戏的对应关系，请切换游戏语言')
    try {
      const installationRoot = resolveInstalledLocalizationRoot(storageRoot, gameDirectory)
      const activeFile = path.join(installationRoot, 'transaction-active.json')
      const journalFile = path.join(installationRoot, 'transaction.json')
      if (fs.existsSync(journalFile)) return unavailable('存在未完成的汉化事务，中文手动查价暂不可用；请重新切换游戏语言以恢复')
      for (const filename of [storageRoot, gameDirectory, activeFile]) ordinaryPath(filename)
      if (fs.statSync(activeFile).size > 1024 * 1024) return unavailable('本机汉化事务记录无效，中文手动查价暂不可用')
      const game = inspect(gameDirectory)
      for (const filename of [game.manifestPath, game.indexPath]) ordinaryPath(filename)
      if (game.stateFlags !== 4) return unavailable('Steam 安装或更新状态不明确，中文手动查价暂不可用')
      const before = [identity(activeFile), identity(game.manifestPath), identity(game.indexPath)].join('|')
      const signature = `${game.gameDirectory}|${installationRoot}|${releaseId || ''}|${allowTraditional}|${before}`
      if (memo?.signature === signature) return memo.result
      const active = JSON.parse(fs.readFileSync(activeFile, 'utf8'))
      const mode = active.mode === undefined ? 'simplified' : active.mode
      let result
      if (active.version !== 1 || !['simplified', 'traditional'].includes(mode) || !/^[a-zA-Z0-9._-]{1,120}$/.test(active.releaseId || '') || (active.releaseId !== releaseId && !(allowTraditional && mode === 'traditional')) || !/^[a-f0-9]{64}$/.test(active.outputHash || '')) result = unavailable('已应用汉化与词库版本不匹配，中文手动查价暂不可用；请重新切简体')
      else if (active.buildId !== game.buildId) result = unavailable('Steam 游戏版本已改变，旧中文映射已停用；请重新切换游戏语言')
      else if (hashFile(game.indexPath) !== active.outputHash) result = unavailable('游戏资源索引已改变，旧中文映射已停用；请重新切换游戏语言')
      else result = { ready: true, buildId: game.buildId, indexHash: active.outputHash, resourceVersion: active.releaseId, mode }
      const after = [identity(activeFile), identity(game.manifestPath), identity(game.indexPath)].join('|')
      if (before !== after || fs.existsSync(journalFile) || resolveInstalledLocalizationRoot(storageRoot, gameDirectory) !== installationRoot) return unavailable('核对期间游戏资源发生变化，中文手动查价暂不可用；请稍后重试切换游戏语言')
      memo = { signature, result }
      return result
    } catch { return unavailable('无法核实当前 Steam 游戏与汉化事务记录，中文手动查价暂不可用；请切换游戏语言') }
  }
}
