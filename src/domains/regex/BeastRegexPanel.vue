<template>
  <div class="regex-panel">
    <div class="panel-heading">
      <div><h2>野兽正则</h2><p>组合野兽名称和批量购买价格区间。</p></div>
      <RegexPresetSelector kind="beast" />
    </div>
    <div class="workspace-grid">
      <div class="filters">
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

        <el-card class="filter-card">
          <template #header><span>野兽名称筛选</span></template>
          <el-input v-model="query" clearable placeholder="搜索野兽名称" :prefix-icon="Search" />
          <div v-if="selected.length" class="selected-summary">
            <el-tag v-for="item in selected" :key="item.id" :type="item.mode === 'exclude' ? 'danger' : 'success'" closable @close="remove(item.id)">{{ item.mode === 'exclude' ? '排除' : '包括' }} · {{ item.id }}</el-tag>
          </div>
          <p class="hint">包括项匹配任意一种野兽；价格与名称同时满足。共 {{ options.length }} 种野兽。</p>
          <div class="beast-list">
            <div v-for="beast in filtered" :key="beast.id" class="beast-row">
              <span>{{ beast.name }}</span>
              <div class="actions">
                <el-button size="small" :type="config.includeIds.includes(beast.id) ? 'success' : 'default'" @click="toggle(beast.id, 'include')">包括</el-button>
                <el-button size="small" :type="config.excludeIds.includes(beast.id) ? 'danger' : 'default'" @click="toggle(beast.id, 'exclude')">排除</el-button>
              </div>
            </div>
            <el-empty v-if="!filtered.length" description="没有符合条件的野兽" :image-size="64" />
          </div>
        </el-card>
      </div>
      <aside class="result-column"><RegexResultCard title="野兽正则结果" :result="result" @copy="copy" @reset="reset" /></aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { electronApi } from '@/api/electron.js'
import RegexPresetSelector from './RegexPresetSelector.vue'
import RegexResultCard from './RegexResultCard.vue'
import { useRegexPresetStore } from './regexPresetStore.js'
import { MAP_PRICE_CURRENCIES, validateMapPriceRange } from './mapRegex.js'
import { BEAST_REGEX_OPTIONS, createDefaultBeastRegexConfig, generateBeastRegex } from './beastRegex.js'

const store = useRegexPresetStore()
const options = BEAST_REGEX_OPTIONS
const query = ref('')
const config = computed(() => store.currentBeastRegexPreset.beastRegex)
const result = computed(() => generateBeastRegex(config.value))
const priceStatus = computed(() => validateMapPriceRange(config.value.priceRange))
const filtered = computed(() => options.filter(item => item.name.includes(query.value.trim())))
const selected = computed(() => [
  ...config.value.includeIds.map(id => ({ id, mode: 'include' })),
  ...config.value.excludeIds.map(id => ({ id, mode: 'exclude' }))
])
let saveTimer
watch(config, () => { clearTimeout(saveTimer); saveTimer = setTimeout(store.save, 250) }, { deep: true })
onBeforeUnmount(() => { clearTimeout(saveTimer); store.save() })
function remove(id) {
  config.value.includeIds = config.value.includeIds.filter(value => value !== id)
  config.value.excludeIds = config.value.excludeIds.filter(value => value !== id)
}
function toggle(id, mode) {
  const key = mode === 'include' ? 'includeIds' : 'excludeIds'
  const wasSelected = config.value[key].includes(id)
  remove(id)
  if (!wasSelected) config.value[key].push(id)
}
async function copy() {
  if (!result.value.regex) return
  try { await electronApi.clipboard.writeText(result.value.regex); ElMessage.success('野兽正则已复制') }
  catch (error) { ElMessage.error(`复制失败：${error?.message || '无法访问剪贴板'}`) }
}
async function reset() {
  try {
    await ElMessageBox.confirm('确定清空当前野兽正则预设吗？', '重置条件', { confirmButtonText: '重置', cancelButtonText: '取消', type: 'warning' })
    store.update('beast', { beastRegex: createDefaultBeastRegexConfig() })
  } catch {}
}
</script>

<style scoped lang="less">
.panel-heading, .beast-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.panel-heading { margin-bottom: 18px; flex-wrap: wrap; }
h2 { margin: 0 0 6px; font-size: 22px; }
p { color: var(--text-secondary); }
.panel-heading p { margin: 0; }
.workspace-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 340px); gap: 16px; align-items: start; }
.filters { display: grid; gap: 16px; min-width: 0; }
.filter-card { border: 1px solid var(--border-base); box-shadow: none; }
.price-filter, .price-range, .currency-options { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.price-filter { justify-content: space-between; }
.price-range :deep(.el-input-number) { width: 112px; }
.price-card :deep(.el-alert) { margin-top: 14px; }
.selected-summary { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.beast-list { display: grid; gap: 6px; max-height: 560px; overflow-y: auto; }
.beast-row { padding: 10px 12px; border: 1px solid var(--border-base); border-radius: 6px; background: var(--surface-2); }
.actions { display: flex; flex-shrink: 0; gap: 8px; }
.actions :deep(.el-button + .el-button) { margin-left: 0; }
.result-column { position: sticky; top: 0; }
@media (max-width: 1100px) { .workspace-grid { grid-template-columns: 1fr; } .result-column { position: static; } }
</style>
