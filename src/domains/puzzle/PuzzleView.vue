<template>
  <div class="puzzle-page primary-page primary-page__scroll primary-page__content">
    <div class="page-heading">
      <div>
        <h2>海图 <el-tag size="small">S30 赛季玩法</el-tag></h2>
        <p>识别 6×10 碎片仓库，计算方案并自动旋转、放入 3×3 海图区。</p>
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
            <el-button size="small" :disabled="executing || analyzing || probingBorder" @click="pickRegion(config.type)">{{ config.pickLabel }}</el-button>
            <el-button size="small" :disabled="executing || analyzing || probingBorder || !config.metadata" :title="clearRegionTitle(config)" @click="clearRegion(config.type)">清空已选</el-button>
            <el-button text size="small" @click="toggleRegion(config.type)">{{ regionExpanded[config.type] ? '收起' : '展开' }}</el-button>
          </div>
        </div>
        <el-collapse-transition>
          <div v-show="regionExpanded[config.type]" class="configuration-body">
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
                <el-button size="small" :disabled="executing || analyzing || probingBorder || !regionMetadata" @click="pickTabPoint(page)">取点</el-button>
              </span>
            </div>
          </div>
        </el-collapse-transition>
      </article>
    </div>
    <div v-if="regionMetadata" class="region-line"><span>快捷键 {{ puzzleShortcut }} 可自动切换并识别两页；{{ emergencyStopShortcut }} 可全局紧急停止</span></div>

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
            <div class="inventory-card-heading">
              <span class="inventory-card-title">
                <strong>碎片仓库</strong>
                <el-tooltip content="点击格子“修正类型”，右键“逆时针旋转角度”；点击格子右上角锁按钮可将该格排除在计算和自动放入之外" placement="top" effect="dark">
                  <el-icon class="inventory-help-icon" tabindex="0" aria-label="查看碎片仓库操作说明"><QuestionFilled /></el-icon>
                </el-tooltip>
              </span>
              <el-button size="small" :disabled="executing || analyzing || probingBorder || !hasInventoryResults" @click="clearAllInventoryPages">清空两页结果</el-button>
            </div>
            <div class="inventory-card-toolbar">
              <div class="inventory-toolbar-group">
                <span class="inventory-toolbar-label">
                  本机校准
                  <el-tooltip content="保存修正会将改过的图块存为本机素材，从下次识别和自动放入校验开始生效" placement="top" effect="dark">
                    <el-icon class="inventory-help-icon" tabindex="0" aria-label="查看本机校准说明"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </span>
                <el-button size="small" :disabled="!pendingCorrectionCount || !savableCorrectionCount || analyzing || executing" :title="calibrationSaveTitle" @click="saveCalibration">
                  保存修正{{ pendingCorrectionCount ? `（${pendingCorrectionCount}）` : '' }}
                </el-button>
                <el-button size="small" @click="calibrationDialogVisible = true">本机素材（{{ calibrationSamples.length }}）</el-button>
              </div>
              <div class="inventory-toolbar-group">
                <span class="inventory-toolbar-label">识别结果</span>
                <el-button type="primary" size="small" :loading="analyzing" :disabled="!regionMetadata || executing || probingBorder" @click="startAnalysis">
                  {{ analyzing ? (analysisProgressText || '正在自动识别…') : '自动识别两页' }}
                </el-button>
                <el-radio-group v-model="selectedInventoryPage" class="inventory-page-tabs" size="small" :disabled="analyzing || executing">
                  <el-radio-button :value="1">第1页</el-radio-button>
                  <el-radio-button :value="2">第2页</el-radio-button>
                </el-radio-group>
                <el-tag :type="currentPageState.recognized ? 'success' : 'info'">
                  {{ currentPageState.recognized ? `可用 ${currentPageAvailableCount} 块` : '未识别' }}
                </el-tag>
                <el-tag v-if="currentPageLockedCount" type="warning">已锁定 {{ currentPageLockedCount }} 格</el-tag>
                <el-tag v-if="uncertainCount" type="warning">{{ uncertainCount }} 格待确认</el-tag>
              </div>
            </div>
          </div>
        </template>

        <div class="inventory-grid">
          <el-tooltip
            v-for="slot in slots"
            :key="`${slot.row}-${slot.column}`"
            placement="top"
            effect="dark"
            :show-after="200"
            :disabled="!slot.occupied && !slot.calibrated && !isSlotLocked(slot)"
          >
            <template #content>
              <div v-for="(line, index) in slotTooltipLines(slot)" :key="`${index}-${line}`" class="mod-tooltip-line">{{ line }}</div>
            </template>
            <div class="inventory-slot-shell">
              <el-dropdown
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
                    locked: isSlotLocked(slot),
                    selected: sourceCellBySlot.has(slotKey(slot))
                  }"
                  :disabled="executing"
                  @contextmenu.prevent="rotateSlot(slot)"
                >
                  <PuzzleGlyph v-if="slot.occupied" :type="slot.type" :orientation="slot.orientation" />
                  <span v-else class="empty-mark">·</span>
                  <em v-if="slot.occupied && slot.uncertain" class="uncertain-mark">?</em>
                  <em v-if="slot.calibrated" class="calibration-mark">校</em>
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
              <button
                class="slot-lock-button"
                :class="{ active: isSlotLocked(slot) }"
                :disabled="executing || resumeIndex > 0"
                :title="lockButtonTitle(slot)"
                :aria-label="lockButtonTitle(slot)"
                @click.stop="toggleSlotLock(slot)"
                @contextmenu.stop.prevent
              >
                <el-icon><Lock v-if="isSlotLocked(slot)" /><Unlock v-else /></el-icon>
              </button>
            </div>
          </el-tooltip>
        </div>

        <div v-if="warnings.length" class="warning-summary">
          <el-icon><Warning /></el-icon>
          {{ warnings.slice(0, 3).map(item => item.message || item).join('；') }}
          <span v-if="warnings.length > 3">等 {{ warnings.length }} 条</span>
        </div>
      </el-card>

      <el-card class="solution-card" shadow="never">
        <template #header>
          <div class="solution-card-header">
            <div class="card-title">
              <span>最优方案</span>
              <el-tag v-if="solutionFeedback" type="warning">无可用方案</el-tag>
              <span v-else-if="result.rewardDataAvailable" class="reward-score">
                <el-tag type="success">相对收益 {{ result.rewardScore }}</el-tag>
                <el-tooltip :content="relativeRewardHelp" placement="top" effect="dark" popper-class="relative-reward-popper">
                  <el-icon class="reward-help-icon" tabindex="0" aria-label="查看相对收益说明"><QuestionFilled /></el-icon>
                </el-tooltip>
              </span>
              <el-tag v-else-if="result.score !== null" type="success">外周出口 {{ result.score }}</el-tag>
            </div>
            <div class="solution-actions">
              <el-select v-model="selectedRewardStrategy" size="small" class="reward-strategy" :disabled="executing || analyzing || probingBorder || resumeIndex > 0" :title="resumeIndex > 0 ? '请先继续完成当前自动放入方案' : ''">
                <el-option v-for="strategy in VOYAGE_REWARD_MODE_OPTIONS" :key="strategy.id" :value="strategy.id" :label="strategy.label" />
              </el-select>
              <small v-if="rewardStrategy === 'auto' && effectiveRewardStrategyLabel" class="effective-reward-strategy">当前自动选择：{{ effectiveRewardStrategyLabel }}</small>
              <el-button v-if="!executing" type="success" size="small" :disabled="!canAutoPlace" :title="autoPlaceBlockedReason" @click="startAutoPlacement">
                {{ resumeIndex > 0 ? `继续自动放入（第 ${resumeIndex + 1} 格）` : '自动放入' }}
              </el-button>
              <el-button v-else type="danger" size="small" @click="stopAutoPlacement">停止自动放入</el-button>
              <small v-if="!executing && !canAutoPlace" class="auto-blocked-reason">{{ autoPlaceBlockedReason }}</small>
            </div>
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
          <el-button size="small" :loading="probingBorder && !borderProbeProgressText" :disabled="probingBorder || executing || analyzing || resumeIndex > 0 || !atlasRegionMetadata" :title="probeBorderBlockedTitle" @click="handleProbeBorderMods">{{ probingBorder && borderProbeProgressText ? borderProbeProgressText : '识别边缘词缀' }}</el-button>
          <el-checkbox :model-value="autoProbeBorderMods" @change="handleAutoProbeChange">完成后自动识别</el-checkbox>
          <el-button size="small" :disabled="executing || !hasExitConstraints" @click="clearExitConstraints">清空出口状态</el-button>
        </div>
        <p class="reward-strategy-note">
          {{ activeRewardStrategy.description }}
          <template v-if="result.rewardDataAvailable">当前按已识别词缀计算相对收益，包含自身、相邻、全航行与边缘影响；该分数只用于方案比较，不是通货估价。</template>
          <template v-else>识别碎片或边缘词缀后启用收益优化；当前仍按外周出口生成方案。</template>
        </p>
        <div class="solution-shell">
            <div class="horizontal-exits top-exits">
                <el-tooltip v-for="id in northExits" :key="id" placement="top" effect="dark" :show-after="200" :disabled="!edgeModLines(id).length">
                    <template #content>
                        <div v-for="line in edgeModLines(id)" :key="line" class="mod-tooltip-line">{{ line }}</div>
                    </template>
                    <button :disabled="executing" :class="exitClasses(id)" :title="exitTitle(id)" @click="toggleRequiredExit(id)" @contextmenu.prevent="toggleForbiddenExit(id)">{{ id }}</button>
                </el-tooltip>
            </div>
            <div class="solution-middle">
              <div class="vertical-exits">
                <el-tooltip v-for="id in westExits" :key="id" placement="left" effect="dark" :show-after="200" :disabled="!edgeModLines(id).length">
                    <template #content>
                        <div v-for="line in edgeModLines(id)" :key="line" class="mod-tooltip-line">{{ line }}</div>
                    </template>
                    <button :disabled="executing" :class="exitClasses(id)" :title="exitTitle(id)" @click="toggleRequiredExit(id)" @contextmenu.prevent="toggleForbiddenExit(id)">{{ id }}</button>
                </el-tooltip>
              </div>
              <div class="solution-grid">
                <el-tooltip
                  v-for="cell in displayCells"
                  :key="cell.index"
                  placement="top"
                  effect="dark"
                  :show-after="200"
                  :disabled="!cell.mask || !solutionCellSlot(cell.index)"
                >
                  <template #content>
                    <div v-for="(line, index) in solutionCellTooltipLines(cell)" :key="`${index}-${line}`" class="mod-tooltip-line">{{ line }}</div>
                  </template>
                  <div class="solution-cell" :class="{ placeholder: !cell.mask }">
                    <PuzzleGlyph v-if="cell.mask" :mask="cell.mask" />
                    <span>{{ cell.index + 1 }}</span>
                  </div>
                </el-tooltip>
              </div>
              <div class="vertical-exits">
                <el-tooltip v-for="id in eastExits" :key="id" placement="right" effect="dark" :show-after="200" :disabled="!edgeModLines(id).length">
                    <template #content>
                        <div v-for="line in edgeModLines(id)" :key="line" class="mod-tooltip-line">{{ line }}</div>
                    </template>
                    <button :disabled="executing" :class="exitClasses(id)" :title="exitTitle(id)" @click="toggleRequiredExit(id)" @contextmenu.prevent="toggleForbiddenExit(id)">{{ id }}</button>
                </el-tooltip>
              </div>
            </div>
            <div class="horizontal-exits bottom-exits">
                <el-tooltip v-for="id in southExits" :key="id" placement="bottom" effect="dark" :show-after="200" :disabled="!edgeModLines(id).length">
                    <template #content>
                        <div v-for="line in edgeModLines(id)" :key="line" class="mod-tooltip-line">{{ line }}</div>
                    </template>
                    <button :disabled="executing" :class="exitClasses(id)" :title="exitTitle(id)" @click="toggleRequiredExit(id)" @contextmenu.prevent="toggleForbiddenExit(id)">{{ id }}</button>
                </el-tooltip>
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
          <div class="chart-complete-row">
            <el-button type="warning" :disabled="executing || analyzing || probingBorder || solving || !currentSolution" @click="completeCurrentChart">当前海图已完成</el-button>
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

    <el-dialog v-model="calibrationDialogVisible" title="海图本机校准素材" width="680px">
      <el-empty v-if="!calibrationSamples.length" description="尚未保存校准素材" :image-size="72" />
      <el-table v-else :data="calibrationSamples" max-height="420">
        <el-table-column label="图块" width="76">
          <template #default="scope"><img class="calibration-thumbnail" :src="scope.row.tileDataUrl" alt="海图校准图块"></template>
        </el-table-column>
        <el-table-column label="标签" width="130">
          <template #default="scope">{{ calibrationLabel(scope.row.labelMask) }}</template>
        </el-table-column>
        <el-table-column label="来源">
          <template #default="scope">第 {{ scope.row.page }} 页 · {{ scope.row.row + 1 }} 行 {{ scope.row.column + 1 }} 列</template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="scope"><el-button text type="danger" @click="removeCalibration(scope.row)">删除</el-button></template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button type="danger" plain :disabled="!calibrationSamples.length" @click="resetCalibration">重置全部</el-button>
        <el-button @click="calibrationDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, Lock, QuestionFilled, Unlock, Warning } from '@element-plus/icons-vue'
