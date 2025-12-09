<template>
  <div class="title-bar">
    <div class="title-content">
      <el-icon class="app-logo-icon"><Monitor /></el-icon>
      <span class="app-title">流放助手</span>
    </div>
    <div class="window-controls">
      <div 
        class="control-btn" 
        :class="{ active: isAlwaysOnTop }"
        @click="toggleAlwaysOnTop" 
        :title="isAlwaysOnTop ? '取消置顶' : '置顶'"
      >
        <el-icon class="rotate-icon"><Connection /></el-icon>
      </div>
      <div class="control-btn" @click="minimizeWindow" title="最小化">
        <el-icon><Minus /></el-icon>
      </div>
      <div class="control-btn" @click="maximizeWindow" title="最大化">
        <el-icon><FullScreen /></el-icon>
      </div>
      <div class="control-btn close-btn" @click="closeWindow" title="关闭">
        <el-icon><Close /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Minus, FullScreen, Close, Connection, Monitor } from '@element-plus/icons-vue'
import { electronApi } from '@/api/electron'

const isAlwaysOnTop = ref(false)

async function toggleAlwaysOnTop() {
  isAlwaysOnTop.value = await electronApi.window.toggleAlwaysOnTop()
}

function minimizeWindow() {
  electronApi.window.minimize()
}

function maximizeWindow() {
  electronApi.window.maximize()
}

function closeWindow() {
  electronApi.window.close()
}

onMounted(async () => {
  // 检查初始状态
  isAlwaysOnTop.value = await electronApi.window.isAlwaysOnTop()
})
</script>

<style scoped lang="less">
.title-bar {
  height: 32px;
  background-color: var(--bg-primary, #2b2d30);
  display: flex;
  justify-content: space-between;
  align-items: center;
  -webkit-app-region: drag; /* Allow dragging */
  user-select: none;
  border-bottom: 1px solid var(--border-base, #3c3f41);
  color: #ccc;
  
  /* Prevent dragging on interactive elements */
  .control-btn {
    -webkit-app-region: no-drag;
  }
}

.title-content {
  display: flex;
  align-items: center;
  padding-left: 10px;
  gap: 8px;
  
  .app-logo-icon {
    font-size: 16px;
  }
  
  .app-title {
    font-size: 12px;
    font-weight: 500;
  }
}

.window-controls {
  display: flex;
  height: 100%;
  
  .control-btn {
    width: 46px;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 14px;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    &.active {
      color: var(--primary-color, #409eff);
      background-color: rgba(64, 158, 255, 0.1);
      
      .rotate-icon {
        transform: rotate(-45deg);
      }
    }
    
    &.close-btn:hover {
      background-color: #e81123;
      color: white;
    }

    .rotate-icon {
      transition: transform 0.3s;
    }
  }
}
</style>


