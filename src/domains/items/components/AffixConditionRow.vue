<template>
  <div class="affix-condition-row" :class="{ 'is-disabled': condition.enabled === false }">
    <el-switch
      :model-value="condition.enabled !== false"
      size="small"
      :aria-label="`启用词缀 ${condition.keyword || '未填写'}`"
      @update:model-value="updateEnabled"
    />
    <el-autocomplete
      :model-value="condition.keyword"
      :placeholder="placeholder"
      :fetch-suggestions="fetchSuggestions"
      :trigger-on-focus="false"
      clearable
      popper-class="affix-suggestion-popper"
      @update:model-value="updateKeyword"
      @select="emit('select', $event)"
      @change="emit('change')"
    >
      <template #default="{ item }">
        <div class="suggestion-option">
          <div class="suggestion-title">
            <b>{{ item.displayName }}</b>
            <el-tag size="small" :type="item.affixType === 'prefix' ? 'success' : 'warning'">
              {{ item.affixType === 'prefix' ? '前缀' : '后缀' }}
            </el-tag>
            <el-tag size="small" type="info" class="suggestion-sources">{{ item.sourceLabel }}</el-tag>
          </div>
          <p>示例：{{ item.exampleText }}</p>
          <small>{{ suggestionSummary(item) }}</small>
        </div>
      </template>
    </el-autocomplete>

    <el-select
      :model-value="isCatalog ? condition.minTier : null"
      :placeholder="affixTierItemLevelLabel(condition)"
      :disabled="!isCatalog"
      clearable
      class="tier-select"
      popper-class="affix-tier-popper"
      @update:model-value="updateMinTier"
      @change="emit('change')"
    >
      <el-option
        v-for="tier in tierOptions"
        :key="tier.tier"
        :label="affixTierItemLevelLabel(condition, tier.tier)"
        :value="tier.tier"
      />
    </el-select>

    <el-button :icon="Delete" circle size="small" @click="emit('remove')" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import { affixTierItemLevelLabel } from '../affixConfig.js'

const props = defineProps({
  condition: { type: Object, required: true },
  placeholder: { type: String, default: '' },
  fetchSuggestions: { type: Function, required: true }
})

const emit = defineEmits(['select', 'change', 'remove'])

const isCatalog = computed(() => props.condition.kind === 'catalog')
const tierOptions = computed(() => !isCatalog.value ? [] : props.condition.tiers?.length
  ? props.condition.tiers
  : Array.from({ length: 20 }, (_, index) => ({ tier: index + 1, name: `T${index + 1}` })))

function updateKeyword(value) {
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
    props.condition.minTier = null
    props.condition.tiers = []
  }
}

function updateEnabled(value) {
  props.condition.enabled = value
  emit('change')
}

function updateMinTier(value) {
  props.condition.minTier = value
}

function suggestionSummary(item) {
  const maxTier = item.tiers.length ? Math.max(...item.tiers.map((tier) => tier.tier)) : null
  return `${item.applicableLabel} · ${maxTier ? `T1–T${maxTier}` : '无阶级'}`
}
</script>

<style scoped lang="less">
.is-disabled > :not(.el-switch) {
  opacity: 0.5;
}
.suggestion-title {
  flex-wrap: wrap;
  white-space: pre-line;
}
.suggestion-sources {
  height: auto;
  max-width: 100%;
  white-space: normal;
  line-height: 1.5;
}
</style>
