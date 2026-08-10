<template>
  <div class="bag-page">
    <el-scrollbar>
      <div class="bag-content">
        <el-tabs v-model="activeTab" class="storage-tabs">
          <el-tab-pane label="入库" name="inbound">
            <div class="section-header"><h3 class="section-title">背包安全入库</h3></div>
            <el-card class="section-card">
              <el-form label-width="120px" label-position="left">
                <el-form-item label="启用模块">
                  <el-switch :model-value="bagStore.moduleEnabled" active-text="开启" inactive-text="关闭" @change="handleModuleToggle" />
                  <span class="hint-text inline-hint">持续检测仓库与背包，并提供游戏内入库按钮</span>
                </el-form-item>
                <el-form-item label="立即执行入库">
                  <el-switch
                    :model-value="bagStore.immediateStash"
                    active-text="开启"
                    inactive-text="关闭"
                    @change="(value) => handlePreferenceChange('immediateStash', value)"
                  />
                  <span class="hint-text inline-hint">开启后每次打开仓库会话自动执行一轮；关闭后点击浮层执行</span>
                </el-form-item>
                <el-form-item label="满足条件显示">
                  <el-switch
                    :model-value="bagStore.showStashButtonOnlyWhenReady"
                    active-text="开启"
                    inactive-text="关闭"
                    @change="(value) => handlePreferenceChange('showStashButtonOnlyWhenReady', value)"
                  />
                  <span class="hint-text inline-hint">关闭后模块运行期间始终显示浮层，未就绪时按钮禁用</span>
                </el-form-item>
                <el-form-item label="检测状态">
                  <el-tag :type="detectionStatus.type">{{ detectionStatus.text }}</el-tag>
                </el-form-item>
                <el-form-item v-if="bagStore.isStashing" label="扫描进度">
                  <el-progress :percentage="bagStore.stashProgress" :text-inside="true" :stroke-width="20" />
                </el-form-item>
                <el-form-item v-if="hasRunStats" label="本轮统计">
                  <div class="stats-row">
                    <el-tag type="success">已入库 {{ bagStore.stashStats.stashedSlots }}</el-tag>
                    <el-tag>跳过占位 {{ bagStore.stashStats.skippedOccupiedSlots }}</el-tag>
                    <el-tag type="warning">黑名单 {{ bagStore.stashStats.blacklistedSlots }}</el-tag>
                    <el-tag type="info">空格 {{ bagStore.stashStats.emptySlots }}</el-tag>
                    <el-tag type="danger">未识别 {{ bagStore.stashStats.unreadableSlots }}</el-tag>
                  </div>
                </el-form-item>
                <el-form-item v-if="bagStore.lastStopReason" label="停止原因">
                  <el-alert :closable="false" type="warning" :title="formatBagStopReason(bagStore.lastStopReason)" />
                </el-form-item>
                <el-form-item v-if="bagStore.isStashing">
                  <el-button type="danger" :icon="VideoPause" @click="handleStopStash">停止入库</el-button>
                </el-form-item>
              </el-form>
            </el-card>

            <div class="section-header"><h3 class="section-title">背包格子布局</h3></div>
            <el-card class="section-card inventory-layout-card">
              <el-alert title="点击格子可切换是否执行自动入库；运行中修改从下一轮入库生效。" type="info" :closable="false" />
              <el-form label-width="120px" label-position="left" class="inventory-layout-settings">
                <el-form-item label="额外背包">
                  <el-switch
                    :model-value="bagStore.inventoryLayout.extraEnabled"
                    active-text="开启"
                    inactive-text="关闭"
                    @change="setExtraInventoryEnabled"
                  />
                </el-form-item>
                <el-form-item label="额外列数">
                  <el-input-number
                    :model-value="bagStore.inventoryLayout.extraColumns"
                    :min="1"
                    :max="INVENTORY_LAYOUT.maxExtraColumns"
                    :step="1"
                    :disabled="!bagStore.inventoryLayout.extraEnabled"
                    @change="setExtraInventoryColumns"
                  />
                </el-form-item>
              </el-form>

              <div class="inventory-layout-scroll">
                <div class="inventory-layout">
                  <div v-if="extraColumns.length" class="inventory-region inventory-region--extra">
                    <div class="inventory-region__label">额外背包</div>
                    <div class="inventory-columns">
                      <div v-for="column in extraColumns" :key="column" class="inventory-column">
                        <button
                          v-for="row in inventoryRows"
                          :key="slotKey(column, row)"
                          type="button"
                          class="inventory-slot inventory-slot--extra"
                          :class="{ 'is-excluded': isSlotExcluded(column, row) }"
                          :aria-label="slotAriaLabel(column, row)"
                          :aria-pressed="isSlotExcluded(column, row)"
                          @click="toggleExcludedSlot(column, row)"
                        >
                          <span v-if="isSlotExcluded(column, row)">×</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="inventory-region inventory-region--native">
                    <div class="inventory-region__label">原生背包</div>
                    <div class="inventory-columns">
                      <div v-for="column in nativeColumns" :key="column" class="inventory-column">
                        <button
                          v-for="row in inventoryRows"
                          :key="slotKey(column, row)"
                          type="button"
                          class="inventory-slot"
                          :class="{ 'is-excluded': isSlotExcluded(column, row) }"
                          :aria-label="slotAriaLabel(column, row)"
                          :aria-pressed="isSlotExcluded(column, row)"
                          @click="toggleExcludedSlot(column, row)"
                        >
                          <span v-if="isSlotExcluded(column, row)">×</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="inventory-layout-footer">
                <div class="inventory-legend">
                  <span><i class="legend-swatch"></i>自动入库</span>
                  <span><i class="legend-swatch is-excluded"></i>不执行入库</span>
                  <span>已禁用 {{ bagStore.inventoryLayout.excludedSlots.length }} 格</span>
                </div>
                <el-button
                  type="danger"
                  plain
                  :disabled="bagStore.inventoryLayout.excludedSlots.length === 0"
                  @click="clearExcludedSlots"
                >
                  清空选择
                </el-button>
              </div>
            </el-card>

            <div class="section-header"><h3 class="section-title">物品黑名单</h3></div>
            <el-card class="section-card">
              <el-alert title="命中任一规则的物品会留在背包；统计按扫描格数计算。" type="info" :closable="false" />
              <div class="rule-editor">
                <el-select v-model="draftRule.field" style="width: 150px">
                  <el-option v-for="field in BAG_BLACKLIST_FIELDS" :key="field" :label="BAG_BLACKLIST_FIELD_LABELS[field]" :value="field" />
                </el-select>
                <el-select v-model="draftRule.matchMode" style="width: 130px">
                  <el-option
                    v-for="mode in BAG_BLACKLIST_MATCH_MODES"
                    :key="mode"
                    :label="BAG_BLACKLIST_MATCH_MODE_LABELS[mode]"
                    :value="mode"
                  />
                </el-select>
                <el-input v-model="draftRule.keyword" placeholder="输入匹配关键词" clearable @keyup.enter="addBlacklistRule" />
                <el-button type="primary" @click="addBlacklistRule">添加</el-button>
              </div>
              <div v-if="bagStore.moduleEnabled" class="hint-text">模块保持开启；新规则从下一轮入库生效。</div>
              <el-table v-if="bagStore.blacklist.length" :data="bagStore.blacklist" class="rule-table">
                <el-table-column label="生效" width="90">
                  <template #default="scope">
                    <el-switch
                      :model-value="scope.row.enabled"
                      inline-prompt
                      active-text="开"
                      inactive-text="关"
                      @change="toggleBlacklistRule(scope.$index, $event)"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="匹配字段" width="160">
                  <template #default="scope">{{ BAG_BLACKLIST_FIELD_LABELS[scope.row.field] }}</template>
                </el-table-column>
                <el-table-column label="匹配方式" width="120">
                  <template #default="scope">{{ BAG_BLACKLIST_MATCH_MODE_LABELS[scope.row.matchMode] }}</template>
                </el-table-column>
                <el-table-column prop="keyword" label="匹配关键词" />
                <el-table-column label="操作" width="100">
                  <template #default="scope">
                    <el-button link type="danger" @click="removeBlacklistRule(scope.$index)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-else description="暂无黑名单规则" :image-size="60" />
            </el-card>

            <el-alert
              title="仓库与背包识别模板已移动到“设置 → 游戏界面检测”，并与混沌配方共用。"
              type="info"
              :closable="false"
            />
          </el-tab-pane>
          <el-tab-pane label="取件" name="pickup">
            <div class="section-header"><h3 class="section-title">仓库自动取件</h3></div>
            <el-card class="section-card">
              <el-alert
                title="默认使用当前高亮模型取件，自动识别普通仓库 12×12 和大型仓库 24×24：搜索框为空时全部物品都会高亮并取出；输入筛选后，只取出筛选结果；模糊格会跳过。请先运行检测预览。"
                type="info"
                :closable="false"
              />
              <el-form label-width="130px" label-position="left" class="stash-pickup-settings">
                <el-form-item label="启用功能">
                  <el-switch
                    :model-value="stashPickupStore.settings.enabled"
                    active-text="开启"
                    inactive-text="关闭"
                    @change="toggleStashPickup"
                  />
                </el-form-item>
                <el-form-item v-for="entry in calibrationOptions" :key="entry.key" :label="entry.label">
                  <el-button @click="stashPickupStore.calibrate(entry.key)">重新框选</el-button>
                  <el-tag :type="interfaceStore.stashGridCalibration[entry.key] ? 'success' : 'info'">
                    {{ interfaceStore.stashGridCalibration[entry.key] ? '已校准' : '未校准' }}
                  </el-tag>
                </el-form-item>
              </el-form>
              <div class="stash-pickup-actions">
                <el-button
                  :loading="stashPickupStore.busy"
                  :disabled="!stashPickupStore.settings.enabled"
                  @click="previewStashPickup"
                >检测预览</el-button>
                <el-button v-if="stashPickupStore.running" type="danger" @click="stashPickupStore.stop()">停止取件</el-button>
                <el-tag :type="stashPickupStatus.type">{{ stashPickupStatus.text }}</el-tag>
                <el-tag>候选格 {{ stashPickupStore.state.candidateCells }}</el-tag>
                <el-tag type="warning">模糊格 {{ stashPickupStore.state.uncertainCells }}</el-tag>
                <el-tag type="warning">剩余 {{ stashPickupStore.state.remainingCells }}</el-tag>
                <el-tag type="success">已取 {{ stashPickupStore.state.pickedItems }}</el-tag>
                <el-tag v-if="stashPickupStore.state.modelVersion">模型 {{ stashPickupStore.state.modelVersion }}</el-tag>
              </div>
              <el-alert
                v-if="stashPickupStore.state.reason"
                :title="stashPickupStopReason"
                type="warning"
                :closable="false"
              />
              <div v-if="stashPickupStore.preview" class="stash-pickup-preview">
                <div>
                  {{ stashPickupStore.preview.layout }}×{{ stashPickupStore.preview.layout }} ·
                  {{ stashPickupStore.preview.candidateCells }} 个候选格 ·
                  {{ stashPickupStore.preview.uncertainCells || 0 }} 个模糊格 ·
                  模型 {{ stashPickupStore.preview.modelVersion || '未就绪' }}
                </div>
                <HighlightGridPreview
                  :image-src="stashPickupStore.preview.rawImageDataUrl || stashPickupStore.preview.imageDataUrl"
                  alt="仓库检测预览"
                  :cells="stashPickupStore.preview.cells || []"
                  :columns="stashPickupStore.preview.layout"
                  :rows="stashPickupStore.preview.layout"
                  :labels="stashPickupStore.previewLabels"
                  decision-mode
                  editable
                  @change="stashPickupStore.setPreviewLabel($event.cell, $event.label)"
                />
                <el-button
                  type="primary"
                  plain
                  :disabled="!Object.keys(stashPickupStore.previewLabels).length"
                  @click="saveStashPreviewCorrections"
                >保存修改的校准素材</el-button>
              </div>
            </el-card>

            <div class="section-header"><h3 class="section-title">君锋镇取出高亮</h3></div>
            <el-card class="section-card junfeng-card">
              <el-alert
                title="正式取件只截取一次奖励网格，不操作搜索框。低置信格会安全停止，不会自动点击。"
                type="info"
                :closable="false"
              />
              <el-form label-width="140px" label-position="left" class="junfeng-settings">
                <el-form-item label="启用功能">
                  <el-switch
                    :model-value="junfengStore.settings.enabled"
                    active-text="开启"
                    inactive-text="关闭"
                    @change="toggleJunfeng"
                  />
                </el-form-item>
                <el-form-item label="奖励标题">
                  <el-button :loading="capturingRewardTitle" @click="captureRewardTitle">框选标题</el-button>
                  <el-tag :type="interfaceStore.templates.junfengRewardTitle ? 'success' : 'info'">
                    {{ interfaceStore.templates.junfengRewardTitle ? '已配置' : '未配置' }}
                  </el-tag>
                </el-form-item>
                <el-form-item label="12×11 奖励网格">
                  <el-button @click="calibrateJunfengGrid">框选网格</el-button>
                  <el-tag :type="junfengStore.settings.gridRegion ? 'success' : 'info'">
                    {{ junfengStore.settings.gridRegion ? '已校准' : '未校准' }}
                  </el-tag>
                </el-form-item>
              </el-form>
              <div class="stash-pickup-actions">
                <el-button :loading="junfengStore.busy" @click="previewJunfeng">检测预览</el-button>
                <el-button v-if="junfengStore.running" type="danger" @click="junfengStore.stop()">停止取件</el-button>
                <el-tag :type="junfengStatus.type">{{ junfengStatus.text }}</el-tag>
                <el-tag>候选物品 {{ junfengStore.state.candidateItems }}</el-tag>
                <el-tag type="warning">模糊格 {{ junfengStore.state.uncertainCells }}</el-tag>
                <el-tag type="success">已取 {{ junfengStore.state.pickedItems }}</el-tag>
              </div>
              <el-alert
                v-if="junfengStore.state.reason"
                :title="junfengStopReason"
                type="warning"
                :closable="false"
              />
              <div v-if="junfengStore.preview" class="junfeng-preview">
                <div class="junfeng-preview__summary">
                  模型 {{ junfengStore.preview.modelVersion || '未就绪' }} ·
                  候选 {{ junfengStore.preview.candidateItems || 0 }} ·
                  模糊 {{ junfengStore.preview.uncertainCells || 0 }}
                </div>
                <el-alert
                  v-if="junfengStore.preview.modelError"
                  :title="`模型不可用：${junfengStore.preview.modelError}`"
                  type="warning"
                  :closable="false"
                />
                <HighlightGridPreview
                  :image-src="junfengStore.preview.rawImageDataUrl || junfengStore.preview.imageDataUrl"
                  alt="君锋镇奖励检测预览"
                  :cells="junfengStore.preview.cells || []"
                  :columns="12"
                  :rows="11"
                  :labels="junfengStore.previewLabels"
                  decision-mode
                  editable
                  @change="junfengStore.setPreviewLabel($event.cell, $event.label)"
                />
                <el-button
                  type="primary"
                  plain
                  :disabled="!Object.keys(junfengStore.previewLabels).length"
                  @click="saveJunfengPreviewCorrections"
                >保存修改的校准素材</el-button>
              </div>
            </el-card>

            <div class="section-header"><h3 class="section-title">共享本机校准素材</h3></div>
            <el-card class="section-card shared-calibration-card">
              <div class="shared-calibration">
                <div class="shared-calibration__header">
                  <strong>已保存 {{ junfengStore.corrections.length }} 个素材</strong>
                  <el-button
                    plain
                    size="small"
                    :disabled="!junfengStore.corrections.length"
                    @click="rebuildJunfengCorrections"
                  >重建特征</el-button>
                  <el-button
                    type="danger"
                    plain
                    size="small"
                    :disabled="!junfengStore.corrections.length"
                    @click="resetJunfengCorrections"
                  >全部重置</el-button>
                </div>
                <el-table v-if="junfengStore.corrections.length" :data="junfengStore.corrections" size="small" max-height="240">
                  <el-table-column label="图块" width="68">
                    <template #default="scope"><img class="calibration-thumbnail" :src="scope.row.tileDataUrl" alt="校准图块" /></template>
                  </el-table-column>
                  <el-table-column label="格子" width="90">
                    <template #default="scope">{{ scope.row.column + 1 }},{{ scope.row.row + 1 }}</template>
                  </el-table-column>
                  <el-table-column label="标签" width="100">
                    <template #default="scope">{{ junfengLabel(scope.row.label) }}</template>
                  </el-table-column>
                  <el-table-column label="来源" width="110">
                    <template #default="scope">{{ calibrationDomainLabel(scope.row.domain) }}</template>
                  </el-table-column>
                  <el-table-column prop="modelVersion" label="模型版本" />
                  <el-table-column label="操作" width="80">
                    <template #default="scope">
                      <el-button link type="danger" @click="junfengStore.removeCorrection(scope.row.id)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { VideoPause } from '@element-plus/icons-vue'
