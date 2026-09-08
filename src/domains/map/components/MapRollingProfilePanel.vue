<template>
  <div class="profile-content">
    <MapFeasibilityNotice :profile="profile" :target-kind="targetKind" />
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span class="title">{{ title }}</span>
          <el-tooltip :content="tooltip" placement="top">
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
      </template>

      <div class="base-content">
        <div class="base-column">
          <div class="column-header">
            <span>必选基底</span>
            <el-tooltip content="必须满足所有勾选的条件" placement="top">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="conditions-list">
            <div v-for="(key, label) in statKeys" :key="key" class="condition-row">
              <el-checkbox v-model="mandatoryStat(key).enabled">{{ label }}</el-checkbox>
              <span class="separator">&gt;=</span>
              <el-input-number v-model="mandatoryStat(key).value" :min="0" controls-position="right" class="number-input" />
            </div>
          </div>
        </div>

        <div class="base-column">
          <div class="column-header">
            <span>挑选基底</span>
            <el-tooltip content="满足其中 N 项即可" placement="top">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
            <div class="count-select">
              <span>包含数</span>
              <el-input-number v-model="profile.match.selectedCount" :min="1" :max="statCount" controls-position="right" size="small" />
            </div>
          </div>
          <div class="conditions-list">
            <div v-for="(key, label) in statKeys" :key="key" class="condition-row">
              <el-checkbox v-model="optionalStat(key).enabled">{{ label }}</el-checkbox>
              <span class="separator">&gt;=</span>
              <el-input-number v-model="optionalStat(key).value" :min="0" controls-position="right" class="number-input" />
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <div class="modifiers-section">
      <el-card class="section-card modifier-card">
        <template #header><div class="card-header"><span class="title">黑名单词缀</span><el-tooltip content="遇到这些词缀会重洗" placement="top"><el-icon class="help-icon"><QuestionFilled /></el-icon></el-tooltip></div></template>
        <div class="modifier-list">
          <div v-for="(_, index) in profile.match.blacklist" :key="index" class="modifier-item">
            <el-autocomplete
              v-model="profile.match.blacklist[index]"
              :fetch-suggestions="fetchSuggestions"
              :trigger-on-focus="false"
              clearable
              placeholder="搜索或输入词缀"
              popper-class="map-affix-suggestion-popper"
            >
              <template #default="{ item }">
                <div class="affix-suggestion">
                  <div class="suggestion-heading">
                    <strong>{{ item.value }}</strong>
                    <el-tag size="small" type="info">{{ affixTypeLabel(item.affixType) }}</el-tag>
                  </div>
                  <span class="suggestion-example">{{ item.example }}</span>
                </div>
              </template>
            </el-autocomplete>
            <el-button type="danger" link @click="removeModifier('blacklist', index)"><el-icon><Delete /></el-icon></el-button>
          </div>
          <el-button class="add-btn" text type="primary" @click="addModifier('blacklist')"><el-icon><Plus /></el-icon> 添加词缀</el-button>
        </div>
      </el-card>

      <el-card class="section-card modifier-card">
        <template #header><div class="card-header"><span class="title">白名单词缀</span><el-tooltip :content="targetKind === 'heist' ? '非空白名单至少命中一条，且满足数值条件；黑名单优先' : '包含任一词缀时通过（黑名单仍优先）'" placement="top"><el-icon class="help-icon"><QuestionFilled /></el-icon></el-tooltip></div></template>
        <div class="modifier-list">
          <div v-for="(_, index) in profile.match.whitelist" :key="index" class="modifier-item">
            <el-autocomplete
              v-model="profile.match.whitelist[index]"
              :fetch-suggestions="fetchSuggestions"
              :trigger-on-focus="false"
              clearable
              placeholder="搜索或输入词缀"
              popper-class="map-affix-suggestion-popper"
            >
              <template #default="{ item }">
                <div class="affix-suggestion">
                  <div class="suggestion-heading">
                    <strong>{{ item.value }}</strong>
                    <el-tag size="small" type="info">{{ affixTypeLabel(item.affixType) }}</el-tag>
                  </div>
                  <span class="suggestion-example">{{ item.example }}</span>
                </div>
              </template>
            </el-autocomplete>
            <el-button type="danger" link @click="removeModifier('whitelist', index)"><el-icon><Delete /></el-icon></el-button>
          </div>
          <el-button class="add-btn" text type="primary" @click="addModifier('whitelist')"><el-icon><Plus /></el-icon> 添加词缀</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MapFeasibilityNotice from './MapFeasibilityNotice.vue'
