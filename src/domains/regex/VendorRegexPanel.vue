<template>
  <div class="regex-panel">
    <div class="panel-heading">
      <div><h2>商城正则</h2><p>选择需要在商人物品中包括或排除的条件。</p></div>
      <RegexPresetSelector kind="vendor" />
    </div>
    <div class="workspace-grid">
      <div class="filter-grid">
        <el-card v-for="group in VENDOR_GROUPS" :key="group.id" class="filter-card">
          <template #header>
            <div class="group-header">
              <span>{{ group.title }}</span>
              <el-button-group>
                <el-button size="small" :type="vendor[group.id].mode === 'include' ? 'primary' : 'default'" @click="vendor[group.id].mode = 'include'">包括</el-button>
                <el-button size="small" :type="vendor[group.id].mode === 'exclude' ? 'danger' : 'default'" @click="vendor[group.id].mode = 'exclude'">排除</el-button>
              </el-button-group>
            </div>
          </template>
          <el-checkbox-group v-model="vendor[group.id].selectedIds" class="option-grid">
            <el-checkbox v-for="item in group.options" :key="item.id" :value="item.id">{{ item.label }}</el-checkbox>
          </el-checkbox-group>
        </el-card>
      </div>
      <aside class="result-column"><RegexResultCard title="商城正则结果" :result="result" @copy="copy" @reset="reset" /></aside>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { electronApi } from '@/api/electron.js'
import RegexPresetSelector from './RegexPresetSelector.vue'
import RegexResultCard from './RegexResultCard.vue'
import { useRegexPresetStore } from './regexPresetStore.js'
import { VENDOR_GROUPS } from './vendorData.js'
import { createDefaultVendorConfig } from './vendorConfig.js'
import { generateVendorRegex } from './vendorRegex.js'

const store = useRegexPresetStore()
const vendor = computed(() => store.currentVendorPreset.vendor)
const result = computed(() => generateVendorRegex(vendor.value))
let saveTimer
watch(vendor, () => { clearTimeout(saveTimer); saveTimer = setTimeout(store.save, 250) }, { deep: true })

async function copy() {
  if (!result.value.regex) return
  try { await electronApi.clipboard.writeText(result.value.regex); ElMessage.success('商城正则已复制') }
  catch (error) { ElMessage.error(`复制失败：${error?.message || '无法访问剪贴板'}`) }
}
async function reset() {
  try {
    await ElMessageBox.confirm('确定清空当前商城正则预设吗？', '重置条件', { confirmButtonText: '重置', cancelButtonText: '取消', type: 'warning' })
    store.update('vendor', { vendor: createDefaultVendorConfig() })
  } catch {}
}
</script>

<style scoped lang="less">
.panel-heading, .group-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.panel-heading { margin-bottom: 18px; }
.panel-heading h2 { margin: 0 0 6px; font-size: 22px; }
.panel-heading p { margin: 0; color: var(--text-secondary); }
.workspace-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 340px); gap: 16px; align-items: start; }
.filter-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.filter-card { border: 1px solid var(--border-base); box-shadow: none; }
.option-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 12px; }
.option-grid :deep(.el-checkbox) { min-height: 34px; margin: 0; padding: 5px 8px; border: 1px solid var(--border-base); border-radius: 5px; background: var(--surface-2); }
.option-grid :deep(.el-checkbox:has(.is-checked)) { border-color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 9%, var(--surface-2)); }
.result-column { position: sticky; top: 20px; }
@media (max-width: 1050px) { .workspace-grid { grid-template-columns: 1fr; } .result-column { position: static; } }
@media (max-width: 760px) { .panel-heading { align-items: flex-start; flex-direction: column; } .filter-grid { grid-template-columns: 1fr; } }
@media (max-width: 480px) { .option-grid { grid-template-columns: 1fr; } }
</style>