import { useBagStore } from '@/stores/bag'
import { useStashPickupStore } from '@/stores/stashPickup'
import { useJunfengStore } from '@/stores/junfeng'
import { useInterfaceDetectionStore } from '@/stores/interfaceDetection'
import { electronApi } from '@/api/electron'
import HighlightGridPreview from '@/components/highlight/HighlightGridPreview.vue'
import { formatBagStopReason, setBagModuleEnabled, stopBagStash, updateBagPreferences, updateBagRuntimeConfig } from '@/utils/bagService'
import {
  BAG_BLACKLIST_FIELDS,
  BAG_BLACKLIST_FIELD_LABELS,
  BAG_BLACKLIST_MATCH_MODES,
  BAG_BLACKLIST_MATCH_MODE_LABELS,
  INVENTORY_LAYOUT
} from '@/utils/bagConfig'

const bagStore = useBagStore()
const stashPickupStore = useStashPickupStore()
const junfengStore = useJunfengStore()
const interfaceStore = useInterfaceDetectionStore()
const activeTab = ref('inbound')
const capturingRewardTitle = ref(false)
const calibrationOptions = [
  { key: 'root', label: '文件夹外仓库' },
  { key: 'folder', label: '文件夹内仓库' }
]
const draftRule = ref({ field: 'name', keyword: '', matchMode: 'contains' })
const nativeColumns = Array.from({ length: INVENTORY_LAYOUT.nativeColumns }, (_value, index) => index)
const inventoryRows = Array.from({ length: INVENTORY_LAYOUT.rows }, (_value, index) => index)
const extraColumns = computed(() => {
  if (!bagStore.inventoryLayout.extraEnabled) return []
  const count = bagStore.inventoryLayout.extraColumns
  return Array.from({ length: count }, (_value, index) => index - count)
})
const excludedSlotKeys = computed(() => new Set(
  bagStore.inventoryLayout.excludedSlots.map((slot) => slotKey(slot.column, slot.row))
))

