<template>
  <div class="affix-goal-editor">
    <section v-for="(group, groupIndex) in groups" :key="group.id" class="affix-group" :class="{ 'is-collapsed': isGroupCollapsed(group.id) }">
      <header class="group-header">
        <div class="group-title">
          <el-switch v-model="group.enabled" @change="commit" />
          <el-input v-model="group.name" maxlength="40" class="group-name" @change="commit" />
          <el-button size="small" :icon="CopyDocument" @click="duplicateGroup(groupIndex)">复制</el-button>
          <el-button size="small" type="danger" plain :icon="Delete" :disabled="groups.length === 1" @click="removeGroup(groupIndex)">删除</el-button>
        </div>
        <div class="group-actions">
          <el-button size="small" :icon="isGroupCollapsed(group.id) ? ArrowDown : ArrowUp" :aria-label="`${isGroupCollapsed(group.id) ? '展开' : '收起'}${group.name || '达标组合'}`" :aria-expanded="!isGroupCollapsed(group.id)" :aria-controls="`affix-group-${group.id}`" @click="toggleGroupCollapse(group.id)">{{ isGroupCollapsed(group.id) ? '展开' : '收起' }}</el-button>
        </div>
      </header>
      <div v-if="!isGroupCollapsed(group.id)" :id="`affix-group-${group.id}`" class="affix-columns">
        <div class="affix-column">
          <div class="column-header"><span>必选词缀</span><el-tooltip content="本组合中的必选词缀必须全部出现" placement="top"><el-icon><QuestionFilled /></el-icon></el-tooltip></div>
          <AffixConditionRow v-for="(condition, index) in group.requiredAffixes" :key="condition.id" :condition="condition" placeholder="搜索或输入必选词缀" :fetch-suggestions="fetchSuggestions" @select="selectSuggestion(group, 'requiredAffixes', index, $event)" @change="commit" @remove="removeCondition(group, 'requiredAffixes', index)" />
          <el-button text :icon="Plus" @click="addCondition(group, 'requiredAffixes')">添加必选词缀</el-button>
        </div>
        <div class="affix-column">
          <div class="column-header"><span>挑选词缀</span><el-tooltip content="本组合满足其中指定数量即可" placement="top"><el-icon><QuestionFilled /></el-icon></el-tooltip><div class="count-selector"><span>包含数</span><el-input-number v-model="group.selectedCount" :min="1" :max="Math.max(group.selectedAffixes.length, 1)" controls-position="right" size="small" @change="commit" /></div></div>
          <AffixConditionRow v-for="(condition, index) in group.selectedAffixes" :key="condition.id" :condition="condition" placeholder="搜索或输入挑选词缀" :fetch-suggestions="fetchSuggestions" @select="selectSuggestion(group, 'selectedAffixes', index, $event)" @change="commit" @remove="removeCondition(group, 'selectedAffixes', index)" />
          <el-button text :icon="Plus" @click="addCondition(group, 'selectedAffixes')">添加挑选词缀</el-button>
        </div>
      </div>
    </section>
    <el-button class="add-group" type="primary" plain :icon="Plus" @click="addGroup">新增达标组合</el-button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ArrowDown, ArrowUp, CopyDocument, Delete, Plus, QuestionFilled } from '@element-plus/icons-vue'
import { electronApi } from '../../../api/electron.js'
import AffixConditionRow from './AffixConditionRow.vue'
import { cloneAffixGroup, createAffixConfigId, createDefaultAffixGroup, normalizeAffixCondition, normalizeAffixGroup } from '../affixConfig.js'

