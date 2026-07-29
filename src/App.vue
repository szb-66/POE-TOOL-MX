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
import { useRoute } from 'vue-router'
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

const route = useRoute()
const settingsStore = useSettingsStore()
let initShortcutsHandler = null
let removeDevToolsListener = null
let removeChaosAutomationListener = null
let removePriceCheckListener = null
let removeAccountListener = null

onMounted(() => {
  if (route.meta.noLayout) return
  // 初始化快捷键
  if (window.electronAPI) {
    void settingsStore.refreshDpiScale()
    initShortcuts()
    initCombatAssist()
    initBagAutomation()
    const accountStore = usePoeCnAccountStore()
    removeAccountListener = accountStore.listenStatus()
    const chaosStore = useChaosRecipeStore()
    removeChaosAutomationListener = chaosStore.listenAutomation()
    void chaosStore.initializeRuntime()
    const priceCheckStore = usePriceCheckStore()
    removePriceCheckListener = priceCheckStore.listenOverlay()
    void priceCheckStore.syncRuntime().catch(() => priceCheckStore.refreshStatus())
  }

  removeDevToolsListener = electronApi.window.onDevToolsVisibilityChanged?.((visible) => {
    settingsStore.updateDebugMode(visible)
  })
  electronApi.window.setDevToolsVisible(settingsStore.debugMode)
})

onUnmounted(() => {
  removeDevToolsListener?.()
  removeChaosAutomationListener?.()
  removePriceCheckListener?.()
  removeAccountListener?.()
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