const detectionStatus = computed(() => {
  if (!bagStore.moduleEnabled) return { type: 'info', text: '模块未启用' }
  if (bagStore.isMatched) return { type: 'success', text: '仓库与背包已就绪' }
  return bagStore.isDetecting ? { type: 'warning', text: '等待仓库与背包同时打开' } : { type: 'danger', text: '检测已停止' }
})
const hasRunStats = computed(() => bagStore.stashStats.scannedSlots > 0)
const stashPickupStatus = computed(() => {
  const status = stashPickupStore.state.status
  if (status === 'running') return { type: 'warning', text: '正在取件' }
  if (status === 'completed') return { type: 'success', text: '已完成' }
  if (status === 'stopped') return { type: 'info', text: '已停止' }
  return { type: 'info', text: stashPickupStore.settings.enabled ? '等待启动' : '功能未启用' }
})
const stashPickupStopReason = computed(() => ({
  'game-not-foreground': '游戏不在前台，取件已停止',
  'interface-lost': '仓库或背包界面丢失，取件已停止',
  'uncertain-cells': '检测到模糊格，未执行自动点击',
  'transfer-unconfirmed': '转移未确认，已安全停止',
  user: '用户已停止取件',
  'no-candidates': '当前画面没有高置信高亮物品',
  completed: '高亮物品已取出'
}[stashPickupStore.state.reason] || `仓库取件已停止：${stashPickupStore.state.reason}`))
const junfengStatus = computed(() => {
  if (junfengStore.running) return { type: 'warning', text: '正在取出高亮' }
  if (junfengStore.state.status === 'completed') return { type: 'success', text: '已完成' }
  if (!junfengStore.settings.enabled) return { type: 'info', text: '功能未启用' }
  return { type: 'info', text: '等待奖励界面' }
})
const junfengStopReason = computed(() => ({
  'game-not-foreground': '游戏不在前台，取件已安全停止',
  'reward-interface-lost': '奖励界面已消失，取件已安全停止',
  'uncertain-cells': '检测到低置信候选，未执行自动点击',
  'transfer-unconfirmed': '转移未确认，已停止且未判断为背包已满',
  'no-candidates': '当前画面没有高置信高亮物品',
  completed: '高亮物品已取出',
  user: '用户已停止取件'
}[junfengStore.state.reason] || `君锋镇取件停止：${junfengStore.state.reason}`))

