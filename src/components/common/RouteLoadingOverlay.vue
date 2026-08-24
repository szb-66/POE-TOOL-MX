<template>
  <Transition name="route-loading-fade">
    <div
      v-if="routeTransition.visible.value"
      class="route-loading-overlay"
      role="status"
      aria-live="polite"
      aria-label="正在加载页面"
    >
      <div class="route-loading-indicator" aria-hidden="true">
        <el-icon class="route-loading-icon"><Loading /></el-icon>
        <span>正在加载页面…</span>
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
  align-items: center;
  justify-content: center;
  color: var(--text-regular);
  font-size: var(--font-size-sm);
  background: color-mix(in srgb, var(--app-bg, #0E1013) 96%, transparent);
}

.route-loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.route-loading-icon {
  color: var(--primary-color);
  font-size: 32px;
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

</style>