import PuzzleGlyph from './PuzzleGlyph.vue'
import { VOYAGE_REWARD_MODE_OPTIONS } from './voyageRewards.js'
import { usePuzzleStore } from '../../stores/puzzle.js'
import { useSettingsStore } from '../settings/settingsStore.js'
import { formatBorderProbeFeedback, fragmentModTooltipLines } from '../../utils/chartModPresentation.js'
import { isEmergencyCancellation } from '../../utils/emergencyStopResult.js'
import { typeForMask } from './solver.js'

const store = usePuzzleStore()
const settingsStore = useSettingsStore()
const {
  regionMetadata,
  inventoryRegionMetadata,
  atlasRegionMetadata,
  inventoryTabPoints,
  selectedInventoryPage,
  inventoryPages,
  lockedSlots,
  calibrationSamples,
  pendingCorrectionCount,
  savableCorrectionCount,
  gridConfidence,
  previews,
  configurationStates,
  slots,
  warnings,
  requiredExits,
  forbiddenExits,
  edges,
  edgesRecognized,
  probingBorder,
  autoProbeBorderMods,
  rewardStrategy,
  analysisProgress,
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
const calibrationDialogVisible = ref(false)
const regionExpanded = reactive({
  inventory: !inventoryRegionMetadata.value,
  atlas: !atlasRegionMetadata.value
})

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
const emergencyStopShortcut = computed(() => settingsStore.globalShortcuts.end || 'Alt+3')
const uncertainCount = computed(() => slots.value.filter(slot => slot.uncertain).length)
const currentPageState = computed(() => inventoryPages.value[selectedInventoryPage.value])
const currentPageAvailableCount = computed(() => slots.value.filter(slot => slot.occupied && !store.isSlotLocked(slot)).length)
const currentPageLockedCount = computed(() => lockedSlots.value.filter(slot => slot.page === selectedInventoryPage.value).length)
const hasInventoryResults = computed(() => [1, 2].some(page => inventoryPages.value[page].recognized))
const relativeRewardHelp = '相对收益是根据已识别词缀的类别、数值、作用范围（自身/相邻/全航行）及边缘增幅，结合当前策略权重计算的启发式比较分。分数越高表示按该权重更优，不代表实际掉落量或通货价格；不同策略权重口径不同，自动模式仍按界面分数直接取最高。'
const calibrationSaveTitle = computed(() => {
  if (!pendingCorrectionCount.value) return '修正类型、空格或角度后可保存'
  if (!savableCorrectionCount.value) return '当前修正缺少截图图块，请重新识别后再保存'
  return `保存 ${savableCorrectionCount.value} 个具有截图图块的修正`
})
const selectedRewardStrategy = computed({
  get: () => rewardStrategy.value,
  set: value => { store.setRewardStrategy(value) }
})
const activeRewardStrategy = computed(() => VOYAGE_REWARD_MODE_OPTIONS.find(strategy => strategy.id === rewardStrategy.value) || VOYAGE_REWARD_MODE_OPTIONS[1])
const effectiveRewardStrategyLabel = computed(() => VOYAGE_REWARD_MODE_OPTIONS.find(strategy => strategy.id === result.value.effectiveStrategy)?.label || '')
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
    if (response?.success) {
      regionExpanded[type] = false
      ElMessage.success(`${type === 'atlas' ? '海图区' : '碎片仓库'}已保存`)
    } else if (response?.error) ElMessage.error(response.error.message || String(response.error))
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
    if (response?.success) {
      regionExpanded[type] = true
      ElMessage.success(`已清空${label}区域`)
    }
    else if (response?.error) ElMessage.error(response.error.message)
  } catch (caught) {
    ElMessage.error(caught?.message || '清空区域失败，请重试')
  }
}

