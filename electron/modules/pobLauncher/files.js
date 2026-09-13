import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

export const MANAGEMENT = '.pob-launcher'
export async function stat(file) {
  try { return await fs.lstat(file) } catch (error) { if (error.code === 'ENOENT') return null; throw error }
}
export async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')) } catch (error) { if (error.code === 'ENOENT') return fallback; throw error }
}
export async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  const temp = `${file}.${randomUUID()}.tmp`
  try { await fs.writeFile(temp, JSON.stringify(value)); await fs.rename(temp, file) }
  finally { await fs.rm(temp, { force: true }) }
}
export function relativePath(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.startsWith('/') ||
    value.split('/').some(part => !part || part === '.' || part === '..' || /[<>:"|?*\x00-\x1f]/.test(part) ||
      /[. ]$/.test(part) || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(part))) {
    throw new Error('归档或管理记录包含非法路径')
  }
  return value
}
// Reject junctions/symlinks at every existing ancestor, including the selected root.
export async function safePath(root, relative = '') {
  const result = relative ? path.join(root, relativePath(relative)) : path.resolve(root)
  let current = path.parse(result).root
  for (const segment of result.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment)
    if ((await stat(current))?.isSymbolicLink()) throw new Error('安装目录不能包含符号链接或目录联接')
  }
  return result
}
export async function listFiles(root, prefix = '', signal) {
  const files = []
  for (const entry of await fs.readdir(path.join(root, prefix), { withFileTypes: true })) {
    signal?.throwIfAborted()
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name
    relativePath(relative)
    if (entry.isSymbolicLink()) throw new Error('归档包含链接')
    if (entry.isDirectory()) files.push(...await listFiles(root, relative, signal))
    else if (entry.isFile()) files.push(relative)
    else throw new Error('归档包含不支持的文件类型')
  }
  return files
}
export function isUserFile(relative) {
  return relative.split('/').some(part => /^(builds|build|user|profiles|screenshots)$/i.test(part)) ||
    /(?:^|\/)(?:settings[^/]*|.*\.(?:ini|conf))$/i.test(relative)
}

export async function recover(root) {
  const base = await safePath(root, MANAGEMENT)
  const journalFile = await safePath(base, 'journal.json')
  const journal = await readJson(journalFile, null)
  if (!journal) return false
  if (!/^[a-f0-9-]{36}$/.test(journal.id) || !Array.isArray(journal.entries)) throw new Error('更新恢复记录无效')
  if (!journal.committed) {
    for (const entry of [...journal.entries].reverse()) {
      const target = await safePath(root, entry.relative)
      if (entry.existed) {
        const backup = await safePath(base, `backups/${journal.id}/${entry.relative}`)
        await fs.copyFile(backup, target)
      } else {
        await fs.rm(target, { force: true })
      }
    }
  }
  await fs.rm(journalFile)
  return !journal.committed
}

export async function commitFiles(root, entries, { beforeWrite = async () => {}, beforeCommit = async () => {}, onProgress = () => {},
  signal, onRollback = () => {}, onCommitted = () => {}, onWarning = () => {} } = {}) {
  const base = await safePath(root, MANAGEMENT)
  const journalFile = path.join(base, 'journal.json')
  if (await stat(journalFile)) throw new Error('存在未恢复的更新，请先重新检测目录')
  const journal = { id: randomUUID(), committed: false, entries: [] }
  // Back up the complete write set first; one journal avoids quadratic disk writes.
  for (const entry of entries) {
    signal?.throwIfAborted()
    const target = await safePath(root, entry.relative)
    const previous = await stat(target)
    if (previous && !previous.isFile()) throw new Error('目标程序文件与目录冲突')
    if (previous) {
      const backup = await safePath(base, `backups/${journal.id}/${entry.relative}`)
      await fs.mkdir(path.dirname(backup), { recursive: true })
      await fs.copyFile(target, backup)
    }
    journal.entries.push({ relative: entry.relative, existed: Boolean(previous) })
  }
  await beforeCommit()
  signal?.throwIfAborted()
  await writeJson(journalFile, journal)
  try {
    for (const [index, entry] of entries.entries()) {
      signal?.throwIfAborted()
      const target = await safePath(root, entry.relative)
      await fs.mkdir(path.dirname(target), { recursive: true })
      await beforeWrite(entry, index)
      signal?.throwIfAborted()
      await fs.copyFile(entry.source, target)
      onProgress(index + 1, entries.length)
    }
    signal?.throwIfAborted()
    journal.committed = true
    await writeJson(journalFile, journal)
  } catch (error) {
    onRollback()
    try { await recover(root) } catch { throw new Error('更新失败且自动恢复未完成；请关闭 PoB 后重新检测，备份已保留') }
    throw error
  }
  onCommitted()
  try { await fs.rm(journalFile) } catch (error) { onWarning(error) }
}
