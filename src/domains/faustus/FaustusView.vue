<template>
  <div class="faustus-page primary-page primary-page--column">
    <div class="primary-page__scroll">
      <div class="primary-page__content">
        <div class="page-heading">
          <div>
            <h1>浮士德市集分段改价</h1>
            <p>只处理游戏内当前已打开的市集页；逐件读取完整旧价后立即改价。</p>
          </div>
          <el-tag :type="store.running ? 'warning' : 'info'">{{ statusLabel }}</el-tag>
        </div>

        <el-alert type="warning" :closable="false" show-icon title="开始前请确认游戏已打开目标浮士德市集页。本功能不会寻找 NPC、切换页签或自动重试提交。" />

        <el-row class="app-grid content-grid" :gutter="16">
          <el-col :xs="24" :lg="9">
            <el-card shadow="never">
              <template #header>
                <div class="config-card-title">
                  <strong>基础配置</strong>
                  <span>按顺序完成 2 项</span>
                </div>
              </template>
              <div class="config-flow">
                <section class="config-step">
                  <div class="config-step__index">01</div>
                  <div class="config-step__body">
                    <div class="config-step__heading">
                      <div>
                        <span class="config-step__eyebrow">换算基准</span>
                        <h3>神圣石兑混沌石</h3>
                      </div>
                      <span class="config-step__required">必填</span>
                    </div>
                    <p class="muted">用于换算分段边界与最终售价。</p>
                    <el-form class="exchange-form" label-position="top">
                      <el-form-item :error="fieldError('chaosPerDivine')">
                        <el-input v-model="store.config.chaosPerDivine" aria-label="神圣石兑混沌石" :disabled="store.running" placeholder="例如 200" @change="commitConfig">
                          <template #prepend>1 神圣石 =</template><template #append>混沌石</template>
                        </el-input>
                      </el-form-item>
                    </el-form>
                  </div>
                </section>

                <section class="config-step">
                  <div class="config-step__index">02</div>
                  <div class="config-step__body">
                    <div class="config-step__heading">
                      <div>
                        <span class="config-step__eyebrow">识别范围</span>
                        <h3>市集网格校准</h3>
                      </div>
                      <el-tag v-if="store.config.gridCalibration" type="success" size="small">已校准</el-tag>
                    </div>
                    <p class="muted">框选当前浮士德市集的完整网格区域。该区域独立保存，不复用普通仓库坐标。</p>
                    <div class="calibration-actions">
                      <el-button :loading="store.busy" :disabled="store.running" @click="runAction(store.calibrateGrid)">选择网格区域</el-button>
                      <el-button :loading="store.busy" :disabled="store.running || !store.config.gridCalibration" @click="runAction(store.testPriceWindow)">价格窗口识别测试</el-button>
                    </div>
                    <div v-if="store.recognition" class="recognition-result">
                      识别结果：{{ store.recognition.price }} {{ currencyLabel(store.recognition.currency) }}
                    </div>
                  </div>
                </section>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="24" :lg="15">
            <el-card shadow="never">
              <template #header>
                <div class="card-header"><strong>价格分段</strong><el-button :disabled="store.running" :icon="Plus" @click="store.addBand">添加分段</el-button></div>
              </template>
              <el-empty v-if="!store.config.bands.length" description="至少添加一个价格分段" />
              <div v-else class="band-list">
                <div
                  v-for="(band, index) in store.config.bands"
                  :key="band.id"
                  class="band-row"
                  :class="{ 'is-dragging': draggedBandId === band.id }"
                  :data-band-id="band.id"
                  @dragenter.prevent="store.previewBandReorder(band.id)"
                  @dragover.prevent
                  @drop.prevent="finishBandDrag"
                >
                  <button
                    type="button"
                    class="band-drag-handle"
                    :disabled="store.running"
                    :draggable="!store.running"
                    :aria-label="`拖动第 ${index + 1} 个价格分段`"
                    title="拖动排序；也可使用上下方向键"
                    @dragstart="startBandDrag($event, band.id)"
                    @dragend="cancelBandDrag"
                    @keydown.up.prevent="store.moveBand(index, -1)"
                    @keydown.down.prevent="store.moveBand(index, 1)"
                  ><el-icon><Rank /></el-icon></button>
                  <div class="band-order">{{ index + 1 }}</div>
                  <el-input v-model="band.start" class="band-start" :disabled="store.running" placeholder="起始价" @change="commitConfig" />
                  <span class="band-range-relation">≤ 旧价 &lt;</span>
                  <el-input v-model="band.end" class="band-end" :disabled="store.running" placeholder="最后一段可留空" @change="commitConfig" />
                  <el-select v-model="band.rangeCurrency" class="band-range-currency" :disabled="store.running" @change="commitConfig"><el-option v-for="item in currencyOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select>
                  <el-input v-model="band.discountPercent" class="band-discount" aria-label="降价百分比" :disabled="store.running" @change="commitConfig"><template #prepend>降价</template><template #append>%</template></el-input>
                  <el-select v-model="band.outputCurrency" class="band-output-currency" :disabled="store.running" @change="commitConfig"><el-option v-for="item in currencyOptions" :key="item.value" :label="`输出 ${item.label}`" :value="item.value" /></el-select>
                  <div class="band-actions">
                    <el-button text type="danger" :disabled="store.running" @click="store.removeBand(index)">删除</el-button>
                  </div>
                </div>
              </div>
              <el-alert v-if="!store.validation.valid" class="validation-alert" type="error" :closable="false" :title="validationSummary" />
            </el-card>
          </el-col>

          <el-col :span="24">
            <el-card shadow="never">
              <template #header><strong>运行控制</strong></template>
              <div class="run-controls">
                <el-button type="primary" :loading="store.busy" :disabled="store.running || !store.validation.valid || !store.config.gridCalibration || !store.recognition" @click="runAction(store.start)">开始改价</el-button>
                <span class="emergency-stop-hint">紧急停止请使用全局快捷键 <kbd>{{ emergencyStopShortcut }}</kbd></span>
                <span class="muted">进度：{{ store.state.processed || 0 }} / {{ store.state.total || 0 }}</span>
              </div>
            </el-card>
          </el-col>

          <el-col :span="24">
            <el-card shadow="never">
              <template #header><strong>逐件结果日志</strong></template>
              <el-table :data="store.logs" empty-text="本次运行暂无结果">
                <el-table-column prop="itemName" label="物品" min-width="140" />
                <el-table-column prop="grid" label="格子" width="90" />
                <el-table-column label="旧价" min-width="120"><template #default="{ row }">{{ priceText(row.oldPrice, row.oldCurrency) }}</template></el-table-column>
                <el-table-column label="新价" min-width="120"><template #default="{ row }">{{ priceText(row.newPrice, row.newCurrency) }}</template></el-table-column>
                <el-table-column label="结果原因" min-width="220"><template #default="{ row }">{{ reasonLabel(row.reasonCode) }}</template></el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Plus, Rank } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useFaustusStore } from './faustusStore.js'