async function handleModuleToggle(enabled) {
  try {
    await setBagModuleEnabled(enabled)
  } catch (error) {
    ElMessage.error(`操作失败：${error.message}`)
  }
}

async function handlePreferenceChange(key, value) {
  try {
    const result = await updateBagPreferences({ [key]: value })
    if (!result?.success) throw new Error(result?.error || '更新设置失败')
  } catch (error) {
    ElMessage.error(`更新设置失败：${error.message}`)
  }
}

async function toggleStashPickup(enabled) {
  try { await stashPickupStore.setEnabled(enabled) } catch (error) { ElMessage.error(error.message) }
}

async function previewStashPickup() {
  try { await stashPickupStore.runPreview() } catch (error) { ElMessage.error(error.message) }
}

async function toggleJunfeng(enabled) {
  try { await junfengStore.setEnabled(enabled) } catch (error) { ElMessage.error(error.message) }
}

async function captureRewardTitle() {
  capturingRewardTitle.value = true
  try {
    const result = await electronApi.bag.captureTemplate('junfengRewardTitle')
    if (result?.canceled) return
    if (!result?.success) throw new Error(result?.error || '奖励标题框选失败')
    interfaceStore.applyTemplateCapture('junfengRewardTitle', result)
  } catch (error) { ElMessage.error(error.message) } finally { capturingRewardTitle.value = false }
}

