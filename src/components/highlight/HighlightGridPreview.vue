<template>
  <div class="highlight-grid-preview">
    <div class="highlight-grid-preview__controls">
      <el-switch v-model="showGridColors" active-text="显示网格颜色" />
      <el-switch v-model="showCenterDots" active-text="显示中心圆点" />
    </div>
    <div class="highlight-grid-preview__canvas">
      <img :src="imageSrc" :alt="alt" />
      <div
        class="highlight-grid-preview__overlay"
        :class="{ 'is-grid-color-hidden': !showGridColors, 'is-center-dot-hidden': !showCenterDots }"
        :style="overlayStyle"
      >
        <div
          v-for="cell in cells"
          :key="cellKey(cell)"
          class="highlight-grid-preview__cell"
          :class="[`is-${visualState(cell)}`]"
          :title="cellTitle(cell)"
          :aria-label="cellAriaLabel(cell)"
        ></div>
      </div>
    </div>
    <div class="highlight-grid-preview__hint">
      当前预览仅供核对识别结果（绿色：高亮候选；橙色：模糊跳过；白色：灰暗；弱白：空格）。
    </div>
    <div class="highlight-grid-preview__legend">
      <span><i class="is-highlighted" />高亮 {{ counts.highlighted }}</span>
      <span><i class="is-dimmed" />灰暗 {{ counts.dimmed }}</span>
      <span><i class="is-empty" />空格 {{ counts.empty }}</span>
      <span v-if="counts.uncertain"><i class="is-uncertain" />模糊 {{ counts.uncertain }}</span>
      <span v-if="counts.unknown"><i class="is-unknown" />未知 {{ counts.unknown }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  imageSrc: { type: String, required: true },
  alt: { type: String, default: '高亮识别网格预览' },
  cells: { type: Array, default: () => [] },
  columns: { type: Number, required: true },
  rows: { type: Number, required: true },
  decisionMode: { type: Boolean, default: false }
})
const showGridColors = ref(true)
const showCenterDots = ref(true)
const overlayStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
  gridTemplateRows: `repeat(${props.rows}, 1fr)`
}))
const counts = computed(() => props.cells.reduce((result, cell) => {
  const state = visualState(cell)
  result[state] = (result[state] || 0) + 1
  return result
}, { highlighted: 0, dimmed: 0, empty: 0, uncertain: 0, unknown: 0 }))

function cellKey(cell) { return `${cell.column}:${cell.row}` }
function effectiveLabel(cell) { return cell.label || 'unknown' }
function visualState(cell) {
  if (!props.decisionMode) return effectiveLabel(cell)
  if (cell.decision === 'candidate') return 'highlighted'
  if (cell.decision === 'uncertain') return 'uncertain'
  return effectiveLabel(cell)
}
function labelName(label) {
  return ({ highlighted: '高亮', dimmed: '灰暗', empty: '空格', uncertain: '模糊', unknown: '未知' })[label] || label
}
function probability(cell) {
  const value = Number(cell.probability)
  return Number.isFinite(value) ? ` ${(value * 100).toFixed(1)}%` : ''
}
function cellTitle(cell) {
  const boostHint = cell.borderBoosted ? '（外缘金边增强）' : ''
  return `列 ${cell.column + 1} 行 ${cell.row + 1}：${labelName(visualState(cell))}${probability(cell)}${boostHint}`
}
function cellAriaLabel(cell) {
  return `第 ${cell.column + 1} 列第 ${cell.row + 1} 行，当前${labelName(visualState(cell))}`
}
</script>

<style scoped lang="less">
.highlight-grid-preview { display: grid; gap: 10px; }
.highlight-grid-preview__controls { display: flex; align-items: center; flex-wrap: wrap; gap: 24px; }
.highlight-grid-preview__canvas { position: relative; width: min(100%, 1100px); overflow: hidden; border: 1px solid var(--border-base); border-radius: 6px; line-height: 0; }
.highlight-grid-preview__canvas > img { display: block; width: 100%; height: auto; }
.highlight-grid-preview__overlay { position: absolute; inset: 0; display: grid; line-height: normal; }
.highlight-grid-preview__cell { position: relative; min-width: 0; min-height: 0; padding: 0; border: 2px solid var(--highlight-label-color); border-radius: 0; background: transparent; }
.highlight-grid-preview__cell::after { position: absolute; top: 50%; left: 50%; width: 9px; height: 9px; border-radius: 50%; background: var(--highlight-label-color); box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.7); content: ''; pointer-events: none; transform: translate(-50%, -50%); }
.is-highlighted { --highlight-label-color: rgba(65, 220, 92, 0.95); }
.is-dimmed { --highlight-label-color: rgba(205, 210, 218, 0.88); }
.is-empty { --highlight-label-color: rgba(255, 255, 255, 0.28); }
.is-uncertain, .is-unknown { --highlight-label-color: rgba(230, 168, 45, 0.95); }
.is-grid-color-hidden .highlight-grid-preview__cell { border-color: transparent; }
.is-center-dot-hidden .highlight-grid-preview__cell::after { display: none; }
.highlight-grid-preview__hint { color: var(--text-secondary); font-size: 12px; }
.highlight-grid-preview__legend { display: flex; align-items: center; flex-wrap: wrap; gap: 14px; color: var(--text-secondary); font-size: 12px; }
.highlight-grid-preview__legend span { display: inline-flex; align-items: center; gap: 5px; }
.highlight-grid-preview__legend i { position: relative; width: 16px; height: 16px; border: 2px solid var(--highlight-label-color); border-radius: 3px; background: transparent; }
.highlight-grid-preview__legend i::after { position: absolute; top: 50%; left: 50%; width: 5px; height: 5px; border-radius: 50%; background: var(--highlight-label-color); content: ''; transform: translate(-50%, -50%); }
</style>
