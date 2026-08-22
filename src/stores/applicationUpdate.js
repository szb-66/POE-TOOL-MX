import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { electronApi } from '../api/electron.js'

function initialState() {
  return {
    mode: 'manual',
    source: 'cnb',
    currentVersion: '',
    status: 'idle',
    supported: false,
    availableVersion: '',
    releaseDate: '',
    releaseNotes: '',
    progress: null,
    error: '',
    installedUpdate: null
  }
}

export const useApplicationUpdateStore = defineStore('applicationUpdate', () => {
  const state = ref(initialState())
  const initialized = ref(false)
  let removeStateListener = null
  let startupCheckPromise = null
  let installedUpdateDialogPromise = null

  const busy = computed(() => ['checking', 'downloading', 'installing'].includes(state.value.status))

  function applyState(snapshot) {
    if (snapshot && typeof snapshot === 'object') state.value = { ...state.value, ...snapshot }
    return state.value
  }

  async function initialize() {
    if (initialized.value) return dispose
    removeStateListener = electronApi.update.onStateChanged(applyState)
    try {
      applyState(await electronApi.update.getState())
      initialized.value = true
    } catch (error) {
      state.value.error = error?.message || '读取更新状态失败'
      removeStateListener?.()
      removeStateListener = null
      throw error
    }
    return dispose
  }

  function dispose() {
    removeStateListener?.()
    removeStateListener = null
    initialized.value = false
    startupCheckPromise = null
  }

  function startupCheck() {
    if (startupCheckPromise) return startupCheckPromise
    startupCheckPromise = check().catch(() => null)
    return startupCheckPromise
  }

  async function check() {
    const result = await electronApi.update.check()
    applyState(result?.state)
    return result
  }

  async function download() {
    const result = await electronApi.update.download()
    applyState(result?.state)
    return result
  }

  async function install() {
    if (state.value.status !== 'downloaded') {
      return { success: false, reason: state.value.status === 'installing' ? 'install-in-progress' : 'update-not-downloaded', state: state.value }
    }
    applyState({ status: 'installing', error: '' })
    try {
      const result = await electronApi.update.restartAndInstall()
      applyState(result?.state)
      return result
    } catch (error) {
      applyState({ status: 'downloaded', error: error?.message || '更新安装失败' })
      throw error
    }
  }

  function showInstalledUpdate(showDialog) {
    if (installedUpdateDialogPromise || !state.value.installedUpdate || typeof showDialog !== 'function') {
      return installedUpdateDialogPromise || Promise.resolve(false)
    }
    const record = { ...state.value.installedUpdate }
    installedUpdateDialogPromise = Promise.resolve()
      .then(() => showDialog(record))
      .then(async () => {
        const result = await electronApi.update.acknowledgeInstalled()
        applyState(result?.state)
        return Boolean(result?.acknowledged)
      })
      .finally(() => { installedUpdateDialogPromise = null })
    return installedUpdateDialogPromise
  }

  return {
    state,
    busy,
    initialized,
    applyState,
    initialize,
    dispose,
    startupCheck,
    check,
    download,
    install,
    showInstalledUpdate
  }
})
