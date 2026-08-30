<template>
  <div class="configuration-issue-editor">
    <template v-if="currencyKey">
      <CoordinateConfigurationField
        :model-value="settings.currencyPositions[currencyKey]"
        :loading="picking === issue.editorId"
        show-pick-text
        :pick-text="`抓取${currencyLabel}坐标`"
        @update:model-value="saveCurrency"
        @pick="pickPoint('currency')"
      />
    </template>

    <CoordinateConfigurationField
      v-else-if="issue.editorId === 'item.position'"
      :model-value="settings.itemPosition"
      :loading="picking === issue.editorId"
      show-pick-text
      pick-text="抓取物品坐标"
      @update:model-value="saveItemPosition"
      @pick="pickPoint('item')"
    />

    <InventoryGridConfigurationField
      v-else-if="issue.editorId === 'inventory.grid'"
      :inventory="settings.inventory"
      :loading="picking === issue.editorId"
      @pick="pickInventoryGrid"
    />

    <TemplateCaptureConfigurationField
      v-else-if="templateDefinition"
      v-bind="templateDefinition"
      @configured="configured"
    />

    <StashTabSelectionSettings
      v-else-if="issue.editorId === 'stash-tab.currency'"
      @configured="configured"
    />

    <template v-else-if="issue.editorId.startsWith('stash-grid.')">
      <StashGridConfigurationField
        v-for="entry in visibleStashCalibrations"
        :key="entry.key"
        :label="entry.label"
        :calibration="interfaceStore.stashGridCalibration[entry.key]"
        :loading="picking === `stash-grid.${entry.key}`"
        @pick="pickStashGrid(entry.key)"
      />
    </template>

    <div v-else-if="issue.editorId === 'junfeng.grid'" class="configuration-issue-editor__row">
      <el-button type="primary" :loading="picking === issue.editorId" @click="pickJunfengGrid">
        {{ junfeng.settings.gridRegion ? '重新框选 12×11 奖励网格' : '框选 12×11 奖励网格' }}
      </el-button>
      <el-tag :type="junfeng.settings.gridRegion ? 'success' : 'info'">
        {{ junfeng.settings.gridRegion ? '已配置' : '未配置' }}
      </el-tag>
    </div>

    <AccountLeagueConfigurationField
      v-else-if="issue.editorId === 'account.poe-cn' || issue.editorId === 'account.league'"
      @configured="configured"
    />

    <ShopStashTabConfigurationField
      v-else-if="issue.editorId === 'shop.stash-tabs'"
      :tabs="chaos.supportedTabs"
      :selected-tab-ids="chaos.settings.selectedTabIds"
      :league="chaos.league"
      :loading="chaos.busy"
      @update:selected-tab-ids="saveShopTabs"
      @update-folder="saveShopFolder"
      @refresh="loadShopTabs"
    />

    <div v-else-if="issue.editorId.startsWith('combat.')" class="combat-editor">
      <template v-if="issue.actionId === 'potion'">
        <el-card v-for="resource in combatResources" :key="resource.key" shadow="never">
          <template #header>
            <div class="configuration-issue-editor__row">
              <strong>{{ resource.label }}</strong>
              <el-switch
                :model-value="combatDraft.potion[resource.key].enabled"
                @change="value => saveCombatResource(resource.key, { enabled: value })"
              />
            </div>
          </template>
          <el-form label-width="100px" label-position="left">
            <el-form-item label="检测坐标">
              <CoordinateConfigurationField
                :model-value="combatDraft.potion[resource.key].point"
                :loading="picking === `combat.${resource.key}`"
                show-pick-text
                pick-text="抓取"
                @update:model-value="value => saveCombatResource(resource.key, { point: value })"
                @pick="pickCombatPoint(resource.key)"
              />
            </el-form-item>
            <el-form-item label="按键序列">
              <KeySequenceCapture
                :model-value="combatDraft.potion[resource.key].keys"
                @update:model-value="value => saveCombatResource(resource.key, { keys: value })"
              />
            </el-form-item>
          </el-form>
        </el-card>
      </template>

      <template v-else-if="issue.actionId === 'loop'">
        <div v-for="(item, index) in combatDraft.loop.items" :key="item.id" class="combat-loop-row">
          <el-switch :model-value="item.enabled" @change="value => saveLoopItem(index, { enabled: value })" />
          <KeyCaptureInput
            :model-value="item.key"
            mode="action"
            placeholder="选择按键"
            @change="value => saveLoopItem(index, { key: value })"
          />
          <el-input-number
            :model-value="item.intervalMs"
            :min="100"
            :step="100"
            @change="value => saveLoopItem(index, { intervalMs: value })"
          />
          <span>毫秒</span>
          <el-button text type="danger" @click="removeLoopItem(index)">删除</el-button>
        </div>
        <el-button type="primary" plain @click="addLoopItem">添加循环按键</el-button>
      </template>

      <el-form v-else label-width="130px" label-position="left">
        <el-form-item label="开启传送门按键">
          <KeyCaptureInput
            :model-value="combatDraft.portal.openKey"
            mode="action"
            @change="value => saveCombatPortal({ openKey: value })"
          />
        </el-form-item>
        <el-form-item label="传送门点击位置">
          <CoordinateConfigurationField
            :model-value="combatDraft.portal.clickPoint"
            :loading="picking === 'combat.portal'"
            show-pick-text
            pick-text="抓取"
            @update:model-value="value => saveCombatPortal({ clickPoint: value })"
            @pick="pickCombatPoint('portal')"
          />
        </el-form-item>
      </el-form>
    </div>

    <div v-else-if="issue.editorId === 'preset.items'" class="preset-editor">
      <PresetSelector type="item" />
      <ModuleTwo />
      <ModuleEldritch />
      <ModuleThree />
    </div>

    <div v-else-if="issue.editorId === 'preset.map'" class="preset-editor">
      <div class="configuration-issue-editor__row">
        <el-radio-group v-model="mapKind">
          <el-radio-button label="atlas">异界地图</el-radio-button>
          <el-radio-button label="chart">航海海图</el-radio-button>
        </el-radio-group>
        <PresetSelector :type="mapKind === 'chart' ? 'chart' : 'map'" />
        <el-select v-model="activeMapProfile.method" class="map-method">
          <el-option label="点金石" value="alchemy" />
          <el-option label="混沌石" value="chaos" />
        </el-select>
      </div>
      <MapRollingProfilePanel
        :profile="activeMapProfile"
        :stat-keys="activeMapStatKeys"
        :title="mapKind === 'chart' ? '航海海图奖励' : '地图基底'"
        :tooltip="mapKind === 'chart' ? '配置当前海图目标' : '配置当前地图目标'"
      />
    </div>

    <div v-else-if="issue.editorId === 'puzzle.inventory-region' || issue.editorId === 'puzzle.atlas-region'" class="configuration-issue-editor__row">
      <el-button type="primary" :loading="picking === issue.editorId" @click="pickPuzzleRegion">
        {{ issue.editorId === 'puzzle.atlas-region' ? '框选 3×3 海图区' : '框选 6×10 碎片仓库区域' }}
      </el-button>
    </div>

    <div v-else-if="issue.editorId.startsWith('puzzle.tab.')" class="configuration-issue-editor__row">
      <el-button type="primary" :loading="picking === issue.editorId" @click="pickPuzzleTab">
        抓取第 {{ puzzlePage }} 页仓库页签坐标
      </el-button>
    </div>

    <el-alert v-else title="该配置项暂时无法在此处编辑，请关闭引导后前往对应功能页配置。" type="warning" :closable="false" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { electronApi } from '@/api/electron'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import { useInterfaceDetectionStore } from '@/stores/interfaceDetection'
