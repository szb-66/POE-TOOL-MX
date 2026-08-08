<template>
  <div class="app-root">
    <template v-if="!route.meta.noLayout">
      <TitleBar />
      <div class="main-content-wrapper">
        <MainLayout>
          <router-view />
        </MainLayout>
      </div>
    </template>
    <router-view v-else />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from './components/Layout/MainLayout.vue'
import TitleBar from './components/Layout/TitleBar.vue'
import { initShortcuts } from './utils/scriptService'
import { useSettingsStore } from './domains/settings/settingsStore'
import { electronApi } from './api/electron'
import { initCombatAssist } from './utils/combatService'
import { disposeBagAutomation, initBagAutomation } from './utils/bagService'
import { useChaosRecipeStore } from './stores/chaosRecipe'
import { usePriceCheckStore } from './stores/priceCheck'
import { usePoeCnAccountStore } from './stores/poeCnAccount'
import { useStashPickupStore } from './stores/stashPickup'
import { usePuzzleStore } from './stores/puzzle'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()
let initShortcutsHandler = null
let removeDevToolsListener = null
let removeChaosAutomationListener = null
let removePriceCheckListener = null
let removeAccountListener = null
let removeStashPickupListener = null
let removePuzzleListener = null

onMounted(async () => {
  if (route.meta.noLayout) return
  window.addEventListener('focus', refreshGameWindowOnFocus)
  // 初始化快捷键
  if (window.electronAPI) {
    void electronApi.update.configure({ mode: settingsStore.updateMode }).catch(() => {})
    const titleSync = await settingsStore.syncGameWindowTitles()
    if (!titleSync.success) ElMessage.warning(`游戏窗口名称同步失败：${titleSync.error}`)
    const processNameSync = await settingsStore.syncGameWindowProcessNames()
    if (!processNameSync.success) ElMessage.warning(`游戏客户端进程名同步失败：${processNameSync.error}`)
    void settingsStore.refreshDpiScale()
    initShortcuts()
    initCombatAssist()
    initBagAutomation()
    const accountStore = usePoeCnAccountStore()
    removeAccountListener = accountStore.listenStatus()
    const chaosStore = useChaosRecipeStore()
    removeChaosAutomationListener = chaosStore.listenAutomation()
    void chaosStore.initializeRuntime()
    const stashPickupStore = useStashPickupStore()
    removeStashPickupListener = stashPickupStore.listen()
    void stashPickupStore.initializeRuntime()
    const priceCheckStore = usePriceCheckStore()
    removePriceCheckListener = priceCheckStore.listenOverlay()
    void priceCheckStore.syncRuntime().catch(() => priceCheckStore.refreshStatus())
    removePuzzleListener = usePuzzleStore().listen(() => {
      void router.push('/puzzle')
    })
  }

  removeDevToolsListener = electronApi.window.onDevToolsVisibilityChanged?.((visible) => {
    settingsStore.updateDebugMode(visible)
  })
  electronApi.window.setDevToolsVisible(settingsStore.debugMode)
})

const refreshGameWindowOnFocus = () => {
  if (window.electronAPI && settingsStore.dpiMode === 'auto') {
    void settingsStore.refreshDpiScale()
  }
}

onUnmounted(() => {
  window.removeEventListener('focus', refreshGameWindowOnFocus)
  removeDevToolsListener?.()
  removeChaosAutomationListener?.()
  removePriceCheckListener?.()
  removeAccountListener?.()
  removeStashPickupListener?.()
  removePuzzleListener?.()
  disposeBagAutomation()
  // 清理 IPC 监听器
  if (window.electronAPI && window.electronAPI.removeAllListeners) {
    window.electronAPI.removeAllListeners('init-shortcuts')
  }
})
</script>

<style scoped>
.app-root {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
  /* Ensure it takes remaining space */
  display: flex; 
  flex-direction: column;
}

/* Ensure MainLayout takes full height of wrapper */
:deep(.main-layout) {
  flex: 1;
  height: 100%;
}
</style>
