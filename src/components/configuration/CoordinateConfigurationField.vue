<template>
  <div class="coordinate-configuration-field">
    <el-input-number
      class="coordinate-number-input"
      :model-value="point.x"
      placeholder="X"
      :controls="false"
      @change="updateAxis('x', $event)"
    />
    <el-input-number
      class="coordinate-number-input"
      :model-value="point.y"
      placeholder="Y"
      :controls="false"
      @change="updateAxis('y', $event)"
    />
    <el-button
      class="pick-position-button"
      :icon="Aim"
      :title="pickTitle"
      :loading="loading"
      :disabled="disabled"
      @click="$emit('pick')"
    >{{ showPickText ? pickText : '' }}</el-button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Aim } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({ x: 0, y: 0 }) },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  showPickText: { type: Boolean, default: false },
  pickText: { type: String, default: '抓取坐标' },
  pickTitle: { type: String, default: '点击选取坐标' }
})

const emit = defineEmits(['update:modelValue', 'change', 'pick'])
const point = computed(() => ({
  x: Number(props.modelValue?.x) || 0,
  y: Number(props.modelValue?.y) || 0
}))

function updateAxis(axis, value) {
  const next = { ...point.value, [axis]: Number(value) || 0 }
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<style scoped lang="less">
.coordinate-configuration-field {
  display: flex;
  align-items: center;
  overflow: hidden;
  width: fit-content;
  max-width: 100%;
  border: 1px solid var(--border-base);
  border-radius: 6px;
  background: var(--bg-tertiary);
  transition: border-color .2s, box-shadow .2s;
}

.coordinate-configuration-field:hover {
  border-color: var(--control-hover-border, var(--text-secondary));
}

.coordinate-configuration-field:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color);
}

.coordinate-configuration-field :deep(.el-input__wrapper) {
  border-radius: 0;
  background: transparent;
  box-shadow: none !important;
}

.coordinate-number-input {
  width: var(--coordinate-number-input-width, 112px);
}

.coordinate-number-input,
.pick-position-button {
  flex: none;
  margin: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.coordinate-configuration-field > .coordinate-number-input,
.coordinate-configuration-field > .pick-position-button {
  border-radius: 0;
}

.coordinate-number-input + .coordinate-number-input,
.pick-position-button {
  border-left: 1px solid var(--border-base);
}

.pick-position-button {
  min-width: 36px;
  height: 32px;
  padding: 0 10px;
}

.pick-position-button:hover,
.pick-position-button:focus-visible {
  color: var(--primary-color);
  background: var(--surface-hover, var(--bg-secondary));
}

@media (max-width: 680px) {
  .coordinate-number-input { width: min(112px, 32vw); }
}
</style>
