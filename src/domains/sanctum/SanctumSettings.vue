<template>
<section class="sanctum-section">
<el-tabs v-model="settingsTab"><el-tab-pane label="路线策略" name="strategy">
          <h3>路线策略</h3><el-form label-position="top" :disabled="store.readOnly">
            <el-form-item label="策略预设"><el-select :model-value="strategy.preset" @change="changePreset" style="width: 240px" :disabled="store.readOnly"><el-option v-for="(preset, id) in SANCTUM_PRESETS" :key="id" :label="preset.label" :value="id" /></el-select></el-form-item>
            <details :open="modernStrategy"><summary>{{ modernStrategy ? '调整策略偏好' : '旧版自定义权重' }}</summary>
            <div v-if="!modernStrategy" class="weights"><el-form-item v-for="(label, key) in weightLabels" :key="key" :label="label"><el-input-number v-model="strategy.weights[key]" :min="0" :max="1000000" :disabled="store.readOnly" /></el-form-item></div>
            <div v-for="group in modernStrategy ? practicalGroups : weightGroups" :key="group.key" class="weight-group"><h3>{{ group.label }}</h3>
              <div class="weights"><el-form-item v-for="(_, key) in strategy[group.key]" :key="key" :label="weightLabel(key)"><el-input-number v-model="strategy[group.key][key]" :min="group.key === 'timing' ? 0 : -1000000" :max="group.key === 'timing' ? 1 : 1000000" :step="group.key === 'timing' ? 0.05 : 1" :disabled="store.readOnly" /></el-form-item></div>
              <div v-if="group.key !== 'timing'" class="toolbar">
                <el-select v-if="modernStrategy" v-model="newKeys[group.key]" filterable clearable :placeholder="group.key === 'targetPriority' ? '选择目标奖励' : '选择房间玩法'" style="width: 240px" :disabled="store.readOnly">
                  <el-option v-for="option in weightOptions[group.key]" :key="option.id" :label="option.label" :value="option.id" :disabled="Object.hasOwn(strategy[group.key], option.id)" />
                </el-select>
                <el-select v-else-if="group.key === 'relicWeights'" v-model="newKeys[group.key]" filterable placeholder="选择圣物词缀" style="width: 360px" :disabled="store.readOnly">
                  <el-option v-for="modifier in store.state.catalogSummary?.modifiers || []" :key="modifier.id" :label="modifier.label" :value="modifier.id" />
                </el-select>
                <el-input v-else v-model="newKeys[group.key]" placeholder="新增名称或标识" style="width: 240px" maxlength="160" :disabled="store.readOnly" />
                <el-button @click="addWeight(group.key)" :disabled="store.readOnly || (modernStrategy && !canAddWeight(group.key))">添加权重</el-button>
              </div>
            </div>
            </details>
            <el-form-item v-for="group in afflictionGroups" :key="group.key" :label="group.label">
              <el-select v-model="strategy[group.key]" multiple filterable :placeholder="`选择${group.label}`" style="width: 100%" :disabled="store.readOnly">
                <el-option v-for="option in afflictionOptions(store.state.catalogSummary?.afflictions, strategy[group.key])" :key="option.id" :label="option.label" :value="option.id" :disabled="option.disabled" class="affliction-option">
                  <span>{{ option.label }}<template v-if="option.descriptions.length">（{{ option.descriptions.join('；') }}）</template></span>
                </el-option>
              </el-select>
            </el-form-item>
            <el-button type="primary" @click="saveStrategy" :disabled="store.readOnly">保存策略</el-button>
          </el-form>
          </el-tab-pane><el-tab-pane label="识别校准" name="calibration">
          <h3>截图校准</h3>
          <p>按用途选择下方页签。框选后自动保存，取消保留原配置。</p>
          <el-tabs v-model="calibrationTab" class="calibration-tabs" type="border-card">
            <el-tab-pane label="地图" name="map">
              <SanctumLiveCalibration section="map" :profile="store.state.liveCalibration" :public-titles="store.state.publicTitles" :busy="store.busy || store.readOnly" :action="perform" />
            </el-tab-pane>
            <el-tab-pane label="状态栏" name="effects">
              <SanctumLiveCalibration section="effects" :profile="store.state.liveCalibration" :public-titles="store.state.publicTitles" :busy="store.busy || store.readOnly" :action="perform" />
            </el-tab-pane>
            <el-tab-pane label="圣物" name="relics">
              <SanctumRelicCalibration :profiles="store.state.relicCalibrations" :public-titles="store.state.publicTitles" :busy="store.busy || store.readOnly" :action="perform" />
            </el-tab-pane>
          </el-tabs>
