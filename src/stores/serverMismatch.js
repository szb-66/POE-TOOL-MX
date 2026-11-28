import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { electronApi } from '@/api/electron'
import { currentServer } from '@/utils/serverContext.js'
import { createEmptyGameServerMismatch } from '../../shared/gameServerMismatch.js'

function pairKeyFor(state) {
  return `${state?.currentServerId || ''}->${state?.detectedServerId || ''}`
}

export const useServerMismatchStore = defineStore('serverMismatch', () => {
  const state = ref(createEmptyGameServerMismatch(currentServer.id))
  const dismissedKey = ref('')
  const switching = ref(false)

  const mismatch = computed(() => Boolean(state.value?.mismatch && state.value?.detectedServerId))
  const currentServerId = computed(() => state.value?.currentServerId || currentServer.id)
  const currentServerLabel = computed(() => state.value?.currentServerLabel || currentServer.label)
  const detectedServerId = computed(() => state.value?.detectedServerId || null)
  const detectedServerLabel = computed(() => state.value?.detectedServerLabel || '')
  const windowTitle = computed(() => state.value?.windowTitle || '')
  const processName = computed(() => state.value?.processName || '')
  const message = computed(() => state.value?.message || '')

  const visible = computed(() => (
    mismatch.value && dismissedKey.value !== pairKeyFor(state.value)
  ))

  function applyStatus(payload) {
    if (!payload || !payload.mismatch || !payload.detectedServerId) {
      state.value = createEmptyGameServerMismatch(currentServer.id)
      dismissedKey.value = ''
      return
    }
    state.value = {
      ...createEmptyGameServerMismatch(currentServer.id),
      ...payload,
      mismatch: true
    }
  }

  async function refresh({ force = false } = {}) {
    try {
      const result = await electronApi.system.detectGameDpi(force ? { force: true } : undefined)
      if (result?.serverMismatch) {
        applyStatus(result.serverMismatch)
      }
      return result?.serverMismatch || state.value
    } catch {
      return state.value
    }
  }

  function dismiss() {
    if (!mismatch.value) return
    dismissedKey.value = pairKeyFor(state.value)
  }

  async function switchToDetectedServer() {
    const targetId = detectedServerId.value
    if (switching.value || !targetId || !window.electronAPI?.switchServerMode) {
      return { success: false, error: '当前环境不支持自动切换服务器模式' }
    }
    switching.value = true
    try {
      const result = await window.electronAPI.switchServerMode(targetId)
      if (!result?.success) {
        switching.value = false
        return { success: false, error: result?.error?.message || result?.error || '切换服务器模式失败' }
      }
      return result
    } catch (error) {
      switching.value = false
      return { success: false, error: error?.message || '切换服务器模式失败' }
    }
  }

  return {
    state,
    mismatch,
    currentServerId,
    currentServerLabel,
    detectedServerId,
    detectedServerLabel,
    windowTitle,
    processName,
    message,
    visible,
    switching,
    applyStatus,
    refresh,
    dismiss,
    switchToDetectedServer
  }
})
