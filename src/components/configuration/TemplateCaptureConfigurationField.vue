<template>
  <div class="template-capture-field">
    <div class="template-capture-field__header">
      <strong>{{ label }}</strong>
      <div class="template-capture-field__actions">
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          :on-change="uploadTemplate"
        >
          <el-button :disabled="capturing">上传</el-button>
        </el-upload>
        <el-button type="primary" :loading="capturing" @click="captureTemplate">
          {{ configured ? '重新框选' : '框选' }}
        </el-button>
      </div>
    </div>

    <img v-if="templatePath" :src="previewUrl" class="template-capture-field__preview" />
    <el-empty v-else description="尚未配置模板" :image-size="48" />

    <div class="template-capture-field__region">
      <el-input-number
        v-for="key in regionKeys"
        :key="key"
        :model-value="region[key]"
        :controls="false"
        :placeholder="key"
        @change="value => updateRegion(key, value)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { electronApi } from '@/api/electron'
import { useInterfaceDetectionStore } from '@/stores/interfaceDetection'

const props = defineProps({
  type: { type: String, required: true },
  regionKey: { type: String, required: true },
  label: { type: String, required: true }
})

const emit = defineEmits(['configured'])
const store = useInterfaceDetectionStore()
const capturing = ref(false)
const version = ref('')
const regionKeys = ['left', 'top', 'right', 'bottom']
const templatePath = computed(() => store.templates[props.type] || '')
const region = computed(() => store.templates[props.regionKey] || {})
const configured = computed(() => Boolean(templatePath.value) &&
  Number(region.value.right) > Number(region.value.left) &&
  Number(region.value.bottom) > Number(region.value.top))
const previewUrl = computed(() => {
  const path = templatePath.value
  const url = path.startsWith('file:') ? path : `file:///${path.replace(/\\/g, '/')}`
  return version.value ? `${url}?v=${encodeURIComponent(version.value)}` : url
})

async function uploadTemplate(file) {
  const path = file?.raw?.path
  if (!path) return
  try {
    const result = await electronApi.bag.uploadTemplate(path, props.type)
    if (!result?.success) return ElMessage.error(result?.error || '上传失败')
    store.setTemplate(props.type, result.path)
    version.value = result.version || Date.now()
    if (result.reloadError) ElMessage.warning(`模板已保存，但检测器重载失败：${result.reloadError}`)
    emit('configured')
  } catch (error) {
    ElMessage.error(error?.message || '上传失败')
  }
}

async function captureTemplate() {
  if (capturing.value) return
  capturing.value = true
  try {
    const result = await electronApi.bag.captureTemplate(props.type)
    if (result?.canceled) return
    if (!result?.success) return ElMessage.error(result?.error || '框选失败')
    store.applyTemplateCapture(props.type, result)
    version.value = result.version || Date.now()
    if (result.reloadError) ElMessage.warning(`模板已保存，但检测器重载失败：${result.reloadError}`)
    emit('configured')
  } catch (error) {
    ElMessage.error(error?.message || '框选失败')
  } finally {
    capturing.value = false
  }
}

function updateRegion(key, value) {
  store.setTemplateRegion(props.type, { ...region.value, [key]: Number(value) || 0 })
  emit('configured')
}
</script>

<style scoped>
.template-capture-field {
  min-width: 0;
  box-sizing: border-box;
  padding: 14px;
  border: 1px solid var(--border-base);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface-2) 56%, var(--surface-1));
}
.template-capture-field__header,
.template-capture-field__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.template-capture-field__preview {
  display: block;
  max-width: 100%;
  height: 72px;
  margin: 14px auto;
  object-fit: contain;
}
.template-capture-field__region {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}
.template-capture-field__region :deep(.el-input-number) {
  width: 100%;
  min-width: 0;
}
@media (max-width: 680px) {
  .template-capture-field__region { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
