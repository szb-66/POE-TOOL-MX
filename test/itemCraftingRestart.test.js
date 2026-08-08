import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function source(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

test('物品制作完成浮窗提供重新开始按钮且地图完成态不受影响', () => {
  const view = source('../src/domains/overlay/OverlayView.vue')
  const content = source('../src/domains/overlay/components/OverlayContent.vue')

  assert.match(content, /defineEmits\(\['confirm', 'restart', 'close'\]\)/)
  assert.match(content, /重新开始/)
  assert.match(content, /\$emit\('restart'\)/)
  assert.match(content, /:loading="isRestarting"/)
  assert.match(view, /@restart="handleRestart"/)
  assert.match(view, /electronApi\.script\.restartLastItem\(\)/)
  assert.match(view, /function restoreCompletedState\(snapshot, error\)[\s\S]*itemInfo\.value = snapshot\.itemInfo/)
  assert.match(view, /if \(!result\?\.success\)[\s\S]*restoreCompletedState\(completedSnapshot, result\?\.error\)/)

  const mapCompletion = content.match(/<!-- 地图制作流程停止后的确认按钮 -->([\s\S]*?)<!-- 制作中或已停止时的关闭按钮 -->/)?.[1] || ''
  assert.doesNotMatch(mapCompletion, /重新开始|\$emit\('restart'\)/)
})

test('最近一次成功的物品制作可通过独立 IPC 重跑并阻止重复请求', () => {
  const ipc = source('../electron/modules/ipc/python.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')

  assert.match(ipc, /let lastSuccessfulItemConfig = null/)
  assert.match(ipc, /let itemRestartPromise = null/)
  assert.match(ipc, /config\?\.mode === 'items' && result\?\.success/)
  assert.match(ipc, /ipcMain\.handle\('restart-last-item-script'/)
  assert.match(ipc, /没有可重新开始的物品制作任务/)
  assert.match(ipc, /物品制作正在重新开始/)
  assert.match(preload, /restartLastItemScript: \(\) => ipcRenderer\.invoke\('restart-last-item-script'\)/)
  assert.match(api, /restartLastItem: \(\) => window\.electronAPI\.restartLastItemScript\?\.\(\)/)
})