function toggleRegion(type) {
  regionExpanded[type] = !regionExpanded[type]
}

async function startAnalysis() {
  const response = await store.analyze()
  if (isEmergencyCancellation(response)) return
  if (response?.success && solutionFeedback.value) ElMessage.warning(solutionFeedback.value.title)
  else if (response?.success) {
    const skipped = [response.fragmentProbe]
      .filter(stats => stats?.skipped && stats.reason && stats.reason !== 'SKIPPED_BY_REQUEST')
      .map(stats => `${stats.reason}`)
    if (skipped.length) ElMessage.warning(`词缀识别跳过：${skipped.join('；')}`)
    else ElMessage.success('海图碎片识别完成')
  } else if (response?.error) ElMessage.error(response.error.message)
}

function rotateSlot(slot) {
  if (executing.value || !slot.occupied) return
  const step = slot.type === 'cross' ? 0 : 90
  store.updateSlotOrientation(slot.row, slot.column, slot.orientation - step)
}

async function startAutoPlacement() {
  const response = await store.startAutoPlacement({
    operationDelayMs: settingsStore.operationDelayMs,
    adaptiveTiming: settingsStore.adaptiveTiming,
    adaptiveTimeoutMs: settingsStore.adaptiveTimeoutMs,
    fixedTiming: settingsStore.fixedTiming
  })
  if (!response?.success) ElMessage.error(response?.error?.message || '海图自动放入启动失败')
}

