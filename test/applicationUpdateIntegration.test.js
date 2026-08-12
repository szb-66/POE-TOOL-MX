import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('更新 IPC 只暴露固定命令且校验主窗口、模式与来源', () => {
  const ipc = source('../electron/modules/ipc/update.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  for (const channel of ['update-get-state', 'update-configure', 'update-check', 'update-download', 'update-restart-install']) {
    assert.match(ipc, new RegExp(channel))
  }
  assert.match(ipc, /event\.sender !== mainWindow\.webContents/)
  assert.match(ipc, /UPDATE_MODES\.has/)
  assert.match(ipc, /UPDATE_SOURCES\.has/)
  assert.match(preload, /onApplicationUpdateStateChanged/)
  assert.match(api, /restartAndInstallApplicationUpdate/)
  assert.doesNotMatch(preload, /setApplicationUpdateFeedURL/)
})

test('设置默认手动更新与 CNB 来源并持久化、重置和同步到主进程', () => {
  const store = source('../src/domains/settings/settingsStore.js')
  const app = source('../src/App.vue')
  const runtime = source('../src/startup/mainRuntime.js')
  assert.match(store, /const updateMode = ref\(UPDATE_MODE_MANUAL\)/)
  assert.match(store, /const updateSource = ref\(UPDATE_SOURCE_CNB\)/)
  assert.match(store, /updateMode: updateMode\.value/)
  assert.match(store, /updateSource: updateSource\.value/)
  assert.match(store, /updateMode\.value = normalizeUpdateMode\(data\.updateMode\)/)
  assert.match(store, /updateSource\.value = normalizeUpdateSource\(data\.updateSource\)/)
  assert.match(store, /electronApi\.update\.configure\(\{ mode: updateMode\.value, source: updateSource\.value \}\)/)

  const initializationStart = store.indexOf('// 初始化时加载')
  const initializationEnd = store.indexOf('return {', initializationStart)
  assert.ok(initializationStart >= 0 && initializationEnd > initializationStart)
  assert.doesNotMatch(
    store.slice(initializationStart, initializationEnd),
    /electronApi\.update\.configure/,
    '设置 store 会被覆盖层复用，构造时不得调用仅限主窗口的更新 IPC'
  )

  const mountedStart = app.indexOf('onMounted(() => {')
  const noLayoutGuard = app.indexOf('if (route.meta.noLayout) return', mountedStart)
  const runtimeImport = app.indexOf("import('./startup/mainRuntime')", mountedStart)
  assert.ok(mountedStart >= 0 && noLayoutGuard > mountedStart && runtimeImport > noLayoutGuard,
    '更新模式应在排除覆盖层路由后由主窗口同步')
  assert.match(runtime, /electronApi\.update\.configure\(\{ mode: settingsStore\.updateMode, source: settingsStore\.updateSource \}\)/)
})

test('设置页展示更新信息、纯文本说明、进度和未签名警告', () => {
  const view = source('../src/domains/settings/SettingsView.vue')
  assert.match(view, /应用更新/)
  assert.match(view, /update-release-notes/)
  assert.doesNotMatch(view, /v-html="updateState\.releaseNotes"/)
  assert.match(view, /el-progress/)
  assert.match(view, /SmartScreen/)
  assert.match(view, /重启并安装/)
  assert.match(view, /CNB（国内推荐）/)
  assert.match(view, /GitHub Release/)
  assert.match(view, /:disabled="updateBusy"/)
})
