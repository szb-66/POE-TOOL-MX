<template>
  <div class="module-two">
    <div class="top-row">
      <el-checkbox v-model="form.enabled" @change="commit">启用词缀制作</el-checkbox>
      <template v-if="form.enabled">
        <el-select v-model="form.mode" class="mode-selector" @change="commit">
          <el-option label="改造石模式" value="alteration" />
          <el-option label="混沌模式" value="chaos" />
          <el-option label="点金石模式" value="alchemy" />
        </el-select>
        <div v-if="form.mode === 'alteration'" class="mode-options">
          <span class="option-with-tip">
            <el-checkbox v-model="form.enableAugmentation" @change="commit">启用增幅石</el-checkbox>
            <el-tooltip content="单词缀魔法物品仅在后续仍可能达标且空槽位可推进目标时使用增幅石；已达标或无望达标时自动跳过" placement="top">
              <el-icon class="tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </span>
          <span class="option-with-tip">
            <el-checkbox v-model="form.enableRegal" @change="commit">启用富豪石</el-checkbox>
            <el-tooltip content="魔法物品未达标但仅差 1 条词缀即可达标时使用富豪石尝试命中；未命中自动重铸回魔法继续洗，已达标不点富豪（药剂自动忽略）" placement="top">
              <el-icon class="tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </span>
        </div>
        <div v-if="form.mode === 'chaos'" class="mode-options"><el-checkbox v-model="form.enableExalted" @change="commit">启用崇高石</el-checkbox></div>
        <div v-if="form.mode === 'alchemy'" class="mode-options"><el-checkbox v-model="form.enableBinding" @change="commit">使用高阶点金石</el-checkbox></div>
      </template>
    </div>
    <AffixGoalEditor v-if="form.enabled" v-model="form.affixGroups" @change="commit" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'
import { usePresetStore } from '../../../stores/preset.js'
import { normalizeModuleTwo } from '../affixConfig.js'
import AffixGoalEditor from './AffixGoalEditor.vue'

const presetStore = usePresetStore()
const moduleTwo = computed(() => presetStore.currentItemPreset.moduleTwo)
const form = ref(normalizeModuleTwo(moduleTwo.value))
watch(moduleTwo, value => { form.value = normalizeModuleTwo(value) }, { deep: true })
function commit() {
  form.value = normalizeModuleTwo(form.value)
  presetStore.updateCurrentItemPreset({ moduleTwo: form.value })
}
</script>

<style scoped lang="less">
.module-two { width: 100%; }
.top-row, .mode-options { display: flex; align-items: center; gap: var(--spacing-md); }
.option-with-tip { display: inline-flex; align-items: center; gap: 4px; }
.tip-icon { color: var(--text-secondary); cursor: help; }
.top-row { margin-bottom: var(--spacing-md); }
.mode-selector { width: 130px; }
</style>
