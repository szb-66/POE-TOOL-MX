<template>
  <div class="overlay-container" :class="{ 'has-content': hasContent }">
    <!-- 背景层 -->
    <div class="background-layer" :style="backgroundStyle">
      <!-- 根据文件路径后缀判断是否为视频 -->
      <video v-if="isVideo(effectiveSettings.backgroundPath)" :src="formattedBackgroundPath" autoplay loop muted
        class="bg-video"></video>
    </div>

    <!-- 遮罩层 -->
    <div class="mask-layer" :style="maskStyle"></div>

    <!-- 地图制作模式：显示统计信息 -->
    <div v-if="isMapMode && hasContent" class="overlay-content" @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave">
      <div class="item-header" :class="{ 'drag-handle': allowDrag }" @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave" @mousedown="handleMouseDown">
        <span>地图概览</span>
      </div>

      <div class="map-stats-container">
        <div class="stat-item">
          <span class="stat-label">已处理地图数量：</span>
          <span class="stat-value">{{ mapStats?.processedCount || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">符合条件数量：</span>
          <span class="stat-value">{{ mapStats?.qualifiedCount || 0 }}</span>
        </div>

        <div v-if="mapStats?.blacklistStats && Object.keys(mapStats.blacklistStats).length > 0" class="stat-section">
          <div class="stat-section-title">黑名单词缀拦截：</div>
          <div v-for="(count, affix) in mapStats.blacklistStats" :key="'black-' + affix" class="stat-affix-item">
            <span class="affix-name">{{ affix }}</span>
            <span class="affix-count">{{ count }}次</span>
          </div>
        </div>

        <div v-if="mapStats?.whitelistStats && Object.keys(mapStats.whitelistStats).length > 0" class="stat-section">
          <div class="stat-section-title">白名单词缀通过：</div>
          <div v-for="(count, affix) in mapStats.whitelistStats" :key="'white-' + affix" class="stat-affix-item">
            <span class="affix-name">{{ affix }}</span>
            <span class="affix-count">{{ count }}次</span>
          </div>
        </div>
      </div>

      <div class="status-footer">
        <span v-if="isCompleted" class="match-success">已完成</span>
        <span v-else-if="isStopped" class="match-stopped">已停止</span>
        <span v-else class="match-pending">制作中...</span>
      </div>

      <!-- 地图制作流程停止后的确认按钮 -->
      <div v-if="isCompleted" class="completion-actions">
        <el-button type="success" size="small" @click="$emit('confirm')">
          确认完成
        </el-button>
      </div>

      <!-- 制作中或已停止时的关闭按钮 -->
      <div v-if="!isCompleted || isStopped" class="completion-actions">
        <el-button type="danger" size="small" @click="$emit('close')">
          关闭
        </el-button>
      </div>
    </div>

    <!-- 物品制作模式：显示物品信息 -->
    <div v-else-if="hasContent" class="overlay-content" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
      <div class="item-header" :class="{ 'drag-handle': allowDrag }" @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave" @mousedown="handleMouseDown">
        <span :class="rarityClass">{{ itemInfo.name }}</span>
        <div class="item-subheader">
          <span class="item-base">
            {{ itemInfo.baseName }}{{ itemInfo.level ? '-' + itemInfo.level : '' }}
          </span>
        </div>
      </div>

      <div v-if="(itemInfo && itemInfo.iteration > 0) || iteration > 0" class="iteration-fixed">
        已循环次数: {{ Math.max(itemInfo?.iteration || 0, iteration) }}
      </div>

      <div class="mods-container">
        <!-- 详细词缀信息 -->
        <div v-for="(mod, index) in itemInfo.detailedMods" :key="index" class="mod-line"
          :class="{ 'matched-highlight': isModMatched(mod) }">
          <span class="mod-tier" :class="mod.type">
            {{ mod.type === 'prefix' ? 'P' : 'S' }}{{ mod.tier }}
          </span>
          <span class="mod-text">{{ mod.text }}</span>
          <span class="mod-tags" v-if="mod.tags && mod.tags.length">
            {{ mod.tags.join(', ') }}
          </span>
        </div>

        <!-- 如果没有详细信息，显示普通词缀 -->
        <div v-if="!itemInfo.detailedMods || itemInfo.detailedMods.length === 0">
          <div v-for="(mod, index) in itemInfo.explicitMods" :key="'exp-' + index" class="mod-line"
            :class="{ 'matched-highlight': isModMatched(mod) }">
            <span class="mod-text">{{ mod }}</span>
          </div>
        </div>
      </div>

      <div class="status-footer">
        <span v-if="isCompleted && itemInfo.affixMatch" class="match-success">词缀匹配成功</span>
        <span v-else-if="isCompleted && itemInfo.socketMatch" class="match-success">插槽匹配成功</span>
        <span v-else-if="isStopped && !itemInfo.affixMatch && !itemInfo.socketMatch" class="match-stopped">已停止</span>
        <span v-else class="match-pending">制作中...</span>
      </div>

      <!-- 制作完成后的确认按钮 -->
      <div v-if="(itemInfo.affixMatch || itemInfo.socketMatch) && isCompleted" class="completion-actions">
        <el-button type="success" size="small" @click="$emit('confirm')">
          确认完成
        </el-button>
      </div>

      <!-- 制作中或已停止时的关闭按钮（制作成功时不显示） -->
      <div v-if="(!isCompleted || isStopped) && !itemInfo.affixMatch && !itemInfo.socketMatch" class="completion-actions">
        <el-button type="danger" size="small" @click="$emit('close')">
          关闭
        </el-button>
      </div>
    </div>
    <div v-else class="overlay-placeholder" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
      <span class="placeholder-text">等待物品信息...</span>
      <div class="placeholder-actions">
        <el-button type="danger" circle size="small" @click="$emit('close')" title="关闭">
          <el-icon>
            <Close />
          </el-icon>
        </el-button>
      </div>
    </div>

    <div v-if="logs.length > 0" class="logs-container">
      <div v-for="(log, index) in logs" :key="index" class="log-line">
        {{ log }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { Close } from '@element-plus/icons-vue'
// 导入默认背景图，以防用户未设置
import defaultBg from '@/assets/images/遮罩背景.png'
import { electronApi } from '@/api/electron'

const props = defineProps({
  itemInfo: {
    type: Object,
    default: null
  },
  settings: {
    type: Object,
    default: () => ({
      backgroundPath: '',
      blur: 4,
      maskOpacity: 0.5
    })
  },
  logs: {
    type: Array,
    default: () => []
  },
  iteration: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  isStopped: {
    type: Boolean,
    default: false
  },
  allowDrag: {
    type: Boolean,
    default: false
  },
  mapStats: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['confirm', 'close'])

// 鼠标事件穿透控制
function setIgnoreMouseEvents(ignore, forward) {
  if (electronApi && electronApi.setIgnoreMouseEvents) {
    electronApi.setIgnoreMouseEvents(ignore, { forward })
  } else if (window.electronAPI && window.electronAPI.setIgnoreMouseEvents) {
    window.electronAPI.setIgnoreMouseEvents(ignore, { forward })
  } else if (window.ipcRenderer) {
    window.ipcRenderer.send('set-ignore-mouse-events', ignore, { forward })
  }
}

// 拖动逻辑
const isDragging = ref(false)
// 记录拖动开始时的初始位置
const dragStart = ref({
  mouseX: 0,
  mouseY: 0,
  winX: 0,
  winY: 0
})

// 鼠标进入/离开区域控制穿透
const handleMouseEnter = () => {
  if (!props.allowDrag || isDragging.value) return
  setIgnoreMouseEvents(false, { forward: false })
}

const handleMouseLeave = () => {
  if (!props.allowDrag || isDragging.value) return
  setIgnoreMouseEvents(true, { forward: true })
}

// 拖动处理函数
const handleMouseDown = (e) => {
  if (!props.allowDrag) return
  
  isDragging.value = true
  setIgnoreMouseEvents(false, { forward: false })
  
  // 记录初始位置
  dragStart.value.mouseX = e.clientX
  dragStart.value.mouseY = e.clientY
  
  // 获取窗口当前位置
  if (electronApi && electronApi.getWindowPosition) {
    const pos = electronApi.getWindowPosition()
    dragStart.value.winX = pos.x
    dragStart.value.winY = pos.y
  } else if (window.electronAPI && window.electronAPI.getWindowPosition) {
    const pos = window.electronAPI.getWindowPosition()
    dragStart.value.winX = pos.x
    dragStart.value.winY = pos.y
  }
  
  // 添加全局事件监听
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (e) => {
  if (!isDragging.value) return
  
  // 计算鼠标移动距离
  const deltaX = e.clientX - dragStart.value.mouseX
  const deltaY = e.clientY - dragStart.value.mouseY
  
  // 计算新窗口位置
  const newX = dragStart.value.winX + deltaX
  const newY = dragStart.value.winY + deltaY
  
  // 移动窗口
  if (electronApi && electronApi.setWindowPosition) {
    electronApi.setWindowPosition(newX, newY)
  } else if (window.electronAPI && window.electronAPI.setWindowPosition) {
    window.electronAPI.setWindowPosition(newX, newY)
  } else if (window.ipcRenderer) {
    window.ipcRenderer.send('set-window-position', newX, newY)
  }
}

const handleMouseUp = () => {
  if (!isDragging.value) return
  
  isDragging.value = false
  
  // 移除全局事件监听
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
  
  // 恢复鼠标穿透
  if (!props.isCompleted && !props.isStopped) {
    setIgnoreMouseEvents(true, { forward: true })
  }
}

// 清理事件监听
onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
})

watch(() => props.isCompleted, (v) => {
  if (v) {
    setIgnoreMouseEvents(false, { forward: false })
  } else if (!isDragging.value && !props.isStopped) {
    setIgnoreMouseEvents(true, { forward: true })
  }
})

watch(() => props.isStopped, (v) => {
  if (v) {
    setIgnoreMouseEvents(false, { forward: false })
  } else if (!isDragging.value && !props.isCompleted) {
    setIgnoreMouseEvents(true, { forward: true })
  }
})

const hasContent = computed(() => {
  return props.itemInfo && (props.itemInfo.name || props.itemInfo.baseName)
})

// 判断是否为地图制作模式
const isMapMode = computed(() => {
  return props.itemInfo?.category === '异界地图' || props.mapStats !== null
})

// 地图统计信息（优先使用props传入的，否则使用itemInfo中的）
const mapStats = computed(() => {
  return props.mapStats || props.itemInfo?.mapStats || null
})

const rarityClass = computed(() => {
  if (!props.itemInfo) return ''
  switch (props.itemInfo.rarity) {
    case '普通': return 'rarity-normal'
    case '魔法': return 'rarity-magic'
    case '稀有': return 'rarity-rare'
    case '传奇': return 'rarity-unique'
    default: return ''
  }
})

// 确保有默认值
const effectiveSettings = computed(() => {
  return {
    backgroundPath: props.settings.backgroundPath || '',
    blur: props.settings.blur ?? 4,
    maskOpacity: props.settings.maskOpacity ?? 0.5
  }
})

const formattedBackgroundPath = computed(() => {
  if (!effectiveSettings.value.backgroundPath) return defaultBg
  // 简单处理 Windows 路径
  return effectiveSettings.value.backgroundPath
})

function isVideo(path) {
  if (!path) return false
  const ext = path.split('.').pop().toLowerCase()
  return ['mp4', 'webm', 'ogg', 'mov'].includes(ext)
}

const backgroundStyle = computed(() => {
  const style = {
    filter: `blur(${effectiveSettings.value.blur}px)`
  }

  const path = effectiveSettings.value.backgroundPath
  const isVideoFile = isVideo(path)

  // 渲染背景图的条件：
  // 1. 路径为空（显示默认图）
  // 2. 不是视频文件
  if (!path || !isVideoFile) {
    // 处理背景图片路径
    let bgUrl = formattedBackgroundPath.value

    // 如果是字符串路径（用户自定义的本地文件路径）
    if (typeof bgUrl === 'string' && bgUrl) {
      // Windows 路径处理：替换反斜杠为正斜杠
      bgUrl = bgUrl.replace(/\\/g, '/')

      // 如果是绝对路径（Windows: C:/ 或 Unix: /），添加 file:// 协议
      // 但排除已经是 URL 的情况（http://, https://, file://）
      if (!bgUrl.match(/^(https?|file):\/\//) && !bgUrl.startsWith('/') && /^[A-Za-z]:/.test(bgUrl)) {
        // Windows 绝对路径，添加 file:/// 前缀（注意三个斜杠）
        bgUrl = `file:///${bgUrl}`
      } else if (!bgUrl.match(/^(https?|file):\/\//) && bgUrl.startsWith('/') && !bgUrl.startsWith('//')) {
        // Unix 绝对路径，添加 file:// 前缀
        bgUrl = `file://${bgUrl}`
      }
    }

    style.backgroundImage = `url("${bgUrl}")`
  }

  return style
})

const maskStyle = computed(() => {
  return {
    background: `rgba(0, 0, 0, ${effectiveSettings.value.maskOpacity})`
  }
})

function isModMatched(mod) {
  // 只有在完成状态且匹配成功时才高亮
  if (!props.isCompleted || !props.itemInfo || !props.itemInfo.affixMatch) return false

  const matchedTexts = props.itemInfo.matchedModTexts || []
  if (matchedTexts.length === 0) return false

  if (typeof mod === 'string') {
    return matchedTexts.includes(mod)
  } else {
    // 匹配 name 或 text
    return (mod.text && matchedTexts.includes(mod.text)) ||
      (mod.name && matchedTexts.includes(mod.name))
  }
}
</script>

<style lang="less" scoped>
.matched-highlight {
  border: 1px solid #55ff55;
  border-radius: 4px;
  background-color: rgba(85, 255, 85, 0.1);
  margin: 0 -4px;
  padding: 0 4px;
}

.overlay-container {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
  border-radius: 20px;
  color: #fff;
  font-size: 14px;
  overflow: hidden;
  user-select: none;
  // pointer-events: none; // 移除了顶层的 pointer-events: none，由父组件控制或具体元素控制
  z-index: 1;

  .background-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background-position: center center;
    background-repeat: no-repeat;
    background-size: cover;
    background-color: rgba(0, 0, 0, 0.3); // 添加默认背景色，确保背景层可见
    z-index: -2;
    overflow: hidden;
    border-radius: inherit;

    .bg-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: inherit;
    }
  }

  .mask-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    pointer-events: none;
    border-radius: inherit;
  }
}

.overlay-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 25px;
}

.item-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 4px;

  &.drag-handle {
    cursor: move;
    /* 鼠标样式为移动十字 */
    -webkit-app-region: drag;
  }

  .rarity-normal {
    color: #c8c8c8;
  }

  .rarity-magic {
    color: #8888ff;
  }

  .rarity-rare {
    color: #ffff77;
  }

  .rarity-unique {
    color: #af6025;
  }

  .item-subheader {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9em;
    color: #aaa;
  }
}