import { useChaosRecipeStore } from '@/stores/chaosRecipe'
import { useStashPickupStore } from '@/stores/stashPickup'
import { useJunfengStore } from '@/stores/junfeng'
import { usePuzzleStore } from '@/stores/puzzle'
import { usePresetStore } from '@/stores/preset'
import { CURRENCY_NAMES } from '@/utils/constants'
import { deriveInventoryGridFromRegion } from '@/utils/inventorySettings'
import { updateBagRuntimeConfig } from '@/utils/bagService'
import { CHART_BASE_STATS, MAP_BASE_STATS, createDefaultChartConfig, createDefaultMapConfig } from '@/utils/mapPresetMigration'
import CoordinateConfigurationField from '@/components/configuration/CoordinateConfigurationField.vue'
import InventoryGridConfigurationField from '@/components/configuration/InventoryGridConfigurationField.vue'
import TemplateCaptureConfigurationField from '@/components/configuration/TemplateCaptureConfigurationField.vue'
import AccountLeagueConfigurationField from '@/components/configuration/AccountLeagueConfigurationField.vue'
import StashGridConfigurationField from '@/components/configuration/StashGridConfigurationField.vue'
import ShopStashTabConfigurationField from '@/components/configuration/ShopStashTabConfigurationField.vue'
import KeyCaptureInput from '@/components/common/KeyCaptureInput.vue'
import KeySequenceCapture from '@/components/common/KeySequenceCapture.vue'
import PresetSelector from '@/components/common/PresetSelector.vue'
import StashTabSelectionSettings from '@/domains/settings/StashTabSelectionSettings.vue'
import ModuleTwo from '@/domains/items/components/ModuleTwo.vue'
import ModuleThree from '@/domains/items/components/ModuleThree.vue'
import ModuleEldritch from '@/domains/items/components/ModuleEldritch.vue'
import MapRollingProfilePanel from '@/domains/map/components/MapRollingProfilePanel.vue'

