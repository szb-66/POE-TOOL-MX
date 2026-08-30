<template>
  <div class="app-root" :class="appThemeClass">
    <template v-if="!route.meta.noLayout">
      <TitleBar />
      <div class="main-content-wrapper">
        <MainLayout>
          <router-view />
        </MainLayout>
      </div>
      <ConfigurationGuideDialog />
    </template>
    <router-view v-else />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from './components/Layout/MainLayout.vue'
import TitleBar from './components/Layout/TitleBar.vue'
import ConfigurationGuideDialog from './domains/configurationGuide/ConfigurationGuideDialog.vue'
import { reportStartupEvent } from './utils/startupReporter'
import { markMainRuntimeSettled } from './startup/readiness'
import { resolveWindowTheme, syncMainWindowTheme } from './theme/mainWindowTheme'

const route = useRoute()
const router = useRouter()
let runtimeDispose = null
let runtimeGeneration = 0

const appThemeClass = computed(() => `${resolveWindowTheme(route)}-window`)

watch(() => route.fullPath, () => syncMainWindowTheme(route), { immediate: true })

// ponytail: HMR 批次后重申主题类，防止热更新链路打掉 html 深色类后停在亮色
if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', () => syncMainWindowTheme(route))
}

onMounted(() => {
  if (route.meta.noLayout) return
  if (!window.electronAPI) return
  const generation = ++runtimeGeneration
  void import('./startup/mainRuntime')
    .then(({ initializeMainRuntime }) => initializeMainRuntime({ router }))
    .then((result) => {
      if (generation !== runtimeGeneration) {
        result.dispose?.()
        return
      }
      runtimeDispose = result.dispose
      if (result.warnings.length) {
        reportStartupEvent('renderer-runtime-failed', result.warnings.map(item => item.name).join(','))
      } else {
        reportStartupEvent('renderer-runtime-ready')
      }
    })
    .catch((error) => {
      markMainRuntimeSettled([{ name: 'main-runtime', error: String(error?.message || error) }])
      reportStartupEvent('renderer-runtime-failed', error)
    })
})

onUnmounted(() => {
  runtimeGeneration += 1
  runtimeDispose?.()
  runtimeDispose = null
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