.mods-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mod-line {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  line-height: 1.4;
}

.mod-tier {
  font-family: monospace;
  padding: 0 4px;
  border-radius: 2px;
  font-size: 10px;

  &.prefix {
    background: rgba(64, 128, 255, 0.3);
    color: #aaddff;
  }

  &.suffix {
    background: rgba(255, 64, 64, 0.3);
    color: #ffaaaa;
  }
}

.mod-text {
  flex: 1;
  color: #ddd;
}

.mod-tags {
  font-size: 10px;
  color: #888;
}

.status-footer {
  margin-top: 4px;
  text-align: center;
  font-weight: bold;

  .match-success {
    color: #55ff55;
  }

  .match-pending {
    color: #ffff55;
  }

  .match-stopped {
    color: #ff5555;
  }
}

.completion-actions {
  display: flex;
  justify-content: center;
  margin-top: 8px;
  pointer-events: auto; // 允许点击按钮
}

.overlay-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  height: 100%;
  color: #888;
  font-style: italic;
  padding-bottom: 20px;
  pointer-events: auto;
  /* 确保可以交互 */
}

.placeholder-actions {
  opacity: 0.6;
  transition: opacity 0.3s;

  &:hover {
    opacity: 1;
  }
}

.iteration-fixed {
  text-align: center;
  font-size: 12px;
  color: #fff127;
  border-radius: 100px;
  border: 1px solid rgba(255, 241, 39, 0.5);
  padding: 4px 0;

  backdrop-filter: blur(8px);
}

.logs-container {
  position: absolute;
  bottom: 0%;
  left: 0;
  width: 100%;
  padding: 4px 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  pointer-events: none;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%);
  z-index: 90;
  max-height: 100px;
  overflow: hidden;
}

.log-line {
  font-size: 10px;
  color: #aaaaaa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 1px 1px 1px #000;
  line-height: 1.3;
}

.map-stats-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .stat-label {
    color: #fff;
    font-size: 13px;
  }

  .stat-value {
    color: #66ff00;
    font-weight: bold;
    font-size: 14px;
  }
}

.stat-section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);

  .stat-section-title {
    color: #fff;
    font-weight: bold;
    font-size: 13px;
    margin-bottom: 6px;
  }

  .stat-affix-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3px 0;
    font-size: 12px;

    .affix-name {
      color: #ddd;
      flex: 1;
    }

    .affix-count {
      color: hsl(51, 100%, 65%);
      font-weight: bold;
      margin-left: 8px;
    }
  }
}
</style>
