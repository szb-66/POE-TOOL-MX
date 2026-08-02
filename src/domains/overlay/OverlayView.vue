<template>
  <div class="overlay-view-wrapper">
    <OverlayContent 
      :item-info="itemInfo"
      :settings="settings"
      :logs="recentLogs"
      :iteration="scriptIteration"
      :is-completed="isCompleted"
      :is-stopped="isStopped"
      :stop-reason="stopReason"
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
const stopReason = ref('') // 结构化运行失败原因
const mapStats = ref(null) // 地图统计信息
let outputLineBuffer = ''
const isMapCategory = (category) => category === '异界地图' || category === '地图'

function mergeMapStats(previousStats, incomingStats) {
  if (!incomingStats) {
    return previousStats
  }

  return {
    processedCount: Math.max(previousStats?.processedCount || 0, incomingStats.processedCount || 0),
    qualifiedCount: Math.max(previousStats?.qualifiedCount || 0, incomingStats.qualifiedCount || 0),
    blacklistStats: {
      ...(previousStats?.blacklistStats || {}),
      ...(incomingStats.blacklistStats || {})
    },
    whitelistStats: {
      ...(previousStats?.whitelistStats || {}),
      ...(incomingStats.whitelistStats || {})
    }
  }
}

function resetOverlayState() {
  itemInfo.value = null
  scriptIteration.value = 0
  recentLogs.value = []
  isCompleted.value = false
  isStopped.value = false
  stopReason.value = ''
  mapStats.value = null
  outputLineBuffer = ''
}

function applyStructuredScriptEvent(line) {
  const text = String(line || '').trim()
  if (!text.startsWith('EVENT ')) return
  try {
    const event = JSON.parse(text.slice(6))
    if (!['crafting-startup-failed', 'currency-preflight-failed', 'stash-tab-selection-failed'].includes(event.event)) return
    stopReason.value = event.reason || (event.event === 'stash-tab-selection-failed'
      ? '仓库页自动选择失败'
      : event.event === 'currency-preflight-failed'
        ? '通货启动预检失败'
        : '制作脚本启动失败')
    isStopped.value = true
    isCompleted.value = false
  } catch {
    // 非完整或非 JSON 日志继续按普通文本展示
  }
}

// 监听控制台日志以提取循环次数
const handleScriptOutput = (data) => {
  if (data.type === 'stdout' && data.data) {
    outputLineBuffer += data.data
    const completeLines = outputLineBuffer.split(/\r?\n/)
    outputLineBuffer = completeLines.pop() || ''
    completeLines.forEach(applyStructuredScriptEvent)

    // 匹配: [进度] 第 10 次
    const match = data.data.match(/\[进度\] 第 (\d+) 次/)
    if (match) {
      scriptIteration.value = parseInt(match[1])
    }
    
    // 判断是否为地图制作模式
    const isMapMode = mapStats.value !== null || isMapCategory(itemInfo.value?.category)
    
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
    if (data.data.includes('[开始]') && !stopReason.value) {
      resetOverlayState()
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
    if (data.reset) {
      resetOverlayState()
      return
    }

    if (data.mapStats) {
      mapStats.value = mergeMapStats(mapStats.value, data.mapStats)
    }

    // 仅有 category/mapStats 的增量消息不能覆盖掉现有地图信息
    if (data.name || data.baseName) {
      itemInfo.value = {
        ...(itemInfo.value || {}),
        ...data,
        mapStats: mapStats.value || data.mapStats || itemInfo.value?.mapStats || null
      }
    } else if (data.category) {
      itemInfo.value = {
        ...(itemInfo.value || {}),
        category: data.category,
        mapStats: mapStats.value || data.mapStats || itemInfo.value?.mapStats || null
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
      const isMapMode = mapStats.value !== null || isMapCategory(itemInfo.value?.category) || data.mapStats !== null
      
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
        mapStats.value = mergeMapStats(mapStats.value, data.mapStats)
        if (itemInfo.value) {
          itemInfo.value = {
            ...itemInfo.value,
            mapStats: mapStats.value
          }
        }
      }

      if (data.error) {
        stopReason.value = data.error
        isStopped.value = true
        isCompleted.value = false
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
