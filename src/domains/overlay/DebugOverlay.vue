<template>
  <div class="debug-overlay">
    <div 
      v-for="(rect, index) in rectangles" 
      :key="index"
      class="debug-rect"
      :style="{
        left: rect.left + 'px',
        top: rect.top + 'px',
        width: (rect.right - rect.left) + 'px',
        height: (rect.bottom - rect.top) + 'px',
        borderColor: rect.color || 'red'
      }"
    >
      <div class="rect-label" v-if="rect.label">{{ rect.label }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { electronApi } from '@/api/electron'

const rectangles = ref([])

onMounted(() => {
  // 监听更新事件
  electronApi.window.onUpdateDebugOverlay((data) => {
    if (data.rectangles) {
      rectangles.value = data.rectangles
    }
  })
})
</script>

<style scoped>
.debug-overlay {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none; /* 确保不阻挡点击 */
  background: transparent;
}

.debug-rect {
  position: absolute;
  border: 2px solid red;
  box-sizing: border-box;
  pointer-events: none;
  z-index: 9999;
}

.rect-label {
  position: absolute;
  top: -24px;
  left: 0;
  background: rgba(255, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
}
</style>
