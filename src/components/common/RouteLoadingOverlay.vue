<template>
  <Transition name="route-loading-fade">
    <div
      v-if="routeTransition.visible.value"
      class="route-loading-overlay"
      role="status"
      aria-live="polite"
      aria-label="正在加载页面"
    >
      <div class="route-loading-shell" aria-hidden="true">
        <div class="route-loading-header">
          <span class="route-loading-title" />
          <div class="route-loading-label">
            <el-icon class="route-loading-icon"><Loading /></el-icon>
            <span>正在加载页面…</span>
          </div>
        </div>
        <span class="route-loading-band" />
        <div class="route-loading-cards"><span /><span /><span /></div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { Loading } from '@element-plus/icons-vue'
import { routeTransition } from '@/router/transitionState'
</script>

<style scoped>
.route-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  padding: 20px;
  color: var(--text-regular);
  font-size: var(--font-size-sm);
  background: color-mix(in srgb, var(--app-bg, #0E1013) 96%, transparent);
}

.route-loading-shell { display: grid; align-content: start; gap: 14px; width: 100%; max-width: 1120px; margin: 0 auto; }
.route-loading-header { display: flex; align-items: center; justify-content: space-between; gap: 14px; min-width: 0; }
.route-loading-title, .route-loading-band, .route-loading-cards span { display: block; border: 1px solid var(--border-base); border-radius: 8px; background: var(--surface-1); box-shadow: inset 0 1px rgba(255,255,255,.025); }
.route-loading-title { flex: 0 1 220px; width: 220px; height: 40px; }
.route-loading-band { height: 64px; }
.route-loading-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.route-loading-cards span { height: 210px; }
.route-loading-label { display: flex; flex: 0 0 auto; align-items: center; gap: 8px; }

.route-loading-icon {
  color: var(--primary-color);
  font-size: 18px;
  animation: route-loading-spin 0.9s linear infinite;
}

.route-loading-fade-enter-active,
.route-loading-fade-leave-active {
  transition: opacity 0.12s ease;
}

.route-loading-fade-enter-from,
.route-loading-fade-leave-to {
  opacity: 0;
}

@keyframes route-loading-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .route-loading-icon { animation: none; }
  .route-loading-fade-enter-active,
  .route-loading-fade-leave-active { transition: none; }
}

@media (max-width: 780px) { .route-loading-cards { grid-template-columns: 1fr; } .route-loading-cards span:nth-child(n+2) { display: none; } }
</style>