import { useSettingsStore } from '@/domains/settings/settingsStore.js'
import {
  FAUSTUS_CURRENCY_LABELS,
  formatFaustusReasonCode,
  formatFaustusValidationError
} from '@/utils/faustusPricing.js'

const store = useFaustusStore()
const settingsStore = useSettingsStore()
const draggedBandId = ref('')
const currencyOptions = Object.entries(FAUSTUS_CURRENCY_LABELS).map(([value, label]) => ({ value, label }))
const statusLabel = computed(() => ({ idle: '空闲', running: '运行中', stopping: '停止中', stopped: '已停止', completed: '已完成', failed: '失败' }[store.state.status] || store.state.status))
const validationSummary = computed(() => store.validation.errors
  .map(item => formatFaustusValidationError(item, store.config))
  .join('；'))
const emergencyStopShortcut = computed(() => settingsStore.globalShortcuts.end)

function currencyLabel(value) { return FAUSTUS_CURRENCY_LABELS[value] || value || '—' }
function priceText(value, currency) { return value ? `${value} ${currencyLabel(currency)}` : '—' }
function reasonLabel(code) { return formatFaustusReasonCode(code) }
function fieldError(field) { return store.validation.errors.find(item => item.field === field) ? '请输入有效的正数比例' : '' }
function commitConfig() { store.updateConfig(store.config) }
function startBandDrag(event, bandId) {
  if (!store.beginBandReorder(bandId)) {
    event.preventDefault()
    return
  }
  draggedBandId.value = bandId
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', bandId)
  const row = event.currentTarget.closest('.band-row')
  if (row) event.dataTransfer.setDragImage(row, 18, Math.round(row.offsetHeight / 2))
}
function finishBandDrag() {
  store.commitBandReorder()
  draggedBandId.value = ''
}
function cancelBandDrag() {
  store.cancelBandReorder()
  draggedBandId.value = ''
}
async function runAction(action) {
  try { await action() } catch (error) { ElMessage.error(error?.message || '操作失败') }
}