import { Delete, Plus, QuestionFilled } from '@element-plus/icons-vue'
import { searchMapAffixSuggestions } from '@/utils/mapAffixSuggestions.js'

const props = defineProps({
  profile: { type: Object, required: true },
  statKeys: { type: Object, required: true },
  title: { type: String, required: true },
  tooltip: { type: String, required: true },
  targetKind: { type: String, required: true, validator: value => ['atlas', 'chart', 'heist'].includes(value) }
})

const statCount = computed(() => Object.keys(props.statKeys).length)

function ensureStat(group, key) {
  if (!props.profile.match[group][key]) props.profile.match[group][key] = { enabled: false, value: 0 }
  return props.profile.match[group][key]
}

const mandatoryStat = key => ensureStat('mandatoryStats', key)
const optionalStat = key => ensureStat('optionalStats', key)
const addModifier = type => props.profile.match[type].push('')
const removeModifier = (type, index) => props.profile.match[type].splice(index, 1)

function fetchSuggestions(query, callback) {
  callback(searchMapAffixSuggestions(props.targetKind, query))
}

function affixTypeLabel(type) {
  if (type === 'prefix') return '前缀'
  if (type === 'suffix') return '后缀'
  return '前缀 / 后缀'
}
</script>

<style scoped lang="less">
.profile-content { display: flex; flex-direction: column; gap: 20px; }
.section-card { border: 1px solid var(--border-base); border-radius: 8px; box-shadow: inset 0 1px rgba(255, 255, 255, .025); }
.card-header, .column-header, .condition-row, .modifier-item, .count-select { display: flex; align-items: center; }
.card-header { gap: 8px; }
.title { color: var(--text-primary); font-size: 16px; font-weight: 500; }
.help-icon { color: var(--text-secondary); }
.base-content, .modifiers-section { display: flex; gap: 20px; }
.base-column { flex: 1; padding: 16px; border-radius: 4px; background: var(--bg-secondary); }
.column-header { gap: 8px; margin-bottom: 16px; color: var(--text-primary); font-weight: 500; }
.count-select { gap: 8px; margin-left: auto; font-size: 12px; font-weight: normal; }
.count-select :deep(.el-input-number) { width: 60px; }
.conditions-list, .modifier-list { display: flex; flex-direction: column; gap: 8px; }
.condition-row { gap: 12px; }
.condition-row :deep(.el-checkbox) { flex: 1; margin-right: 0; }
.separator { color: var(--text-secondary); font-size: 12px; }
.number-input { width: 100px; }
.modifier-card { flex: 1; }
.modifier-item { gap: 8px; padding: 4px 8px; border-radius: 4px; background: var(--bg-secondary); }
.modifier-item :deep(.el-autocomplete) { width: 100%; }
.affix-suggestion { display: flex; min-width: 0; flex-direction: column; gap: 3px; padding: 4px 0; line-height: 1.35; }
.suggestion-heading { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: 12px; }
.suggestion-heading strong, .suggestion-example { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.suggestion-example { color: var(--text-secondary); font-size: 12px; }
.add-btn { justify-content: flex-start; margin-top: 8px; padding-left: 0; }
@media (max-width: 900px) { .base-content, .modifiers-section { flex-direction: column; } }

:global(.map-affix-suggestion-popper .el-autocomplete-suggestion__wrap) {
  max-height: min(420px, 60vh) !important;
  overflow-y: auto !important;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}
:global(.map-affix-suggestion-popper .el-autocomplete-suggestion li) {
  height: auto;
  min-height: 54px;
  border-left: 3px solid transparent;
  white-space: normal;
}
:global(.map-affix-suggestion-popper .el-autocomplete-suggestion li:hover),
:global(.map-affix-suggestion-popper .el-autocomplete-suggestion li.highlighted) {
  border-left-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9) !important;
}
</style>
