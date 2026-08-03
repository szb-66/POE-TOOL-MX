import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { importOverlayBackground, OverlayBackgroundImportError } from '../electron/modules/window/backgroundImport.js'

function temporaryDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'overlay-background-test-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  return directory
}

test('背景导入会复制到 userData/backgrounds', (t) => {
  const root = temporaryDirectory(t)
  const source = path.join(root, 'personal.PNG')
  fs.writeFileSync(source, 'image')

  const result = importOverlayBackground(source, { userDataPath: path.join(root, 'profile'), now: () => 123 })

  assert.equal(result.success, true)
  assert.equal(result.filePath, path.join(root, 'profile', 'backgrounds', 'personal_123.png'))
  assert.equal(fs.readFileSync(result.filePath, 'utf8'), 'image')
})

test('背景导入拒绝空路径、不支持格式和文件夹', (t) => {
  const root = temporaryDirectory(t)
  const directoryWithImageExtension = path.join(root, 'folder.png')
  fs.mkdirSync(directoryWithImageExtension)

  assert.throws(
    () => importOverlayBackground('', { userDataPath: root }),
    (error) => error instanceof OverlayBackgroundImportError && error.code === 'BACKGROUND_PATH_REQUIRED'
  )
  assert.throws(
    () => importOverlayBackground(path.join(root, 'background.png'), { userDataPath: '' }),
    (error) => error.code === 'BACKGROUND_STORAGE_UNAVAILABLE'
  )
  assert.throws(
    () => importOverlayBackground(path.join(root, 'background.svg'), { userDataPath: root }),
    (error) => error.code === 'BACKGROUND_FORMAT_UNSUPPORTED'
  )
  assert.throws(
    () => importOverlayBackground(directoryWithImageExtension, { userDataPath: root }),
    (error) => error.code === 'BACKGROUND_FILE_REQUIRED'
  )
})

test('复制失败时不会返回原始个人文件路径作为可用背景', () => {
  const fileSystem = {
    statSync: () => ({ isFile: () => true }),
    mkdirSync: () => {},
    copyFileSync: () => { throw new Error('denied') }
  }

  assert.throws(
    () => importOverlayBackground('C:\\personal\\background.webp', { userDataPath: 'C:\\profile', fileSystem }),
    (error) => error.code === 'BACKGROUND_COPY_FAILED'
  )
})
