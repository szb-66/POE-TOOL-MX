<template>
  <div class="module-two">
    <div class="top-row">
      <el-checkbox v-model="form.enabled" @change="commit">
        <span v-if="!form.enabled">启用词缀制作</span>
      </el-checkbox>

      <template v-if="form.enabled">
        <el-select v-model="form.mode" class="mode-selector" @change="commit">
          <el-option label="改造石模式" value="alteration" />
          <el-option label="混沌模式" value="chaos" />
          <el-option label="点金石模式" value="alchemy" />
        </el-select>
        <div v-if="form.mode === 'alteration'" class="mode-options">
          <el-checkbox v-model="form.enableAugmentation" @change="commit">启用增幅石</el-checkbox>
          <el-checkbox v-model="form.enableRegal" @change="commit">启用富豪石</el-checkbox>
        </div>
        <div v-if="form.mode === 'chaos'" class="mode-options">
          <el-checkbox v-model="form.enableExalted" @change="commit">启用崇高石</el-checkbox>
        </div>
      </template>
    </div>

    <template v-if="form.enabled">
      <el-alert
        title="任意一个组合满足即达标；每组要求全部必选词缀，并满足指定数量的挑选词缀。T 级为空表示不限，T1 优于 T2。"
        type="info"
        :closable="false"
        class="rule-tip"
      />

      <section v-for="(group, groupIndex) in form.affixGroups" :key="group.id" class="affix-group">
        <header class="group-header">
          <div class="group-title">
            <el-switch v-model="group.enabled" @change="commit" />
            <el-input v-model="group.name" maxlength="40" class="group-name" @change="commit" />
          </div>
          <div class="group-actions">
            <el-button size="small" :icon="CopyDocument" @click="duplicateGroup(groupIndex)">复制</el-button>
            <el-button
              size="small"
              type="danger"
              plain
              :icon="Delete"
              :disabled="form.affixGroups.length === 1"
              @click="removeGroup(groupIndex)"
            >删除</el-button>
          </div>
        </header>

        <div class="affix-columns">
          <div class="affix-column">
            <div class="column-header">
              <span>必选词缀</span>
              <el-tooltip content="本组合中的必选词缀必须全部出现" placement="top">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
            <AffixConditionRow
              v-for="(condition, index) in group.requiredAffixes"
              :key="condition.id"
              :condition="condition"
              placeholder="搜索或输入必选词缀"
              :fetch-suggestions="fetchSuggestions"
              @select="selectSuggestion(group, 'requiredAffixes', index, $event)"
              @change="commit"
              @remove="removeCondition(group, 'requiredAffixes', index)"
            />
            <el-button text :icon="Plus" @click="addCondition(group, 'requiredAffixes')">添加必选词缀</el-button>
          </div>

          <div class="affix-column">
            <div class="column-header">
              <span>挑选词缀</span>
              <el-tooltip content="本组合满足其中指定数量即可" placement="top">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
              <div class="count-selector">
                <span>包含数</span>
                <el-input-number
                  v-model="group.selectedCount"
                  :min="1"
                  :max="Math.max(group.selectedAffixes.length, 1)"
                  controls-position="right"
                  size="small"
                  @change="commit"
                />
              </div>
            </div>
            <AffixConditionRow
              v-for="(condition, index) in group.selectedAffixes"
              :key="condition.id"
              :condition="condition"
              placeholder="搜索或输入挑选词缀"
              :fetch-suggestions="fetchSuggestions"
              @select="selectSuggestion(group, 'selectedAffixes', index, $event)"
              @change="commit"
              @remove="removeCondition(group, 'selectedAffixes', index)"
            />
            <el-button text :icon="Plus" @click="addCondition(group, 'selectedAffixes')">添加挑选词缀</el-button>
          </div>
        </div>
      </section>

      <el-button class="add-group" type="primary" plain :icon="Plus" @click="addGroup">新增达标组合</el-button>
    </template>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, ref, watch } from 'vue'