</el-tab-pane></el-tabs>
</section>
</template>
<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useSanctumActions } from './useSanctumActions.js'
const { store, perform } = useSanctumActions()
import { SANCTUM_PRESETS, createSanctumStrategy } from '../../../shared/sanctum.js'
import { layoutLabels, timingLabels } from '../../../shared/sanctumPresentation.js'
import currencyManifest from '../../../electron/assets/sanctum/currency/manifest.json'
import { afflictionOptions, canAddStrategyWeight } from './strategyOptions.js'
import SanctumLiveCalibration from './SanctumLiveCalibration.vue'
import SanctumRelicCalibration from './SanctumRelicCalibration.vue'
const props = defineProps({ section: { type: String, default: 'strategy' } })
const emit = defineEmits(['update:section'])
const settingsTab = computed({ get: () => props.section, set: value => emit('update:section', value) }), calibrationTab = ref('map')
const strategy = ref(createSanctumStrategy()), newKeys = reactive({})
const weightOptions = {
  targetPriority: [...new Set(currencyManifest.entries.map(entry => entry.name))].map(name => ({ id: name, label: name })),
  layoutPreference: Object.entries(layoutLabels).map(([id, label]) => ({ id, label }))
}
const weightLabels = { reward: '货币收益', recovery: '续航收益', risk: '痛苦代价', relic: '圣物产出', options: '后续选择余地' }
const weightLabel = key => timingLabels[key] || layoutLabels[key] || store.state.catalogSummary?.modifiers?.find(modifier => modifier.id === key)?.label || key
const modernStrategy = computed(()=>['reveal','quantity'].includes(strategy.value.preset))
const afflictionGroups = computed(() => [
  ...(modernStrategy.value ? [{ key: 'toleratedAfflictions', label: '可容忍痛苦' }] : []),
  { key: 'bannedAfflictions', label: '禁选痛苦' }
])
const practicalGroups = [{key:'targetPriority',label:'目标奖励优先级（同级不代表同价格，0 为非目标）'},{key:'layoutPreference',label:'房间玩法偏好（偏好分，不代表耗时）'}]
const weightGroups = [{ key: 'currencyWeights', label: '货币相对权重' }, { key: 'timing', label: '领取时机折扣' },
  { key: 'afflictionWeights', label: '痛苦代价' }, { key: 'roomWeights', label: '房间偏好' }, { key: 'relicWeights', label: '圣物词缀权重' }]
function clearNewKeys() { for (const key of Object.keys(newKeys)) delete newKeys[key] }
function changePreset(id) { strategy.value = createSanctumStrategy(id); clearNewKeys() }
const canAddWeight = group => canAddStrategyWeight(strategy.value, group, newKeys[group]?.trim(), weightOptions[group])
function addWeight(group) {
  if (store.readOnly || (modernStrategy.value && !canAddWeight(group))) return
  const key = newKeys[group]?.trim()
  if (!key || ['__proto__', 'constructor', 'prototype'].includes(key)) return
  if (!Object.hasOwn(strategy.value[group], key)) strategy.value[group][key] = 1
  newKeys[group] = ''
}
async function saveStrategy() {
  await perform('saveStrategy', strategy.value)
}
watch(() => JSON.stringify(store.state.strategy), serialized => {
  const value = JSON.parse(serialized)
  strategy.value = { ...value, layoutPreference: { miniboss: 0, ...value.layoutPreference },
    toleratedAfflictions: value.toleratedAfflictions || [], bannedAfflictions: value.bannedAfflictions || [] }
  clearNewKeys()
}, { immediate: true })

</script>
<style scoped lang="less">
@import "./sanctumSection.less";
.affliction-option { height: auto; min-height: 34px; line-height: 1.5; padding-top: 8px; padding-bottom: 8px; white-space: normal; overflow-wrap: anywhere; }
</style>
