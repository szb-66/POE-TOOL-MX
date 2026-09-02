<template>
  <div class="regex-panel">
    <div class="panel-heading">
      <div><h2>地图正则</h2><p>组合地图数值、状态与普通或 T17 词缀。</p></div>
      <RegexPresetSelector kind="map" />
    </div>
    <div class="workspace-grid">
      <div class="filters">
        <div class="top-grid">
          <el-card class="filter-card">
            <template #header>
              <div class="card-heading">
                <span>数量与掉落</span>
                <div class="heading-actions">
                  <el-radio-group v-model="config.statMatch" size="small"><el-radio-button value="all">全部</el-radio-button><el-radio-button value="any">任一</el-radio-button></el-radio-group>
                  <el-radio-group v-model="config.numericMode" size="small"><el-radio-button value="exact">精准</el-radio-button><el-radio-button value="optimized">优化</el-radio-button></el-radio-group>
                </div>
              </div>
            </template>
            <div class="stat-list">
              <div v-for="stat in MAP_REGEX_STATS" :key="stat.id" class="stat-row">
                <el-checkbox v-model="config.stats[stat.id].enabled">{{ stat.label }}</el-checkbox>
                <span>≥</span>
                <el-input-number v-model="config.stats[stat.id].value" :min="0" :max="999" controls-position="right" />
                <span>%</span>
              </div>
            </div>
          </el-card>
          <el-card class="filter-card">
            <template #header><span>地图状态</span></template>
            <div class="state-block">
              <div class="state-heading"><span>地图稀有度</span><ModeButtons v-model="config.rarity.mode" /></div>
              <el-checkbox-group v-model="config.rarity.selectedIds" class="inline-options">
                <el-checkbox v-for="item in MAP_RARITY_OPTIONS" :key="item.id" :value="item.id">{{ item.label }}</el-checkbox>
              </el-checkbox-group>
            </div>
            <div class="state-block">
              <div class="state-heading"><el-checkbox v-model="config.corrupted.enabled">筛选腐化地图</el-checkbox><ModeButtons v-model="config.corrupted.mode" /></div>
            </div>
          </el-card>
        </div>

        <el-card class="filter-card price-card">
          <template #header><span>批量购买价格筛选</span></template>
          <div class="price-filter">
            <div class="price-range">
              <span>价格范围</span>
              <el-input-number v-model="config.priceRange.min" :min="1" :max="999" :controls="false" placeholder="最低价" />
              <span>—</span>
              <el-input-number v-model="config.priceRange.max" :min="1" :max="999" :controls="false" placeholder="最高价" />
            </div>
            <el-checkbox-group v-model="config.priceRange.currencies" class="currency-options">
              <el-checkbox v-for="currency in MAP_PRICE_CURRENCIES" :key="currency.id" :value="currency.id">{{ currency.label }}</el-checkbox>
            </el-checkbox-group>
          </div>
          <el-alert v-if="priceStatus.active && !priceStatus.valid" :title="priceStatus.message" type="warning" :closable="false" show-icon />
        </el-card>

        <el-card class="filter-card affix-card">
          <template #header>
            <div class="card-heading">
              <span>词缀过滤器</span>
              <el-radio-group v-model="config.affixMatch" size="small"><el-radio-button value="any">任一</el-radio-button><el-radio-button value="all">全部</el-radio-button></el-radio-group>
            </div>
          </template>
          <div class="affix-toolbar">
            <el-checkbox-group v-model="config.affixTypes"><el-checkbox value="prefix">前缀</el-checkbox><el-checkbox value="suffix">后缀</el-checkbox></el-checkbox-group>
            <el-radio-group v-model="config.region" size="small"><el-radio-button value="normal">普通</el-radio-button><el-radio-button value="t17">T17</el-radio-button></el-radio-group>
            <el-input v-model="query" :prefix-icon="Search" clearable placeholder="搜索词缀描述或标签" class="affix-search" />
          </div>
          <div v-if="selectedAffixes.length" class="selected-summary">
            <el-tag v-for="item in selectedAffixes" :key="`${item.kind}-${item.id}`" :type="item.kind === 'exclude' ? 'danger' : 'success'" closable @close="removeAffix(item.id)">
              {{ item.kind === 'exclude' ? '排除' : '想要' }} · {{ item.value }}
            </el-tag>
          </div>
          <div class="affix-list">
            <div v-for="affix in filteredAffixes" :key="affix.id" class="affix-row">
              <div class="affix-copy">
                <strong>{{ affix.value }}</strong>
                <span>{{ affix.example }}</span>
              </div>
              <el-tag size="small" type="info">{{ affix.affixType === 'suffix' ? '后缀' : affix.affixType === 'prefix' ? '前缀' : '混合' }}</el-tag>
              <div class="affix-actions">
                <el-button size="small" :type="config.includeAffixIds.includes(affix.id) ? 'success' : 'default'" :icon="CirclePlus" @click="toggleAffix(affix.id, 'include')">想要</el-button>
                <el-button size="small" :type="config.excludeAffixIds.includes(affix.id) ? 'danger' : 'default'" :icon="CircleClose" @click="toggleAffix(affix.id, 'exclude')">排除</el-button>
              </div>
            </div>
            <el-empty v-if="!filteredAffixes.length" description="没有符合条件的词缀" :image-size="64" />
          </div>
        </el-card>
      </div>
      <aside class="result-column"><RegexResultCard title="地图正则结果" :result="result" @copy="copy" @reset="reset" /></aside>
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, ref, watch } from 'vue'
import { CircleClose, CirclePlus, Search } from '@element-plus/icons-vue'
import { ElButton } from 'element-plus'
import { electronApi } from '@/api/electron.js'
import RegexPresetSelector from './RegexPresetSelector.vue'
import RegexResultCard from './RegexResultCard.vue'
import { useRegexPresetStore } from './regexPresetStore.js'
import { createDefaultMapRegexConfig, generateMapRegex, MAP_PRICE_CURRENCIES, MAP_RARITY_OPTIONS, MAP_REGEX_AFFIXES, MAP_REGEX_STATS, validateMapPriceRange } from './mapRegex.js'

