<template>
  <div v-if="snapshot" class="sanctum-overlay">
    <svg :viewBox="`0 0 ${snapshot.width} ${snapshot.height}`" preserveAspectRatio="none" aria-label="圣所路线与位置">
      <SanctumMapGraph :rooms="snapshot.rooms" :lines="snapshot.lines" marker-id="sanctum-overlay-arrow" />
      <rect v-if="snapshot.highlight" v-bind="snapshot.highlight" class="highlight" />
      <rect v-if="snapshot.ocrRegion" v-bind="snapshot.ocrRegion" class="ocr-region" />
    </svg>
    <aside><b>{{ snapshot.nextRoom ? `推荐下一房：${snapshot.nextRoom}` : '圣所 · 按当前信息评估' }}</b>
      <p>{{ snapshot.reason }}</p><p v-if="snapshot.avoided">手动避让：{{ snapshot.avoided }}</p>
      <p v-if="snapshot.recognitionMessage">{{ snapshot.recognitionMessage }}</p>
      <SanctumMapLegend v-if="snapshot.rooms.length" />
      <p v-for="gap in snapshot.unknown" :key="gap">待确认：{{ gap }}</p><small>{{ stopKey }} 停止 · 鼠标穿透</small>
    </aside>
  </div>
</template>
<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import SanctumMapGraph from './SanctumMapGraph.vue'
import SanctumMapLegend from './SanctumMapLegend.vue'
const snapshot = ref(null), stopKey = ref('全局紧急停止快捷键')
function readStopKey() {
  try { stopKey.value = JSON.parse(localStorage.getItem('settings') || '{}').globalShortcuts?.end || '全局紧急停止快捷键' } catch { stopKey.value = '全局紧急停止快捷键' }
}
let unsubscribe
onMounted(() => { readStopKey(); window.addEventListener('storage', readStopKey); unsubscribe = window.electronAPI?.onSanctumOverlay(value => { snapshot.value = value }) })
onUnmounted(() => { unsubscribe?.(); window.removeEventListener('storage', readStopKey) })
</script>
<style scoped lang="less">
.sanctum-overlay { position: fixed; inset: 0; pointer-events: none; color: #eff3ff; font-size: 14px; }
svg { width: 100%; height: 100%; position: absolute; }
.highlight { fill: #ffdb4033; stroke: #ffdb40; stroke-width: 5; }
.ocr-region { fill: none; stroke: #57c9ff; stroke-width: 3; vector-effect: non-scaling-stroke; }
aside { position: absolute; top: 16px; left: 16px; max-width: 340px; max-height: 45%; overflow: hidden; background: #111827e8; border: 1px solid #53637b; border-radius: 8px; padding: 12px; }
p { margin: 6px 0; } small { color: #adb9cd; }
</style>
