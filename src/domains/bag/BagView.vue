<template>
  <div class="bag-page">
    <el-scrollbar>
      <div class="bag-content">
        <div class="section-header"><h3 class="section-title">背包安全自动入库</h3></div>
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

        <div class="section-header"><h3 class="section-title">仓库自动取件</h3></div>
        <el-card class="section-card">
          <el-alert
            title="按每格中央区域的图像统计值取件；搜索框为空时会取出所有达到阈值的物品。请先用检测预览确认参数。"
            type="warning"
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
          <div class="profile-grid">
            <div v-for="entry in profileOptions" :key="entry.key" class="profile-card">
              <h4>{{ entry.label }}</h4>
              <el-form label-width="90px" label-position="left">
                <el-form-item label="检测方式">
                  <el-select
                    :model-value="stashPickupStore.settings.profiles[entry.key].method"
                    @change="value => updateStashPickupProfile(entry.key, { method: value })"
                  >
                    <el-option label="方差 variance" value="variance" />
                    <el-option label="亮度 brightness" value="brightness" />
                    <el-option label="饱和度 saturation" value="saturation" />
                  </el-select>
                </el-form-item>
                <el-form-item label="跳过阈值">
                  <el-input-number
                    :model-value="activeProfileThreshold(entry.key)"
                    :min="0"
                    :max="stashPickupStore.settings.profiles[entry.key].method === 'variance' ? 65025 : 255"
                    :step="stashPickupStore.settings.profiles[entry.key].method === 'variance' ? 50 : 1"
                    @change="value => updateProfileThreshold(entry.key, value)"
                  />
                </el-form-item>
                <el-form-item label="采样比例">
                  <el-input-number
                    :model-value="stashPickupStore.settings.profiles[entry.key].sampleRatio"
                    :min="0.1"
                    :max="1"
                    :step="0.05"
                    :precision="2"
                    @change="value => updateStashPickupProfile(entry.key, { sampleRatio: value })"
                  />
                </el-form-item>
              </el-form>
            </div>
          </div>
          <div class="stash-pickup-actions">
            <el-button
              :loading="stashPickupStore.busy"
              :disabled="!stashPickupStore.settings.enabled"
              @click="previewStashPickup"
            >检测预览</el-button>
            <el-button v-if="stashPickupStore.running" type="danger" @click="stashPickupStore.stop()">停止取件</el-button>
            <el-tag :type="stashPickupStatus.type">{{ stashPickupStatus.text }}</el-tag>
            <el-tag>候选格 {{ stashPickupStore.state.candidateCells }}</el-tag>
            <el-tag type="warning">剩余 {{ stashPickupStore.state.remainingCells }}</el-tag>
            <el-tag type="success">已取 {{ stashPickupStore.state.pickedItems }}</el-tag>
          </div>
          <el-alert
            v-if="stashPickupStore.state.reason"
            :title="stashPickupStopReason"
            :type="stashPickupStore.state.reason === 'inventory-full' ? 'warning' : 'info'"
            :closable="false"
          />
          <div v-if="stashPickupStore.preview" class="stash-pickup-preview">
            <div>{{ stashPickupStore.preview.layout }}×{{ stashPickupStore.preview.layout }} · {{ stashPickupStore.preview.candidateCells }} 个候选格</div>
            <img :src="stashPickupStore.preview.imageDataUrl" alt="仓库检测预览" />
          </div>
        </el-card>

        <div class="section-header"><h3 class="section-title">背包格子布局</h3></div>
        <el-card class="section-card inventory-layout-card">
          <el-alert title="点击格子可切换是否执行自动入库；模块启用后布局将锁定。" type="info" :closable="false" />
          <el-form label-width="120px" label-position="left" class="inventory-layout-settings">
            <el-form-item label="额外背包">
              <el-switch
                :model-value="bagStore.inventoryLayout.extraEnabled"
                active-text="开启"
                inactive-text="关闭"
                :disabled="bagStore.moduleEnabled"
                @change="setExtraInventoryEnabled"
              />
            </el-form-item>
            <el-form-item label="额外列数">
              <el-input-number
                :model-value="bagStore.inventoryLayout.extraColumns"
                :min="1"
                :max="INVENTORY_LAYOUT.maxExtraColumns"
                :step="1"
                :disabled="bagStore.moduleEnabled || !bagStore.inventoryLayout.extraEnabled"
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
                      :disabled="bagStore.moduleEnabled"
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
                      :disabled="bagStore.moduleEnabled"
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
              :disabled="bagStore.moduleEnabled || bagStore.inventoryLayout.excludedSlots.length === 0"
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
            <el-select v-model="draftRule.field" style="width: 150px" :disabled="bagStore.moduleEnabled">
              <el-option v-for="field in BAG_BLACKLIST_FIELDS" :key="field" :label="BAG_BLACKLIST_FIELD_LABELS[field]" :value="field" />
            </el-select>
            <el-select v-model="draftRule.matchMode" style="width: 130px" :disabled="bagStore.moduleEnabled">
              <el-option
                v-for="mode in BAG_BLACKLIST_MATCH_MODES"
                :key="mode"
                :label="BAG_BLACKLIST_MATCH_MODE_LABELS[mode]"
                :value="mode"
              />
            </el-select>
            <el-input v-model="draftRule.keyword" placeholder="输入匹配关键词" clearable :disabled="bagStore.moduleEnabled" @keyup.enter="addBlacklistRule" />
            <el-button type="primary" :disabled="bagStore.moduleEnabled" @click="addBlacklistRule">添加</el-button>
          </div>
          <div v-if="bagStore.moduleEnabled" class="hint-text">请先关闭模块再修改黑名单，重新启用后新规则生效。</div>
          <el-table v-if="bagStore.blacklist.length" :data="bagStore.blacklist" class="rule-table">
            <el-table-column label="匹配字段" width="160">
              <template #default="scope">{{ BAG_BLACKLIST_FIELD_LABELS[scope.row.field] }}</template>
            </el-table-column>
            <el-table-column label="匹配方式" width="120">
              <template #default="scope">{{ BAG_BLACKLIST_MATCH_MODE_LABELS[scope.row.matchMode] }}</template>
            </el-table-column>
            <el-table-column prop="keyword" label="匹配关键词" />
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button link type="danger" :disabled="bagStore.moduleEnabled" @click="removeBlacklistRule(scope.$index)">删除</el-button>
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
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { VideoPause } from '@element-plus/icons-vue'
import { useBagStore } from '@/stores/bag'
import { useStashPickupStore } from '@/stores/stashPickup'
import { useInterfaceDetectionStore } from '@/stores/interfaceDetection'
import { formatBagStopReason, setBagModuleEnabled, stopBagStash, updateBagPreferences } from '@/utils/bagService'
import {
  BAG_BLACKLIST_FIELDS,
  BAG_BLACKLIST_FIELD_LABELS,
  BAG_BLACKLIST_MATCH_MODES,
  BAG_BLACKLIST_MATCH_MODE_LABELS,
  INVENTORY_LAYOUT
} from '@/utils/bagConfig'