const props = defineProps({ issue: { type: Object, required: true } })
const emit = defineEmits(['configured'])
const settings = useSettingsStore()
const interfaceStore = useInterfaceDetectionStore()
const chaos = useChaosRecipeStore()
const stashPickup = useStashPickupStore()
const junfeng = useJunfengStore()
const puzzle = usePuzzleStore()
const presets = usePresetStore()
const picking = ref('')
const combatDraft = ref(JSON.parse(JSON.stringify(settings.combatAssist)))
const combatResources = [
  { key: 'health', label: '生命药剂' },
  { key: 'mana', label: '魔力药剂' }
]
const templateDefinitions = {
  'template.stash-title': { type: 'stashTitle', regionKey: 'stashRegion', label: '仓库标题模板' },
  'template.inventory-title': { type: 'inventoryTitle', regionKey: 'inventoryRegion', label: '背包标题模板' },
  'template.junfeng-reward-title': { type: 'junfengRewardTitle', regionKey: 'junfengRewardRegion', label: '君锋镇奖励标题模板' }
}

const currencyKey = computed(() => props.issue.editorId.startsWith('currency.') ? props.issue.editorId.slice('currency.'.length) : '')
const currencyLabel = computed(() => CURRENCY_NAMES[currencyKey.value] || currencyKey.value)
const templateDefinition = computed(() => templateDefinitions[props.issue.editorId] || null)
const visibleStashCalibrations = computed(() => {
  const requested = props.issue.editorId.slice('stash-grid.'.length)
  const entries = [
    { key: 'root', label: '文件夹外仓库网格' },
    { key: 'folder', label: '文件夹内仓库网格' }
  ]
  return requested === 'any' ? entries : entries.filter(entry => entry.key === requested)
})
const puzzlePage = computed(() => Number(props.issue.editorId.split('.').at(-1)))
const mapKind = computed({
  get: () => presets.mapRollingKind,
  set: value => presets.setMapRollingKind(value)
})
const mapConfig = computed(() => {
  const preset = presets.currentMapPreset
  if (!preset.map) preset.map = createDefaultMapConfig()
  return preset.map
})
const chartConfig = computed(() => {
  const preset = presets.currentChartPreset
  if (!preset.chart) preset.chart = createDefaultChartConfig()
  return preset.chart
})
const activeMapProfile = computed(() => mapKind.value === 'chart' ? chartConfig.value : mapConfig.value)
const activeMapStatKeys = computed(() => mapKind.value === 'chart' ? CHART_BASE_STATS : MAP_BASE_STATS)

function configured() {
  emit('configured', props.issue.id)
}

function saveCurrency(point) {
  settings.updateCurrencyPosition(currencyKey.value, point)
  configured()
}

function saveItemPosition(point) {
  settings.updateItemPosition(point)
  configured()
}

async function pickPoint(type) {
  if (picking.value) return
  picking.value = props.issue.editorId
  try {
    const result = await electronApi.window.pickScreenCoordinate()
    if (!result || result.canceled) return
    if (result.success === false) throw new Error(result.error?.message || '坐标选取失败')
    const point = { x: result.x, y: result.y }
    if (type === 'currency') saveCurrency(point)
    else saveItemPosition(point)
    ElMessage.success(`已保存坐标 (${point.x}, ${point.y})`)
  } catch (error) {
    ElMessage.error(error?.message || '坐标选取失败')
  } finally {
    picking.value = ''
  }
}

async function pickInventoryGrid() {
  if (picking.value) return
  picking.value = props.issue.editorId
  try {
    const result = await electronApi.window.pickScreenRegion({
      purpose: 'bag-inventory',
      minimumSize: { width: 240, height: 100 }
    })
    if (!result || result.canceled) return
    if (result.success === false) throw new Error(result.error?.message || '框选背包网格失败')
    const grid = deriveInventoryGridFromRegion(result.selectedRegion)
    if (!grid) throw new Error('选区无法换算背包网格，请重新框选')
    const response = await updateBagRuntimeConfig({
      inventory: { ...settings.inventory, startPos: grid.startPos, slotSize: grid.slotSize }
    })
    if (!response?.success) throw new Error(response?.error || '保存背包网格失败')
    configured()
  } catch (error) {
    ElMessage.error(error?.message || '框选背包网格失败')
  } finally {
    picking.value = ''
  }
}

async function pickStashGrid(key) {
  if (picking.value) return
  picking.value = `stash-grid.${key}`
  try {
    const result = props.issue.moduleId === 'shop'
      ? await chaos.calibrate(key)
      : await stashPickup.calibrate(key)
    if (!result?.canceled) configured()
  } catch (error) {
    ElMessage.error(error?.message || '仓库网格框选失败')
  } finally {
    picking.value = ''
  }
}

