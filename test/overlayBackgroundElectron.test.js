import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('选择和拖拽背景共用主进程导入边界', () => {
  const ipc = source('../electron/modules/ipc/window.js')
  assert.match(ipc, /select-overlay-background/)
  assert.match(ipc, /import-overlay-background/)
  assert.match(ipc, /importBackground\(result\.filePaths\[0\]\)/)
  assert.match(ipc, /import-overlay-background', \(_event, sourcePath\) => importBackground\(sourcePath\)/)
})

test('preload 仅通过 webUtils 解析拖入文件并移除旧孤立接口', () => {
  const preload = source('../electron/preload.cjs')
  const rendererApi = source('../src/api/electron.js')

  assert.match(preload, /webUtils\.getPathForFile\(file\)/)
  assert.match(preload, /selectOverlayBackground/)
  assert.match(preload, /importOverlayBackground/)
  assert.doesNotMatch(preload, /copyFileToProject|copy-file-to-project/)
  assert.doesNotMatch(rendererApi, /copyFileToProject|copy-file-to-project/)
})
