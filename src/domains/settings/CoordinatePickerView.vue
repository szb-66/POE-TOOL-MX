<template>
  <div class="coordinate-picker" @click="handlePick" @pointerdown="handlePointerDown" @pointermove="handlePointerMove" @pointerup="handlePointerUp">
    <div v-if="selection" class="coordinate-picker__selection" :style="selectionStyle"></div>
    <div class="coordinate-picker__tip">
      <strong>{{ context.mode === 'region' ? '拖动框选标题模板' : '点击选取坐标' }}</strong>
      <span v-if="context.mode === 'region'">{{ regionHint }}</span>
      <span v-else>移动到目标点后单击确认，按 Esc 取消</span>
      <button v-if="context.mode === 'region'" type="button" :disabled="!selectionValid" @click.stop="confirmRegion">确认选区</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { electronApi } from '@/api/electron'

const context = reactive({ mode: 'point', minimumSize: { width: 20, height: 10 }, scaleFactor: 1 })
const dragStart = ref(null)
const selection = ref(null)

const normalizedSelection = computed(() => {
  if (!selection.value) return null
  const { start, end } = selection.value
  return {
    left: Math.min(start.x, end.x), top: Math.min(start.y, end.y),
    right: Math.max(start.x, end.x), bottom: Math.max(start.y, end.y)
  }
})
const physicalSize = computed(() => ({
  width: Math.round((normalizedSelection.value?.right - normalizedSelection.value?.left || 0) * context.scaleFactor),
  height: Math.round((normalizedSelection.value?.bottom - normalizedSelection.value?.top || 0) * context.scaleFactor)
}))
const selectionValid = computed(() => physicalSize.value.width >= context.minimumSize.width && physicalSize.value.height >= context.minimumSize.height)
const selectionStyle = computed(() => {
  const region = normalizedSelection.value
  return region ? { left: `${region.left}px`, top: `${region.top}px`, width: `${region.right - region.left}px`, height: `${region.bottom - region.top}px` } : {}
})
const regionHint = computed(() => selection.value
  ? `${physicalSize.value.width} × ${physicalSize.value.height} 物理像素${selectionValid.value ? '，按 Enter 或点击确认' : '，最小 20 × 10'}`
  : '拖动框选完整标题，按 Esc 取消')

const handlePick = (event) => {
  if (context.mode !== 'point') return
  electronApi.window.submitScreenCoordinate({
    x: event.clientX,
    y: event.clientY
  })
}

function pointer(event) {
  return { x: Math.max(0, Math.min(window.innerWidth, event.clientX)), y: Math.max(0, Math.min(window.innerHeight, event.clientY)) }
}

function handlePointerDown(event) {
  if (context.mode !== 'region' || event.button !== 0) return
  event.currentTarget.setPointerCapture(event.pointerId)
  dragStart.value = pointer(event)
  selection.value = { start: dragStart.value, end: dragStart.value }
}

function handlePointerMove(event) {
  if (!dragStart.value) return
  selection.value = { start: dragStart.value, end: pointer(event) }
}

function handlePointerUp(event) {
  if (!dragStart.value) return
  selection.value = { start: dragStart.value, end: pointer(event) }
  dragStart.value = null
}

function confirmRegion() {
  if (!selectionValid.value) return
  electronApi.window.submitScreenRegion(normalizedSelection.value)
}

const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    electronApi.window.cancelScreenCoordinatePicker()
  } else if (event.key === 'Enter' && context.mode === 'region') {
    confirmRegion()
  }
}

onMounted(async () => {
  Object.assign(context, await electronApi.window.getScreenPickerContext() || {})
  window.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
.coordinate-picker {
  width: 100vw;
  height: 100vh;
  display: grid;
  place-items: center;
  cursor: crosshair;
  user-select: none;
  background: rgba(15, 23, 42, 0.18);
}

.coordinate-picker__tip {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 20px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  background: rgba(17, 24, 39, 0.88);
  color: #fff;
  text-align: center;
  pointer-events: none;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
}

.coordinate-picker__tip span {
  color: #d1d5db;
  font-size: 13px;
}

.coordinate-picker__tip button { align-self: center; padding: 6px 18px; border: 0; border-radius: 5px; cursor: pointer; }
.coordinate-picker__tip button:disabled { cursor: not-allowed; opacity: 0.45; }
.coordinate-picker__selection { position: fixed; box-sizing: border-box; border: 2px solid #22d3ee; background: rgba(34, 211, 238, 0.12); pointer-events: none; box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.2); }
</style>
