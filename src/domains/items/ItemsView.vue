<template>
  <div class="items-page primary-page primary-page__scroll primary-page__content">
    <el-row class="app-grid" :gutter="16"><el-col :span="24">
    <SupportedFormatPanel :guidance="ITEM_FORMAT_GUIDANCE" />

    <el-alert
      v-if="showEldritchRuntime"
      :title="eldritchRuntimeText"
      :type="scriptStore.itemRuntime.eldritchImplicitMatch ? 'success' : scriptStore.itemRuntime.error ? 'error' : 'info'"
      :closable="false"
      class="eldritch-runtime"
    />

    <!-- 模块一：快捷键和预设 -->
    <div class="module-section">
      <ModuleOne />
    </div>

    <!-- 模块二：词缀匹配 -->
    <div class="module-section">
      <ModuleTwo />
    </div>

    <!-- 古灵隐式制作（与词缀、插槽互斥） -->
    <div class="module-section">
      <ModuleEldritch />
    </div>

    <!-- 模块三：插槽制作 -->
    <div class="module-section">
      <ModuleThree />
    </div>
    </el-col></el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ModuleOne from './components/ModuleOne.vue'
import ModuleTwo from './components/ModuleTwo.vue'
import ModuleEldritch from './components/ModuleEldritch.vue'
import ModuleThree from './components/ModuleThree.vue'
import SupportedFormatPanel from '@/components/common/SupportedFormatPanel.vue'
import { ITEM_FORMAT_GUIDANCE } from '@/utils/supportedItemFormats'
import { usePresetStore } from '@/stores/preset'
import { useScriptStore } from '@/stores/script'

const presetStore = usePresetStore()
const scriptStore = useScriptStore()
const showEldritchRuntime = computed(() => presetStore.currentItemPreset.moduleEldritch?.enabled && (
  scriptStore.isRunning || scriptStore.itemRuntime.iteration > 0 || scriptStore.itemRuntime.eldritchImplicitMatch || scriptStore.itemRuntime.error || (scriptStore.lastMode === 'items' && scriptStore.lastError)
))
const eldritchRuntimeText = computed(() => {
  const runtime = scriptStore.itemRuntime
  if (runtime.error || (scriptStore.lastMode === 'items' && scriptStore.lastError)) return `古灵隐式制作停止：${runtime.error || scriptStore.lastError}`
  if (runtime.eldritchImplicitMatch) return `古灵隐式命中：${runtime.matchedEldritchTargetName || '目标词缀'} · 循环 ${runtime.iteration} 次`
  return `古灵隐式制作中 · 已循环 ${runtime.iteration} 次`
})
</script>

<style scoped lang="less">
.items-page {
  height: 100%;
  overflow-y: auto;
  padding: 20px;

  .eldritch-runtime {
    margin-bottom: var(--spacing-md);
  }

  .module-section {
    margin-bottom: var(--spacing-md);
    background-color: var(--bg-primary);
    border-radius: 8px;
    padding: var(--spacing-lg);
    border: 1px solid var(--border-base);
    box-shadow: none;

    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
