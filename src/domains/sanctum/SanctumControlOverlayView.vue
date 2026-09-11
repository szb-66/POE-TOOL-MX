<template>
  <div class="bag-overlay">
    <div class="drag-handle" title="拖动圣所采集按钮" @pointerdown="drag.pointerDown" @pointermove="drag.pointerMove" @pointerup="drag.pointerUp" @pointercancel="drag.pointerUp"><span></span><span></span><span></span></div>
    <button :disabled="state.disabled || starting" :aria-label="buttonLabel" @pointerdown.stop.prevent="start" @click="keyboardStart"><span v-if="state.running || starting" class="busy-spinner" aria-hidden="true"></span><span role="status" aria-live="polite">{{ buttonLabel }}</span></button>
  </div>
</template>
<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { createOverlayDrag } from '@/utils/useOverlayDrag'
const api = window.electronAPI
const state = ref({ disabled: true, label: '开始采集', reason: '' })
const starting = ref(false), error = ref('')
const buttonLabel = computed(() => state.value.disabled ? state.value.label : starting.value ? '正在启动' : error.value ? '分析失败·重试' : state.value.label)
const drag = createOverlayDrag(message => api.sanctum.moveControlOverlay(message), { finalCoordinates: true })
let unsubscribe
async function start(event) {
  if (event.button !== 0 || state.value.disabled) return
  if (starting.value) return
  starting.value = true; error.value = ''
  try {
    const result = await api.sanctum.startLive()
    if (!result.success) error.value = result.error
  } catch (e) {
    error.value = e.message || '采集启动失败'
  } finally { starting.value = false }
}
function keyboardStart(event) { if (event.detail === 0) void start({ button: 0 }) }
onMounted(async () => {
  unsubscribe = api.onSanctumControlState(value => { state.value = value; if (value.running) { starting.value = false; error.value = '' } })
  const result = await api.sanctum.getControlState()
  if (result.success) state.value = result.data
})
onUnmounted(() => { unsubscribe?.(); drag.dispose() })
</script>
<style scoped>
:global(html), :global(body), :global(#app) {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: transparent !important;
}
.bag-overlay {
  position: relative;
  display: grid;
  grid-template-columns: 22px 1fr;
  grid-template-rows: 1fr;
  gap: 0;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 4px;
  font-family: var(--font-ui);
  user-select: none;
}
.drag-handle {
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
  justify-content: center;
  cursor: grab;
  touch-action: none;
  background: var(--brand-color);
  border-radius: var(--overlay-radius-md) 0 0 var(--overlay-radius-md);
}
.drag-handle:active { cursor: grabbing; }
.drag-handle span {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--brand-on-color);
}
button {
  -webkit-app-region: no-drag;
  box-sizing: border-box;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  gap: var(--overlay-space-2);
  padding: var(--overlay-space-2) var(--overlay-space-3);
  border: 1px solid var(--overlay-border);
  border-radius: 0 var(--overlay-radius-md) var(--overlay-radius-md) 0;
  color: var(--brand-on-color);
  background: var(--brand-color);
  box-shadow: var(--overlay-shadow), inset 0 1px rgba(255, 255, 255, .14);
  font: 700 14px/1 var(--font-ui);
  white-space: nowrap;
  cursor: pointer;
}
button:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--brand-color) 84%, white);
  background: color-mix(in srgb, var(--brand-color) 84%, white);
}
button:active:not(:disabled) { transform: translateY(1px); }
button:disabled {
  border-color: var(--border-base);
  color: var(--text-secondary);
  background: var(--surface-2);
  cursor: not-allowed;
}
.busy-spinner { width: 12px; height: 12px; flex: 0 0 12px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: sanctum-spin .8s linear infinite; }
@keyframes sanctum-spin { to { transform: rotate(360deg); } }
</style>