onMounted(() => store.connect())
onUnmounted(() => {
  cancelBandDrag()
  store.disconnect()
})
</script>

<style scoped lang="less">
.page-heading, .card-header, .config-card-title, .config-step__heading, .run-controls { display: flex; align-items: center; }
.page-heading { justify-content: space-between; gap: 16px; margin-bottom: 16px; }
h1 { margin: 0 0 6px; font-size: 25px; }
.page-heading p, .muted { margin: 0; color: var(--text-secondary); font-size: 13px; }
.content-grid { margin-top: 16px; }
.card-header, .config-card-title, .config-step__heading { justify-content: space-between; gap: 12px; }
.config-card-title span { color: var(--text-secondary); font-size: 12px; font-weight: 400; }
.config-flow { display: flex; flex-direction: column; }
.config-step { display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: 12px; padding: 2px 0 22px; }
.config-step + .config-step { padding-top: 22px; border-top: 1px solid var(--border-base); }
.config-step:last-child { padding-bottom: 2px; }
.config-step__index { width: 32px; height: 32px; display: grid; place-items: center; border: 1px solid color-mix(in srgb, var(--brand-color) 48%, var(--border-base)); border-radius: 8px; background: color-mix(in srgb, var(--brand-color) 8%, transparent); color: var(--brand-color); font-size: 11px; font-weight: 700; letter-spacing: .04em; }
.config-step__body { min-width: 0; }
.config-step__heading { align-items: flex-start; }
.config-step__eyebrow { display: block; margin-bottom: 4px; color: var(--text-secondary); font-size: 11px; letter-spacing: .08em; }
.config-step h3 { margin: 0; color: var(--text-primary); font-size: 15px; line-height: 1.35; }
.config-step__required { margin-top: 17px; color: var(--el-color-warning); font-size: 11px; }
.config-step .muted { margin-top: 7px; line-height: 1.55; }
.exchange-form { margin-top: 14px; }
.exchange-form :deep(.el-form-item) { margin-bottom: 0; }
.exchange-form :deep(.el-form-item__error) { position: static; padding-top: 7px; }
.calibration-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.calibration-actions .el-button { margin-left: 0; }
.recognition-result { margin-top: 12px; padding: 9px 11px; border-left: 2px solid var(--el-color-success); background: color-mix(in srgb, var(--el-color-success) 8%, transparent); color: var(--el-color-success); font-size: 13px; }
.band-list { overflow-x: auto; }
.band-row { display: grid; grid-template-columns: 28px 28px minmax(88px, 1fr) max-content minmax(116px, 1.2fr) 110px auto; grid-template-rows: auto auto; align-items: center; gap: 8px; min-width: 600px; padding: 12px 0; border-bottom: 1px solid var(--border-base); transition: background-color .15s ease, opacity .15s ease; }
.band-row.is-dragging { background: color-mix(in srgb, var(--brand-color) 9%, transparent); opacity: .72; }
.band-drag-handle { width: 28px; height: 28px; display: grid; place-items: center; padding: 0; border: 0; border-radius: 5px; background: transparent; color: var(--text-secondary); cursor: grab; }
.band-drag-handle:hover, .band-drag-handle:focus-visible { background: color-mix(in srgb, var(--brand-color) 12%, transparent); color: var(--brand-color); outline: none; }
.band-drag-handle:active { cursor: grabbing; }
.band-drag-handle:disabled { opacity: .4; cursor: not-allowed; }
.band-drag-handle, .band-order { grid-row: 1 / 3; }
.band-order { color: var(--text-secondary); text-align: center; }
.band-start { grid-column: 3; }
.band-range-relation { white-space: nowrap; }
.band-end { grid-column: 5; }
.band-range-currency { grid-column: 6; }
.band-discount { grid-column: 3 / 5; grid-row: 2; }
.band-output-currency { grid-column: 5 / 7; grid-row: 2; }
.band-actions { grid-column: 7; grid-row: 1 / 3; display: flex; white-space: nowrap; }
.validation-alert { margin-top: 14px; }
.run-controls { flex-wrap: wrap; gap: 10px; }
.emergency-stop-hint { color: var(--text-secondary); font-size: 13px; }
.emergency-stop-hint kbd { margin-left: 4px; padding: 2px 7px; border: 1px solid var(--border-base); border-bottom-width: 2px; border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary); font: inherit; }
@media (max-width: 520px) { .config-step { grid-template-columns: 1fr; } .config-step__index { margin-bottom: -2px; } .calibration-actions { flex-direction: column; } .calibration-actions .el-button { width: 100%; } }
</style>
