<template>
<section class="sanctum-section">
          <h3>路线策略</h3><el-form label-position="top" :disabled="store.readOnly">
            <el-form-item label="策略预设"><el-select :model-value="strategy.preset" @change="changePreset" style="width: 240px" :disabled="store.readOnly"><el-option v-for="(preset, id) in SANCTUM_PRESETS" :key="id" :label="preset.label" :value="id" /></el-select></el-form-item>
            <details open><summary>调整策略偏好</summary>
            <div v-for="group in practicalGroups" :key="group.key" class="weight-group"><h3>{{ group.label }}</h3>
              <div class="weights"><el-form-item v-for="(_, key) in strategy[group.key]" :key="key" :label="weightLabel(key)"><el-input-number v-model="strategy[group.key][key]" :min="-1000000" :max="1000000" :step="1" :disabled="store.readOnly" /></el-form-item></div>
              <div class="toolbar">
                <el-select v-model="newKeys[group.key]" filterable clearable :placeholder="group.key === 'targetPriority' ? '选择目标奖励' : '选择房间玩法'" style="width: 240px" :disabled="store.readOnly">
                  <el-option v-for="option in weightOptions[group.key]" :key="option.id" :label="option.label" :value="option.id" :disabled="Object.hasOwn(strategy[group.key], option.id)" />
                </el-select>
                <el-button @click="addWeight(group.key)" :disabled="store.readOnly || !canAddWeight(group.key)">添加权重</el-button>
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

</section>
</template>
<script setup>
import { reactive, ref, watch } from 'vue'
import { useSanctumActions } from './useSanctumActions.js'
const { store, perform } = useSanctumActions()
import { SANCTUM_PRESETS, createSanctumStrategy } from '../../../shared/sanctum.js'
import { layoutLabels } from '../../../shared/sanctumPresentation.js'
import currencyManifest from '../../../electron/assets/sanctum/currency/manifest.json'
import { afflictionOptions, canAddStrategyWeight } from './strategyOptions.js'
const strategy = ref(createSanctumStrategy()), newKeys = reactive({})
const weightOptions = {
  targetPriority: [...new Set(currencyManifest.entries.map(entry => entry.name))].map(name => ({ id: name, label: name })),
  layoutPreference: Object.entries(layoutLabels).map(([id, label]) => ({ id, label }))
}
const weightLabel = key => layoutLabels[key] || key
const afflictionGroups = [{ key: 'toleratedAfflictions', label: '可容忍痛苦' }, { key: 'bannedAfflictions', label: '禁选痛苦' }]
const practicalGroups = [{key:'targetPriority',label:'目标奖励优先级（同级不代表同价格，0 为非目标）'},{key:'layoutPreference',label:'房间玩法偏好（偏好分，不代表耗时）'}]
function clearNewKeys() { for (const key of Object.keys(newKeys)) delete newKeys[key] }
function changePreset(id) { strategy.value = createSanctumStrategy(id); clearNewKeys() }
const canAddWeight = group => canAddStrategyWeight(strategy.value, group, newKeys[group]?.trim(), weightOptions[group])
function addWeight(group) {
  if (store.readOnly || !canAddWeight(group)) return
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
