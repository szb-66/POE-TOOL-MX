<template>
  <div class="batch-module">
    <div class="batch-header">
      <h3>背包批量制作</h3>
      <el-switch :model-value="enabled" active-text="启用" inactive-text="关闭" :disabled="scriptStore.isRunning || store.busy" @change="toggleEnabled" />
    </div>

    <el-alert
      v-if="enabled"
      title="请先在游戏中打开角色背包和通货仓库页面"
      :description="preparationDescription"
      type="warning"
      :closable="false"
      show-icon
    />

    <div v-if="enabled" class="batch-body">
      <div class="scan-controls">
        <el-button type="primary" :loading="store.busy" :disabled="scriptStore.isRunning" @click="scanInventory">
          {{ store.snapshot ? '重新扫描' : '扫描背包' }}
        </el-button>
        <el-button v-if="store.busy" type="danger" plain @click="store.stopScan">停止扫描</el-button>
        <span v-if="store.snapshot?.scannedAt" class="scan-time">扫描于 {{ formatTime(store.snapshot.scannedAt) }}</span>
      </div>

      <el-progress
        v-if="store.busy"
        :percentage="scanPercentage"
        :format="() => `${store.progress.scanned}/${store.progress.total} 格`"
      />
      <el-alert v-if="store.error" :title="store.error" type="error" :closable="false" show-icon />

      <div v-if="scriptStore.batchRuntime.total" class="batch-progress-panel">
        <strong>批次进度：{{ scriptStore.batchRuntime.completed }}/{{ scriptStore.batchRuntime.total }}</strong>
        <span v-if="scriptStore.batchRuntime.currentItem">
          当前 {{ scriptStore.batchRuntime.currentItem.displayName || scriptStore.batchRuntime.currentItem.baseType }}，剩余 {{ scriptStore.batchRuntime.remaining }} 件
        </span>
        <span v-if="scriptStore.batchRuntime.stopReason" class="batch-error">{{ scriptStore.batchRuntime.stopReason }}；请重新扫描后建立新批次。</span>
      </div>

      <template v-if="store.snapshot">
        <div class="category-section">
          <strong>需要制作的物品类别</strong>
          <el-checkbox-group :model-value="categoryIds" :disabled="scriptStore.isRunning" @change="updateCategories">
            <el-checkbox v-for="category in store.categories" :key="category.id" :value="category.id">
              <span class="category-dot" :style="{ background: categoryColor(category.id) }" />
              {{ category.label }}（{{ category.count }}）
            </el-checkbox>
          </el-checkbox-group>
          <el-empty v-if="!store.categories.length" description="当前背包没有支持批量制作的物品" :image-size="48" />
        </div>

        <div class="inventory-preview">
          <div class="preview-heading">
            <strong>原生背包预览（候选 {{ store.candidates.length }} 件）</strong>
            <span>勾选类别后，对应物品会整体高亮。</span>
          </div>
          <div class="inventory-grid" role="img" aria-label="原生十二列五行背包扫描预览">
            <span v-for="cell in 60" :key="cell" class="empty-cell" />
            <el-tooltip v-for="issue in gridIssues" :key="`issue-${issue.code}-${issue.x}-${issue.y}`" placement="top" effect="dark">
              <template #content>
                <div class="item-tooltip">
                  <b>扫描问题</b>
                  <span>位置：第 {{ issue.x + 1 }} 列第 {{ issue.y + 1 }} 行</span>
                  <span class="tooltip-warning">{{ issue.message }}</span>
                </div>
              </template>
              <div class="inventory-item blocked issue-region" :style="issueStyle(issue)">无法识别</div>
            </el-tooltip>
            <el-tooltip
              v-for="item in store.snapshot.items"
              :key="item.id"
              placement="top"
              effect="dark"
              :show-after="150"
            >
              <template #content>
                <div class="item-tooltip">
                  <b>{{ item.displayName }}</b>
                  <span>底材：{{ item.baseType || '未知' }}</span>
                  <span>类别：{{ item.categoryLabel || item.categoryRaw || '不支持' }}</span>
                  <span>稀有度：{{ item.rarity || '未知' }} · 物品等级：{{ item.itemLevel || '未知' }}</span>
                  <span>位置：第 {{ item.x + 1 }} 列第 {{ item.y + 1 }} 行 · {{ item.width }}×{{ item.height }}</span>
                  <span>尺寸来源：{{ footprintLabel(item.footprintSource) }}</span>
                  <span v-if="item.issue" class="tooltip-warning">{{ item.issue }}</span>
                </div>
              </template>
              <div
                class="inventory-item"
                :class="{
                  selected: isSelected(item),
                  muted: item.selectable !== false && !isSelected(item),
                  blocked: item.selectable === false,
                  completed: isCompleted(item)
                }"
                :style="itemStyle(item)"
              >
                <span>{{ shortLabel(item) }}</span>
                <span v-if="isCompleted(item)" class="completion-mark" aria-label="已制作完成">
                  <el-icon><Check /></el-icon>
                </span>
              </div>
            </el-tooltip>
          </div>
          <div v-if="store.snapshot.issues?.length" class="scan-issues">
            <el-tag type="warning" effect="plain">{{ store.snapshot.issues.length }} 个格子需要处理</el-tag>
            <span>警示区域不会加入批量制作；请调整物品摆放后重新扫描。</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, h, ref } from 'vue'
