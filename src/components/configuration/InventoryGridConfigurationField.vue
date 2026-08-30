<template>
  <div class="inventory-grid-configuration-field">
    <el-button type="primary" :loading="loading" :disabled="disabled" @click="$emit('pick')">
      {{ configured ? '重新框选背包网格' : '框选背包网格' }}
    </el-button>
    <span class="summary" :class="{ 'summary--empty': !configured }">{{ summary }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  inventory: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})

defineEmits(['pick'])

const configured = computed(() => (
  (Number(props.inventory?.startPos?.x) !== 0 || Number(props.inventory?.startPos?.y) !== 0) &&
  Number(props.inventory?.slotSize?.w) > 0 && Number(props.inventory?.slotSize?.h) > 0
))

const summary = computed(() => configured.value
  ? `首格 (${props.inventory.startPos.x}, ${props.inventory.startPos.y}) · 单格 ${props.inventory.slotSize.w}×${props.inventory.slotSize.h}`
  : '尚未框选')
</script>

<style scoped lang="less">
.inventory-grid-configuration-field {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.summary {
  color: var(--text-secondary);
  font-size: 13px;
}

.summary--empty {
  color: var(--warning-color);
}
</style>
