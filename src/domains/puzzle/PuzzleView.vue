<template>
  <div class="puzzle-page">
    <div class="page-heading">
      <div>
        <h2>海图 <el-tag size="small">S30 赛季玩法</el-tag></h2>
        <p>识别 6×10 碎片仓库，计算方案并自动旋转、放入 3×3 海图区。</p>
      </div>
      <div class="heading-actions">
        <el-select
          v-model="recognitionStrength"
          size="small"
          style="width: 92px"
          :disabled="analyzing || executing"
          @change="handleRecognitionStrengthChange"
        >
          <el-option value="sensitive" label="敏感" />
          <el-option value="standard" label="标准" />
          <el-option value="strict" label="严格" />
        </el-select>
        <el-button type="primary" :loading="analyzing" :disabled="!regionMetadata" @click="startAnalysis">
          {{ analyzing ? '正在自动识别两页…' : '自动识别两页' }}
        </el-button>
        <el-button v-if="!executing" type="success" :disabled="!canAutoPlace" :title="autoPlaceBlockedReason" @click="startAutoPlacement">
          {{ resumeIndex > 0 ? `继续自动放入（第 ${resumeIndex + 1} 格）` : '自动放入' }}
        </el-button>
        <el-button v-else type="danger" @click="stopAutoPlacement">停止自动放入</el-button>
        <small v-if="!executing && !canAutoPlace" class="auto-blocked-reason">{{ autoPlaceBlockedReason }}</small>
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
      title="首次使用请先框选完整的 6×10 碎片仓库。"
      :description="`标定两个仓库页签后，识别按钮会自动切换并读取两页；也可按 ${puzzleShortcut} 触发。`"
      type="info"
      show-icon
      :closable="false"
      class="status-alert"
    />

    <div class="configuration-grid">
      <article v-for="config in regionConfigs" :key="config.type" class="configuration-card" :class="{ ready: config.state?.valid }">
        <div class="configuration-heading">
          <strong>{{ config.label }}</strong>
          <div class="configuration-actions">
            <el-tag :type="config.state?.valid ? 'success' : config.metadata ? 'danger' : 'warning'" size="small">{{ config.state?.valid ? '有效' : config.metadata ? '已失效' : '未配置' }}</el-tag>
            <el-button size="small" :disabled="executing || analyzing" @click="pickRegion(config.type)">{{ config.pickLabel }}</el-button>
            <el-button size="small" :disabled="executing || analyzing || !config.metadata" :title="clearRegionTitle(config)" @click="clearRegion(config.type)">清空已选</el-button>
          </div>
        </div>
        <div class="preview-shell">
          <div
            v-if="config.preview"
            class="preview-stage"
            :style="{ '--columns': config.columns, '--rows': config.rows, '--preview-aspect': config.aspect, '--preview-width': `${config.aspect * 220}px` }"
          >
            <img :src="config.preview" :alt="`${config.label}截图预览`">
            <i class="preview-grid" />
          </div>
          <el-empty
            v-else
            :description="config.metadata ? '预览不可用，请重新框选' : '等待截图'"
            :image-size="72"
            class="preview-empty"
          />
        </div>
        <small v-if="config.type === 'inventory' && regionMetadata">
          {{ config.text }} · 网格对齐：{{ gridAlignmentLabel }}<template v-if="gridAlignmentWarning">，建议重新框选</template> · {{ config.state?.message }}
        </small>
        <small v-else>{{ config.text }} · {{ config.state?.message }}</small>
        <div v-if="config.type === 'inventory'" class="tab-point-settings">
          <span v-for="page in [1, 2]" :key="page">
            第 {{ page }} 页页签：{{ tabPointText(page) }}
            <el-button size="small" :disabled="executing || analyzing || !regionMetadata" @click="pickTabPoint(page)">取点</el-button>
          </span>
        </div>
      </article>
      </div>
    <div v-if="regionMetadata" class="region-line"><span>快捷键 {{ puzzleShortcut }} 可自动切换并识别两页；Alt+3 可紧急停止自动放入</span></div>

    <el-alert v-if="executing || ['completed', 'stopped', 'error'].includes(execution.status)" :type="execution.status === 'completed' ? 'success' : execution.status === 'error' ? 'error' : 'info'" :closable="false" show-icon class="status-alert" :title="executionText" />

    <div class="count-strip">
      <div v-for="option in typeOptions" :key="option.value" class="count-card">
        <PuzzleGlyph :type="option.value" />
        <span>{{ option.label }}</span>
        <strong>{{ counts[option.value] }}</strong>
      </div>
      <div class="count-card total" :class="{ insufficient: result.error === 'INSUFFICIENT_FRAGMENTS' }">
        <span>可用总数</span>
        <strong>{{ occupiedCount }}</strong>
      </div>
    </div>

    <div class="workspace">
      <el-card class="inventory-card" shadow="never">
        <template #header>
          <div class="inventory-card-header">
            <strong>碎片仓库</strong>
            <div class="inventory-card-toolbar">
              <span class="inventory-help">点击“修正类型”，右键“逆时针旋转角度”</span>
              <el-radio-group v-model="selectedInventoryPage" class="inventory-page-tabs" size="small" :disabled="analyzing || executing">
                <el-radio-button :value="1">第1页</el-radio-button>
                <el-radio-button :value="2">第2页</el-radio-button>
              </el-radio-group>
              <el-tag :type="currentPageState.recognized ? 'success' : 'info'">
                {{ currentPageState.recognized ? `已识别 ${currentPageOccupiedCount} 块` : '未识别' }}
              </el-tag>
              <el-tag v-if="uncertainCount" type="warning">{{ uncertainCount }} 格待确认</el-tag>
              <el-button size="small" :disabled="executing || !currentPageState.recognized" @click="clearCurrentInventoryPage">清空本页结果</el-button>
            </div>
          </div>
        </template>

        <div class="inventory-grid">
          <el-dropdown
            v-for="slot in slots"
            :key="`${slot.row}-${slot.column}`"
            trigger="click"
            :disabled="executing"
            @command="updateSlot(slot, $event)"
          >
            <button
              class="inventory-slot"
              :class="{
                empty: !slot.occupied,
                uncertain: slot.uncertain,
                corrected: slot.corrected,
                selected: sourceCellBySlot.has(slotKey(slot))
              }"
              :title="slotTitle(slot)"
              :disabled="executing"
              @contextmenu.prevent="rotateSlot(slot)"
            >
              <PuzzleGlyph v-if="slot.occupied" :type="slot.type" :orientation="slot.orientation" />
              <span v-else class="empty-mark">·</span>
              <em v-if="slot.occupied && slot.uncertain" class="uncertain-mark">?</em>
              <em v-if="slot.occupied" class="orientation-badge">{{ slot.orientation }}°</em>
              <b v-if="sourceCellBySlot.has(slotKey(slot))" class="source-index">
                {{ sourceCellBySlot.get(slotKey(slot)) + 1 }}
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
            <el-tag v-if="solutionFeedback" type="warning">无可用方案</el-tag>
            <el-tag v-else-if="result.score !== null" type="success">外周出口 {{ result.score }}</el-tag>
          </div>
        </template>

        <el-alert
          v-if="solutionFeedback"
          :title="solutionFeedback.title"
          :description="solutionFeedback.description"
          type="warning"
          show-icon
          :closable="false"
          class="solution-feedback"
        />

        <div class="exit-controls">
          <p class="exit-help">左键设为必选出口，右键设为禁止出口；同键再点一次恢复默认。绿色表示当前方案已连接。</p>
          <el-button size="small" :disabled="executing || !hasExitConstraints" @click="clearExitConstraints">清空出口状态</el-button>
        </div>
        <div class="solution-shell">
            <div class="horizontal-exits top-exits">
                <button v-for="id in northExits" :key="id" :disabled="executing" :class="exitClasses(id)" :title="exitTitle(id)" @click="toggleRequiredExit(id)" @contextmenu.prevent="toggleForbiddenExit(id)">{{ id }}</button>
            </div>
            <div class="solution-middle">
              <div class="vertical-exits">
                <button v-for="id in westExits" :key="id" :disabled="executing" :class="exitClasses(id)" :title="exitTitle(id)" @click="toggleRequiredExit(id)" @contextmenu.prevent="toggleForbiddenExit(id)">{{ id }}</button>
              </div>
              <div class="solution-grid">
                <div v-for="cell in displayCells" :key="cell.index" class="solution-cell" :class="{ placeholder: !cell.mask }">
                  <PuzzleGlyph v-if="cell.mask" :mask="cell.mask" />
                  <span>{{ cell.index + 1 }}</span>
                </div>
              </div>
              <div class="vertical-exits">
                <button v-for="id in eastExits" :key="id" :disabled="executing" :class="exitClasses(id)" :title="exitTitle(id)" @click="toggleRequiredExit(id)" @contextmenu.prevent="toggleForbiddenExit(id)">{{ id }}</button>
              </div>
            </div>
            <div class="horizontal-exits bottom-exits">
              <button v-for="id in southExits" :key="id" :disabled="executing" :class="exitClasses(id)" :title="exitTitle(id)" @click="toggleRequiredExit(id)" @contextmenu.prevent="toggleForbiddenExit(id)">{{ id }}</button>
            </div>
        </div>

        <template v-if="currentSolution">
          <div class="solution-meta">
            <span v-for="option in typeOptions" :key="option.value">
              {{ option.label }} {{ currentSolution.usage[option.value] }}
            </span>
          </div>
          <div class="solution-pager">
            <el-button :disabled="executing || solutionIndex === 0" @click="previousSolution">上一个</el-button>
            <span>第 {{ solutionIndex + 1 }} / {{ result.solutions.length }} 个展示方案</span>
            <el-button :disabled="executing || solutionIndex + 1 >= result.solutions.length" @click="nextSolution">下一个</el-button>
          </div>
          <p class="total-note">
            同分最优方案共 {{ result.totalOptimalCount }} 个<span v-if="result.truncated">，仅展示前 100 个</span>。
            仓库中高亮的 9 格分别对应方案编号 1–9。
          </p>
        </template>

        <el-empty v-else :description="emptyDescription" />
        <div v-if="loadingVisible" class="solution-loading-mask">
          <div class="solution-loading-spinner">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>正在计算最优方案…</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, Warning } from '@element-plus/icons-vue'