const ModeButtons = defineComponent({
  props: { modelValue: { type: String, required: true } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('div', { class: 'mode-buttons' }, [
      h(ElButton, { size: 'small', type: props.modelValue === 'include' ? 'primary' : 'default', onClick: () => emit('update:modelValue', 'include') }, () => '包括'),
      h(ElButton, { size: 'small', type: props.modelValue === 'exclude' ? 'danger' : 'default', onClick: () => emit('update:modelValue', 'exclude') }, () => '排除')
    ])
  }
})

const store = useRegexPresetStore()
const query = ref('')
const config = computed(() => store.currentMapRegexPreset.mapRegex)
const result = computed(() => generateMapRegex(config.value))
const priceStatus = computed(() => validateMapPriceRange(config.value.priceRange))
const filteredAffixes = computed(() => {
  const keyword = query.value.trim().toLocaleLowerCase('zh-CN')
  return MAP_REGEX_AFFIXES.filter(item => item.regions.includes(config.value.region))
    .filter(item => item.affixType === 'mixed' || config.value.affixTypes.includes(item.affixType))
    .filter(item => !keyword || `${item.value} ${item.example} ${(item.tags || []).join(' ')}`.toLocaleLowerCase('zh-CN').includes(keyword))
})
const selectedAffixes = computed(() => [
  ...config.value.includeAffixIds.map(id => ({ ...MAP_REGEX_AFFIXES.find(item => item.id === id), kind: 'include' })),
  ...config.value.excludeAffixIds.map(id => ({ ...MAP_REGEX_AFFIXES.find(item => item.id === id), kind: 'exclude' }))
].filter(item => item.id))

let saveTimer
watch(config, () => { clearTimeout(saveTimer); saveTimer = setTimeout(store.save, 250) }, { deep: true })

