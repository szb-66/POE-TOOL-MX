<template>
  <div class="puzzle-page">
    <div class="page-heading">
      <div>
        <h2>九宫格</h2>
        <p>识别右侧 6×10 碎片仓库，计算内部完全相连且外周出口最多的方案。</p>
      </div>
      <div class="heading-actions">
        <el-button @click="pickRegion">框选仓库区域</el-button>
        <el-button type="primary" :loading="analyzing" :disabled="!regionMetadata" @click="startAnalysis">
          {{ analyzing ? '正在识别…' : '开始识别' }}
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="error"
      :title="error.message"
      type="error"
      show-icon
      :closable="false"
      class="status-alert"
    />
    <el-alert
      v-else-if="!regionMetadata"
      title="首次使用请先框选右侧完整的 6×10 碎片仓库。"
      :description="`页面按钮会自动切换到游戏并立即识别；也可按 ${puzzleShortcut} 触发。`"
      type="info"
      show-icon
      :closable="false"
      class="status-alert"
    />

    <div v-if="regionMetadata" class="region-line">
      已配置区域：{{ regionText }}
      <span>快捷键 {{ puzzleShortcut }} 可在游戏前台立即分析</span>
    </div>

    <div class="count-strip">
      <div v-for="option in typeOptions" :key="option.value" class="count-card">
        <PuzzleGlyph :type="option.value" />
        <span>{{ option.label }}</span>
        <strong>{{ counts[option.value] }}</strong>
      </div>
      <div class="count-card total">
        <span>可用总数</span>
        <strong>{{ occupiedCount }}</strong>
      </div>
    </div>

    <div class="workspace">
      <el-card class="inventory-card" shadow="never">
        <template #header>
          <div class="card-title">
            <span>碎片仓库（点击格子可修正）</span>
            <el-tag v-if="uncertainCount" type="warning">{{ uncertainCount }} 格待确认</el-tag>
          </div>
        </template>

        <div class="inventory-grid">
          <el-dropdown
            v-for="slot in slots"
            :key="`${slot.row}-${slot.column}`"
            trigger="click"
            @command="updateSlot(slot, $event)"
          >
            <button
              class="inventory-slot"
              :class="{
                empty: !slot.occupied,
                uncertain: slot.uncertain,
                corrected: slot.corrected,
                selected: sourceCellBySlot.has(`${slot.row}:${slot.column}`)
              }"
              :title="slotTitle(slot)"
            >
              <PuzzleGlyph v-if="slot.occupied" :type="slot.type" :orientation="slot.orientation" />
              <span v-else class="empty-mark">·</span>
              <b v-if="sourceCellBySlot.has(`${slot.row}:${slot.column}`)" class="source-index">
                {{ sourceCellBySlot.get(`${slot.row}:${slot.column}`) + 1 }}
              </b>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="empty">空格</el-dropdown-item>
                <el-dropdown-item v-for="option in typeOptions" :key="option.value" :command="option.value">
                  {{ option.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <div v-if="warnings.length" class="warning-summary">
          <el-icon><Warning /></el-icon>
          {{ warnings.slice(0, 3).map(item => item.message || item).join('；') }}
          <span v-if="warnings.length > 3">等 {{ warnings.length }} 条</span>
        </div>
      </el-card>

      <el-card class="solution-card" shadow="never">
        <template #header>
          <div class="card-title">
            <span>最优方案</span>
            <el-tag v-if="result.score !== null" type="success">外周出口 {{ result.score }}</el-tag>
          </div>
        </template>

        <p class="exit-help">点击外周编号可设为必选出口；绿色表示当前方案已连接。</p>
        <div class="solution-shell">
            <div class="horizontal-exits top-exits">
              <button v-for="id in northExits" :key="id" :class="exitClasses(id)" @click="toggleExit(id)">{{ id }}</button>
            </div>
            <div class="solution-middle">
              <div class="vertical-exits">
                <button v-for="id in westExits" :key="id" :class="exitClasses(id)" @click="toggleExit(id)">{{ id }}</button>
              </div>
              <div class="solution-grid">
                <div v-for="cell in displayCells" :key="cell.index" class="solution-cell" :class="{ placeholder: !cell.mask }">
                  <PuzzleGlyph v-if="cell.mask" :mask="cell.mask" />
                  <span>{{ cell.index + 1 }}</span>
                </div>
              </div>
              <div class="vertical-exits">
                <button v-for="id in eastExits" :key="id" :class="exitClasses(id)" @click="toggleExit(id)">{{ id }}</button>
              </div>
            </div>
            <div class="horizontal-exits bottom-exits">
              <button v-for="id in southExits" :key="id" :class="exitClasses(id)" @click="toggleExit(id)">{{ id }}</button>
            </div>
        </div>

        <template v-if="currentSolution">
          <div class="solution-meta">
            <span v-for="option in typeOptions" :key="option.value">
              {{ option.label }} {{ currentSolution.usage[option.value] }}
            </span>
          </div>
          <div class="solution-pager">
            <el-button :disabled="solutionIndex === 0" @click="previousSolution">上一个</el-button>
            <span>第 {{ solutionIndex + 1 }} / {{ result.solutions.length }} 个展示方案</span>
            <el-button :disabled="solutionIndex + 1 >= result.solutions.length" @click="nextSolution">下一个</el-button>
          </div>
          <p class="total-note">
            同分最优方案共 {{ result.totalOptimalCount }} 个<span v-if="result.truncated">，仅展示前 100 个</span>。
            仓库中高亮的 9 格分别对应方案编号 1–9。
          </p>
        </template>

        <el-empty v-else :description="emptyDescription">
          <el-button v-if="requiredExits.length" @click="clearRequiredExits">清空必选出口</el-button>
        </el-empty>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'
import PuzzleGlyph from './PuzzleGlyph.vue'
import { usePuzzleStore } from '../../stores/puzzle.js'
import { useSettingsStore } from '../settings/settingsStore.js'

const store = usePuzzleStore()
const settingsStore = useSettingsStore()
const {
  regionMetadata,
  slots,
  warnings,
  requiredExits,
  solutionIndex,
  analyzing,
  error,
  result,
  counts,
  currentSolution,
  currentSourceSlots
} = storeToRefs(store)

const typeOptions = [
  { value: 'endpoint', label: '单边' },
  { value: 'straight', label: '直线' },
  { value: 'corner', label: '拐角' },
  { value: 'tee', label: '三向' },
  { value: 'cross', label: '十字' }
]
const northExits = ['N0', 'N1', 'N2']
const eastExits = ['E0', 'E1', 'E2']
const southExits = ['S0', 'S1', 'S2']
const westExits = ['W0', 'W1', 'W2']

const occupiedCount = computed(() => Object.values(counts.value).reduce((sum, count) => sum + count, 0))
const puzzleShortcut = computed(() => settingsStore.globalShortcuts.puzzleAnalyze || 'Alt+7')
const uncertainCount = computed(() => slots.value.filter(slot => slot.uncertain).length)
const regionText = computed(() => {
  const region = regionMetadata.value?.selectedRegion
  if (!region) return '未配置'
  return `${region.left}, ${region.top} · ${region.right - region.left}×${region.bottom - region.top}px · DPI ${regionMetadata.value.scaleFactor}`
})
const sourceCellBySlot = computed(() => new Map(currentSourceSlots.value.map(source => [
  `${source.row}:${source.column}`,
  source.cellIndex
])))
const displayCells = computed(() => currentSolution.value?.cells || Array.from({ length: 9 }, (_, index) => ({ index, mask: 0 })))
const emptyDescription = computed(() => {
  if (!occupiedCount.value) return '识别仓库后将在这里显示方案'
  if (result.value.error === 'INSUFFICIENT_FRAGMENTS') return '可用碎片不足 9 块'
  if (requiredExits.value.length) return '当前库存无法满足这些必选出口'
  return '当前库存组合没有可行的连通方案'
})

async function pickRegion() {
  try {
    const response = await store.pickInventoryRegion()
    if (response?.success) ElMessage.success('碎片仓库区域已保存')
  } catch (caught) {
    ElMessage.error(caught?.message || '框选区域失败')
  }
}

async function startAnalysis() {
  const response = await store.analyze()
  if (response?.success) ElMessage.success('九宫格碎片识别完成')
  else if (response?.error) ElMessage.error(response.error.message)
}

function updateSlot(slot, command) {
  store.updateSlot(slot.row, slot.column, command === 'empty' ? null : command)
}

function slotTitle(slot) {
  if (!slot.occupied) return `第 ${slot.row + 1} 行第 ${slot.column + 1} 列：空格`
  const name = typeOptions.find(option => option.value === slot.type)?.label || slot.type
  return `${name} · 朝向 ${slot.orientation}° · 置信度 ${Math.round(slot.confidence * 100)}%`
}

function exitClasses(id) {
  return {
    'exit-button': true,
    achieved: currentSolution.value?.exits.includes(id),
    required: requiredExits.value.includes(id)
  }
}

function toggleExit(id) {
  store.toggleRequiredExit(id)
}

function clearRequiredExits() {
  for (const id of [...requiredExits.value]) store.toggleRequiredExit(id)
}

const previousSolution = store.previousSolution
const nextSolution = store.nextSolution
</script>

<style scoped lang="less">
.puzzle-page {
  padding: var(--spacing-lg);
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
}

.page-heading,
.card-title,
.solution-pager,
.region-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.page-heading h2 { margin: 0 0 6px; }
.page-heading p { margin: 0; color: var(--el-text-color-secondary); }
.heading-actions { display: flex; gap: 10px; flex-shrink: 0; }
.status-alert { margin-top: var(--spacing-md); }
.region-line { margin: 12px 0; font-size: 13px; color: var(--el-text-color-secondary); }
.region-line span { color: var(--el-color-primary); }

.count-strip {
  display: grid;
  grid-template-columns: repeat(6, minmax(100px, 1fr));
  gap: 10px;
  margin: 16px 0;
}

.count-card {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
  color: var(--el-color-success);
}
.count-card span { color: var(--el-text-color-regular); }
.count-card strong { color: var(--el-text-color-primary); font-size: 18px; }
.count-card.total { grid-template-columns: 1fr auto; }

.workspace {
  display: grid;
  grid-template-columns: minmax(390px, 1fr) minmax(440px, 1.1fr);
  gap: 16px;
  align-items: start;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(42px, 1fr));
  gap: 5px;
  max-width: 560px;
  margin: 0 auto;
}

.inventory-slot {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  padding: 9px;
  border: 1px solid var(--el-border-color);
  border-radius: 5px;
  background: #13251f;
  color: #72ffb4;
  cursor: pointer;
}
.inventory-slot:hover { border-color: var(--el-color-primary); }
.inventory-slot.empty { background: var(--el-fill-color-lighter); color: var(--el-text-color-placeholder); }
.inventory-slot.uncertain { border-color: var(--el-color-warning); box-shadow: inset 0 0 0 1px var(--el-color-warning); }
.inventory-slot.corrected::after { content: ''; position: absolute; right: 3px; top: 3px; width: 6px; height: 6px; border-radius: 50%; background: var(--el-color-primary); }
.inventory-slot.selected { border-color: #f5c451; box-shadow: 0 0 0 2px #f5c451; }
.empty-mark { font-size: 24px; }
.source-index { position: absolute; left: 2px; top: 1px; color: #f5c451; font-size: 12px; }
.warning-summary { margin-top: 12px; color: var(--el-color-warning); font-size: 13px; }

.exit-help { text-align: center; color: var(--el-text-color-secondary); margin: 0 0 10px; }
.solution-shell {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 42px;
  grid-template-rows: 30px auto 30px;
  column-gap: 6px;
  row-gap: 8px;
  width: min(100%, 390px);
  margin: 0 auto;
  overflow: visible;
}
.solution-middle {
  display: grid;
  grid-column: 1 / -1;
  grid-row: 2;
  grid-template-columns: 42px minmax(0, 1fr) 42px;
  gap: 6px;
  min-width: 0;
}
.solution-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
  min-width: 0;
  overflow: hidden;
  border: 2px solid var(--el-border-color);
}
.solution-cell {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  aspect-ratio: 1;
  padding: 17%;
  color: var(--el-color-primary);
  border: 1px solid var(--el-border-color);
  background: var(--el-fill-color-light);
}
.solution-cell.placeholder { background: var(--el-fill-color-lighter); }
.solution-cell span { position: absolute; left: 5px; top: 3px; color: var(--el-text-color-secondary); font-size: 11px; }
.horizontal-exits {
  display: grid;
  grid-column: 2;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  min-height: 30px;
  position: relative;
  z-index: 2;
}
.top-exits { grid-row: 1; }
.bottom-exits { grid-row: 3; }
.vertical-exits { display: grid; grid-template-rows: repeat(3, minmax(0, 1fr)); gap: 4px; min-width: 0; }
.exit-button { min-width: 0; min-height: 30px; border: 1px solid var(--el-border-color); border-radius: 5px; background: var(--el-fill-color-lighter); color: var(--el-text-color-secondary); cursor: pointer; font-size: 11px; line-height: 1; }
.exit-button.achieved { color: var(--el-color-success); border-color: var(--el-color-success); background: var(--el-color-success-light-9); }
.exit-button.required { outline: 2px solid var(--el-color-warning); outline-offset: -2px; font-weight: 700; }
.solution-meta { display: flex; justify-content: center; flex-wrap: wrap; gap: 12px; margin: 16px 0 10px; font-size: 13px; }
.solution-pager { justify-content: center; }
.total-note { text-align: center; color: var(--el-text-color-secondary); font-size: 13px; margin-bottom: 0; }

@media (max-width: 1050px) {
  .workspace { grid-template-columns: 1fr; }
  .count-strip { grid-template-columns: repeat(3, 1fr); }
}
</style>
