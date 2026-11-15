import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { FileWatcher, fileWatcher } from '../electron/modules/watcher/fileWatcher.js'

test('国际服脚本与通信文件单独保存，国服默认路径兼容', t => {
  assert.equal(fileWatcher.getFilePaths().tempDir, path.join(os.tmpdir(), 'exile-helper'))
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'international-automation-files-'))
  const watcher = new FileWatcher(path.join(root, 'cn'))
  t.after(() => {
    watcher.stopFileWatcher()
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()))
    fs.rmSync(root, { recursive: true, force: true })
  })
  const original = watcher.getFilePaths()
  fs.writeFileSync(original.itemInfoFile, 'cn-content')
  watcher.configureDirectory(path.join(root, 'servers/international/automation'))
  const international = watcher.getFilePaths()
  assert.notEqual(international.itemInfoFile, original.itemInfoFile)
  watcher.startFileWatcher({ mode: 'items' })
  assert.throws(() => watcher.configureDirectory(path.join(root, 'other')), /必须停止/)
  assert.equal(fs.readFileSync(original.itemInfoFile, 'utf8'), 'cn-content')
  assert.equal(JSON.parse(fs.readFileSync(international.itemInfoFile, 'utf8')).clipboard, '')
})