async function stopAutoPlacement() {
  await store.stopAutoPlacement('user')
  ElMessage.info('海图自动放入已停止')
}

async function completeCurrentChart() {
  const response = await store.completeCurrentChart()
  if (isEmergencyCancellation(response)) return
  if (!response?.success) ElMessage.error(response?.error?.message || '完成当前海图失败')
  else {
    const baseText = `已扣除当前海图 9 块碎片，剩余 ${occupiedCount.value} 块已重新计算`
    if (response.borderProbe && !response.borderProbe.skipped) {
      const feedback = formatBorderProbeFeedback(response)
      if (feedback.partial) ElMessage.warning(`${baseText}，${feedback.text}`)
      else ElMessage.success(`${baseText}，${feedback.text}`)
    } else ElMessage.warning(`${baseText}，边缘词缀已清空，请点击“识别边缘词缀”`)
  }
}

function updateSlot(slot, command) {
  store.updateSlot(slot.row, slot.column, command === 'empty' ? null : command)
}

function isSlotLocked(slot) {
  return store.isSlotLocked(slot)
}

function lockButtonTitle(slot) {
  if (resumeIndex.value > 0) return '当前自动放入方案尚未完成，暂不能修改固定锁'
  if (executing.value) return '自动放入执行中，暂不能修改固定锁'
  return isSlotLocked(slot) ? '解除固定锁，恢复参与计算和自动放入' : '固定此格，排除计算和自动放入'
}