async function calibrateJunfengGrid() {
  try { await junfengStore.calibrateGrid() } catch (error) { ElMessage.error(error.message) }
}

async function previewJunfeng() {
  try { await junfengStore.runPreview() } catch (error) { ElMessage.error(error.message) }
}

async function saveJunfengPreviewCorrections() {
  try {
    const count = await junfengStore.savePreviewCorrections()
    ElMessage.success(`已保存 ${count} 个校准素材并立即生效`)
  }
  catch (error) { ElMessage.error(error.message) }
}

async function saveStashPreviewCorrections() {
  try {
    const count = await stashPickupStore.savePreviewCorrections()
    await junfengStore.loadCorrections()
    ElMessage.success(`已保存 ${count} 个校准素材并立即生效`)
  } catch (error) { ElMessage.error(error.message) }
}

async function resetJunfengCorrections() {
  try { await junfengStore.resetCorrections(); ElMessage.success('本机校准素材已重置') }
  catch (error) { ElMessage.error(error.message) }
}

async function rebuildJunfengCorrections() {
  try { await junfengStore.rebuildCorrections(); ElMessage.success('已标记为按当前模型重新提取特征') }
  catch (error) { ElMessage.error(error.message) }
}

function junfengLabel(label) {
  return ({ highlighted: '高亮', dimmed: '灰暗', empty: '空格', unknown: '未知' })[label] || label
}