const props = defineProps({ modelValue: { type: Array, required: true } })
const emit = defineEmits(['update:modelValue', 'change'])
const cloneGroups = value => (Array.isArray(value) && value.length ? value : [createDefaultAffixGroup(0)]).map((group, index) => normalizeAffixGroup(group, index))
const groups = ref(cloneGroups(props.modelValue))
const collapsedGroupIds = ref(new Set())
watch(() => props.modelValue, value => { groups.value = cloneGroups(value) }, { deep: true })
function commit() { groups.value = cloneGroups(groups.value); emit('update:modelValue', groups.value); emit('change', groups.value) }
function isGroupCollapsed(id) { return collapsedGroupIds.value.has(id) }
function toggleGroupCollapse(id) {
  const next = new Set(collapsedGroupIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  collapsedGroupIds.value = next
}
function forgetGroupCollapse(id) {
  const next = new Set(collapsedGroupIds.value)
  next.delete(id)
  collapsedGroupIds.value = next
}
function blankCondition() { return { id: createAffixConfigId('condition'), kind: 'keyword', keyword: '', displayName: '', effectPattern: '', source: '', sourceLabel: '', profileId: '', applicableLabel: '', minTier: null, tiers: [] } }
function addCondition(group, key) { group[key].push(blankCondition()) }
function removeCondition(group, key, index) { group[key].splice(index, 1); if (key === 'selectedAffixes') group.selectedCount = Math.max(1, Math.min(group.selectedCount, group.selectedAffixes.length || 1)); commit() }
function selectSuggestion(group, key, index, suggestion) { group[key][index] = normalizeAffixCondition({ ...suggestion, id: group[key][index]?.id || createAffixConfigId('condition'), kind: 'catalog', keyword: suggestion.displayName, minTier: null }); commit() }
async function fetchSuggestions(query, callback) { const keyword = String(query || '').trim(); if (!keyword) return callback([]); try { const result = await electronApi.crafting.searchAffixSuggestions({ query: keyword, limit: 50 }); callback((result?.items ?? []).map(item => ({ ...item, value: item.displayName }))) } catch { callback([]) } }
function addGroup() {
  groups.value.push(createDefaultAffixGroup(groups.value.length))
  commit()
}
function duplicateGroup(index) {
  groups.value.splice(index + 1, 0, cloneAffixGroup(groups.value[index], index + 1))
  commit()
}
function removeGroup(index) {
  if (groups.value.length <= 1) return
  const [removedGroup] = groups.value.splice(index, 1)
  forgetGroupCollapse(removedGroup?.id)
  commit()
}
</script>

<style scoped lang="less">
.affix-group { padding: var(--spacing-md); margin-bottom: var(--spacing-md); border: 1px solid var(--border-lighter); border-radius: 8px; background: var(--bg-secondary); }
.group-header, .group-title, .group-actions, .column-header, .count-selector { display: flex; align-items: center; gap: var(--spacing-sm); }
.group-header { justify-content: space-between; gap: var(--spacing-md); padding-bottom: var(--spacing-md); border-bottom: 1px solid var(--border-lighter); }
.is-collapsed .group-header { padding-bottom: 0; border-bottom: 0; }
.group-name { max-width: 280px; }
.group-name :deep(.el-input__inner) { font-weight: 600; }
.group-title :deep(.el-button + .el-button) { margin-left: 0; }
.affix-columns { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--spacing-lg); padding-top: var(--spacing-md); }
.column-header { min-height: 32px; margin-bottom: var(--spacing-sm); font-weight: 600; }
.column-header .count-selector { margin-left: auto; font-size: var(--font-size-xs); font-weight: normal; }
:deep(.affix-condition-row) { display: grid; grid-template-columns: minmax(0, 1fr) 112px auto; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm); }
.add-group { width: 100%; }
:global(.affix-suggestion-popper .el-autocomplete-suggestion__wrap), :global(.affix-tier-popper .el-select-dropdown__wrap) { max-height: min(420px, 60vh) !important; overflow-y: auto !important; overscroll-behavior: contain; scrollbar-gutter: stable; }
:global(.affix-suggestion-popper .el-scrollbar__bar.is-vertical), :global(.affix-tier-popper .el-scrollbar__bar.is-vertical) { opacity: 1; }
:global(.affix-suggestion-popper .el-autocomplete-suggestion li) { height: auto; min-height: 58px; padding: 9px 14px; border-left: 3px solid transparent; line-height: 1.45; white-space: normal; transition: background-color var(--el-transition-duration-fast), border-color var(--el-transition-duration-fast); }
:global(.affix-suggestion-popper .el-autocomplete-suggestion li:hover), :global(.affix-suggestion-popper .el-autocomplete-suggestion li.highlighted), :global(.affix-tier-popper .el-select-dropdown__item:hover), :global(.affix-tier-popper .el-select-dropdown__item.is-hovering) { border-left-color: var(--el-color-primary); background-color: var(--el-color-primary-light-9) !important; }
:global(.affix-suggestion-popper .suggestion-option) { width: 100%; }
:global(.affix-suggestion-popper .suggestion-title) { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
:global(.affix-suggestion-popper .suggestion-option p) { margin: 3px 0; color: var(--text-primary); white-space: pre-line; }
:global(.affix-suggestion-popper .suggestion-option small) { color: var(--text-secondary); }
:global(.affix-tier-popper .el-select-dropdown__item) { border-left: 3px solid transparent; transition: background-color var(--el-transition-duration-fast), border-color var(--el-transition-duration-fast); }
@media (max-width: 900px) { .affix-columns { grid-template-columns: 1fr; } .group-header { align-items: flex-start; } }
</style>