function toggleSlotLock(slot) {
  if (!store.toggleSlotLock(slot)) ElMessage.warning(lockButtonTitle(slot))
}

async function saveCalibration() {
  try {
    const count = await store.savePendingCorrections()
    ElMessage.success(`已保存 ${count} 个本机校准素材，下次识别和自动放入生效`)
  } catch (caught) {
    ElMessage.error(caught?.message || '保存校准素材失败')
  }
}

function calibrationLabel(mask) {
  const value = Number(mask) & 15
  if (!value) return '空格'
  const type = typeForMask(value)
  return `${typeOptions.find(option => option.value === type)?.label || type} · 掩码 ${value}`
}

async function removeCalibration(sample) {
  try {
    await store.removeCalibration(sample.id)
    ElMessage.success('校准素材已删除')
  } catch (caught) {
    ElMessage.error(caught?.message || '删除校准素材失败')
  }
}

async function resetCalibration() {
  try {
    await ElMessageBox.confirm('确定重置全部海图本机校准素材吗？', '重置确认', { type: 'warning' })
    await store.resetCalibration()
    ElMessage.success('海图本机校准素材已重置')
  } catch (caught) {
    if (caught !== 'cancel' && caught !== 'close') ElMessage.error(caught?.message || '重置校准素材失败')
  }
}

