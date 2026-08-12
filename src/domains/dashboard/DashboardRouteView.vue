<template>
  <div class="dashboard-route primary-page" :aria-busy="loading || !mainRuntimeState.settled">
    <div v-if="contentComponent" class="dashboard-content" :inert="!mainRuntimeState.settled">
      <component :is="contentComponent" />
    </div>

    <div v-else-if="error" class="dashboard-error" role="alert">
      <strong>数据看板加载失败</strong>
      <p>{{ error }}</p>
      <button type="button" @click="loadContent">重试</button>
    </div>

    <div v-else class="dashboard-skeleton" aria-label="数据看板正在加载">
      <header><div><span class="title-block" /><span class="text-block" /></div></header>
      <section class="summary-skeleton">
        <span v-for="item in 4" :key="item" />
      </section>
      <section v-for="group in 3" :key="group" class="group-skeleton">
        <span class="group-title" />
        <div><span v-for="card in 3" :key="card" /></div>
      </section>
    </div>

    <div v-if="contentComponent && !mainRuntimeState.settled" class="runtime-syncing">
      正在同步模块状态…
    </div>
  </div>
</template>

<script setup>
import { onMounted, shallowRef, ref } from 'vue'
import { mainRuntimeState } from '../../startup/readiness'
import { reportStartupEvent } from '../../utils/startupReporter'

const contentComponent = shallowRef(null)
const loading = ref(false)
const error = ref('')

async function loadContent() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    contentComponent.value = (await import('./DashboardView.vue')).default
  } catch (reason) {
    error.value = String(reason?.message || reason || '未知错误')
    reportStartupEvent('dashboard-load-failed', reason)
  } finally {
    loading.value = false
  }
}

onMounted(loadContent)
</script>

<style scoped>
.dashboard-route { position: relative; height: 100%; background: var(--bg-secondary); }
.dashboard-content { height: 100%; }
.dashboard-skeleton { box-sizing: border-box; height: 100%; overflow: hidden; padding: 20px; }
.dashboard-skeleton header { height: 50px; margin-bottom: 18px; }
.dashboard-skeleton header div { display: grid; gap: 8px; width: 360px; }
.dashboard-skeleton span { display: block; border-radius: 8px; background: var(--el-fill-color); animation: startup-pulse 1.2s ease-in-out infinite; }
.title-block { width: 120px; height: 26px; }
.text-block { width: 340px; height: 14px; }
.summary-skeleton { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
.summary-skeleton span { height: 74px; }
.group-skeleton { margin-bottom: 24px; }
.group-title { width: 90px; height: 18px; margin-bottom: 12px; }
.group-skeleton div { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.group-skeleton div span { height: 150px; }
.dashboard-error { display: grid; place-content: center; min-height: 100%; gap: 10px; padding: 24px; text-align: center; }
.dashboard-error p { max-width: 560px; margin: 0; color: var(--text-secondary); }
.dashboard-error button { justify-self: center; padding: 7px 18px; border: 1px solid var(--el-color-primary); border-radius: 6px; color: var(--el-color-primary); background: var(--bg-primary); cursor: pointer; }
.runtime-syncing { position: absolute; right: 18px; bottom: 16px; padding: 7px 12px; border: 1px solid var(--border-base); border-radius: 8px; color: var(--text-secondary); background: var(--bg-primary); box-shadow: var(--el-box-shadow-light); font-size: 12px; pointer-events: none; }
@keyframes startup-pulse { 50% { opacity: .45; } }
@media (max-width: 780px) {
  .summary-skeleton { grid-template-columns: repeat(2, 1fr); }
  .group-skeleton div { grid-template-columns: 1fr; }
}
</style>
