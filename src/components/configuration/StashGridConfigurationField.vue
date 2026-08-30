<template>
  <div class="stash-grid-field">
    <el-button type="primary" :loading="loading" :disabled="disabled" @click="$emit('pick')">
      {{ configured ? '重新框选' : '框选' }}{{ label }}
    </el-button>
    <el-tag :type="configured ? 'success' : 'info'">{{ configured ? '已校准' : '未校准' }}</el-tag>
    <span v-if="configured" class="stash-grid-field__summary">{{ summary }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  calibration: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})

defineEmits(['pick'])
const configured = computed(() => Boolean(props.calibration))
const summary = computed(() => {
  const value = props.calibration || {}
  const width = value.width ?? (Number(value.right) - Number(value.left))
  const height = value.height ?? (Number(value.bottom) - Number(value.top))
  if (!(Number(width) > 0 && Number(height) > 0)) return '已保存校准区域'
  return `${Math.round(Number(width))} × ${Math.round(Number(height))}`
})
</script>

<style scoped>
.stash-grid-field { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.stash-grid-field__summary { color: var(--text-secondary); font-size: 13px; }
</style>