async function clearAllInventoryPages() {
  const response = await store.clearInventoryPages()
  if (response?.success) ElMessage.success('已清空两页识别结果')
  else if (response?.error) ElMessage.error(response.error.message)
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

function slotTooltipLines(slot) {
  const lockedText = isSlotLocked(slot) ? ['已固定：不参与库存计算、方案求解和自动放入'] : []
  const calibratedText = slot.calibrated ? [`本机素材已校准 · 相似度 ${(Number(slot.calibrationSimilarity || 0) * 100).toFixed(1)}%`] : []
  if (!slot.occupied) return [...lockedText, ...calibratedText]
  const name = typeOptions.find(option => option.value === slot.type)?.label || slot.type
  const selectedIndex = sourceCellBySlot.value?.get(slotKey(slot))
  const selectedText = selectedIndex !== undefined ? ` · 已拼入海图第 ${selectedIndex + 1} 格` : ''
  return [
    `${name} · 朝向 ${slot.orientation}° · 置信度 ${Math.round(slot.confidence * 100)}%${selectedText}`,
    ...lockedText,
    ...calibratedText,
    ...fragmentModTooltipLines(slot.mods)
  ]
}

function solutionCellSlot(cellIndex) {
  const source = currentSourceSlots.value.find(source => source.cellIndex === cellIndex)
  if (!source) return null
  const page = Number(source.page || 1)
  return inventoryPages.value[page]?.slots?.[Number(source.row) * 6 + Number(source.column)] || null
}

function solutionCellTooltipLines(cell) {
  const slot = cell.mask ? solutionCellSlot(cell.index) : null
  return slot ? fragmentModTooltipLines(slot.mods) : []
}

function edgeModLines(id) {
  if (!edgesRecognized.value) return ['词缀：未识别']
  const edge = edges.value[id]
  if (!edge) return ['词缀：未知']
  if (edge.status === 'matched' && edge.mod) return [...edge.mod.lines]
  const rawLines = Array.isArray(edge.rawTexts)
    ? edge.rawTexts.filter(line => typeof line === 'string' && line.trim())
    : []
  return rawLines.length ? ['词缀：未知', ...rawLines] : ['词缀：未知']
}

const analysisProgressText = computed(() => {
  const progress = analysisProgress.value
  if (!progress?.stage) return ''
  if (progress.stage === 'copy') {
    return progress.index ? `正在读取碎片词缀 ${progress.index}/${progress.total}` : '正在准备读取碎片词缀…'
  }
  return ''
})

const borderProbeProgressText = computed(() => {
  const progress = analysisProgress.value
  if (!probingBorder.value || progress?.stage !== 'border' || !progress.index) return ''
  return `识别边缘词缀 ${progress.index}/${progress.total}`
})

function clearRegionTitle(config) {
  if (executing.value) return '自动放入进行中，暂不能清空'
  if (analyzing.value) return '识别进行中，暂不能清空'
  if (probingBorder.value) return '边缘词缀识别进行中，暂不能清空'
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

const probeBorderBlockedTitle = computed(() => {
  if (executing.value || analyzing.value) return '海图任务进行中，暂不能识别边缘词缀'
  if (resumeIndex.value > 0) return '请先继续完成当前自动放入方案'
  if (!atlasRegionMetadata.value) return '请先框选 3×3 海图区'
  return ''
})

async function handleProbeBorderMods() {
  const response = await store.probeBorderMods()
  if (isEmergencyCancellation(response)) return
  if (response?.success) {
    const feedback = formatBorderProbeFeedback(response)
    if (feedback.partial) ElMessage.warning(feedback.text)
    else ElMessage.success(feedback.text)
  } else if (response?.error) {
    ElMessage.error(response.error.message)
  }
}

function handleAutoProbeChange(value) {
  store.setAutoProbeBorderMods(Boolean(value))
}

const clearExitConstraints = store.clearExitConstraints

let removeExecutionListener = null
onMounted(() => {
  void store.loadConfiguration()
  removeExecutionListener = store.listenExecution(event => {
    if (event?.status === 'error') ElMessage.error(event.error?.message || event.reason || '海图自动放入失败')
    if (event?.status === 'completed') ElMessage.success('海图自动放入完成')
  })
  void store.refreshExecutionStatus()
})
onUnmounted(() => {
  removeExecutionListener?.()
})

const previousSolution = store.previousSolution
const nextSolution = store.nextSolution
</script>

<style scoped lang="less">
.puzzle-page {
  padding: 20px;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
}
.page-heading,
.card-title,
.solution-card-header,
.solution-pager,
.region-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.page-heading h2 { margin: 0 0 6px; }
.page-heading p { margin: 0; color: var(--el-text-color-secondary); }
.status-alert { margin-top: var(--spacing-md); }
.auto-blocked-reason { max-width: 260px; color: var(--el-color-warning); line-height: 1.35; }
.region-line { margin: 12px 0; font-size: 13px; color: var(--el-text-color-secondary); }
.region-line span { color: var(--el-color-primary); }
.configuration-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
.configuration-card { min-width: 0; padding: 12px; border: 1px solid var(--el-color-warning-light-5); border-radius: 9px; background: var(--el-bg-color); }
.configuration-card.ready { border-color: var(--el-color-success-light-5); }
.configuration-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.configuration-actions { display: flex; align-items: center; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.configuration-body { padding-top: 8px; }
.configuration-card small { display: block; overflow: hidden; margin-top: 7px; color: var(--el-text-color-secondary); text-overflow: ellipsis; white-space: nowrap; }
.tab-point-settings { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 10px; }
.tab-point-settings span { display: inline-flex; align-items: center; gap: 6px; color: var(--el-text-color-secondary); font-size: 12px; }
.inventory-card-header { display: grid; gap: 10px; }
.inventory-card-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.inventory-card-title, .inventory-toolbar-label { display: inline-flex; align-items: center; gap: 5px; }
.inventory-card-title > strong { line-height: 1; }
.inventory-card-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; min-width: 0; }
.inventory-toolbar-group { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 6px 8px; border: 1px solid var(--el-border-color-lighter); border-radius: 6px; }
.inventory-toolbar-label { color: var(--el-text-color-secondary); font-size: 12px; white-space: nowrap; }
.inventory-help-icon { color: var(--el-text-color-secondary); cursor: help; }
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

.inventory-slot-shell { position: relative; width: 100%; aspect-ratio: 1; }
.inventory-slot-shell :deep(.el-dropdown) { display: block; width: 100%; height: 100%; }

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
.inventory-slot.locked {
  border-color: var(--el-color-warning);
  filter: saturate(0.45);
  opacity: 0.68;
}
.inventory-slot.locked::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: repeating-linear-gradient(135deg, transparent 0 6px, rgba(230, 162, 60, 0.13) 6px 12px);
  pointer-events: none;
}
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
.calibration-mark { position: absolute; right: 23px; top: 2px; color: var(--el-color-success); font-size: 10px; font-style: normal; font-weight: 700; }
.slot-lock-button {
  position: absolute;
  z-index: 3;
  top: 2px;
  right: 2px;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 1px solid rgba(144, 147, 153, 0.7);
  border-radius: 4px;
  background: rgba(20, 20, 20, 0.78);
  color: var(--el-text-color-secondary);
  cursor: pointer;
}
.slot-lock-button:hover { border-color: var(--el-color-warning); color: var(--el-color-warning); }
.slot-lock-button.active { border-color: var(--el-color-warning); background: rgba(230, 162, 60, 0.2); color: var(--el-color-warning); }
.slot-lock-button:disabled { cursor: not-allowed; opacity: 0.55; }
.calibration-thumbnail { display: block; width: 48px; height: 48px; object-fit: fill; border-radius: 4px; }
.mod-tooltip-line { line-height: 1.5; }
.warning-summary { margin-top: 12px; color: var(--el-color-warning); font-size: 13px; }

.solution-card { position: relative; }
.solution-card-header { align-items: flex-start; }
.solution-actions { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 8px; }
.reward-score { display: inline-flex; align-items: center; gap: 4px; }
.reward-help-icon { color: var(--el-text-color-secondary); cursor: help; }
:global(.relative-reward-popper) { max-width: 380px; line-height: 1.6; }
.reward-strategy { width: 160px; }
.effective-reward-strategy { color: var(--el-text-color-secondary); white-space: nowrap; }
.reward-strategy-note { margin: 0 0 12px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.6; text-align: center; }
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
.chart-complete-row { display: flex; justify-content: center; margin-top: 12px; }
.total-note { text-align: center; color: var(--el-text-color-secondary); font-size: 13px; margin-bottom: 0; }

@media (max-width: 1050px) {
  .workspace { grid-template-columns: 1fr; }
  .count-strip { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 720px) {
  .page-heading { align-items: flex-start; flex-direction: column; }
  .configuration-grid { grid-template-columns: 1fr; }
  .configuration-heading,
  .solution-card-header,
  .exit-controls { align-items: flex-start; flex-direction: column; }
  .configuration-actions,
  .solution-actions { justify-content: flex-start; }
}
</style>
