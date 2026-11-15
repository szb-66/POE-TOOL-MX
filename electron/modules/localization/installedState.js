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

// Local reads only: verify on startup, then reuse a hash while all file identities
// remain unchanged. A Steam update or external replacement invalidates the cache.
export function createInstalledLocalizationVerifier({ inspect = inspectSteamGame } = {}) {
  let memo = null
  return ({ storageRoot, gameDirectory, releaseId }) => {
    const unavailable = reason => ({ ready: false, reason })
    if (!gameDirectory || !releaseId) return unavailable('尚未核实已应用汉化与当前游戏的对应关系，请手动扫描')
    try {
      const activeFile = path.join(storageRoot, 'transaction-active.json')
      const journalFile = path.join(storageRoot, 'transaction.json')
      if (fs.existsSync(journalFile)) return unavailable('存在未完成的汉化事务，中文手动查价暂不可用；请手动扫描恢复')
      for (const filename of [storageRoot, gameDirectory, activeFile]) ordinaryPath(filename)
      if (fs.statSync(activeFile).size > 1024 * 1024) return unavailable('本机汉化事务记录无效，中文手动查价暂不可用')
      const game = inspect(gameDirectory)
      for (const filename of [game.manifestPath, game.indexPath]) ordinaryPath(filename)
      if (game.stateFlags !== 4) return unavailable('Steam 安装或更新状态不明确，中文手动查价暂不可用')
      const before = [identity(activeFile), identity(game.manifestPath), identity(game.indexPath)].join('|')
      const signature = `${game.gameDirectory}|${releaseId}|${before}`
      if (memo?.signature === signature) return memo.result
      const active = JSON.parse(fs.readFileSync(activeFile, 'utf8'))
      let result
      if (active.version !== 1 || active.releaseId !== releaseId || !/^[a-f0-9]{64}$/.test(active.outputHash || '')) result = unavailable('已应用汉化与词库版本不匹配，中文手动查价暂不可用；请手动扫描')
      else if (active.buildId !== game.buildId) result = unavailable('Steam 游戏版本已改变，旧中文映射已停用；请重新扫描并应用汉化')
      else if (hashFile(game.indexPath) !== active.outputHash) result = unavailable('游戏资源索引已改变，旧中文映射已停用；请重新扫描并应用汉化')
      else result = { ready: true, buildId: game.buildId, indexHash: active.outputHash, resourceVersion: releaseId }
      const after = [identity(activeFile), identity(game.manifestPath), identity(game.indexPath)].join('|')
      if (before !== after || fs.existsSync(journalFile)) return unavailable('核对期间游戏资源发生变化，中文手动查价暂不可用；请稍后扫描')
      memo = { signature, result }
      return result
    } catch { return unavailable('无法核实当前 Steam 游戏与汉化事务记录，中文手动查价暂不可用；请手动扫描') }
  }
}