function calibrationDomainLabel(domain) {
  return ({ junfeng: '君锋镇', 'small-stash': '小仓库', 'large-stash': '大仓库' })[domain] || '君锋镇'
}


async function applyBagRuntimePatch(patch) {
  const result = await updateBagRuntimeConfig(patch)
  if (!result.success) ElMessage.error(result.error)
  return result.success
}

async function addBlacklistRule() {
  const keyword = draftRule.value.keyword.trim()
  if (!keyword) return ElMessage.warning('请输入黑名单关键词')
  const success = await applyBagRuntimePatch({ blacklist: [...bagStore.blacklist, {
    field: draftRule.value.field,
    keyword,
    matchMode: draftRule.value.matchMode,
    enabled: true
  }] })
  if (success) draftRule.value.keyword = ''
}

function toggleBlacklistRule(index, enabled) {
  return applyBagRuntimePatch({ blacklist: bagStore.blacklist.map((rule, ruleIndex) => (
    ruleIndex === index ? { ...rule, enabled: Boolean(enabled) } : rule
  )) })
}

function removeBlacklistRule(index) {
  return applyBagRuntimePatch({ blacklist: bagStore.blacklist.filter((_rule, ruleIndex) => ruleIndex !== index) })
}

function slotKey(column, row) {
  return `${column}:${row}`
}

