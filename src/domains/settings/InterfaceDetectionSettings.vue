<template>
  <div>
    <div class="section-header"><h3 class="section-title">游戏界面检测</h3></div>
    <el-card class="section-card">
      <el-alert title="自动入库与混沌配方共用以下仓库、背包识别配置。" type="info" :closable="false" />
      <el-form label-width="140px" label-position="left" class="detection-form">
        <el-form-item label="显示检测区域">
          <el-switch v-model="showDebugOverlay" active-text="显示" inactive-text="隐藏" />
        </el-form-item>
        <el-form-item label="匹配阈值">
          <el-slider
            :model-value="store.matchThreshold"
            :min="0.1"
            :max="1"
            :step="0.05"
            show-input
            @change="store.setMatchThreshold"
          />
        </el-form-item>
      </el-form>
      <div class="template-grid">
        <div v-for="definition in definitions" :key="definition.type" class="capture-card">
          <div class="capture-header">
            <strong>{{ definition.label }}</strong>
            <div>
              <el-upload
                :auto-upload="false"
                :show-file-list="false"
                accept="image/*"
                :on-change="file => uploadTemplate(file, definition.type)"
              >
                <el-button>上传</el-button>
              </el-upload>
              <el-button
                type="primary"
                :loading="capturingType === definition.type"
                :disabled="Boolean(capturingType)"
                @click="captureTemplate(definition)"
              >框选</el-button>
            </div>
          </div>
          <img
            v-if="store.templates[definition.type]"
            :src="previewUrl(store.templates[definition.type], versions[definition.type])"
            class="template-preview"
          />
          <el-empty v-else description="尚未配置模板" :image-size="48" />
          <div class="region-inputs">
            <el-input-number
              v-for="key in regionKeys"
              :key="key"
              v-model="store.templates[definition.region][key]"
              :controls="false"
              :placeholder="key"
              @change="saveRegion(definition.type)"
            />
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onUnmounted, ref, watch } from 'vue'
import { electronApi } from '@/api/electron'
import { useInterfaceDetectionStore } from '@/stores/interfaceDetection'

const store = useInterfaceDetectionStore()
const capturingType = ref('')
const versions = ref({})
const showDebugOverlay = ref(false)
const regionKeys = ['left', 'top', 'right', 'bottom']
const definitions = [
  { type: 'stashTitle', region: 'stashRegion', label: '仓库标题模板' },
  { type: 'inventoryTitle', region: 'inventoryRegion', label: '背包标题模板' },
  { type: 'junfengRewardTitle', region: 'junfengRewardRegion', label: '君锋镇奖励标题模板' }
]

async function uploadTemplate(file, type) {
  const result = await electronApi.bag.uploadTemplate(file.raw.path, type)
  if (!result?.success) return ElMessage.error(result?.error || '上传失败')
  store.setTemplate(type, result.path)
  versions.value[type] = result.version || Date.now()
  if (result.reloadError) ElMessage.warning(`模板已保存，但检测器重载失败：${result.reloadError}`)
}

async function captureTemplate(definition) {
  capturingType.value = definition.type
  try {
    const result = await electronApi.bag.captureTemplate(definition.type)
    if (result?.canceled) return
    if (!result?.success) return ElMessage.error(result?.error || '框选失败')
    store.applyTemplateCapture(definition.type, result)
    versions.value[definition.type] = result.version || Date.now()
    if (result.reloadError) ElMessage.warning(`模板已保存，但检测器重载失败：${result.reloadError}`)
  } finally {
    capturingType.value = ''
  }
}

function saveRegion(type) {
  store.clearCaptureMetadata(type)
  store.save()
}

function previewUrl(imagePath, version = '') {
  const url = imagePath.startsWith('file:') ? imagePath : `file:///${imagePath.replace(/\\/g, '/')}`
  return version ? `${url}?v=${encodeURIComponent(version)}` : url
}

function updateDebugOverlay() {
  if (!showDebugOverlay.value) return
  electronApi.window.updateDebugOverlay({ rectangles: [
    { ...store.templates.stashRegion, label: '仓库标题区域', color: 'red' },
    { ...store.templates.inventoryRegion, label: '背包标题区域', color: 'blue' },
    { ...store.templates.junfengRewardRegion, label: '君锋镇奖励标题区域', color: 'orange' }
  ] })
}

watch(showDebugOverlay, async (visible) => {
  if (visible) {
    await electronApi.window.openDebugOverlay()
    updateDebugOverlay()
  } else await electronApi.window.closeDebugOverlay()
})
watch(() => store.templates, updateDebugOverlay, { deep: true })
onUnmounted(() => { if (showDebugOverlay.value) electronApi.window.closeDebugOverlay() })
</script>

<style scoped>
.section-header { margin: 0 0 var(--spacing-sm) var(--spacing-xs); }
.section-title { margin: 0; font-size: var(--font-size-md); font-weight: 600; }
.section-card { margin-bottom: var(--spacing-lg); box-shadow: none; border: 1px solid var(--border-base); }
.detection-form { margin-top: 16px; }
.template-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.capture-card { padding: 14px; border: 1px solid var(--border-light); border-radius: 8px; }
.capture-header, .capture-header > div { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.template-preview { display: block; max-width: 100%; height: 72px; margin: 14px auto; object-fit: contain; }
.region-inputs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
@media (max-width: 900px) {
  .template-grid { grid-template-columns: 1fr; }
  .region-inputs { grid-template-columns: repeat(2, 1fr); }
}
</style>
