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

const route = useRoute()
const settingsStore = useSettingsStore()
let initShortcutsHandler = null
let removeDevToolsListener = null

onMounted(() => {
  if (route.meta.noLayout) return
  // 初始化快捷键
  if (window.electronAPI) {
    initShortcuts()
    initCombatAssist()
    initBagAutomation()
  }

  removeDevToolsListener = electronApi.window.onDevToolsVisibilityChanged?.((visible) => {
    settingsStore.updateDebugMode(visible)
  })
  electronApi.window.setDevToolsVisible(settingsStore.debugMode)
})

onUnmounted(() => {
  removeDevToolsListener?.()
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
