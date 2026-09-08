import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { EventEmitter } from 'node:events'
import vm from 'node:vm'
import path from 'node:path'

const source = readFileSync(new URL('../electron/modules/window/manager.js', import.meta.url), 'utf8')
const createSource = source.slice(source.indexOf('export function createMainWindow('), source.indexOf('export function createOverlayWindow(')).replace('export function', 'function')

function setup(state) {
  const calls = [], saved = []
  class Window extends EventEmitter {
    constructor(options) {
      super()
      this.visible = options.show !== false
      this.webContents = new EventEmitter()
      this.webContents.send = () => {}
    }
    isDestroyed() { return !!this.destroyed }
    show() { calls.push('show'); this.visible = true }
    maximize() { calls.push('maximize'); this.visible = true; this.maximized = true; this.emit('maximize') }
    setFullScreen(value) { calls.push('fullscreen'); this.fullscreen = value; this.emit('enter-full-screen') }
    setAlwaysOnTop(value) { this.alwaysOnTop = value }
    isMaximized() { return !!this.maximized }
    isFullScreen() { return !!this.fullscreen }
    isAlwaysOnTop() { return !!this.alwaysOnTop }
    getBounds() { return { x: 10, y: 10, width: 1200, height: 800 } }
    loadURL() { calls.push('load') }
  }
  const context = vm.createContext({
    BrowserWindow: Window, mainWindow: null, path, __dirname: '.',
    loadWindowState: () => state, saveWindowState: value => saved.push(value),
    nativeImage: { createFromPath: () => ({ isEmpty: () => true }) },
    process: { env: { NODE_ENV: 'development', VITE_DEV_SERVER_URL: 'http://localhost:3000' } },
    setTimeout, clearTimeout
  })
  const window = vm.runInContext(`${createSource}\ncreateMainWindow()`, context)
  return { window, calls, saved }
}

for (const state of [{}, { isMaximized: true }, { isFullScreen: true }, { isMaximized: true, isFullScreen: true }]) {
  test(`首帧之前保持隐藏，之后恢复窗口状态 ${JSON.stringify(state)}`, () => {
    const { window, calls, saved } = setup({ ...state, alwaysOnTop: true })
    assert.equal(window.visible, false)
    assert.deepEqual(calls, ['load'])
    window.emit('ready-to-show')
    assert.deepEqual(calls, ['load', ...(state.isMaximized ? ['maximize'] : []), ...(state.isFullScreen ? ['fullscreen'] : []), 'show'])
    assert.equal(window.visible, true)
    assert.equal(window.isMaximized(), !!state.isMaximized)
    assert.equal(window.isFullScreen(), !!state.isFullScreen)
    assert.equal(window.isAlwaysOnTop(), true)
    if (saved.length) {
      assert.equal(saved.at(-1).isMaximized, !!state.isMaximized)
      assert.equal(saved.at(-1).isFullScreen, !!state.isFullScreen)
    }
    const count = calls.length
    window.emit('ready-to-show')
    assert.equal(calls.length, count)
  })
}

test('首帧前销毁的窗口不恢复状态也不显示', () => {
  const { window, calls } = setup({ isMaximized: true, isFullScreen: true })
  window.destroyed = true
  window.emit('ready-to-show')
  assert.deepEqual(calls, ['load'])
  assert.equal(window.visible, false)
})
