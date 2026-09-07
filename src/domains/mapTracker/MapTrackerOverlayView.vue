<template>
  <main class="map-tracker-overlay">
    <div class="drag-handle" title="拖动浮窗" @pointerdown="drag.pointerDown" @pointermove="drag.pointerMove" @pointerup="drag.pointerUp" @pointercancel="drag.pointerUp"><span></span><span></span><span></span></div>
    <strong class="timer">{{ duration }}</strong>
    <div class="details"><span class="map-name">{{ mapLabel(run?.areaName) || '等待地图' }}</span><span class="portals">传送门 {{ run?.portalsUsed ?? '—' }}</span></div>
  </main>
</template>
<script setup>
import { mapLabel } from '../../../shared/mapTrackerLabels.js'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { electronApi } from '@/api/electron.js'
import { createOverlayDrag } from '@/utils/useOverlayDrag.js'
const snapshot = ref({ settings: { overlay: {} }, activeRun: null }); let dispose
const drag = createOverlayDrag(message => electronApi.mapTracker.moveOverlay(message))
const run = computed(() => snapshot.value.activeRun)
const duration = computed(() => { const seconds = Math.floor((run.value?.activeDurationMs || 0) / 1000); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` })
onMounted(async () => { dispose = electronApi.mapTracker.onSnapshot(value => { snapshot.value = value }); const result = await electronApi.mapTracker.getStatus(); if (result?.data) snapshot.value = result.data })
onUnmounted(() => dispose?.())
</script>
<style scoped>
.map-tracker-overlay{position:relative;box-sizing:border-box;width:100vw;height:100vh;padding:22px 12px 8px;border:1px solid rgba(176,139,76,.7);border-radius:8px;background:rgba(16,19,23,.94);color:#e9e2d4;font:12px/1.3 system-ui;user-select:none;overflow:hidden}
.timer{display:block;font-size:28px;line-height:32px;font-variant-numeric:tabular-nums;color:#e9d2a9}
.details{display:flex;align-items:center;gap:10px;line-height:20px}.map-name{min-width:0;flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.portals{flex-shrink:0;color:#c9c3b8}
.drag-handle{position:absolute;top:0;left:50%;transform:translateX(-50%);width:72px;height:24px;display:flex;align-items:center;justify-content:center;gap:4px;cursor:grab;touch-action:none;z-index:2}.drag-handle:active{cursor:grabbing}.drag-handle span{width:3px;height:3px;border-radius:50%;background:#b08b4c}
</style>
