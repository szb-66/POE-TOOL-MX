<template>
  <div class="items-page primary-page primary-page--column">
    <div class="primary-page__tabs">
      <el-tabs v-model="activeKind" class="kind-tabs">
        <el-tab-pane label="通用" name="general" />
        <el-tab-pane label="精华" name="essence" />
        <el-tab-pane label="花园工艺" name="harvest" />
      </el-tabs>
    </div>

    <div class="items-content primary-page__scroll primary-page__content">
      <el-row class="app-grid" :gutter="16"><el-col :span="24">
        <template v-if="activeKind === 'general'">
          <el-alert v-if="showEldritchRuntime" :title="eldritchRuntimeText" :type="scriptStore.itemRuntime.eldritchImplicitMatch ? 'success' : scriptStore.itemRuntime.error ? 'error' : 'info'" :closable="false" class="eldritch-runtime" />
          <div class="module-section"><ModuleOne /></div>
          <div class="module-section"><ModuleBatch /></div>
          <div class="module-section"><ModuleTwo /></div>
          <div class="module-section"><ModuleEldritch /></div>
          <div class="module-section"><ModuleThree /></div>
        </template>
        <SpecializedCraftingPanel v-else :kind="activeKind" />
      </el-col></el-row>
    </div>
    <PageHelpDrawer :topics="helpTopics" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ModuleOne from './components/ModuleOne.vue'
import ModuleBatch from './components/ModuleBatch.vue'
import ModuleTwo from './components/ModuleTwo.vue'
import ModuleEldritch from './components/ModuleEldritch.vue'
import ModuleThree from './components/ModuleThree.vue'
import SpecializedCraftingPanel from './components/SpecializedCraftingPanel.vue'
import PageHelpDrawer from '@/domains/help/PageHelpDrawer.vue'
import { moduleHelpTopicsById } from '@/domains/help/helpContent.js'
import { usePresetStore } from '@/stores/preset'
import { useScriptStore } from '@/stores/script'

const helpTopics = moduleHelpTopicsById('items')
const presetStore = usePresetStore()
const scriptStore = useScriptStore()
const activeKind = computed({ get: () => presetStore.itemCraftingKind, set: value => presetStore.setItemCraftingKind(value) })
const showEldritchRuntime = computed(() => presetStore.currentItemPreset.moduleEldritch?.enabled && (
  (scriptStore.isRunning && scriptStore.craftingKind === 'general') ||
  scriptStore.itemRuntime.eldritchImplicitMatch ||
  scriptStore.itemRuntime.error ||
  (scriptStore.lastMode === 'items' && scriptStore.lastCraftingKind === 'general' && scriptStore.lastError)
))
const eldritchRuntimeText = computed(() => {
  const runtime = scriptStore.itemRuntime
  if (runtime.error || (scriptStore.lastMode === 'items' && scriptStore.lastCraftingKind === 'general' && scriptStore.lastError)) return `古灵隐式制作停止：${runtime.error || scriptStore.lastError}`
  if (runtime.eldritchImplicitMatch) return `古灵隐式命中：${runtime.matchedEldritchTargetName || '目标词缀'}`
  return '古灵隐式制作中'
})
</script>

<style scoped lang="less">
.items-page { height: 100%; }
.kind-tabs { width: 100%; }
.items-content { overflow-y: auto; }
.eldritch-runtime { margin-bottom: var(--spacing-md); }
.module-section { margin-bottom: var(--spacing-md); padding: var(--spacing-lg); border: 1px solid var(--border-base); border-radius: 8px; background: var(--bg-primary); box-shadow: none; }
.module-section:last-child { margin-bottom: 0; }
</style>