import { ElCheckbox, ElMessage, ElMessageBox } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { usePresetStore } from '@/stores/preset'
import { useBatchCraftingStore } from '@/stores/batchCrafting'
import { useScriptStore } from '@/stores/script'
import { useSettingsStore } from '@/domains/settings/settingsStore'

const presets = usePresetStore()
const store = useBatchCraftingStore()
const scriptStore = useScriptStore()
const settingsStore = useSettingsStore()

const CATEGORY_COLORS = Object.freeze({
  helmet: '#4f8cff', bodyArmour: '#5865d8', gloves: '#35a7b8', boots: '#2dbe88',
  shield: '#6d72c3', oneHandWeapon: '#e98736', twoHandWeapon: '#d75b4a', bow: '#c68a2f',
  quiver: '#a66b3d', ring: '#b86de0', amulet: '#9a63d5', belt: '#8b6f47',
  jewel: '#d84fa1', flask: '#34a853'
})

const enabled = computed(() => Boolean(presets.currentItemPreset.batchCrafting?.enabled))
const categoryIds = computed(() => presets.currentItemPreset.batchCrafting?.categoryIds || [])
const selectedSet = computed(() => new Set(categoryIds.value))
const completedSet = computed(() => new Set(scriptStore.batchRuntime.completedIds || []))
const scanPercentage = computed(() => Math.min(100, Math.round(store.progress.scanned / Math.max(1, store.progress.total) * 100)))
const gridIssues = computed(() => (store.snapshot?.issues || []).filter(issue =>
  !(store.snapshot?.items || []).some(item => item.x === issue.x && item.y === issue.y && item.issueCode === issue.code)
))
const preparationDescription = computed(() => settingsStore.stashTabSelection?.enabled
  ? '扫描不会主动打开或关闭游戏页面。正式制作时会按全局设置自动选择已配置的通货页。'
  : '扫描不会主动打开或关闭游戏页面。全局自动选页已关闭，请保持正确的通货页处于当前页面。')

function saveBatch(patch) {
  presets.updateCurrentItemPreset({ batchCrafting: { ...presets.currentItemPreset.batchCrafting, ...patch } })
}

function toggleEnabled(value) {
  saveBatch({ enabled: Boolean(value) })
  if (!value) store.clear()
}

function updateCategories(value) {
  saveBatch({ categoryIds: value })
}

async function scanInventory() {
  try {
    if (!settingsStore.batchScanConfirmationSuppressed) {
      const suppressConfirmation = ref(false)
      await ElMessageBox.confirm(
        h('div', { class: 'scan-confirm-content' }, [
          h('p', '请确认游戏中已经同时打开角色背包和通货仓库页面。扫描只会聚焦游戏、移动鼠标并复制物品，不会主动打开或切换页面。'),
          h(ElCheckbox, {
            modelValue: suppressConfirmation.value,
            'onUpdate:modelValue': value => { suppressConfirmation.value = Boolean(value) }
          }, () => '不再显示')
        ]),
        '准备扫描原生背包',
        { confirmButtonText: '开始扫描', cancelButtonText: '取消', type: 'warning' }
      )
      if (suppressConfirmation.value) settingsStore.updateBatchScanConfirmationSuppressed(true)
    }
    await store.scanInventory({
      inventory: settingsStore.inventory,
      operationDelayMs: settingsStore.operationDelayMs,
      fixedTiming: settingsStore.fixedTiming
    })
    ElMessage.success('原生背包扫描完成')
  } catch (error) {
    if (error === 'cancel' || error === 'close' || error?.cancelled || error?.code === 'USER_STOPPED') return
    ElMessage.error(error?.message || '本地背包扫描失败')
  }
}

function categoryColor(id) {
  return CATEGORY_COLORS[id] || '#7f8794'
}

