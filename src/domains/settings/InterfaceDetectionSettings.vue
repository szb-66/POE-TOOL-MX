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
        <TemplateCaptureConfigurationField
          v-for="definition in definitions"
          :key="definition.type"
          :type="definition.type"
          :region-key="definition.region"
          :label="definition.label"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onUnmounted, ref, watch } from 'vue'
import { electronApi } from '@/api/electron'
import { useInterfaceDetectionStore } from '@/stores/interfaceDetection'
import TemplateCaptureConfigurationField from '@/components/configuration/TemplateCaptureConfigurationField.vue'

const store = useInterfaceDetectionStore()
const showDebugOverlay = ref(false)
const definitions = [
  { type: 'stashTitle', region: 'stashRegion', label: '仓库标题模板' },
  { type: 'inventoryTitle', region: 'inventoryRegion', label: '背包标题模板' },
  { type: 'junfengRewardTitle', region: 'junfengRewardRegion', label: '君锋镇奖励标题模板' },
  { type: 'allflameReceiverTitle', region: 'allflameReceiverRegion', label: '永火接收舱标题模板' }
]

function updateDebugOverlay() {
  if (!showDebugOverlay.value) return
  electronApi.window.updateDebugOverlay({ rectangles: [
    { ...store.templates.stashRegion, label: '仓库标题区域', color: 'red' },
    { ...store.templates.inventoryRegion, label: '背包标题区域', color: 'blue' },
    { ...store.templates.junfengRewardRegion, label: '君锋镇奖励标题区域', color: 'orange' },
    { ...store.templates.allflameReceiverRegion, label: '永火接收舱标题区域', color: 'green' }
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
@media (max-width: 900px) {
  .template-grid { grid-template-columns: 1fr; }
}
</style>