function toggleAffix(id, kind) {
  const own = kind === 'include' ? config.value.includeAffixIds : config.value.excludeAffixIds
  const other = kind === 'include' ? config.value.excludeAffixIds : config.value.includeAffixIds
  const index = own.indexOf(id)
  if (index >= 0) own.splice(index, 1)
  else { const otherIndex = other.indexOf(id); if (otherIndex >= 0) other.splice(otherIndex, 1); own.push(id) }
}
function removeAffix(id) {
  for (const values of [config.value.includeAffixIds, config.value.excludeAffixIds]) {
    const index = values.indexOf(id); if (index >= 0) values.splice(index, 1)
  }
}
async function copy() {
  if (!result.value.regex) return
  try { await electronApi.clipboard.writeText(result.value.regex); ElMessage.success('地图正则已复制') }
  catch (error) { ElMessage.error(`复制失败：${error?.message || '无法访问剪贴板'}`) }
}
async function reset() {
  try {
    await ElMessageBox.confirm('确定清空当前地图正则预设吗？', '重置条件', { confirmButtonText: '重置', cancelButtonText: '取消', type: 'warning' })
    store.update('map', { mapRegex: createDefaultMapRegexConfig() })
  } catch {}
}
</script>

<style scoped lang="less">
.panel-heading, .card-heading, .state-heading, .affix-toolbar, .affix-row { display: flex; align-items: center; gap: 14px; }
.panel-heading, .card-heading, .state-heading { justify-content: space-between; }
.panel-heading { margin-bottom: 18px; }
.panel-heading h2 { margin: 0 0 6px; font-size: 22px; }
.panel-heading p, .affix-copy span { margin: 0; color: var(--text-secondary); }
.workspace-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 340px); gap: 16px; align-items: start; }
.filters { display: grid; gap: 16px; }
.top-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.filter-card { border: 1px solid var(--border-base); box-shadow: none; }
.heading-actions, .inline-options, .mode-buttons, .affix-actions { display: flex; align-items: center; gap: 8px; }
.mode-buttons :deep(.el-button + .el-button), .affix-actions :deep(.el-button + .el-button) { margin-left: 0; }
.stat-list { display: grid; gap: 10px; }
.stat-row { display: grid; grid-template-columns: minmax(110px, 1fr) auto 120px auto; align-items: center; gap: 8px; }
.stat-row :deep(.el-input-number) { width: 120px; }
.state-block + .state-block { margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--border-light); }
.inline-options { margin-top: 14px; }
.price-filter, .price-range, .currency-options { display: flex; align-items: center; gap: 12px; }
.price-filter { justify-content: space-between; flex-wrap: wrap; }
.price-range :deep(.el-input-number) { width: 112px; }
.price-card :deep(.el-alert) { margin-top: 14px; }
.affix-toolbar { flex-wrap: wrap; margin-bottom: 14px; }
.affix-search { min-width: 220px; flex: 1; }
.selected-summary { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; padding: 12px; border-radius: 6px; background: var(--surface-2); }
.affix-list { display: grid; max-height: 560px; gap: 6px; overflow-y: auto; }
.affix-row { padding: 10px 12px; border: 1px solid var(--border-base); border-radius: 6px; background: var(--surface-2); }
.affix-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 3px; }
.affix-copy strong, .affix-copy span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.result-column { position: sticky; top: 20px; }
@media (max-width: 1100px) { .workspace-grid { grid-template-columns: 1fr; } .result-column { position: static; } }
@media (max-width: 800px) { .panel-heading { align-items: flex-start; flex-direction: column; } .top-grid { grid-template-columns: 1fr; } .price-filter, .price-range { align-items: stretch; flex-direction: column; } .price-range :deep(.el-input-number) { width: 100%; } .currency-options { align-items: flex-start; flex-direction: column; } .affix-row { align-items: flex-start; flex-wrap: wrap; } .affix-actions { width: 100%; } }
</style>
