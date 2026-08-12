<template>
  <div class="map-page primary-page primary-page--column">
    <div class="primary-page__tabs">
      <el-tabs v-model="activeKind" class="kind-tabs">
        <el-tab-pane label="异界地图" name="atlas" />
        <el-tab-pane label="航海海图" name="chart" />
      </el-tabs>
    </div>

    <div class="map-content primary-page__scroll primary-page__content">
      <SupportedFormatPanel :guidance="formatGuidance" />

      <div class="map-header">
        <div class="header-top">
        <div class="form-item">
          <label class="form-label">洗图目标</label>
          <strong>{{ activeKind === 'chart' ? '航海海图' : '异界地图' }}</strong>
        </div>
        <div class="form-item">
          <label class="form-label">洗图方法</label>
          <el-select v-model="activeProfile.method" class="form-select">
            <el-option label="点金石" value="alchemy" />
            <el-option label="混沌石" value="chaos" />
          </el-select>
        </div>
        <div class="form-item">
          <label class="form-label">开始</label>
          <KeyCaptureInput :model-value="shortcuts.mapStart" class="form-input-short" @change="saveShortcut('mapStart', $event)" />
        </div>
        <div class="form-item">
          <label class="form-label">结束</label>
          <KeyCaptureInput :model-value="shortcuts.end" class="form-input-short" @change="saveShortcut('end', $event)" />
        </div>
        <div class="form-item">
          <label class="form-label">预设</label>
          <PresetSelector :type="activeKind === 'chart' ? 'chart' : 'map'" />
        </div>
        <div class="form-item">
          <label class="form-label">操作</label>
          <el-button type="primary" :loading="starting" :disabled="starting || scriptStore.isRunning" @click="handleStart">
            {{ isCurrentModeRunning ? '运行中' : '启动' }}
          </el-button>
        </div>
      </div>

        <div class="header-bottom">
          <el-checkbox v-model="activeProfile.vaal.enabled" label="瓦尔宝珠" size="large">
            <template #default><div class="checkbox-label"><img :src="vaalIcon" alt="瓦尔宝珠" class="icon-image" />瓦尔宝珠</div></template>
          </el-checkbox>
          <el-checkbox v-model="activeProfile.autoStash" label="符合条件存仓" size="large">
            <template #default><div class="checkbox-label">符合条件存仓<el-tooltip content="满足当前目标条件后自动存入仓库" placement="top"><el-icon class="help-icon"><QuestionFilled /></el-icon></el-tooltip></div></template>
          </el-checkbox>
        </div>
      </div>

      <MapRollingProfilePanel
        :profile="activeProfile"
        :stat-keys="activeStatKeys"
        :title="activeKind === 'chart' ? '航海海图奖励' : '地图基底'"
        :tooltip="activeKind === 'chart' ? '区域等级不会被普通通货改变，因此不参与筛选' : '设置地图的基本属性要求'"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'
import { useSettingsStore } from '../settings/settingsStore'
import { usePresetStore } from '../../stores/preset'
import PresetSelector from '@/components/common/PresetSelector.vue'
import vaalIcon from '@/assets/images/瓦尔宝珠.png'
import SupportedFormatPanel from '@/components/common/SupportedFormatPanel.vue'
import { CHART_FORMAT_GUIDANCE, MAP_FORMAT_GUIDANCE } from '@/utils/supportedItemFormats'
import { CHART_BASE_STATS, MAP_BASE_STATS, createDefaultChartConfig, createDefaultMapConfig } from '@/utils/mapPresetMigration'
import KeyCaptureInput from '@/components/common/KeyCaptureInput.vue'
import { useScriptStore } from '@/stores/script'
import { commitGlobalShortcut, startMapRolling } from '@/utils/scriptService'
import MapRollingProfilePanel from './components/MapRollingProfilePanel.vue'

const settingsStore = useSettingsStore()
const presetStore = usePresetStore()
const scriptStore = useScriptStore()
const starting = ref(false)
const isCurrentModeRunning = computed(() => scriptStore.isRunning && scriptStore.mode === 'map')
const shortcuts = computed(() => settingsStore.globalShortcuts)

const mapConfig = computed(() => {
  const preset = presetStore.currentMapPreset
  if (!preset.map) preset.map = createDefaultMapConfig()
  return preset.map
})

const chartConfig = computed(() => {
  const preset = presetStore.currentChartPreset
  if (!preset.chart) preset.chart = createDefaultChartConfig()
  return preset.chart
})

const activeKind = computed({
  get: () => presetStore.mapRollingKind,
  set: value => presetStore.setMapRollingKind(value)
})
const activeProfile = computed(() => activeKind.value === 'chart' ? chartConfig.value : mapConfig.value)
const activeStatKeys = computed(() => activeKind.value === 'chart' ? CHART_BASE_STATS : MAP_BASE_STATS)
const formatGuidance = computed(() => activeKind.value === 'chart' ? CHART_FORMAT_GUIDANCE : MAP_FORMAT_GUIDANCE)

async function saveShortcut(key, value) {
  try { await commitGlobalShortcut(key, value) } catch (error) { ElMessage.error(error.message) }
}

async function handleStart() {
  if (starting.value || scriptStore.isRunning) return
  starting.value = true
  try { await startMapRolling() } finally { starting.value = false }
}

watch(
  [() => presetStore.currentMapPreset, () => presetStore.currentChartPreset],
  () => presetStore.savePresets(),
  { deep: true }
)
</script>

<style scoped lang="less">
.kind-tabs { width: 100%; }
.map-header { margin-bottom: 20px; padding: 20px; border-radius: 8px; background: var(--bg-primary); }
.header-top, .header-bottom, .form-item, .checkbox-label { display: flex; align-items: center; }
.header-top { flex-wrap: wrap; gap: 20px; margin-bottom: 16px; }
.header-bottom { gap: 24px; }
.form-item { gap: 8px; }
.form-label { color: var(--text-primary); font-size: 14px; white-space: nowrap; }
.form-select { width: 120px; }
.form-input-short { width: 80px; }
.checkbox-label { gap: 4px; }
.icon-image { width: 18px; height: 18px; object-fit: contain; }
.help-icon { margin-left: 4px; color: var(--text-secondary); font-size: 14px; }
</style>
