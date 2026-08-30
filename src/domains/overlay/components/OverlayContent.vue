<template>
  <div class="overlay-container" :class="{
    'has-content': hasContent,
    'has-drag-handle': allowDrag,
    'operation-log-expanded': operationLogExpanded
  }">
    <div v-if="allowDrag" class="overlay-drag-handle" title="拖动浮窗"
      @pointerdown="drag.pointerDown"
      @pointermove="drag.pointerMove"
      @pointerup="drag.pointerUp"
      @pointercancel="drag.pointerUp">
      <span></span><span></span><span></span>
    </div>
    <div v-if="stopReason" class="failure-reason" role="alert">
      <div class="failure-title">制作已停止</div>
      <div class="failure-message">{{ stopReason }}</div>
      <div v-if="failureDetail?.expected" class="failure-detail">
        <span>预期：{{ failureDetail.expected }}</span>
        <span>实际：{{ failureDetail.actual || '未检测到物品' }}</span>
      </div>
      <div v-if="isStopped" class="failure-actions">
        <el-button v-if="canRelocate" type="warning" size="small" :disabled="isRestarting" @click="$emit('relocate')">
          重新定位
        </el-button>
        <el-button v-if="canRetry" type="primary" size="small" :loading="isRestarting" @click="$emit('retry')">
          重试
        </el-button>
        <el-button type="danger" size="small" :disabled="isRestarting" @click="$emit('close')">
          关闭
        </el-button>
      </div>
    </div>
    <!-- 背景层 -->
    <div v-if="backgroundMedia !== 'none'" class="background-layer" :style="backgroundStyle">
      <!-- 根据文件路径后缀判断是否为视频 -->
      <video v-if="backgroundMedia === 'video'" :src="formattedBackgroundPath" autoplay loop muted
        class="bg-video"></video>
    </div>

    <!-- 遮罩层 -->
    <div class="mask-layer" :style="maskStyle"></div>

    <section v-if="currencyUsageEntries.length || showZeroCurrencyUsage" class="currency-usage-bill" aria-label="本次消耗">
      <div class="currency-usage-title">本次消耗</div>
      <div v-if="currencyUsageEntries.length" class="currency-usage-list">
        <span v-for="entry in currencyUsageEntries" :key="entry.key" class="currency-usage-item"
          role="img" :aria-label="`${entry.name} ${entry.amount} 次`" :title="`${entry.name}：${entry.amount} 次`">
          <img :src="entry.icon" alt="" aria-hidden="true" />
          <span class="currency-usage-count">×{{ entry.amount }}</span>
        </span>
      </div>
      <div v-else class="currency-usage-empty">本次未消耗通货</div>
    </section>

    <!-- 地图制作模式：显示统计信息 -->
    <div v-if="isMapMode && hasContent" class="overlay-content">
      <div class="item-header">
        <span>{{ rollingTargetLabel }}概览</span>
      </div>

      <div class="map-stats-container">
        <div class="stat-item">
          <span class="stat-label">已处理{{ rollingTargetLabel }}数量：</span>
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

      <!-- 制作停止后的关闭按钮 -->
      <div v-if="isStopped && !isCompleted && !stopReason" class="completion-actions">
        <el-button type="danger" size="small" @click="$emit('close')">
          关闭
        </el-button>
      </div>
    </div>

    <!-- 物品制作模式：显示物品信息 -->
    <div v-else-if="hasContent" class="overlay-content">
      <div class="item-header">
        <span :class="rarityClass">{{ itemInfo.name }}</span>
        <div class="item-subheader">
          <span class="item-base">
            {{ itemInfo.baseName }}{{ itemInfo.level ? '-' + itemInfo.level : '' }}
          </span>
        </div>
      </div>

      <div class="mods-container">
        <div v-if="itemInfo.implicitMods?.length" class="implicit-section">
          <div class="implicit-heading">隐式词缀</div>
          <div v-for="(mod, index) in itemInfo.implicitMods" :key="'imp-' + index" class="mod-line"
            :class="{ 'matched-highlight': itemInfo.eldritchImplicitMatch && mod === itemInfo.matchedEldritchText }">
            <span class="mod-text">{{ mod }}</span>
          </div>
        </div>
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
        <span v-if="isCompleted && itemInfo.eldritchImplicitMatch" class="match-success">古灵隐式命中：{{ itemInfo.matchedEldritchTargetName }}</span>
        <span v-else-if="isCompleted && itemInfo.affixMatch" class="match-success">词缀匹配成功</span>
        <span v-else-if="isCompleted && itemInfo.socketMatch" class="match-success">插槽匹配成功</span>
        <span v-else-if="isStopped && !itemInfo.affixMatch && !itemInfo.socketMatch && !itemInfo.eldritchImplicitMatch" class="match-stopped">已停止</span>
        <span v-else class="match-pending">制作中...</span>
      </div>

      <!-- 制作完成后的确认按钮 -->
      <div v-if="(itemInfo.affixMatch || itemInfo.socketMatch || itemInfo.eldritchImplicitMatch) && isCompleted" class="completion-actions">
        <el-button type="primary" size="small" :loading="isRestarting" @click="$emit('restart')">
          重新开始
        </el-button>
        <el-button type="success" size="small" :disabled="isRestarting" @click="$emit('confirm')">
          确认完成
        </el-button>
      </div>

      <!-- 制作停止后的关闭按钮（制作成功时不显示） -->
      <div v-if="isStopped && !isCompleted && !stopReason && !itemInfo.affixMatch && !itemInfo.socketMatch && !itemInfo.eldritchImplicitMatch" class="completion-actions">
        <el-button type="danger" size="small" @click="$emit('close')">
          关闭
        </el-button>
      </div>
    </div>
    <div v-else class="overlay-placeholder">
      <span class="placeholder-text">等待物品信息...</span>
      <div v-if="!stopReason" class="placeholder-actions">
        <el-button type="danger" circle size="small" @click="$emit('close')" title="关闭">
          <el-icon>
            <Close />
          </el-icon>
        </el-button>
      </div>
    </div>

    <section class="operation-log" aria-label="操作日志">
      <button
        type="button"
        class="operation-log-header"
        :aria-expanded="operationLogExpanded"
        @click="$emit('toggle-operation-log')"
      >
        <span>操作日志</span>
        <span class="operation-log-count">{{ operationLogExpanded ? '收起' : '展开' }} · {{ logs.length }}/100</span>
      </button>
      <div v-if="operationLogExpanded" ref="operationLogList" class="operation-log-list">
        <div v-if="logs.length === 0" class="operation-log-empty">等待操作记录...</div>
        <div
          v-for="(log, index) in logs"
          :key="`${log.sessionId}-${log.timestamp}-${index}`"
          class="operation-log-line"
          :class="`operation-${log.outcome}`"
        >
          <span class="operation-log-time">{{ formatOperationTime(log.timestamp) }}</span>
          <span class="operation-log-phase">{{ operationPhaseLabel(log.phase) }}</span>
          <span class="operation-log-summary">{{ log.summary || log.action }}</span>
          <span v-if="log.code" class="operation-log-code">{{ log.code }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { Close } from '@element-plus/icons-vue'
// 导入默认背景图，以防用户未设置
import defaultBg from '@/assets/images/遮罩背景.png'
import { electronApi } from '@/api/electron'
import { createOverlayDrag } from '@/utils/useOverlayDrag'
import { normalizeOverlaySettings, overlayBackgroundMedia } from '../../../../shared/overlayBackground.js'
import { CRAFTING_CURRENCY_CATALOG, normalizeCurrencyUsage } from '../../../../shared/craftingCurrencyCatalog.js'
import { CRAFTING_CURRENCY_ICONS } from '../craftingCurrencyIcons.js'

const props = defineProps({
  itemInfo: {
    type: Object,
    default: null
  },
  settings: {
    type: Object,
    default: () => ({
      backgroundMode: 'default',
      backgroundPath: '',
      blur: 4,
      maskOpacity: 0.5
    })
  },
  logs: {
    type: Array,
    default: () => []
  },
  operationLogExpanded: {
    type: Boolean,
    default: false
  },
  currencyUsage: {
    type: Object,
    default: () => ({})
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  isStopped: {
    type: Boolean,
    default: false
  },
  isRestarting: {
    type: Boolean,
    default: false
  },
  canRetry: {
    type: Boolean,
    default: false
  },
  canRelocate: {
    type: Boolean,
    default: false
  },
  failureDetail: {
    type: Object,
    default: null
  },
  stopReason: {
    type: String,
    default: ''
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

const emit = defineEmits(['confirm', 'restart', 'retry', 'relocate', 'toggle-operation-log', 'close'])
const drag = createOverlayDrag((message) => electronApi.window.moveOverlay(message))
const operationLogList = ref(null)
const operationPhaseLabels = {
  session: '会话',
  input: '输入',
  snapshot: '读取',
  transition: '确认',
  publication: '发布'
}

function operationPhaseLabel(phase) {
  return operationPhaseLabels[phase] || phase || '操作'
}

function formatOperationTime(timestamp) {
  const parsed = new Date(timestamp)
  if (Number.isNaN(parsed.getTime())) return '--:--:--'
  return parsed.toLocaleTimeString('zh-CN', { hour12: false })
}

watch(() => props.logs.length, async () => {
  await nextTick()
  const list = operationLogList.value
  if (list) list.scrollTop = list.scrollHeight
})

// 鼠标事件穿透控制
function setIgnoreMouseEvents(ignore, forward = true) {
  const options = { forward: Boolean(typeof forward === 'object' ? forward.forward : forward) }
  if (electronApi && electronApi.setIgnoreMouseEvents) {
    electronApi.setIgnoreMouseEvents(ignore, options)
  } else if (window.electronAPI && window.electronAPI.setIgnoreMouseEvents) {
    window.electronAPI.setIgnoreMouseEvents(ignore, options)
  } else if (window.ipcRenderer) {
    window.ipcRenderer.send('set-ignore-mouse-events', ignore, options)
  }
}

watch(() => props.isCompleted, (v) => {
  if (v) {
    setIgnoreMouseEvents(false, { forward: false })
  } else if (!props.isStopped) {
    setIgnoreMouseEvents(true, { forward: true })
  }
})

watch(() => props.isStopped, (v) => {
  if (v) {
    setIgnoreMouseEvents(false, { forward: false })
  } else if (!props.isCompleted) {
    setIgnoreMouseEvents(true, { forward: true })
  }
})

// 判断是否为地图制作模式
const isMapMode = computed(() => {
  return ['异界地图', '地图', '海图'].includes(props.itemInfo?.category) || props.mapStats !== null
})

const rollingTargetLabel = computed(() => (
  props.itemInfo?.rollingTarget === 'chart' || props.itemInfo?.category === '海图'
    ? '航海海图'
    : '地图'
))

const currencyUsageEntries = computed(() => {
  const usage = normalizeCurrencyUsage(props.currencyUsage)
  return CRAFTING_CURRENCY_CATALOG.flatMap((currency) => usage[currency.key]
    ? [{ ...currency, amount: usage[currency.key], icon: CRAFTING_CURRENCY_ICONS[currency.key] }]
    : [])
})

const showZeroCurrencyUsage = computed(() => (
  (props.isCompleted || props.isStopped) && currencyUsageEntries.value.length === 0
))

const hasContent = computed(() => {
  if (isMapMode.value) {
    return Boolean(props.itemInfo?.category || props.itemInfo?.name || props.itemInfo?.baseName || props.mapStats)
  }

  return Boolean(props.itemInfo && (props.itemInfo.name || props.itemInfo.baseName))
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
  return normalizeOverlaySettings(props.settings)
})

const backgroundMedia = computed(() => overlayBackgroundMedia(effectiveSettings.value))

function formatBackgroundPath(filePath) {
  if (!filePath || typeof filePath !== 'string') return filePath
  let normalizedPath = filePath.replace(/\\/g, '/')
  if (normalizedPath.match(/^(https?|file):\/\//)) return normalizedPath
  if (/^[A-Za-z]:/.test(normalizedPath)) return `file:///${normalizedPath}`
  if (normalizedPath.startsWith('/') && !normalizedPath.startsWith('//')) return `file://${normalizedPath}`
  return normalizedPath
}

const formattedBackgroundPath = computed(() => {
  if (effectiveSettings.value.backgroundMode === 'default') return defaultBg
  return formatBackgroundPath(effectiveSettings.value.backgroundPath)
})

const backgroundStyle = computed(() => {
  const style = {
    filter: `blur(${effectiveSettings.value.blur}px)`
  }

  const path = effectiveSettings.value.backgroundPath
  const isVideoFile = backgroundMedia.value === 'video'

  // 渲染背景图的条件：
  // 1. 路径为空（显示默认图）
  // 2. 不是视频文件
  if (backgroundMedia.value === 'default' || (path && !isVideoFile)) {
    // 处理背景图片路径
    style.backgroundImage = `url("${formattedBackgroundPath.value}")`
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
  padding: var(--overlay-space-3);
  box-sizing: border-box;
  border-radius: var(--overlay-radius-md);
  // 为带 filter 的背景合成层建立明确裁剪，避免透明 Electron 窗口仍显示方角。
  clip-path: inset(0 round var(--overlay-radius-md));
  color: var(--text-primary);
  font-family: var(--font-ui);
  font-size: var(--overlay-font-size);
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

.overlay-container.has-drag-handle {
  padding-top: calc(24px + var(--overlay-space-1));
}

.overlay-drag-handle {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 72px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: grab;
  pointer-events: auto;
  touch-action: none;
  user-select: none;
  -webkit-app-region: no-drag;
  z-index: 100;

  &::before {
    position: absolute;
    width: 46px;
    height: 16px;
    box-sizing: border-box;
    border: 1px solid var(--overlay-border);
    border-radius: var(--overlay-radius-md);
    background: var(--overlay-surface);
    content: '';
  }

  &:active {
    cursor: grabbing;
  }

  span {
    z-index: 1;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--brand-color);
  }
}

.overlay-content {
  display: flex;
  flex-direction: column;
  gap: var(--overlay-space-3);
  padding-bottom: 38px;
}

.operation-log-expanded .overlay-content {
  padding-bottom: 170px;
}

.failure-reason {
  position: relative;
  z-index: 95;
  margin: 18px 0 var(--overlay-space-3);
  padding: var(--overlay-space-3);
  border: 1px solid var(--danger-color);
  border-radius: var(--overlay-radius-md);
  background: color-mix(in srgb, var(--danger-color) 28%, var(--surface-1));
  color: #F6D3D1;
  pointer-events: none;

  .failure-title {
    margin-bottom: 4px;
    color: color-mix(in srgb, var(--danger-color) 76%, white);
    font-weight: 700;
  }

  .failure-message {
    line-height: 1.4;
    word-break: break-word;
  }

  .failure-detail {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    margin-top: 6px;
    color: #f0d7a1;
    font-size: 11px;
  }

  .failure-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--overlay-space-2);
    margin-top: var(--overlay-space-2);
    pointer-events: auto;
  }
}

.item-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 4px;

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

.implicit-section {
  display: grid;
  gap: 2px;
  margin-bottom: 5px;

  .implicit-heading {
    color: #c69bff;
    font-size: 11px;
    font-weight: 700;
  }
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

.currency-usage-bill {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 5px;
  margin-bottom: var(--overlay-space-2);
  padding: 6px 8px;
  border: 1px solid rgba(214, 180, 94, 0.42);
  border-radius: var(--overlay-radius-md);
  background: rgba(10, 12, 16, 0.58);
  backdrop-filter: blur(8px);
}

.currency-usage-title {
  color: #e7cf8e;
  font-size: 11px;
  font-weight: 700;
}

.currency-usage-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 8px;
}

.currency-usage-item {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  min-width: 38px;
  color: #f4f4f4;
  font-variant-numeric: tabular-nums;
  font-weight: 700;

  img {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }
}

.currency-usage-count {
  font-size: 12px;
  text-shadow: 0 1px 2px #000;
}

.currency-usage-empty {
  color: #b8b8b8;
  font-size: 11px;
}

.operation-log {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30px;
  padding: 4px 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  background: rgba(4, 6, 8, 0.92);
  border-top: 1px solid rgba(221, 184, 92, 0.45);
  z-index: 90;
}

.operation-log-expanded .operation-log {
  height: 156px;
  padding-top: 6px;
}

.operation-log-header {
  display: flex;
  width: 100%;
  border: 0;
  padding: 0 0 4px;
  justify-content: space-between;
  background: transparent;
  color: #e7cf8e;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  pointer-events: auto;
}

.operation-log-count {
  color: #999;
  font-weight: 400;
}

.operation-log-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
}

.operation-log-line {
  display: grid;
  grid-template-columns: 54px 34px minmax(0, 1fr) auto;
  gap: 4px;
  align-items: baseline;
  font-size: 10px;
  color: #aaaaaa;
  text-shadow: 1px 1px 1px #000;
  line-height: 1.45;
}

.operation-log-time,
.operation-log-phase,
.operation-log-code {
  white-space: nowrap;
}

.operation-log-summary {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.operation-log-code,
.operation-failed {
  color: #e56b6b;
}

.operation-confirmed,
.operation-success {
  color: #8fcf75;
}

.operation-log-empty {
  color: #777;
  font-size: 10px;
  padding-top: 6px;
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