const bagStore = useBagStore()
const stashPickupStore = useStashPickupStore()
const interfaceStore = useInterfaceDetectionStore()
const calibrationOptions = [
  { key: 'root', label: '文件夹外仓库' },
  { key: 'folder', label: '文件夹内仓库' }
]
const profileOptions = [
  { key: 'normal', label: '普通仓库 12×12' },
  { key: 'quad', label: '大型仓库 24×24' }
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
  'inventory-full': '背包空间不足，取件已停止',
  'game-not-foreground': '游戏不在前台，取件已停止',
  'interface-lost': '仓库或背包界面丢失，取件已停止',
  user: '用户已停止取件',
  'no-candidates': '未检测到符合阈值的物品'
}[stashPickupStore.state.reason] || `仓库取件已停止：${stashPickupStore.state.reason}`))

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

async function updateStashPickupProfile(layout, patch) {
  try { await stashPickupStore.updateProfile(layout, patch) } catch (error) { ElMessage.error(error.message) }
}

function activeProfileThreshold(layout) {
  const profile = stashPickupStore.settings.profiles[layout]
  return profile.thresholds[profile.method]
}

function updateProfileThreshold(layout, value) {
  const profile = stashPickupStore.settings.profiles[layout]
  return updateStashPickupProfile(layout, { thresholds: { ...profile.thresholds, [profile.method]: value } })
}

async function previewStashPickup() {
  try { await stashPickupStore.runPreview() } catch (error) { ElMessage.error(error.message) }
}


function addBlacklistRule() {
  const keyword = draftRule.value.keyword.trim()
  if (!keyword) return ElMessage.warning('请输入黑名单关键词')
  bagStore.setBlacklist([...bagStore.blacklist, {
    field: draftRule.value.field,
    keyword,
    matchMode: draftRule.value.matchMode
  }])
  draftRule.value.keyword = ''
}

function removeBlacklistRule(index) {
  bagStore.setBlacklist(bagStore.blacklist.filter((_rule, ruleIndex) => ruleIndex !== index))
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
  bagStore.setInventoryLayout({ extraEnabled })
}

function setExtraInventoryColumns(extraColumns) {
  bagStore.setInventoryLayout({ extraColumns })
}

function toggleExcludedSlot(column, row) {
  if (bagStore.moduleEnabled) return
  const key = slotKey(column, row)
  const excludedSlots = bagStore.inventoryLayout.excludedSlots.filter((slot) => slotKey(slot.column, slot.row) !== key)
  if (excludedSlots.length === bagStore.inventoryLayout.excludedSlots.length) excludedSlots.push({ column, row })
  bagStore.setInventoryLayout({ excludedSlots })
}

function clearExcludedSlots() {
  if (bagStore.moduleEnabled) return
  bagStore.setInventoryLayout({ excludedSlots: [] })
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
.section-header { margin: 0 0 var(--spacing-sm) var(--spacing-xs); }
.section-title { margin: 0; font-size: var(--font-size-md); font-weight: 600; color: var(--text-primary); }
.section-card { margin-bottom: var(--spacing-lg); box-shadow: none; border: 1px solid var(--border-base); }
.inline-hint { margin-left: 12px; }
.hint-text { margin-top: 6px; color: var(--text-secondary); font-size: 12px; }
.stats-row, .rule-editor { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.rule-editor { margin-top: 16px; }
.rule-editor .el-input { flex: 1; min-width: 220px; }
.rule-table { margin-top: 16px; }
.profile-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
.profile-card { padding: 14px; border: 1px solid var(--border-base); border-radius: 8px; background: var(--bg-primary); }
.profile-card h4 { margin: 0 0 12px; }
.stash-pickup-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin: 12px 0; }
.stash-pickup-preview { margin-top: 12px; color: var(--text-secondary); }
.stash-pickup-preview img { display: block; max-width: 100%; max-height: 520px; margin-top: 8px; border: 1px solid var(--border-base); border-radius: 6px; }
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