import { CopyDocument, Delete, Plus, QuestionFilled } from '@element-plus/icons-vue'
import { ElAutocomplete, ElButton, ElOption, ElSelect, ElTag } from 'element-plus'
import { electronApi } from '../../../api/electron.js'
import { usePresetStore } from '../../../stores/preset.js'
import {
  cloneAffixGroup,
  createAffixConfigId,
  createDefaultAffixGroup,
  normalizeAffixCondition,
  normalizeModuleTwo
} from '../affixConfig.js'

const AffixConditionRow = defineComponent({
  name: 'AffixConditionRow',
  props: {
    condition: { type: Object, required: true },
    placeholder: { type: String, default: '' },
    fetchSuggestions: { type: Function, required: true }
  },
  emits: ['select', 'change', 'remove'],
  setup(props, { emit }) {
    const tierOptions = computed(() => props.condition.tiers?.length
      ? props.condition.tiers
      : Array.from({ length: 20 }, (_, index) => ({ tier: index + 1, name: `T${index + 1}` })))
    return () => h('div', { class: 'affix-condition-row' }, [
      h(ElAutocomplete, {
        modelValue: props.condition.keyword,
        'onUpdate:modelValue': (value) => {
          const changedCatalogText = props.condition.kind === 'catalog' && value !== props.condition.keyword
          props.condition.keyword = value
          props.condition.displayName = value
          if (changedCatalogText) {
            props.condition.kind = 'keyword'
            props.condition.effectPattern = ''
            props.condition.source = ''
            props.condition.sourceLabel = ''
            props.condition.profileId = ''
            props.condition.applicableLabel = ''
            props.condition.tiers = []
          }
        },
        placeholder: props.placeholder,
        fetchSuggestions: props.fetchSuggestions,
        triggerOnFocus: false,
        clearable: true,
        popperClass: 'affix-suggestion-popper',
        onSelect: (item) => emit('select', item),
        onChange: () => emit('change')
      }, {
        default: ({ item }) => h('div', { class: 'suggestion-option' }, [
          h('div', { class: 'suggestion-title' }, [
            h('b', item.displayName),
            h(ElTag, { size: 'small', type: item.affixType === 'prefix' ? 'success' : 'warning' }, () => item.affixType === 'prefix' ? '前缀' : '后缀'),
            h(ElTag, { size: 'small', type: 'info' }, () => item.sourceLabel)
          ]),
          h('p', item.exampleText),
          h('small', `${item.applicableLabel} · ${item.tiers.length ? `T1–T${Math.max(...item.tiers.map((tier) => tier.tier))}` : '无阶级'}`)
        ])
      }),
      h(ElSelect, {
        modelValue: props.condition.minTier,
        'onUpdate:modelValue': (value) => { props.condition.minTier = value },
        placeholder: '不限 T',
        clearable: true,
        class: 'tier-select',
        popperClass: 'affix-tier-popper',
        onChange: () => emit('change')
      }, () => tierOptions.value.map((tier) => h(ElOption, {
        key: tier.tier,
        label: `最低 T${tier.tier}`,
        value: tier.tier
      }))),
      h(ElButton, {
        icon: Delete,
        circle: true,
        size: 'small',
        onClick: () => emit('remove')
      })
    ])
  }
})

const presetStore = usePresetStore()
const moduleTwo = computed(() => presetStore.currentItemPreset.moduleTwo)
const form = ref(normalizeModuleTwo(moduleTwo.value))

watch(moduleTwo, (value) => {
  form.value = normalizeModuleTwo(value)
}, { deep: true })

function commit() {
  form.value = normalizeModuleTwo(form.value)
  presetStore.updateCurrentItemPreset({ moduleTwo: form.value })
}

function blankCondition() {
  return {
    id: createAffixConfigId('condition'),
    kind: 'keyword',
    keyword: '',
    displayName: '',
    effectPattern: '',
    source: '',
    sourceLabel: '',
    profileId: '',
    applicableLabel: '',
    minTier: null,
    tiers: []
  }
}

function addCondition(group, key) {
  group[key].push(blankCondition())
}

function removeCondition(group, key, index) {
  group[key].splice(index, 1)
  if (key === 'selectedAffixes') group.selectedCount = Math.max(1, Math.min(group.selectedCount, group.selectedAffixes.length || 1))
  commit()
}

