<template>
  <div class="bag-overlay" :title="state.disabledReason || '点击执行自动入库'">
    <div
      class="drag-handle"
      title="拖动浮层"
      @pointerdown="drag.pointerDown"
      @pointermove="drag.pointerMove"
      @pointerup="drag.pointerUp"
      @pointercancel="drag.pointerUp"
    >
      <span></span><span></span><span></span>
    </div>
    <button
      type="button"
      :disabled="state.disabled || starting"
      :aria-label="state.disabledReason || state.label"
      @pointerdown.stop.prevent="startStashFromPointer"
    >
      <span class="button-icon">{{ state.stashing || starting ? '…' : '⇧' }}</span>
      <span>{{ starting ? '启动中' : state.label }}</span>
    </button>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { electronApi } from '@/api/electron'
import { createOverlayDrag } from '@/utils/useOverlayDrag'

const state = ref({
  visible: false,
  ready: false,
  foreground: false,
  stashing: false,
  disabled: true,
  disabledReason: '等待仓库与背包同时打开',
  label: '自动入库'
})
const starting = ref(false)
let disposeState
const drag = createOverlayDrag((message) => electronApi.bag.moveOverlay(message))

function applyState(snapshot) {
  if (snapshot) state.value = { ...state.value, ...snapshot }
  if (snapshot?.stashing) starting.value = false
}

async function startStash() {
  if (state.value.disabled || starting.value) return
  starting.value = true
  try {
    const result = await electronApi.bag.startStash()
    if (!result?.success) {
      state.value = {
        ...state.value,
        disabledReason: result?.error || '启动入库失败'
      }
    }
  } finally {
    starting.value = false
  }
}

function startStashFromPointer(event) {
  if (event.button === 0) void startStash()
}

onMounted(async () => {
  disposeState = electronApi.bag.onOverlayState(applyState)
  applyState(await electronApi.bag.getOverlayState())
})

onUnmounted(() => disposeState?.())
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
  grid-template-columns: 28px 1fr;
  gap: 5px;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 7px;
  font-family: "Microsoft YaHei", sans-serif;
  user-select: none;
}
.drag-handle {
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
  justify-content: center;
  cursor: move;
  touch-action: none;
}
.drag-handle span {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(218, 230, 255, .7);
}
button {
  -webkit-app-region: no-drag;
  box-sizing: border-box;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(132, 178, 255, .62);
  border-radius: 12px;
  color: #f4f8ff;
  background: linear-gradient(145deg, rgba(36, 91, 171, .96), rgba(21, 55, 112, .96));
  box-shadow: 0 8px 24px rgba(0, 0, 0, .42), inset 0 1px rgba(255, 255, 255, .14);
  font: 700 15px/1 "Microsoft YaHei", sans-serif;
  cursor: pointer;
}
button:hover:not(:disabled) {
  border-color: rgba(174, 208, 255, .95);
  background: linear-gradient(145deg, rgba(48, 111, 199, .98), rgba(27, 70, 139, .98));
}
button:active:not(:disabled) { transform: translateY(1px); }
button:disabled {
  border-color: rgba(145, 155, 174, .45);
  color: rgba(235, 240, 248, .7);
  background: linear-gradient(145deg, rgba(65, 72, 86, .92), rgba(38, 43, 54, .92));
  cursor: not-allowed;
}
.button-icon { font-size: 18px; }
</style>