function isSlotExcluded(column, row) {
  return excludedSlotKeys.value.has(slotKey(column, row))
}

function slotAriaLabel(column, row) {
  const region = column < 0 ? '额外背包' : '原生背包'
  const displayColumn = column < 0 ? column + bagStore.inventoryLayout.extraColumns + 1 : column + 1
  return `${region}第 ${displayColumn} 列第 ${row + 1} 行，${isSlotExcluded(column, row) ? '不执行入库' : '自动入库'}`
}

function setExtraInventoryEnabled(extraEnabled) {
  return applyBagRuntimePatch({ inventoryLayout: { ...bagStore.inventoryLayout, extraEnabled } })
}

function setExtraInventoryColumns(extraColumns) {
  return applyBagRuntimePatch({ inventoryLayout: { ...bagStore.inventoryLayout, extraColumns } })
}

function toggleExcludedSlot(column, row) {
  const key = slotKey(column, row)
  const excludedSlots = bagStore.inventoryLayout.excludedSlots.filter((slot) => slotKey(slot.column, slot.row) !== key)
  if (excludedSlots.length === bagStore.inventoryLayout.excludedSlots.length) excludedSlots.push({ column, row })
  return applyBagRuntimePatch({ inventoryLayout: { ...bagStore.inventoryLayout, excludedSlots } })
}

function clearExcludedSlots() {
  return applyBagRuntimePatch({ inventoryLayout: { ...bagStore.inventoryLayout, excludedSlots: [] } })
}

async function handleStopStash() {
  try {
    await stopBagStash()
    ElMessage.info('已停止入库')
  } catch (error) {
    ElMessage.error(`停止入库失败：${error.message}`)
  }
}

