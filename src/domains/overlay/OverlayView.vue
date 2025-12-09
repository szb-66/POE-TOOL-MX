<template>
  <div class="overlay-view-wrapper">
    <OverlayContent 
      :item-info="itemInfo"
      :settings="settings"
      :logs="recentLogs"
      :iteration="scriptIteration"
      :is-completed="isCompleted"
      :is-stopped="isStopped"
      :allow-drag="true"
      :map-stats="mapStats"
      @confirm="handleConfirmCompletion"
      @close="handleClose"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { electronApi } from '@/api/electron'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import OverlayContent from './components/OverlayContent.vue'

const settingsStore = useSettingsStore()
// 使用本地 ref 存储设置，以便响应 IPC 更新
const settings = ref({ ...settingsStore.overlaySettings })

const itemInfo = ref(null)
const scriptIteration = ref(0) // 从脚本输出提取的循环次数
const recentLogs = ref([]) // 最近的日志
const isCompleted = ref(false) // 是否制作完成
const isStopped = ref(false) // 是否已停止
const mapStats = ref(null) // 地图统计信息

// 监听控制台日志以提取循环次数
const handleScriptOutput = (data) => {
  if (data.type === 'stdout' && data.data) {
    // 匹配: [进度] 第 10 次
    const match = data.data.match(/\[进度\] 第 (\d+) 次/)
    if (match) {
      scriptIteration.value = parseInt(match[1])
    }
    
    // 判断是否为地图制作模式
    const isMapMode = mapStats.value !== null || itemInfo.value?.category === '异界地图'
    
    // 匹配完成信号
    // 对于地图制作模式，只有整个流程结束（包含"地图洗练结束"）才设置完成状态
    // 对于物品制作模式，任何[完成]都表示完成
    if (data.data.includes('[完成]')) {
      if (isMapMode) {
        // 地图制作模式：只有整个流程结束才设置完成
        if (data.data.includes('地图洗练结束')) {
          isCompleted.value = true
        }
        // 单张地图完成时不设置完成状态，保持制作中
      } else {
        // 物品制作模式：任何[完成]都表示完成
        isCompleted.value = true
      }
    }
    
    // 匹配开始信号，重置状态
    if (data.data.includes('[开始]')) {
      isCompleted.value = false
      isStopped.value = false
      scriptIteration.value = 0
      recentLogs.value = [] // 可选：清空日志
      mapStats.value = null // 重置地图统计信息
    }
    
    // 更新日志
    const lines = data.data.split('\n').filter(line => line.trim())
    for (const line of lines) {
      recentLogs.value.push(line)
      if (recentLogs.value.length > 5) {
        recentLogs.value.shift()
      }
    }
  }
}

function handleConfirmCompletion() {
  // 确认完成，关闭覆盖层
  electronApi.window.closeOverlay()
}

function handleClose() {
  electronApi.window.closeOverlay()
}

onMounted(() => {
  // 监听主进程发来的物品更新事件
  electronApi.events.onUpdateOverlay((data) => {
    // 如果数据中有物品信息，更新 itemInfo
    if (data.name || data.baseName || data.category) {
      itemInfo.value = data
    }
    // 如果只有统计信息更新，也要更新 mapStats
    if (data.mapStats) {
      mapStats.value = data.mapStats
      // 如果是地图模式但 itemInfo 为空，设置一个基本的 itemInfo
      if (!itemInfo.value && data.category === '异界地图') {
        itemInfo.value = { category: '异界地图' }
      }
    }
    if (data.iteration) {
      scriptIteration.value = data.iteration
    }
  })

  // 监听脚本停止事件（用于获取最终的地图统计信息）
  if (electronApi.events.onScriptStopped) {
    electronApi.events.onScriptStopped((data) => {
      // 判断是否是地图制作模式
      const isMapMode = mapStats.value !== null || itemInfo.value?.category === '异界地图' || data.mapStats !== null
      
      if (isMapMode) {
        // 地图制作模式：如果已完成，保持完成状态；如果未完成，标记为已停止
        if (isCompleted.value) {
          // 已完成，保持完成状态，不设置isStopped
          isStopped.value = false
        } else {
          // 未完成时停止，标记为已停止
          isStopped.value = true
          isCompleted.value = false
        }
      } else {
        // 物品制作模式：如果制作成功，不标记为已停止，保持成功状态
        if (itemInfo.value?.affixMatch || itemInfo.value?.socketMatch) {
          // 制作成功，保持完成状态，不设置isStopped
          isCompleted.value = true
          isStopped.value = false
        } else {
          // 制作未成功时停止，标记为已停止
          isStopped.value = true
          isCompleted.value = false
        }
      }
      
      if (data.mapStats) {
        mapStats.value = data.mapStats
      }
    })
  }

  // 监听设置更新
  if (electronApi.events.onUpdateOverlaySettings) {
    electronApi.events.onUpdateOverlaySettings((newSettings) => {
      settings.value = { ...settings.value, ...newSettings }
    })
  }

  // 监听脚本输出
  if (electronApi.events.onPythonOutput) {
    electronApi.events.onPythonOutput(handleScriptOutput)
  }
})
</script>

<style scoped>
.overlay-view-wrapper {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
