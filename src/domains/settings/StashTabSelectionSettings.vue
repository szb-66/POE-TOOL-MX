<template>
  <div>
    <div class="section-header"><h3 class="section-title">仓库页识别</h3></div>
    <el-card class="section-card">
      <el-alert
        title="首版仅支持根目录仓库页，且只用于物品制作和地图制作自动选择通货页。请框选左侧仓库列表的“图标 + 名称”内容区，排除滚动条与外围边框。"
        type="info"
        :closable="false"
      />
      <el-form label-width="140px" label-position="left" class="stash-form">
        <el-form-item label="自动选择仓库页">
          <el-switch
            :model-value="config.enabled"
            active-text="启用"
            inactive-text="关闭"
            @change="update({ enabled: $event })"
          />
        </el-form-item>
        <el-form-item label="列表有滚动条">
          <el-checkbox
            :model-value="config.hasScrollbar"
            @change="update({ hasScrollbar: $event })"
          >由我判断当前列表是否可滚动</el-checkbox>
        </el-form-item>
        <el-form-item label="根目录列表区域">
          <el-button type="primary" :loading="picking" @click="pickRegion">
            {{ config.rootRegion ? '重新框选' : '框选区域' }}
          </el-button>
          <el-button :loading="previewing" :disabled="!config.rootRegion" @click="preview">
            识别当前列表
          </el-button>
          <span class="region-summary">{{ regionSummary }}</span>
        </el-form-item>
      </el-form>

      <div class="mapping-title">仓库类型与实际名称映射</div>
      <div class="mapping-grid">
        <el-input
          v-for="definition in STASH_TAB_TYPES"
          :key="definition.key"
          :model-value="config.names[definition.key]"
          :placeholder="definition.defaultName"
          @update:model-value="updateName(definition.key, $event)"
        >
          <template #prepend>{{ definition.label }}</template>
        </el-input>
      </div>

      <div v-if="previewResult" class="preview-result">
        <div class="preview-header">
          <strong>识别结果</strong>
          <el-tag :type="previewResult.uniqueTargetMatch ? 'success' : 'warning'">
            通货映射命中 {{ previewResult.targetMatchCount || 0 }} 次
          </el-tag>
        </div>
        <el-table :data="previewResult.rows || []" size="small" max-height="320" empty-text="未识别到文字">
          <el-table-column prop="text" label="识别文本" min-width="150" />
          <el-table-column label="置信度" width="90">
            <template #default="scope">{{ Number(scope.row.confidence || 0).toFixed(3) }}</template>
          </el-table-column>
          <el-table-column label="屏幕行框" min-width="180">
            <template #default="scope">{{ formatBox(scope.row.screenBox || scope.row.box) }}</template>
          </el-table-column>
          <el-table-column label="映射" min-width="150">
            <template #default="scope">
              <el-tag v-if="scope.row.matched" type="success">
                {{ mappedLabels(scope.row.mappedTypes) }}
              </el-tag>
              <span v-else-if="scope.row.similarType" class="similar-hint">
                近似 {{ typeLabel(scope.row.similarType) }}（不点击）
              </span>
              <span v-else>未命中</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { electronApi } from '@/api/electron'
import { STASH_TAB_TYPES, normalizeStashTabSelection } from '@/utils/stashTabSelection'
import { useSettingsStore } from './settingsStore'

const store = useSettingsStore()
const picking = ref(false)
const previewing = ref(false)
const previewResult = ref(null)
const config = computed(() => store.stashTabSelection)

const regionSummary = computed(() => {
  const region = config.value.rootRegion
  if (!region) return '尚未框选'
  return `${region.x}, ${region.y} · ${region.width} × ${region.height} · DPI ${region.scaleFactor || 1}`
})

function update(patch) {
  store.updateStashTabSelection(patch)
  previewResult.value = null
}

function updateName(key, value) {
  update({ names: { [key]: String(value || '').trim() } })
}

async function pickRegion() {
  picking.value = true
  try {
    const response = await electronApi.stashTabs.pickRootRegion()
    if (response?.canceled) return
    if (!response?.success) return ElMessage.error(response?.error || '框选仓库列表失败')
    update({ rootRegion: response.rootRegion })
    ElMessage.success('已保存根目录仓库列表区域')
  } catch (error) {
    ElMessage.error(error?.message || '框选仓库列表失败')
  } finally {
    picking.value = false
  }
}

async function preview() {
  previewing.value = true
  try {
    const response = await electronApi.stashTabs.preview(normalizeStashTabSelection(config.value))
    if (!response?.success) return ElMessage.error(response?.reason || response?.error || '仓库列表识别失败')
    previewResult.value = response
    if (response.uniqueTargetMatch) ElMessage.success('已唯一识别通货仓库页')
    else ElMessage.warning('通货仓库页未唯一命中；自动选择时不会点击')
  } catch (error) {
    ElMessage.error(error?.message || '仓库列表识别失败')
  } finally {
    previewing.value = false
  }
}

function formatBox(box = {}) {
  return `(${box.x ?? '-'}, ${box.y ?? '-'}) ${box.width ?? '-'} × ${box.height ?? '-'}`
}

function typeLabel(key) {
  return STASH_TAB_TYPES.find(item => item.key === key)?.label || key
}

function mappedLabels(keys = []) {
  return keys.map(typeLabel).join('、')
}
</script>

<style scoped>
.section-header { margin: 0 0 var(--spacing-sm) var(--spacing-xs); }
.section-title { margin: 0; font-size: var(--font-size-md); font-weight: 600; }
.section-card { margin-bottom: var(--spacing-lg); box-shadow: none; border: 1px solid var(--border-base); }
.stash-form { margin-top: 16px; }
.region-summary { margin-left: 12px; color: var(--text-secondary); font-size: 13px; }
.mapping-title { margin: 4px 0 12px; font-weight: 600; }
.mapping-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 14px; }
.preview-result { margin-top: 18px; }
.preview-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.similar-hint { color: var(--el-color-warning); }
@media (max-width: 900px) { .mapping-grid { grid-template-columns: 1fr; } }
</style>
