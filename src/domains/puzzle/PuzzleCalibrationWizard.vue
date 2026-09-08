<template>
  <el-dialog
    :model-value="modelValue"
    title="校准本机素材"
    width="760px"
    :destroy-on-close="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="current" class="wizard-summary">
      <span>第 {{ current.page }} 页 · {{ current.row + 1 }} 行 {{ current.column + 1 }} 列</span>
      <el-tag type="warning">剩余 {{ calibrationQueue.length }} 项</el-tag>
      <el-tag v-if="completedCount" type="success">本次已完成 {{ completedCount }} 项</el-tag>
    </div>

    <div v-if="current" class="wizard-body">
      <section class="source-panel">
        <h3>本轮原图</h3>
        <img v-if="current.capture?.tileDataUrl" :src="current.capture.tileDataUrl" alt="待校准海图原始图块">
        <el-empty v-else description="缺少本轮截图，请重新识别" :image-size="72" />
        <p>{{ current.slot.candidate ? '图像初扫：候选格' : '图像初扫：空格' }}</p>
      </section>

      <section class="result-panel">
        <h3>识别结果与修正</h3>
        <div class="result-row">
          <span>复制类型</span>
          <strong v-if="current.typeLocked">{{ typeLabel(current.slot.type) }}（{{ current.slot.shapeLabel || '已复制确认' }}）</strong>
          <el-select v-else v-model="selectedType" placeholder="请选择空格或碎片类型" class="type-select">
            <el-option label="空格" value="empty" />
            <el-option v-for="option in typeOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
        </div>
        <el-alert
          v-if="current.typeLocked"
          title="类型来自游戏复制文本，只能校准方向"
          type="success"
          :closable="false"
          show-icon
        />
        <el-alert
          v-else-if="!selectedType"
          title="复制未获得有效形状，请先选择空格或正确类型"
          type="warning"
          :closable="false"
          show-icon
        />

        <template v-if="selectedPuzzleType">
          <div class="direction-preview">
            <PuzzleGlyph :type="selectedPuzzleType" :orientation="selectedOrientation" />
            <div>
              <strong>{{ typeLabel(selectedPuzzleType) }} · {{ selectedOrientation }}°</strong>
              <small>{{ confidenceText }}</small>
            </div>
          </div>
          <div class="result-row direction-row">
            <span>正确方向</span>
            <el-radio-group v-model="selectedOrientation" size="small">
              <el-radio-button v-for="orientation in orientationOptions" :key="orientation" :value="orientation">
                {{ orientation }}°
              </el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <div v-else-if="selectedType === 'empty'" class="empty-choice">本格将确认为空格，并保存空格视觉素材。</div>
      </section>
    </div>

    <el-result v-else icon="success" title="本轮校准已完成" sub-title="已保存的结果会立即用于仓库求解，并在下次识别时复用。" />

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">关闭</el-button>
      <el-button
        v-if="current"
        type="primary"
        :loading="saving"
        :disabled="!canSave"
        @click="saveAndNext"
      >
        {{ calibrationQueue.length === 1 ? '保存并完成' : '保存并下一个' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import PuzzleGlyph from './PuzzleGlyph.vue'
import { usePuzzleStore } from '../../stores/puzzle.js'

defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue'])

const store = usePuzzleStore()
const { calibrationQueue } = storeToRefs(store)
const saving = ref(false)
const completedCount = ref(0)
const selectedType = ref('')
const selectedOrientation = ref(0)

const typeOptions = Object.freeze([
  { value: 'endpoint', label: '单边' },
  { value: 'straight', label: '直线' },
  { value: 'corner', label: '拐角' },
  { value: 'tee', label: '三向' },
  { value: 'cross', label: '十字' }
])

const current = computed(() => calibrationQueue.value[0] || null)
const selectedPuzzleType = computed(() => typeOptions.some(option => option.value === selectedType.value) ? selectedType.value : null)
const orientationOptions = computed(() => {
  if (selectedPuzzleType.value === 'cross') return [0]
  if (selectedPuzzleType.value === 'straight') return [0, 90]
  return selectedPuzzleType.value ? [0, 90, 180, 270] : []
})
const selectedDirection = computed(() => current.value?.capture?.directionCandidates?.[selectedPuzzleType.value] || null)
const confidenceText = computed(() => {
  const confidence = Number(selectedDirection.value?.confidence ?? current.value?.slot?.directionConfidence ?? 0)
  const status = confidence >= 0.72 ? '高置信' : confidence >= 0.35 ? '中置信' : '低置信，建议确认'
  return `图像方向置信度 ${Math.round(confidence * 100)}% · ${status}`
})
const canSave = computed(() => Boolean(
  current.value?.capture?.tileDataUrl && selectedType.value &&
  (selectedType.value === 'empty' || orientationOptions.value.includes(Number(selectedOrientation.value)))
))

function typeLabel(type) {
  return typeOptions.find(option => option.value === type)?.label || type || '未知'
}

function resetSelection(item) {
  if (!item) {
    selectedType.value = ''
    selectedOrientation.value = 0
    return
  }
  const initialType = item.typeLocked || item.manualCorrection ? item.slot.type : null
  selectedType.value = initialType || (item.manualCorrection && item.slot.typeSource === 'manual' ? 'empty' : '')
  const suggestion = initialType ? item.capture?.directionCandidates?.[initialType] : null
  selectedOrientation.value = Number(item.slot.type === initialType ? item.slot.orientation : suggestion?.orientation) || 0
}

watch(() => current.value?.key, () => resetSelection(current.value), { immediate: true })
watch(() => calibrationQueue.value.length, (length, previous) => {
  if (previous === 0 && length > 0) completedCount.value = 0
})
watch(selectedPuzzleType, type => {
  if (!type) {
    selectedOrientation.value = 0
    return
  }
  const suggestion = current.value?.capture?.directionCandidates?.[type]
  if (!orientationOptions.value.includes(Number(selectedOrientation.value)) || current.value?.slot.type !== type) {
    selectedOrientation.value = Number(suggestion?.orientation) || 0
  }
})

async function saveAndNext() {
  if (!current.value || !canSave.value || saving.value) return
  const key = current.value.key
  saving.value = true
  try {
    await store.saveCalibrationItem(key, {
      type: selectedType.value === 'empty' ? null : selectedType.value,
      orientation: selectedOrientation.value
    })
    completedCount.value += 1
    if (calibrationQueue.value.length) ElMessage.success('当前项已保存，继续校准下一项')
    else ElMessage.success('本轮本机校准已完成')
  } catch (caught) {
    ElMessage.error(caught?.message || '当前校准项保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="less">
.wizard-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  color: var(--el-text-color-secondary);
}

.wizard-body {
  display: grid;
  grid-template-columns: minmax(240px, .9fr) minmax(320px, 1.1fr);
  gap: 18px;
}

.source-panel,
.result-panel {
  min-height: 330px;
  padding: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

h3 { margin: 0 0 14px; font-size: 15px; }

.source-panel img {
  display: block;
  width: min(100%, 260px);
  aspect-ratio: 1;
  margin: 0 auto 12px;
  border-radius: 6px;
  background: var(--el-color-success-light-9);
  image-rendering: pixelated;
}

.source-panel p { margin: 0; text-align: center; color: var(--el-text-color-secondary); }
.result-panel { display: grid; align-content: start; gap: 14px; }
.result-row { display: grid; grid-template-columns: 76px 1fr; align-items: center; gap: 10px; }
.result-row > span { color: var(--el-text-color-secondary); }
.type-select { width: 100%; }
.direction-preview { display: grid; grid-template-columns: 86px 1fr; align-items: center; gap: 14px; padding: 14px; border-radius: 8px; background: var(--el-color-success-light-9); color: var(--success-color); }
.direction-preview :deep(svg) { width: 78px; height: 78px; }
.direction-preview div { display: grid; gap: 5px; }
.direction-preview small { color: var(--el-text-color-placeholder); line-height: 1.45; }
.direction-row { align-items: start; }
.empty-choice { padding: 18px; border: 1px dashed var(--el-border-color); border-radius: 8px; color: var(--el-text-color-secondary); text-align: center; }

@media (max-width: 760px) {
  .wizard-body { grid-template-columns: 1fr; }
  .source-panel,
  .result-panel { min-height: auto; }
}
</style>