import PuzzleGlyph from './PuzzleGlyph.vue'
import { usePuzzleStore } from '../../stores/puzzle.js'
import { useSettingsStore } from '../settings/settingsStore.js'

const store = usePuzzleStore()
const settingsStore = useSettingsStore()
const {
  regionMetadata,
  inventoryRegionMetadata,
  atlasRegionMetadata,
  inventoryTabPoints,
  selectedInventoryPage,
  inventoryPages,
  recognition,
  gridConfidence,
  previews,
  configurationStates,
  slots,
  warnings,
  requiredExits,
  forbiddenExits,
  solutionIndex,
  solving,
  analyzing,
  error,
  result,
  counts,
  currentSolution,
  currentSourceSlots,
  execution,
  executing,
  canAutoPlace,
  autoPlaceBlockedReason,
  resumeIndex
} = storeToRefs(store)

const loadingVisible = computed(() => solving.value)

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
const currentPageState = computed(() => inventoryPages.value[selectedInventoryPage.value])
const currentPageOccupiedCount = computed(() => slots.value.filter(slot => slot.occupied).length)
const recognitionStrength = computed({
  get: () => recognition.value?.strength || 'standard',
  set: value => { store.setRecognitionStrength(value) }
})
const gridAlignmentLabel = computed(() => gridConfidence.value == null ? '—' : gridConfidence.value >= 0.8 ? '高' : gridConfidence.value >= 0.5 ? '中' : '低')
const gridAlignmentWarning = computed(() => gridConfidence.value != null && gridConfidence.value < 0.5)
const hasExitConstraints = computed(() => Boolean(requiredExits.value.length || forbiddenExits.value.length))
const solutionFeedback = computed(() => {
  if (result.value.error === 'INSUFFICIENT_FRAGMENTS') {
    const missingCount = Math.max(0, 9 - occupiedCount.value)
    return {
      kind: 'insufficient',
      title: '碎片不足，无法填满海图九宫格',
      description: `当前识别到 ${occupiedCount.value} 块，还差 ${missingCount} 块。请补充碎片后重新识别，或点击仓库格修正识别结果。`
    }
  }
  if (result.value.error !== 'NO_SOLUTION') return null
  if (hasExitConstraints.value) {
    return {
      kind: 'constraints',
      title: '现有碎片无法满足当前出口限制',
      description: '请调整必选或禁止出口，或点击“清空出口状态”后重新计算。'
    }
  }
  return {
    kind: 'combination',
    title: '现有碎片类型组合无法拼成完整九宫格',
    description: '碎片总数已经足够，但类型组合无法形成完整连通方案。请补充其他类型，或点击仓库格修正识别结果。'
  }
})
const metadataText = metadata => {
  const region = metadata?.selectedRegion
  if (!region) return '请贴近网格外边框进行截图'
  return `${region.left}, ${region.top} · ${region.right - region.left}×${region.bottom - region.top}px · DPI ${metadata.scaleFactor} · ${metadata.capturedAt ? new Date(metadata.capturedAt).toLocaleString() : '时间未知'}`
}
const previewAspect = (metadata, columns, rows) => {
  const region = metadata?.selectedRegion
  const width = Number(region?.right) - Number(region?.left)
  const height = Number(region?.bottom) - Number(region?.top)
  return width > 0 && height > 0 ? width / height : columns / rows
}
const regionConfigs = computed(() => [
  { type: 'inventory', label: '碎片仓库 6×10', pickLabel: '框选碎片仓库', columns: 6, rows: 10, metadata: inventoryRegionMetadata.value, state: configurationStates.value.inventory, preview: previews.value.inventory, aspect: previewAspect(inventoryRegionMetadata.value, 6, 10), text: metadataText(inventoryRegionMetadata.value) },
  { type: 'atlas', label: '海图区 3×3', pickLabel: '框选海图区', columns: 3, rows: 3, metadata: atlasRegionMetadata.value, state: configurationStates.value.atlas, preview: previews.value.atlas, aspect: previewAspect(atlasRegionMetadata.value, 3, 3), text: metadataText(atlasRegionMetadata.value) }
])
const executionText = computed(() => {
  if (execution.value.status === 'completed') return '海图自动放入和完整终检已完成'
  if (execution.value.status === 'stopped') return `海图自动放入已停止，已完成 ${execution.value.completed || 0}/9 格`
  if (execution.value.error?.code === 'ATLAS_NOT_EMPTY') return `${execution.value.reason}；未发送任何放置点击`
  if (execution.value.status === 'error') return `${execution.value.reason || '海图自动放入失败'}；已完成 ${execution.value.completed || 0}/9 格，可重新同步仓库后继续`
  return `海图自动放入进行中：${execution.value.completed || 0}/9 格${execution.value.currentIndex >= 0 ? `，当前第 ${execution.value.currentIndex + 1} 格` : ''}${execution.value.source?.page ? `，仓库第 ${execution.value.source.page} 页` : ''}`
})
const sourceCellBySlot = computed(() => new Map(currentSourceSlots.value.map(source => [
  `${Number(source.page || 1)}:${source.row}:${source.column}`,
  source.cellIndex
])))
const displayCells = computed(() => currentSolution.value?.cells || Array.from({ length: 9 }, (_, index) => ({ index, mask: 0 })))
const emptyDescription = computed(() => {
  if (!occupiedCount.value) return '识别仓库后将在这里显示方案'
  if (result.value.error === 'INSUFFICIENT_FRAGMENTS') return '可用碎片不足 9 块'
  if (hasExitConstraints.value) return '当前库存无法满足出口限制，请手动调整出口状态或点击“清空出口状态”'
  return '当前库存组合没有可行的连通方案'
})