function selectSuggestion(group, key, index, suggestion) {
  group[key][index] = normalizeAffixCondition({
    ...suggestion,
    id: group[key][index]?.id || createAffixConfigId('condition'),
    kind: 'catalog',
    keyword: suggestion.displayName,
    minTier: null
  })
  commit()
}

async function fetchSuggestions(query, callback) {
  const keyword = String(query || '').trim()
  if (!keyword) return callback([])
  try {
    const result = await electronApi.crafting.searchAffixSuggestions({ query: keyword, limit: 50 })
    callback((result?.items ?? []).map((item) => ({ ...item, value: item.displayName })))
  } catch {
    callback([])
  }
}

function addGroup() {
  form.value.affixGroups.push(createDefaultAffixGroup(form.value.affixGroups.length))
  commit()
}

function duplicateGroup(index) {
  form.value.affixGroups.splice(index + 1, 0, cloneAffixGroup(form.value.affixGroups[index], index + 1))
  commit()
}

function removeGroup(index) {
  if (form.value.affixGroups.length <= 1) return
  form.value.affixGroups.splice(index, 1)
  commit()
}
</script>

<style scoped lang="less">
.module-two {
  width: 100%;
}

.top-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.mode-selector {
  width: 130px;
}

.mode-options,
.group-title,
.group-actions,
.column-header,
.count-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.rule-tip {
  margin-bottom: var(--spacing-md);
}

.affix-group {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--border-lighter);
  border-radius: 8px;
  background: var(--bg-secondary);
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-lighter);
}

.group-name {
  max-width: 280px;

  :deep(.el-input__inner) {
    font-weight: 600;
  }
}

.affix-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-lg);
  padding-top: var(--spacing-md);
}

.column-header {
  min-height: 32px;
  margin-bottom: var(--spacing-sm);
  font-weight: 600;

  .count-selector {
    margin-left: auto;
    font-size: var(--font-size-xs);
    font-weight: normal;
  }
}

:deep(.affix-condition-row) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px auto;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.add-group {
  width: 100%;
}

/*
 * 两个下拉层均由 Element Plus Teleport 到 body，不能依赖组件 scoped 后代选择器。
 * 专用 popper class 让多行候选和 T 级选项拥有独立、可滚动的视口。
 */
:global(.affix-suggestion-popper .el-autocomplete-suggestion__wrap),
:global(.affix-tier-popper .el-select-dropdown__wrap) {
  max-height: min(420px, 60vh) !important;
  overflow-y: auto !important;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

:global(.affix-suggestion-popper .el-scrollbar__bar.is-vertical),
:global(.affix-tier-popper .el-scrollbar__bar.is-vertical) {
  opacity: 1;
}

:global(.affix-suggestion-popper .el-autocomplete-suggestion li) {
  height: auto;
  min-height: 58px;
  padding: 9px 14px;
  border-left: 3px solid transparent;
  line-height: 1.45;
  white-space: normal;
  transition:
    background-color var(--el-transition-duration-fast),
    border-color var(--el-transition-duration-fast);
}

:global(.affix-suggestion-popper .el-autocomplete-suggestion li:hover),
:global(.affix-suggestion-popper .el-autocomplete-suggestion li.highlighted),
:global(.affix-tier-popper .el-select-dropdown__item:hover),
:global(.affix-tier-popper .el-select-dropdown__item.is-hovering) {
  border-left-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9) !important;
}

:global(.affix-suggestion-popper .suggestion-option) {
  width: 100%;
}

:global(.affix-suggestion-popper .suggestion-title) {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

:global(.affix-suggestion-popper .suggestion-option p) {
  margin: 3px 0;
  color: var(--text-primary);
  white-space: pre-line;
}

:global(.affix-suggestion-popper .suggestion-option small) {
  color: var(--text-secondary);
}

:global(.affix-tier-popper .el-select-dropdown__item) {
  border-left: 3px solid transparent;
  transition:
    background-color var(--el-transition-duration-fast),
    border-color var(--el-transition-duration-fast);
}

@media (max-width: 900px) {
  .affix-columns {
    grid-template-columns: 1fr;
  }

  .group-header {
    align-items: flex-start;
  }
}
</style>