</script>

<style scoped lang="less">
.bag-page { height: 100%; background: var(--bg-secondary); }
.bag-content { max-width: 1100px; margin: 0 auto; padding: 20px; }
.storage-tabs { margin-bottom: var(--spacing-lg); }
.storage-tabs :deep(.el-tabs__header) { margin-bottom: var(--spacing-lg); }
.section-header { margin: 0 0 var(--spacing-sm) var(--spacing-xs); }
.section-title { margin: 0; font-size: var(--font-size-md); font-weight: 600; color: var(--text-primary); }
.section-card { margin-bottom: var(--spacing-lg); box-shadow: none; border: 1px solid var(--border-base); }
.inline-hint { margin-left: 12px; }
.hint-text { margin-top: 6px; color: var(--text-secondary); font-size: 12px; }
.stats-row, .rule-editor { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.rule-editor { margin-top: 16px; }
.rule-editor .el-input { flex: 1; min-width: 220px; }
.rule-table { margin-top: 16px; }
.stash-pickup-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin: 12px 0; }
.stash-pickup-preview { display: grid; gap: 10px; margin-top: 12px; color: var(--text-secondary); }
.junfeng-settings { margin-top: 16px; }
.junfeng-preview { display: grid; gap: 10px; margin-top: 14px; }
.junfeng-preview__summary { color: var(--text-secondary); }
.shared-calibration { display: grid; gap: 8px; }
.calibration-thumbnail { display: block; width: 40px; height: 40px; object-fit: cover; border: 1px solid var(--border-base); border-radius: 4px; }
.shared-calibration__header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.inventory-layout-settings { display: flex; gap: 28px; flex-wrap: wrap; margin-top: 16px; }
.inventory-layout-settings :deep(.el-form-item) { margin-bottom: 8px; }
.inventory-layout-scroll { overflow-x: auto; padding: 12px 2px 4px; }
.inventory-layout { display: inline-flex; align-items: flex-end; min-width: max-content; }
.inventory-region { padding: 10px; border: 1px solid var(--border-base); border-radius: 8px; background: var(--bg-primary); }
.inventory-region--extra { margin-right: 8px; background: color-mix(in srgb, var(--primary-color) 7%, var(--bg-primary)); border-right: 2px solid var(--primary-color); }
.inventory-region--native { border-left: 2px solid var(--text-secondary); }
.inventory-region__label { margin-bottom: 8px; color: var(--text-secondary); font-size: 12px; font-weight: 600; text-align: center; }
.inventory-columns { display: flex; gap: 3px; }
.inventory-column { display: grid; grid-template-rows: repeat(5, 30px); gap: 3px; }
.inventory-slot { width: 30px; height: 30px; padding: 0; border: 1px solid var(--text-secondary); border-radius: 4px; background: var(--bg-primary); color: var(--danger-color); font-size: 22px; line-height: 1; cursor: pointer; }
.inventory-slot--extra { background: color-mix(in srgb, var(--primary-color) 5%, var(--bg-primary)); }
.inventory-slot:hover:not(:disabled) { border-color: var(--primary-color); box-shadow: 0 0 0 1px var(--primary-color); }
.inventory-slot.is-excluded { border-color: var(--danger-color); background: color-mix(in srgb, var(--danger-color) 14%, var(--bg-primary)); }
.inventory-slot:disabled { cursor: not-allowed; opacity: 0.72; }
.inventory-layout-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 14px; }
.inventory-legend { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; color: var(--text-secondary); font-size: 12px; }
.inventory-legend > span { display: inline-flex; align-items: center; gap: 6px; }
.legend-swatch { width: 16px; height: 16px; border: 1px solid var(--text-secondary); border-radius: 3px; background: var(--bg-primary); }
.legend-swatch.is-excluded { border-color: var(--danger-color); background: color-mix(in srgb, var(--danger-color) 14%, var(--bg-primary)); }
</style>