async function pickRegion(type) {
  try {
    const response = type === 'atlas' ? await store.pickAtlasRegion() : await store.pickInventoryRegion()
    if (response?.success) ElMessage.success(`${type === 'atlas' ? '海图区' : '碎片仓库'}已保存`)
  } catch (caught) {
    ElMessage.error(caught?.message || '框选区域失败')
  }
}

async function clearRegion(type) {
  const label = type === 'atlas' ? '海图区' : '碎片仓库'
  try {
    await ElMessageBox.confirm(`确定清空已框选的${label}区域吗？`, '清空确认', {
      type: 'warning',
      confirmButtonText: '清空',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  try {
    const response = await store.clearRegion(type)
    if (response?.success) ElMessage.success(`已清空${label}区域`)
    else if (response?.error) ElMessage.error(response.error.message)
  } catch (caught) {
    ElMessage.error(caught?.message || '清空区域失败，请重试')
  }
}

async function startAnalysis() {
  const response = await store.analyze()
  if (response?.success && solutionFeedback.value) ElMessage.warning(solutionFeedback.value.title)
  else if (response?.success) ElMessage.success('海图碎片识别完成')
  else if (response?.error) ElMessage.error(response.error.message)
}

function handleRecognitionStrengthChange() {
  if (!regionMetadata.value) return
  void startAnalysis()
}

function rotateSlot(slot) {
  if (executing.value || !slot.occupied) return
  const step = slot.type === 'cross' ? 0 : 90
  store.updateSlotOrientation(slot.row, slot.column, slot.orientation - step)
}

async function startAutoPlacement() {
  const response = await store.startAutoPlacement(
    settingsStore.operationDelayMs,
    settingsStore.adaptiveTiming,
    settingsStore.adaptiveTimeoutMs
  )
  if (!response?.success) ElMessage.error(response?.error?.message || '海图自动放入启动失败')
}

async function stopAutoPlacement() {
  await store.stopAutoPlacement('user')
  ElMessage.info('海图自动放入已停止')
}

function updateSlot(slot, command) {
  store.updateSlot(slot.row, slot.column, command === 'empty' ? null : command)
}

async function clearCurrentInventoryPage() {
  const response = await store.clearInventoryPage(selectedInventoryPage.value)
  if (response?.success) ElMessage.success(`已清空第 ${selectedInventoryPage.value} 页识别结果`)
}

async function pickTabPoint(page) {
  const response = await store.pickInventoryTabPoint(page)
  if (response?.success) ElMessage.success(`第 ${page} 页页签坐标已保存`)
  else if (response?.error) ElMessage.error(response.error.message)
}

function tabPointText(page) {
  const point = inventoryTabPoints.value?.[page]
  return point ? `${point.x}, ${point.y}` : '未标定'
}

function slotKey(slot) {
  return `${Number(slot.page || selectedInventoryPage.value)}:${slot.row}:${slot.column}`
}

function slotTitle(slot) {
  if (!slot.occupied) return `第 ${slot.row + 1} 行第 ${slot.column + 1} 列：空格`
  const name = typeOptions.find(option => option.value === slot.type)?.label || slot.type
  const selectedIndex = sourceCellBySlot.value?.get(slotKey(slot))
  const selectedText = selectedIndex !== undefined ? ` · 已拼入海图第 ${selectedIndex + 1} 格` : ''
  return `${name} · 朝向 ${slot.orientation}° · 置信度 ${Math.round(slot.confidence * 100)}%${selectedText}`
}

function clearRegionTitle(config) {
  if (executing.value) return '自动放入进行中，暂不能清空'
  if (analyzing.value) return '识别进行中，暂不能清空'
  if (!config.metadata) return '尚未框选区域'
  return '清空已选区域'
}

function exitClasses(id) {
  return {
    'exit-button': true,
    achieved: currentSolution.value?.exits.includes(id),
    required: requiredExits.value.includes(id),
    forbidden: forbiddenExits.value.includes(id)
  }
}

function exitTitle(id) {
  if (requiredExits.value.includes(id)) return `${id}：必选出口；左键取消，右键切换为禁止`
  if (forbiddenExits.value.includes(id)) return `${id}：禁止出口；右键取消，左键切换为必选`
  return `${id}：左键设为必选，右键设为禁止`
}

function toggleRequiredExit(id) {
  store.toggleRequiredExit(id)
}

function toggleForbiddenExit(id) {
  store.toggleForbiddenExit(id)
}

const clearExitConstraints = store.clearExitConstraints

let removeExecutionListener = null
onMounted(() => {
  void store.loadConfiguration()
  removeExecutionListener = store.listenExecution(event => {
    if (event?.status === 'error') ElMessage.error(event.error?.message || event.reason || '海图自动放入失败')
    if (event?.status === 'completed') ElMessage.success('海图自动放入完成')
    if (['error', 'stopped'].includes(event?.status)) void store.refreshInventoryAfterExecution()
  })
  void store.refreshExecutionStatus().then(status => {
    if (['error', 'stopped'].includes(status?.status)) return store.refreshInventoryAfterExecution()
    return null
  })
})
onUnmounted(() => {
  removeExecutionListener?.()
})

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
.auto-blocked-reason { max-width: 220px; color: var(--el-color-warning); line-height: 1.35; }
.region-line { margin: 12px 0; font-size: 13px; color: var(--el-text-color-secondary); }
.region-line span { color: var(--el-color-primary); }
.configuration-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
.configuration-card { min-width: 0; padding: 12px; border: 1px solid var(--el-color-warning-light-5); border-radius: 9px; background: var(--el-bg-color); }
.configuration-card.ready { border-color: var(--el-color-success-light-5); }
.configuration-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.configuration-actions { display: flex; align-items: center; gap: 8px; }
.configuration-card small { display: block; overflow: hidden; margin-top: 7px; color: var(--el-text-color-secondary); text-overflow: ellipsis; white-space: nowrap; }
.tab-point-settings { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 10px; }
.tab-point-settings span { display: inline-flex; align-items: center; gap: 6px; color: var(--el-text-color-secondary); font-size: 12px; }
.inventory-card-header { display: grid; gap: 10px; }
.inventory-card-header > strong { display: block; line-height: 1; }
.inventory-card-toolbar { display: flex; align-items: center; gap: 10px; min-width: 0; }
.inventory-help { flex: 1; color: var(--el-text-color-secondary); font-size: 12px; }
.inventory-page-tabs { display: inline-flex; flex: none; flex-direction: row; flex-wrap: nowrap; white-space: nowrap; }
.preview-shell { display: grid; min-height: 236px; padding: 8px; place-items: center; overflow: auto; box-sizing: border-box; border: 1px solid var(--el-border-color); border-radius: 6px; background: var(--el-fill-color-dark); color: var(--el-text-color-secondary); }
.preview-stage { position: relative; width: min(100%, var(--preview-width)); aspect-ratio: var(--preview-aspect); }
.preview-stage img { display: block; width: 100%; height: 100%; object-fit: contain; }
.preview-empty {
  width: 100%;
  padding: 12px 0;
  :deep(.el-empty__description p) { margin: 0; font-size: 12px; }
}
.preview-grid { position: absolute; inset: 0; pointer-events: none; background-image: linear-gradient(to right, rgba(34,211,238,.75) 1px, transparent 1px), linear-gradient(to bottom, rgba(34,211,238,.75) 1px, transparent 1px); background-size: calc(100% / var(--columns)) calc(100% / var(--rows)); }

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
.count-card.total.insufficient {
  border-color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  box-shadow: inset 0 0 0 1px var(--el-color-warning-light-5);
}
.count-card.total.insufficient span,
.count-card.total.insufficient strong { color: var(--el-color-warning-dark-2); }

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
  box-sizing: border-box;
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
.inventory-slot.uncertain {
  border-style: dashed;
  border-color: var(--el-color-warning);
  background: #313131;
}
.inventory-slot.corrected::after { content: ''; position: absolute; right: 3px; top: 3px; width: 6px; height: 6px; border-radius: 50%; background: var(--el-color-primary); }
.inventory-slot.selected { border-width: 5px; border-color: var(--el-color-primary); }
.inventory-slot.selected.uncertain {
  border-width: 5px;
  border-color: var(--el-color-primary);
  background: #313131;
}
.empty-mark { font-size: 24px; }
.uncertain-mark {
  position: absolute;
  left: 3px;
  bottom: 1px;
  color: var(--el-color-warning);
  font-size: 11px;
  font-weight: 700;
  font-style: normal;
  line-height: 1;
  pointer-events: none;
}
.source-index {
  position: absolute;
  left: 2px;
  top: 2px;
  min-width: 14px;
  padding: 1px 3px;
  border-radius: 3px;
  border: 1px solid rgba(64, 158, 255, 0.65);
  background: rgba(64, 158, 255, 0.12);
  color: var(--el-color-primary);
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  line-height: 1.2;
}
.orientation-badge { position: absolute; right: 2px; bottom: 1px; color: #d1fae5; font-size: 9px; font-style: normal; }
.warning-summary { margin-top: 12px; color: var(--el-color-warning); font-size: 13px; }

.solution-card { position: relative; }
.solution-loading-mask {
  position: absolute;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.88);
}
.solution-loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--el-color-primary);
  font-size: 14px;
}
.solution-loading-spinner .el-icon { font-size: 42px; }
.solution-feedback { margin-bottom: 14px; }
.exit-controls { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 0 0 10px; }
.exit-help { text-align: center; color: var(--el-text-color-secondary); margin: 0; }
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
.exit-button.forbidden { color: var(--el-color-danger); border-color: var(--el-color-danger); background: var(--el-color-danger-light-9); text-decoration: line-through; font-weight: 700; }
.solution-meta { display: flex; justify-content: center; flex-wrap: wrap; gap: 12px; margin: 16px 0 10px; font-size: 13px; }
.solution-pager { justify-content: center; }
.total-note { text-align: center; color: var(--el-text-color-secondary); font-size: 13px; margin-bottom: 0; }

@media (max-width: 1050px) {
  .workspace { grid-template-columns: 1fr; }
  .count-strip { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 720px) {
  .page-heading { align-items: flex-start; flex-direction: column; }
  .heading-actions { flex-wrap: wrap; }
  .configuration-grid { grid-template-columns: 1fr; }
  .configuration-heading,
  .exit-controls { align-items: flex-start; flex-direction: column; }
}
</style>