function isSelected(item) {
  return item.selectable !== false && selectedSet.value.has(item.categoryId)
}

function isCompleted(item) {
  return completedSet.value.has(String(item.id))
}

function itemStyle(item) {
  return {
    left: `${item.x / 12 * 100}%`,
    top: `${item.y / 5 * 100}%`,
    width: `${item.width / 12 * 100}%`,
    height: `${item.height / 5 * 100}%`,
    '--item-color': item.selectable === false ? '#b7791f' : categoryColor(item.categoryId)
  }
}

function issueStyle(issue) {
  return {
    left: `${issue.x / 12 * 100}%`, top: `${issue.y / 5 * 100}%`,
    width: `${100 / 12}%`, height: `${100 / 5}%`, '--item-color': '#b7791f'
  }
}

function shortLabel(item) {
  return item.issueCode === 'AMBIGUOUS_FOOTPRINT' ? '占位歧义' : (item.categoryLabel || item.displayName)
}

function footprintLabel(source) {
  if (source === 'catalog') return '本地尺寸目录'
  if (source === 'inferred-single') return '扫描推断为单格'
  if (source === 'ambiguous') return '无法确定'
  return '未知'
}

function formatTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '未知时间' : date.toLocaleTimeString('zh-CN', { hour12: false })
}
</script>

<style scoped lang="less">
.batch-module, .batch-body { display: flex; flex-direction: column; gap: 14px; }
.batch-header, .scan-controls, .preview-heading, .scan-issues { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.batch-header { justify-content: space-between; }
.batch-header h3 { margin: 0; font-size: 16px; }
.scan-time, .preview-heading span, .scan-issues span { color: var(--text-secondary); font-size: 12px; }
.batch-progress-panel { display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; border: 1px solid var(--border-base); border-radius: 6px; background: var(--bg-secondary); }
.batch-progress-panel span { color: var(--text-secondary); font-size: 12px; }
.batch-progress-panel .batch-error { color: var(--el-color-danger); }
.category-section, .inventory-preview { display: flex; flex-direction: column; gap: 9px; }
.category-section :deep(.el-checkbox-group) { display: flex; flex-wrap: wrap; gap: 4px 16px; }
.category-section :deep(.el-checkbox) { margin-right: 0; }
.category-dot { display: inline-block; width: 9px; height: 9px; border-radius: 3px; margin-right: 4px; }
.preview-heading { justify-content: space-between; }
.inventory-grid { position: relative; display: grid; grid-template-columns: repeat(12, 1fr); grid-template-rows: repeat(5, 1fr); width: min(100%, 720px); aspect-ratio: 12 / 5; border: 1px solid var(--border-base); border-radius: 8px; overflow: hidden; background: var(--bg-primary); }
.empty-cell { border-right: 1px solid color-mix(in srgb, var(--border-base) 70%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--border-base) 70%, transparent); }
.inventory-item { position: absolute; z-index: 2; box-sizing: border-box; display: flex; align-items: center; justify-content: center; padding: 3px; overflow: hidden; color: #fff; font-size: 11px; font-weight: 700; text-align: center; background: var(--item-color); border: 2px solid color-mix(in srgb, var(--item-color) 70%, #fff); border-radius: 5px; transition: filter .15s ease, box-shadow .15s ease, transform .15s ease; }
.inventory-item.muted { filter: saturate(.42) brightness(.72); }
.inventory-item.selected { z-index: 3; box-shadow: 0 0 0 2px #fff, 0 0 14px color-mix(in srgb, var(--item-color) 75%, transparent); transform: scale(.97); }
.inventory-item.completed { border-color: #8cff9b; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .7), 0 0 12px rgba(38, 214, 84, .65); }
.completion-mark { position: absolute; top: 4px; right: 4px; display: grid; place-items: center; width: 20px; height: 20px; color: #fff; font-size: 16px; background: #20a83a; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 1px 4px rgba(0, 0, 0, .35); }
.inventory-item.blocked { background: repeating-linear-gradient(135deg, #8b5a16 0 8px, #c98b2e 8px 16px); border-color: #ffd27a; color: #fff7df; }
.inventory-item.issue-region { z-index: 4; font-size: 9px; }
.item-tooltip { display: flex; flex-direction: column; gap: 3px; max-width: 300px; }
.tooltip-warning { color: #ffd27a; }
:global(.scan-confirm-content) { display: flex; flex-direction: column; gap: 8px; }
:global(.scan-confirm-content p) { margin: 0; line-height: 1.6; }
@media (max-width: 720px) { .inventory-item { font-size: 9px; } }
</style>
