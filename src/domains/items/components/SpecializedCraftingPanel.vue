<template>
  <div class="specialized-panel">
    <div class="module-section control-section">
      <div class="form-row">
        <div class="form-item">
          <label class="form-label">预设</label>
          <PresetSelector :type="kind" />
        </div>
        <div class="form-item">
          <label class="form-label">首次识别</label>
          <el-checkbox v-model="checkInitialItem">开启</el-checkbox>
        </div>
        <div class="form-item coordinate-item">
          <label class="form-label">被制作物品位置</label>
          <CoordinateConfigurationField :model-value="itemPosition" :loading="picking === 'item'" :disabled="Boolean(picking)" :pick-title="`抓取${title}被制作物品位置`" @update:model-value="updateItemPosition" @pick="pickCoordinate('item')" />
        </div>
        <div v-if="kind === 'harvest'" class="form-item coordinate-item">
          <label class="form-label">工艺按钮位置</label>
          <CoordinateConfigurationField :model-value="actionPosition" :loading="picking === 'action'" :disabled="Boolean(picking)" pick-title="抓取花园工艺按钮位置" @update:model-value="updateActionPosition" @pick="pickCoordinate('action')" />
        </div>
        <div class="form-item">
          <label class="form-label">词缀参考</label>
          <a href="https://poedb.tw/cn/Modifiers" target="_blank" rel="noopener noreferrer"><el-button type="primary" plain>国服流亡编年史·查看词缀</el-button></a>
        </div>
        <div class="form-item">
          <label class="form-label">操作</label>
          <el-button type="primary" :loading="starting" :disabled="starting || scriptStore.isRunning" @click="handleStart">{{ isRunning ? '运行中' : '启动' }}</el-button>
        </div>
        <div class="form-item">
          <label class="form-label">启动快捷键</label>
          <KeyCaptureInput :model-value="settingsStore.globalShortcuts.itemStart" class="shortcut-input" @change="saveShortcut" />
        </div>
      </div>
    </div>
    <div class="module-section">
      <div v-if="kind === 'essence'" class="preset-coordinate-row">
        <div class="form-item coordinate-item compact-coordinate">
          <label class="form-label">目标使用精华位置</label>
          <CoordinateConfigurationField :model-value="actionPosition" :loading="picking === 'action'" :disabled="Boolean(picking)" pick-title="抓取目标精华位置" @update:model-value="updateActionPosition" @pick="pickCoordinate('action')" />
        </div>
      </div>
      <AffixGoalEditor :model-value="preset.affixGroups" @update:model-value="updateAffixGroups" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { electronApi } from '@/api/electron'
import CoordinateConfigurationField from '@/components/configuration/CoordinateConfigurationField.vue'
import KeyCaptureInput from '@/components/common/KeyCaptureInput.vue'
import PresetSelector from '@/components/common/PresetSelector.vue'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import { usePresetStore } from '@/stores/preset'
import { useScriptStore } from '@/stores/script'
import { commitGlobalShortcut, startCrafting } from '@/utils/scriptService'
import AffixGoalEditor from './AffixGoalEditor.vue'

const props = defineProps({ kind: { type: String, required: true, validator: value => ['essence', 'harvest'].includes(value) } })
const presetStore = usePresetStore()
const settingsStore = useSettingsStore()
const scriptStore = useScriptStore()
const picking = ref('')
const starting = ref(false)
const title = computed(() => props.kind === 'essence' ? '精华' : '花园工艺')
const preset = computed(() => props.kind === 'essence' ? presetStore.currentEssencePreset : presetStore.currentHarvestPreset)
const itemPosition = computed(() => props.kind === 'essence' ? settingsStore.essenceItemPosition : settingsStore.harvestItemPosition)
const actionPosition = computed(() => props.kind === 'essence' ? preset.value.essencePosition : settingsStore.harvestCraftButtonPosition)
const checkInitialItem = computed({
  get: () => presetStore.craftingInitialChecks[props.kind],
  set: value => presetStore.updateCraftingInitialCheck(props.kind, value)
})
const isRunning = computed(() => scriptStore.isRunning && scriptStore.mode === 'items' && scriptStore.craftingKind === props.kind)

function updateItemPosition(point) {
  if (props.kind === 'essence') settingsStore.updateEssenceItemPosition(point)
  else settingsStore.updateHarvestItemPosition(point)
}
function updateActionPosition(point) {
  if (props.kind === 'essence') presetStore.updateCurrentEssencePreset({ essencePosition: point })
  else settingsStore.updateHarvestCraftButtonPosition(point)
}
function updateAffixGroups(affixGroups) {
  if (props.kind === 'essence') presetStore.updateCurrentEssencePreset({ affixGroups })
  else presetStore.updateCurrentHarvestPreset({ affixGroups })
}
async function pickCoordinate(target) {
  if (picking.value) return
  picking.value = target
  try {
    const result = await electronApi.window.pickScreenCoordinate()
    if (!result || result.canceled) return
    if (result.success === false) throw new Error(result.error?.message || '坐标选取失败')
    const point = { x: result.x, y: result.y }
    if (target === 'item') updateItemPosition(point); else updateActionPosition(point)
    ElMessage.success(`已选取坐标 (${point.x}, ${point.y})`)
  } catch (error) { ElMessage.error(error?.message || '坐标选取失败') } finally { picking.value = '' }
}
async function saveShortcut(value) {
  try { await commitGlobalShortcut('itemStart', value) } catch (error) { ElMessage.error(error.message) }
}
async function handleStart() {
  if (starting.value || scriptStore.isRunning) return
  presetStore.setItemCraftingKind(props.kind)
  starting.value = true
  try { await startCrafting({ craftingKind: props.kind }) } finally { starting.value = false }
}
</script>

<style scoped lang="less">
.module-section { margin-bottom: var(--spacing-md); padding: var(--spacing-lg); border: 1px solid var(--border-base); border-radius: 8px; background: var(--bg-primary); }
.form-row { display: flex; align-items: flex-end; flex-wrap: wrap; gap: var(--spacing-md); }
.form-item { display: flex; flex-direction: column; gap: var(--spacing-xs); }
.form-label { color: var(--text-regular); font-size: var(--font-size-sm); font-weight: 500; }
.preset-coordinate-row { display: flex; align-items: center; margin-bottom: var(--spacing-md); padding-bottom: var(--spacing-md); border-bottom: 1px solid var(--border-lighter); }
.compact-coordinate { flex-direction: row; align-items: center; gap: var(--spacing-sm); }
.compact-coordinate .form-label { flex: 0 0 auto; white-space: nowrap; }
.shortcut-input { width: 140px; }
a { display: inline-flex; text-decoration: none; }
</style>
