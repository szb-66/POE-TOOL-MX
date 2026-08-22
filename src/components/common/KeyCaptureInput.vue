<template>
  <div
    ref="root"
    class="key-capture"
    :class="{ capturing, disabled }"
    :tabindex="disabled ? -1 : 0"
    role="button"
    :aria-label="capturing ? '正在捕获按键' : '点击设置按键'"
    @click="startCapture"
  >
    <span v-if="capturing" class="capture-prompt">请按下按键…</span>
    <span v-else-if="modelValue" class="key-value">{{ modelValue }}</span>
    <span v-else class="placeholder">{{ placeholder }}</span>
    <span class="edit-tip">{{ capturing ? 'Esc 取消' : '点击录入' }}</span>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { interpretCaptureEvent } from '@/utils/keyCapture'
import { electronApi } from '@/api/electron'

const props = defineProps({
  modelValue: { type: String, default: '' },
  mode: { type: String, default: 'shortcut' },
  placeholder: { type: String, default: '未设置' },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'change'])
const capturing = ref(false)
const root = ref(null)
const activeModifiers = new Set()

async function startCapture(event) {
  if (props.disabled) return
  if (!capturing.value) await electronApi.shortcut.beginCapture()
  capturing.value = true
  event.currentTarget?.focus?.()
  window.addEventListener('keydown', handleKeydown, true)
  window.addEventListener('keyup', handleKeyup, true)
  window.addEventListener('pointerdown', handleOutsidePointer, true)
}

async function stopCapture() {
  capturing.value = false
  activeModifiers.clear()
  window.removeEventListener('keydown', handleKeydown, true)
  window.removeEventListener('keyup', handleKeyup, true)
  window.removeEventListener('pointerdown', handleOutsidePointer, true)
  await electronApi.shortcut.endCapture()
}

async function cancelCapture() {
  await stopCapture()
}

function handleOutsidePointer(event) {
  if (!root.value?.contains(event.target)) void cancelCapture()
}

function handleKeyup(event) {
  activeModifiers.delete(event.key)
}

async function handleKeydown(event) {
  if (!capturing.value || props.disabled) return
  event.preventDefault()
  event.stopPropagation()
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) activeModifiers.add(event.key)
  const result = interpretCaptureEvent(event, props.mode, activeModifiers)
  if (result.type === 'cancel') return cancelCapture()
  if (result.type === 'pending') return
  await stopCapture()
  emit('update:modelValue', result.value)
  emit('change', result.value)
}

onBeforeUnmount(() => {
  if (capturing.value) void stopCapture()
})
</script>

<style scoped lang="less">
.key-capture { min-width: 130px; height: 32px; box-sizing: border-box; padding: 0 10px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border: 1px solid var(--border-base); border-radius: var(--el-border-radius-base); background: var(--surface-2); cursor: pointer; outline: none; transition: background-color .15s ease, border-color .15s ease, box-shadow .15s ease; }
.key-capture:not(.disabled):hover { background: var(--surface-hover); border-color: var(--control-hover-border); }
.key-capture:focus, .key-capture.capturing { border-color: var(--brand-color); }
.key-capture.capturing { box-shadow: 0 0 0 2px var(--el-color-primary-light-8); }
.key-capture.disabled { cursor: not-allowed; opacity: .6; }
.key-value { color: var(--el-text-color-primary); font-family: Consolas, monospace; }
.capture-prompt { color: var(--el-color-primary); }
.placeholder { color: var(--el-text-color-placeholder); }
.edit-tip { flex: 0 0 auto; font-size: 11px; color: var(--el-text-color-placeholder); }
</style>
