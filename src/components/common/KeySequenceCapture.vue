<template>
  <div class="sequence-editor">
    <div class="key-tags">
      <el-tag
        v-for="(key, index) in modelValue"
        :key="`${key}-${index}`"
        closable
        draggable="true"
        class="key-tag"
        @close="remove(index)"
        @dragstart="dragIndex = index"
        @dragover.prevent
        @drop="drop(index)"
      >{{ key }}</el-tag>
      <span v-if="!modelValue.length" class="empty">暂无按键</span>
    </div>
    <KeyCaptureInput model-value="" mode="action" placeholder="添加按键" @change="append" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import KeyCaptureInput from './KeyCaptureInput.vue'

const props = defineProps({ modelValue: { type: Array, default: () => [] } })
const emit = defineEmits(['update:modelValue', 'change'])
const dragIndex = ref(-1)

function commit(keys) {
  emit('update:modelValue', keys)
  emit('change', keys)
}

function append(key) {
  if (key) commit([...props.modelValue, key])
}

function remove(index) {
  commit(props.modelValue.filter((_, itemIndex) => itemIndex !== index))
}

function drop(index) {
  if (dragIndex.value < 0 || dragIndex.value === index) return
  const keys = [...props.modelValue]
  const [key] = keys.splice(dragIndex.value, 1)
  keys.splice(index, 0, key)
  dragIndex.value = -1
  commit(keys)
}
</script>

<style scoped lang="less">
.sequence-editor { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; width: 100%; }
.key-tags { display: flex; gap: 6px; flex-wrap: wrap; min-width: 120px; }
.key-tag { cursor: grab; font-family: Consolas, monospace; }
.empty { color: var(--el-text-color-placeholder); font-size: 13px; }
</style>
