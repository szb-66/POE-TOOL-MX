<template>
  <div class="affix-condition-row">
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
            <el-tag size="small" type="info">{{ item.sourceLabel }}</el-tag>
          </div>
          <p>{{ item.exampleText }}</p>
          <small>{{ suggestionSummary(item) }}</small>
        </div>
      </template>
    </el-autocomplete>

    <el-select
      :model-value="condition.minTier"
      placeholder="不限 T"
      clearable
      class="tier-select"
      popper-class="affix-tier-popper"
      @update:model-value="updateMinTier"
      @change="emit('change')"
    >
      <el-option
        v-for="tier in tierOptions"
        :key="tier.tier"
        :label="`最低 T${tier.tier}`"
        :value="tier.tier"
      />
    </el-select>

    <el-button :icon="Delete" circle size="small" @click="emit('remove')" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Delete } from '@element-plus/icons-vue'

const props = defineProps({
  condition: { type: Object, required: true },
  placeholder: { type: String, default: '' },
  fetchSuggestions: { type: Function, required: true }
})

const emit = defineEmits(['select', 'change', 'remove'])

const tierOptions = computed(() => props.condition.tiers?.length
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
    props.condition.tiers = []
  }
}

function updateMinTier(value) {
  props.condition.minTier = value
}

function suggestionSummary(item) {
  const maxTier = item.tiers.length ? Math.max(...item.tiers.map((tier) => tier.tier)) : null
  return `${item.applicableLabel} · ${maxTier ? `T1–T${maxTier}` : '无阶级'}`
}
</script>
