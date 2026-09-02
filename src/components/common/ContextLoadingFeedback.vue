<template>
  <Transition name="context-loading-fade">
    <aside v-if="snapshot.visible" class="context-loading-feedback" role="status" aria-live="polite" :aria-label="snapshot.label">
      <span class="context-loading-spinner" aria-hidden="true"></span>
      <div>
        <strong>{{ snapshot.label }}</strong>
        <small v-if="snapshot.activeCount > 1">另有 {{ snapshot.activeCount - 1 }} 项任务正在处理</small>
      </div>
      <span v-if="hasProgress" class="context-loading-progress">{{ snapshot.current }}/{{ snapshot.total }}</span>
    </aside>
  </Transition>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { electronApi } from '../../api/electron.js'

const props = defineProps({ target: { type: String, default: 'app' } })

const snapshot = ref({ visible: false, target: 'app', label: '', current: 0, total: 0, activeCount: 0 })
const hasProgress = computed(() => Number(snapshot.value.total) > 0)
let removeListener = null

onMounted(async () => {
  removeListener = electronApi.loadingFeedback.onState(value => { snapshot.value = value })
  if (props.target === 'app') {
    const current = await electronApi.loadingFeedback.getState()
    if (current) snapshot.value = current
  }
})

onUnmounted(() => removeListener?.())
</script>

<style scoped lang="less">
.context-loading-feedback {
  position: fixed; z-index: 5000; top: 46px; left: 50%; display: flex; align-items: center; gap: 10px;
  min-width: 280px; max-width: min(520px, calc(100vw - 32px)); padding: 10px 14px; transform: translateX(-50%);
  color: var(--text-primary); border: 1px solid var(--border-base); border-radius: 8px;
  background: color-mix(in srgb, var(--bg-primary) 96%, transparent); box-shadow: var(--el-box-shadow-light); pointer-events: none;
}
.context-loading-feedback div { display: grid; flex: 1; min-width: 0; gap: 2px; }
.context-loading-feedback strong { overflow: hidden; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.context-loading-feedback small { color: var(--text-secondary); font-size: 11px; }
.context-loading-spinner { flex: 0 0 14px; width: 14px; height: 14px; border: 2px solid color-mix(in srgb, var(--primary-color) 28%, transparent); border-top-color: var(--primary-color); border-radius: 50%; animation: context-loading-spin .8s linear infinite; }
.context-loading-progress { color: var(--text-secondary); font-size: 12px; font-variant-numeric: tabular-nums; }
.context-loading-fade-enter-active, .context-loading-fade-leave-active { transition: opacity .12s ease; }
.context-loading-fade-enter-from, .context-loading-fade-leave-to { opacity: 0; }
@keyframes context-loading-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .context-loading-spinner { animation: none; }
  .context-loading-fade-enter-active, .context-loading-fade-leave-active { transition: none; }
}
</style>
