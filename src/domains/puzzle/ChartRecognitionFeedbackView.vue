<template>
  <main class="recognition-feedback" :class="[snapshot.kind, snapshot.status]" aria-live="polite">
    <template v-if="snapshot.kind === 'running'">
      <div class="status-row">
        <span class="spinner" aria-hidden="true"></span>
        <strong>{{ stageLabel }}</strong>
        <span v-if="hasProgress" class="progress-count">{{ current }}/{{ total }}</span>
      </div>
      <div v-if="hasProgress" class="progress-track" aria-hidden="true">
        <span :style="{ width: `${progressPercent}%` }"></span>
      </div>
      <p>{{ helperText }}</p>
    </template>
    <template v-else>
      <span class="result-icon" aria-hidden="true">{{ resultIcon }}</span>
      <div class="result-copy">
        <strong>{{ resultTitle }}</strong>
        <p>{{ snapshot.message }}</p>
      </div>
    </template>
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { electronApi } from '../../api/electron.js'

const snapshot = ref({ kind: 'running', stage: 'shape', current: 0, total: 0, status: '' })
const stageLabels = Object.freeze({
  shape: '正在识别碎片形状',
  copy: '正在读取碎片词缀',
  border: '正在识别边缘词缀',
  starting: '正在加载识别组件',
  grid: '正在扫描市集格子'
})
const resultTitles = Object.freeze({
  success: '识别完成',
  partial: '识别部分完成',
  failure: '识别失败',
  stopped: '识别已停止'
})
const resultIcons = Object.freeze({ success: '✓', partial: '!', failure: '×', stopped: '■' })
const current = computed(() => Math.max(0, Number(snapshot.value.current || 0)))
const total = computed(() => Math.max(0, Number(snapshot.value.total || 0)))
const hasProgress = computed(() => total.value > 0)
const progressPercent = computed(() => Math.min(100, Math.round(current.value / Math.max(1, total.value) * 100)))
const isFaustus = computed(() => snapshot.value.scope === 'faustus')
const stageLabel = computed(() => snapshot.value.label || stageLabels[snapshot.value.stage] || '正在识别')
const helperText = computed(() => snapshot.value.detail || (isFaustus.value ? '正在游戏内执行，请勿操作鼠标和键盘' : '识别进行中，请勿移动鼠标'))
const resultTitle = computed(() => isFaustus.value
  ? (snapshot.value.status === 'success' ? '价格识别完成' : '价格识别失败')
  : (resultTitles[snapshot.value.status] || '识别结束'))
const resultIcon = computed(() => resultIcons[snapshot.value.status] || '•')
let removeListener = null

onMounted(() => {
  removeListener = electronApi.puzzle.onRecognitionFeedbackUpdated(data => {
    snapshot.value = { ...snapshot.value, ...data }
  })
})
onUnmounted(() => removeListener?.())
</script>

<style scoped lang="less">
.recognition-feedback {
  position: fixed;
  inset: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  overflow: hidden;
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, .5);
  border-radius: 12px;
  background: rgba(15, 23, 42, .94);
  box-shadow: 0 12px 32px rgba(0, 0, 0, .4);
  font-family: "Microsoft YaHei UI", sans-serif;
}

.running { display: block; }
.status-row { display: flex; align-items: center; gap: 9px; font-size: 15px; }
.progress-count { margin-left: auto; color: #cbd5e1; font-variant-numeric: tabular-nums; }
.progress-track { height: 4px; margin-top: 8px; overflow: hidden; border-radius: 999px; background: rgba(148, 163, 184, .25); }
.progress-track span { display: block; height: 100%; border-radius: inherit; background: #38bdf8; transition: width .18s ease-out; }
.recognition-feedback p { margin: 5px 0 0; color: #cbd5e1; font-size: 12px; }
.spinner { width: 13px; height: 13px; border: 2px solid rgba(56, 189, 248, .35); border-top-color: #38bdf8; border-radius: 50%; animation: spin .8s linear infinite; }
.result-icon { display: grid; place-items: center; flex: 0 0 34px; width: 34px; height: 34px; border-radius: 50%; font-size: 22px; font-weight: 800; background: rgba(148, 163, 184, .18); }
.result-copy { min-width: 0; }
.result-copy strong { font-size: 15px; }
.result-copy p { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.success { border-color: rgba(34, 197, 94, .7); .result-icon { color: #86efac; background: rgba(34, 197, 94, .2); } }
.partial { border-color: rgba(234, 179, 8, .75); .result-icon { color: #fde047; background: rgba(234, 179, 8, .2); } }
.failure { border-color: rgba(239, 68, 68, .75); .result-icon { color: #fca5a5; background: rgba(239, 68, 68, .2); } }
.stopped { border-color: rgba(148, 163, 184, .6); .result-icon { color: #cbd5e1; } }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