async function pickJunfengGrid() {
  if (picking.value) return
  picking.value = props.issue.editorId
  try {
    const result = await junfeng.calibrateGrid()
    if (!result?.canceled) configured()
  } catch (error) {
    ElMessage.error(error?.message || '奖励网格框选失败')
  } finally {
    picking.value = ''
  }
}

async function loadShopTabs() {
  try {
    await chaos.loadTabs()
    configured()
  } catch (error) {
    ElMessage.error(error?.message || '加载仓库页失败')
  }
}

async function saveShopTabs(values) {
  const result = await chaos.updateSetting('selectedTabIds', values.map(String))
  if (!result?.success) return ElMessage.error(result?.error || '保存仓库页失败')
  configured()
}

function saveShopFolder({ tabId, inFolder }) {
  chaos.updateTabFolderState(tabId, inFolder)
  configured()
}

async function saveCombat(candidate) {
  combatDraft.value = candidate
  const result = await settings.updateCombatAssist(candidate)
  if (!result?.success) {
    combatDraft.value = JSON.parse(JSON.stringify(settings.combatAssist))
    return ElMessage.error(result?.error || '保存战斗辅助配置失败')
  }
  combatDraft.value = JSON.parse(JSON.stringify(settings.combatAssist))
  configured()
}

function saveCombatResource(key, patch) {
  const candidate = JSON.parse(JSON.stringify(combatDraft.value))
  candidate.potion[key] = { ...candidate.potion[key], ...patch }
  return saveCombat(candidate)
}

function saveCombatPortal(patch) {
  const candidate = JSON.parse(JSON.stringify(combatDraft.value))
  candidate.portal = { ...candidate.portal, ...patch }
  return saveCombat(candidate)
}

function saveLoopItem(index, patch) {
  const candidate = JSON.parse(JSON.stringify(combatDraft.value))
  candidate.loop.items[index] = { ...candidate.loop.items[index], ...patch }
  return saveCombat(candidate)
}

function addLoopItem() {
  const candidate = JSON.parse(JSON.stringify(combatDraft.value))
  candidate.loop.items.push({ id: `loop-${Date.now()}`, key: '', intervalMs: 3000, enabled: true })
  combatDraft.value = candidate
}

function removeLoopItem(index) {
  const candidate = JSON.parse(JSON.stringify(combatDraft.value))
  candidate.loop.items.splice(index, 1)
  return saveCombat(candidate)
}

async function pickCombatPoint(target) {
  if (picking.value) return
  picking.value = target === 'portal' ? 'combat.portal' : `combat.${target}`
  try {
    const result = await electronApi.window.pickScreenCoordinate()
    if (!result || result.canceled) return
    if (result.success === false) throw new Error(result.error?.message || '坐标选取失败')
    const point = { x: result.x, y: result.y }
    if (target === 'portal') await saveCombatPortal({ clickPoint: point })
    else await saveCombatResource(target, { point })
  } catch (error) {
    ElMessage.error(error?.message || '坐标选取失败')
  } finally {
    picking.value = ''
  }
}

async function pickPuzzleRegion() {
  if (picking.value) return
  picking.value = props.issue.editorId
  try {
    const result = props.issue.editorId === 'puzzle.atlas-region'
      ? await puzzle.pickAtlasRegion()
      : await puzzle.pickInventoryRegion()
    if (result?.success) configured()
    else if (!result?.canceled) ElMessage.error(result?.error?.message || '框选区域失败')
  } finally {
    picking.value = ''
  }
}

async function pickPuzzleTab() {
  if (picking.value) return
  picking.value = props.issue.editorId
  try {
    const result = await puzzle.pickInventoryTabPoint(puzzlePage.value)
    if (result?.success) configured()
    else if (!result?.canceled) ElMessage.error(result?.error?.message || '抓取页签坐标失败')
  } finally {
    picking.value = ''
  }
}

watch(() => settings.combatAssist, value => {
  combatDraft.value = JSON.parse(JSON.stringify(value))
}, { deep: true })

watch(
  [() => presets.currentItemPreset, () => presets.currentMapPreset, () => presets.currentChartPreset],
  () => {
    presets.savePresets()
    configured()
  },
  { deep: true }
)

onMounted(() => {
  if (props.issue.editorId === 'shop.stash-tabs' && chaos.auth.authenticated && chaos.league) void loadShopTabs()
})
</script>

<style scoped>
.configuration-issue-editor { display: grid; gap: 14px; }
.configuration-issue-editor__row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
.combat-editor, .preset-editor { display: grid; gap: 14px; }
.combat-loop-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.combat-loop-row :deep(.el-input-number) { width: 130px; }
.map-method { width: 140px; }
</style>
