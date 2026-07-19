<template>
  <div class="coordinate-picker" @click="handlePick">
    <div class="coordinate-picker__tip">
      <strong>点击选取坐标</strong>
      <span>移动到目标点后单击确认，按 Esc 取消</span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { electronApi } from '@/api/electron'

const handlePick = (event) => {
  electronApi.window.submitScreenCoordinate({
    x: event.clientX,
    y: event.clientY
  })
}

const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    electronApi.window.cancelScreenCoordinatePicker()
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
.coordinate-picker {
  width: 100vw;
  height: 100vh;
  display: grid;
  place-items: center;
  cursor: crosshair;
  user-select: none;
  background: rgba(15, 23, 42, 0.18);
}

.coordinate-picker__tip {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 20px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  background: rgba(17, 24, 39, 0.88);
  color: #fff;
  text-align: center;
  pointer-events: none;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
}

.coordinate-picker__tip span {
  color: #d1d5db;
  font-size: 13px;
}
</style>
