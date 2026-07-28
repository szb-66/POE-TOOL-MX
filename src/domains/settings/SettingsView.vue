<template>
  <div class="settings-page">
    <el-scrollbar>
      <div class="settings-content">
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="danger" @click="handleReset" :icon="Refresh">
            重置所有设置
          </el-button>
        </div>

        <InterfaceDetectionSettings />

        <!-- 快捷键设置 -->
        <div class="section-header">
          <h3 class="section-title">快捷键设置</h3>
        </div>
        <el-card class="section-card">
          <el-form :model="shortcuts" label-width="120px" label-position="left">
            <el-row :gutter="40">
              <el-col :span="8">
                <el-form-item label="物品开始">
                  <KeyCaptureInput :model-value="shortcuts.itemStart" @change="handleShortcutsChange('itemStart', $event)" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="地图开始">
                  <KeyCaptureInput :model-value="shortcuts.mapStart" @change="handleShortcutsChange('mapStart', $event)" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="结束">
                  <KeyCaptureInput :model-value="shortcuts.end" @change="handleShortcutsChange('end', $event)" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="40">
              <el-col :span="8">
                <el-form-item label="配方开始">
                  <KeyCaptureInput :model-value="shortcuts.chaosRecipeStart" @change="handleShortcutsChange('chaosRecipeStart', $event)" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="配方暂停/继续">
                  <KeyCaptureInput :model-value="shortcuts.chaosRecipePause" @change="handleShortcutsChange('chaosRecipePause', $event)" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="配方紧急停止">
                  <KeyCaptureInput :model-value="shortcuts.chaosRecipeStop" @change="handleShortcutsChange('chaosRecipeStop', $event)" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>

        <!-- 背包设置 -->
        <div class="section-header">
          <h3 class="section-title">背包设置</h3>
        </div>
        <el-card class="section-card">
          <el-form :model="inventory" label-width="120px" label-position="left">
            <el-row :gutter="40">
              <el-col :span="12">
                <el-form-item label="首格位置">
                  <div class="position-input">
                    <el-input-number
                      v-model="inventory.startPos.x"
                      placeholder="X"
                      :controls="false"
                      style="width: 80px"
                      @change="handleInventoryChange"
                    />
                    <span class="separator">,</span>
                    <el-input-number
                      v-model="inventory.startPos.y"
                      placeholder="Y"
                      :controls="false"
                      style="width: 80px"
                      @change="handleInventoryChange"
                    />
                    <el-button
                      class="pick-position-button"
                      :icon="Aim"
                      circle
                      title="点击选取坐标"
                      :loading="coordinatePickingTarget === 'inventory'"
                      :disabled="Boolean(coordinatePickingTarget) && coordinatePickingTarget !== 'inventory'"
                      @click="handlePickCoordinate('inventory')"
                    />
                  </div>
                  <div class="hint-text">背包第一个格子（左上角）的中心坐标</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="单格宽高">
                  <div class="position-input">
                    <el-input-number
                      v-model="inventory.slotSize.w"
                      placeholder="W"
                      :min="0"
                      :controls="false"
                      style="width: 80px"
                      @change="handleInventoryChange"
                    />
                    <span class="separator">x</span>
                    <el-input-number
                      v-model="inventory.slotSize.h"
                      placeholder="H"
                      :min="0"
                      :controls="false"
                      style="width: 80px"
                      @change="handleInventoryChange"
                    />
                  </div>
                  <div class="hint-text">单个背包格子的宽度和高度</div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="40">
              <el-col :span="12">
                <el-form-item label="连续空格停止数量">
                  <el-input-number
                    v-model="inventory.emptySlotThreshold"
                    :min="EMPTY_SLOT_THRESHOLD.min"
                    :max="EMPTY_SLOT_THRESHOLD.max"
                    :step="1"
                    step-strictly
                    controls-position="right"
                    style="width: 180px"
                    @change="handleEmptySlotThresholdChange"
                  />
                  <div class="hint-text">扫描连续达到该数量的空格后，认为后续没有内容</div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>

        <!-- 通货坐标 -->
        <div class="section-header">
          <h3 class="section-title">通货坐标</h3>
        </div>
        <el-card class="section-card">
          <el-form :model="positions" label-width="120px" label-position="left">
            <el-row :gutter="40">
              <el-col :span="12" :lg="8" v-for="(pos, key) in positions" :key="key">
                <el-form-item :label="getCurrencyName(key)">
                  <div class="position-input">
                    <el-input-number
                      v-model="positions[key].x"
                      placeholder="X"
                      :controls="false"
                      style="width: 80px"
                      @change="handlePositionChange(key)"
                    />
                    <span class="separator">,</span>
                    <el-input-number
                      v-model="positions[key].y"
                      placeholder="Y"
                      :controls="false"
                      style="width: 80px"
                      @change="handlePositionChange(key)"
                    />
                    <el-button
                      class="pick-position-button"
                      :icon="Aim"
                      circle
                      title="点击选取坐标"
                      :loading="coordinatePickingTarget === `currency:${key}`"
                      :disabled="Boolean(coordinatePickingTarget) && coordinatePickingTarget !== `currency:${key}`"
                      @click="handlePickCoordinate('currency', key)"
                    />
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>

        <!-- 物品位置 -->
        <div class="section-header">
          <h3 class="section-title">物品位置</h3>
        </div>
        <el-card class="section-card">
          <el-form :model="itemPosition" label-width="120px" label-position="left">
            <el-row :gutter="40">
              <el-col :span="8">
                <el-form-item label="物品位置">
                  <div class="position-input">
                    <el-input-number
                      v-model="itemPosition.x"
                      placeholder="X"
                      :controls="false"
                      style="width: 80px"
                      @change="handleItemPositionChange"
                    />
                    <span class="separator">,</span>
                    <el-input-number
                      v-model="itemPosition.y"
                      placeholder="Y"
                      :controls="false"
                      style="width: 80px"
                      @change="handleItemPositionChange"
                    />
                    <el-button
                      class="pick-position-button"
                      :icon="Aim"
                      circle
                      title="点击选取坐标"
                      :loading="coordinatePickingTarget === 'item'"
                      :disabled="Boolean(coordinatePickingTarget) && coordinatePickingTarget !== 'item'"
                      @click="handlePickCoordinate('item')"
                    />
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>

        <!-- 系统设置 -->
        <div class="section-header">
          <h3 class="section-title">系统设置</h3>
        </div>
        <el-card class="section-card">
          <el-form label-width="120px" label-position="left">
            <el-form-item label="屏幕DPI缩放">
              <div class="dpi-settings">
                <el-radio-group :model-value="settingsStore.dpiMode" @change="handleDpiModeChange">
                  <el-radio-button value="auto">自动识别</el-radio-button>
                  <el-radio-button value="manual">手动设置</el-radio-button>
                </el-radio-group>
                <div v-if="settingsStore.dpiMode === 'auto'" class="dpi-input">
                  <el-tag :type="settingsStore.dpiDetectionStatus === 'success' ? 'success' : 'info'">
                    {{ Math.round(settingsStore.dpiScale * 100) }}% · {{ getDpiSourceText() }}
                  </el-tag>
                  <el-button
                    :icon="Refresh"
                    :loading="settingsStore.dpiDetectionStatus === 'detecting'"
                    @click="handleRefreshDpi"
                  >重新识别</el-button>
                </div>
                <div v-else class="dpi-input">
                <el-input-number
                  v-model="manualDpiScale"
                  :min="1.0"
                  :max="3.0"
                  :step="0.25"
                  :precision="2"
                  controls-position="right"
                  style="width: 120px"
                  @change="handleDpiScaleChange"
                />
                  <span class="hint-text">例如 Windows 150% 缩放填写 1.5</span>
                </div>
                <span v-if="settingsStore.dpiMode === 'auto'" class="hint-text">
                  {{ getDpiStatusText() }}
                </span>
              </div>
            </el-form-item>
            <el-form-item label="调试模式">
              <div class="dpi-input">
                <el-switch
                  v-model="debugMode"
                  active-text="显示控制台"
                  inactive-text="关闭"
                  @change="handleDebugModeChange"
                />
                <span class="hint-text">显示应用的 Chromium DevTools Console 调试面板</span>
              </div>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 操作延迟 -->
        <div class="section-header">
          <h3 class="section-title">操作延迟</h3>
        </div>
        <el-card class="section-card">
          <el-form label-width="180px" label-position="left">
            <el-form-item label="自动操作等待">
              <el-input-number
                v-model="operationDelayMs"
                :min="OPERATION_DELAY.min"
                :max="OPERATION_DELAY.max"
                :step="10"
                controls-position="right"
                style="width: 240px"
                @change="handleOperationDelayChange"
              >
                <template #suffix>ms</template>
              </el-input-number>
              <div class="hint-text">鼠标到达目标后、点击完成后和读取剪贴板时使用的真实等待时间</div>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 覆盖层设置 -->
        <div class="section-header">
          <h3 class="section-title">覆盖层设置</h3>
        </div>
        <el-card class="section-card">
          <el-row :gutter="40">
            <el-col :span="12">
              <el-form :model="overlaySettings" label-width="120px" label-position="left">
                <!-- 移除背景类型选择，只保留文件上传 -->
                
                <el-form-item label="背景文件">
                  <div class="file-input">
                    <el-input v-model="overlaySettings.backgroundPath" placeholder="默认背景" readonly @click="handleSelectFile">
                       <template #append>
                         <el-button @click="handleSelectFile">选择</el-button>
                       </template>
                    </el-input>
                  </div>
                </el-form-item>

                <el-form-item label="背景模糊">
                  <el-slider 
                    v-model="overlaySettings.blur" 
                    :min="0" 
                    :max="20" 
                    placement="top"
                    @change="handleOverlaySettingsChange" 
                  />
                </el-form-item>

                <el-form-item label="遮罩透明度">
                  <el-slider 
                    v-model="overlaySettings.maskOpacity" 
                    :min="0" 
                    :max="1" 
                    :step="0.1" 
                    placement="top"
                    @change="handleOverlaySettingsChange" 
                  />
                </el-form-item>
              </el-form>

              <!-- 历史记录 -->
              <div v-if="backgroundHistory.length > 0" class="history-section">
                <h4 class="history-title">历史背景</h4>
                <div class="history-grid">
                  <div 
                    v-for="(item, index) in backgroundHistory" 
                    :key="index" 
                    class="history-item"
                    :class="{ active: item.path === overlaySettings.backgroundPath }"
                    @click="applyHistory(item)"
                  >
                    <!-- 根据文件扩展名来决定显示视频还是图片 -->
                    <video 
                      v-if="isVideo(item.path)" 
                      :src="formatFilePath(item.path)" 
                      class="history-thumb" 
                      muted 
                    ></video>
                    <img 
                      v-else 
                      :src="formatFilePath(item.path)" 
                      class="history-thumb" 
                      @error="handleImageError"
                    />
                    <div class="delete-btn" @click.stop="removeHistory(index)">
                      <el-icon><Close /></el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="12">
               <!-- 预览区域 -->
               <div class="preview-container">
                 <div class="preview-label">
                   效果预览 
                   <el-button link type="primary" size="small" @click="refreshPreview">刷新物品</el-button>
                 </div>
                 <div class="preview-box">
                    <OverlayContent 
                      :item-info="previewItem"
                      :settings="overlaySettings"
                      :is-completed="false"
                    />
                 </div>
               </div>
            </el-col>
          </el-row>
        </el-card>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Refresh, Close, Aim } from '@element-plus/icons-vue'
import { useSettingsStore } from './settingsStore'
import { useBagStore } from '@/stores/bag'
import { CURRENCY_NAMES } from '../../utils/constants'
import { OPERATION_DELAY } from '../../utils/operationDelay'
import { EMPTY_SLOT_THRESHOLD } from '../../utils/inventorySettings'
import { commitGlobalShortcut } from '../../utils/scriptService'
import { electronApi } from '@/api/electron'
import OverlayContent from '@/domains/overlay/components/OverlayContent.vue'
import { generateRandomItem } from '@/utils/mockItem'
import KeyCaptureInput from '@/components/common/KeyCaptureInput.vue'
import InterfaceDetectionSettings from './InterfaceDetectionSettings.vue'
import { useInterfaceDetectionStore } from '@/stores/interfaceDetection'

const settingsStore = useSettingsStore()
const bagStore = useBagStore()
const interfaceDetectionStore = useInterfaceDetectionStore()

const shortcuts = ref({ ...settingsStore.globalShortcuts })
const positions = ref({ ...settingsStore.currencyPositions })
const inventory = ref({ ...settingsStore.inventory })
const operationDelayMs = ref(settingsStore.operationDelayMs)
const itemPosition = ref({ ...settingsStore.itemPosition })
const manualDpiScale = ref(settingsStore.manualDpiScale || 1.0)
const debugMode = ref(settingsStore.debugMode)
const overlaySettings = ref({ ...settingsStore.overlaySettings })
const backgroundHistory = ref([...settingsStore.backgroundHistory])
const bagAutoStashEnabled = ref(bagStore.moduleEnabled)
const coordinatePickingTarget = ref('')

// 监听store变化，同步到本地ref（使用 immediate: false 避免初始化时触发）
watch(() => settingsStore.globalShortcuts, (val) => {
  shortcuts.value = { ...val }
}, { deep: true })
watch(() => settingsStore.currencyPositions, (val) => {
  positions.value = { ...val }
}, { deep: true })
watch(() => settingsStore.inventory, (val) => {
  inventory.value = { ...val }
}, { deep: true })
watch(() => settingsStore.operationDelayMs, (val) => {
  operationDelayMs.value = val
})
watch(() => settingsStore.itemPosition, (val) => {
  itemPosition.value = { ...val }
}, { deep: true })
watch(() => settingsStore.manualDpiScale, (val) => {
  manualDpiScale.value = val
})
watch(() => settingsStore.debugMode, (val) => {
  debugMode.value = val
})
watch(() => settingsStore.overlaySettings, (val) => {
  overlaySettings.value = { ...val }
}, { deep: true })
watch(() => settingsStore.backgroundHistory, (val) => {
  backgroundHistory.value = [...val]
}, { deep: true })
watch(() => bagStore.moduleEnabled, (val) => {
  bagAutoStashEnabled.value = val
})

function getCurrencyName(key) {
  return CURRENCY_NAMES[key] || key
}

function handleBagAutoStashToggle(enabled) {
  bagStore.setModuleEnabled(enabled)
  if (enabled) {
    ElMessage.success('一键入库功能已启用，请前往"背包"页面进行配置')
  } else {
    ElMessage.info('一键入库功能已关闭')
  }
}

async function handleShortcutsChange(key, value) {
  try {
    await commitGlobalShortcut(key, value)
    ElMessage.success('快捷键已保存并注册')
  } catch (error) {
    shortcuts.value = { ...settingsStore.globalShortcuts }
    ElMessage.error(error.message)
  }
}

function handlePositionChange(currency) {
  settingsStore.updateCurrencyPosition(currency, {
    x: positions.value[currency].x,
    y: positions.value[currency].y
  })
}

function handleInventoryChange() {
  settingsStore.updateInventorySettings({
    startPos: inventory.value.startPos,
    slotSize: inventory.value.slotSize
  })
}

function handleEmptySlotThresholdChange(value) {
  const normalized = settingsStore.updateInventorySettings({ emptySlotThreshold: value })
  inventory.value.emptySlotThreshold = normalized.emptySlotThreshold
}

function handleItemPositionChange() {
  settingsStore.updateItemPosition({
    x: itemPosition.value.x,
    y: itemPosition.value.y
  })
}

async function handlePickCoordinate(type, currency = '') {
  if (coordinatePickingTarget.value) return

  coordinatePickingTarget.value = type === 'currency' ? `currency:${currency}` : type
  try {
    const result = await electronApi.window.pickScreenCoordinate()
    if (!result || result.canceled) return

    const point = { x: result.x, y: result.y }
    if (type === 'inventory') {
      inventory.value.startPos = point
      handleInventoryChange()
    } else if (type === 'currency') {
      positions.value[currency] = point
      handlePositionChange(currency)
    } else if (type === 'item') {
      itemPosition.value = point
      handleItemPositionChange()
    }
    ElMessage.success(`已选取坐标 (${point.x}, ${point.y})`)
  } catch (error) {
    ElMessage.error('选取坐标失败')
  } finally {
    coordinatePickingTarget.value = ''
  }
}

function handleDpiScaleChange() {
  settingsStore.updateManualDpiScale(manualDpiScale.value)
}

async function handleDpiModeChange(mode) {
  settingsStore.updateDpiMode(mode)
  if (mode === 'auto') await handleRefreshDpi()
}

function getDpiSourceText() {
  return {
    game: '游戏窗口',
    history: '上次识别值',
    primary: '主屏倍率',
    manual: '手动设置'
  }[settingsStore.dpiSource] || '等待识别'
}

function getDpiStatusText() {
  if (settingsStore.dpiDetectionStatus === 'detecting') return '正在识别《流放之路》窗口所在显示器…'
  if (settingsStore.dpiDetectionStatus === 'success') {
    return settingsStore.dpiWindowTitle ? `已从“${settingsStore.dpiWindowTitle}”识别` : '已识别游戏窗口 DPI'
  }
  if (settingsStore.dpiDetectionStatus === 'error') {
    return `${settingsStore.dpiDetectionError}，当前使用${getDpiSourceText()}`
  }
  return `当前使用${getDpiSourceText()}，应用启动后会自动识别`
}

async function handleRefreshDpi() {
  const result = await settingsStore.refreshDpiScale()
  if (result.success) ElMessage.success(`已识别游戏 DPI：${Math.round(result.scaleFactor * 100)}%`)
  else ElMessage.warning(`${result.error}，继续使用${getDpiSourceText()} ${result.scaleFactor}`)
}

async function handleDebugModeChange(enabled) {
  settingsStore.updateDebugMode(enabled)
  try {
    const result = await electronApi.window.setDevToolsVisible(enabled)
    if (result && typeof result.visible === 'boolean') {
      settingsStore.updateDebugMode(result.visible)
    }
  } catch (error) {
    debugMode.value = settingsStore.debugMode
    ElMessage.error('切换调试模式失败')
  }
}

function handleOperationDelayChange(value) {
  settingsStore.updateOperationDelay(value)
}

function isVideo(path) {
  if (!path) return false
  const ext = path.split('.').pop().toLowerCase()
  return ['mp4', 'webm', 'ogg', 'mov'].includes(ext)
}

// 格式化文件路径用于显示（转换为 file:// URL）
function formatFilePath(filePath) {
  if (!filePath) return ''
  // 如果已经是 URL，直接返回
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('file://')) {
    return filePath
  }
  // 处理 Windows 路径
  const normalizedPath = filePath.replace(/\\/g, '/')
  // 如果是绝对路径，添加 file:// 协议
  if (/^[A-Za-z]:/.test(normalizedPath)) {
    // Windows 绝对路径
    return `file:///${normalizedPath}`
  } else if (normalizedPath.startsWith('/')) {
    // Unix 绝对路径
    return `file://${normalizedPath}`
  }
  return filePath
}

function handleOverlaySettingsChange() {
  if (settingsStore.updateOverlaySettings) {
    settingsStore.updateOverlaySettings(overlaySettings.value)
  }
}

async function handleSelectFile() {
  try {
    const result = await electronApi.selectFile()
    if (!result.canceled && result.filePaths.length > 0) {
      // 文件已经复制到项目目录，使用返回的路径
      const savedPath = result.filePaths[0]
      overlaySettings.value.backgroundPath = savedPath
      
      // 更新设置（会自动添加到历史记录）
      handleOverlaySettingsChange()
    }
  } catch (error) {
    ElMessage.error('选择文件失败: ' + error.message)
  }
}

// 历史记录操作
function applyHistory(item) {
  // 移除对 type 的依赖
  overlaySettings.value.backgroundPath = item.path
  handleOverlaySettingsChange()
}

function removeHistory(index) {
  settingsStore.removeHistoryItem(index)
}

// 处理图片加载错误
function handleImageError(event) {
  // 可以设置一个默认占位图
  event.target.style.display = 'none'
}

// 预览相关
const previewItem = ref(generateRandomItem())
function refreshPreview() {
  previewItem.value = generateRandomItem()
}

async function handleReset() {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有设置为默认值吗？此操作不可恢复。',
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 重置设置
    settingsStore.resetSettings()
    interfaceDetectionStore.reset()

    // 同步本地 ref
    shortcuts.value = { ...settingsStore.globalShortcuts }
    positions.value = { ...settingsStore.currencyPositions }
    operationDelayMs.value = settingsStore.operationDelayMs
    itemPosition.value = { ...settingsStore.itemPosition }
    manualDpiScale.value = settingsStore.manualDpiScale
    debugMode.value = settingsStore.debugMode
    overlaySettings.value = { ...settingsStore.overlaySettings }
    backgroundHistory.value = []

    // 重新注册快捷键
    if (window.electronAPI) {
      try {
        await updateShortcuts()
        ElMessage.success('设置已重置为默认值，快捷键已重新注册')
      } catch (error) {
        ElMessage.success('设置已重置为默认值')
      }
    } else {
      ElMessage.success('设置已重置为默认值')
    }
  } catch (error) {
    // 用户取消操作
    if (error !== 'cancel') {
      ElMessage.error('重置设置失败')
    }
  }
}
</script>

<style scoped lang="less">
.settings-page {
  height: 100%;
  background-color: var(--bg-secondary);

  .settings-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;

    .action-buttons {
      margin-bottom: 24px;
      display: flex;
      justify-content: flex-end;
    }

    .section-header {
      margin-bottom: var(--spacing-sm);
      padding-left: var(--spacing-xs);

      .section-title {
        font-size: var(--font-size-md);
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }
    }

    .section-card {
      margin-bottom: var(--spacing-lg);
    }

    .position-input {
      display: flex;
      align-items: center;

      .separator {
        margin: 0 8px;
        color: var(--text-secondary);
      }

      .pick-position-button {
        margin-left: 8px;
        flex: none;
      }
    }
    
    .file-input {
      width: 100%;
    }
    
    .history-section {
      margin-top: 20px;
      border-top: 1px solid var(--border-base);
      padding-top: 15px;
      
      .history-title {
        font-size: 14px;
        margin-bottom: 10px;
        color: var(--text-primary);
      }
      
      .history-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        
        .history-item {
          position: relative;
          width: 100%;
          padding-bottom: 100%; // 1:1 Aspect Ratio
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
          background-color: var(--bg-tertiary);
          
          &.active {
            border-color: var(--el-color-primary);
          }
          
          &:hover {
            .delete-btn {
              opacity: 1;
            }
          }
          
          .history-thumb {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .delete-btn {
            position: absolute;
            top: 2px;
            right: 2px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.2s;
            
            &:hover {
              background: rgba(255, 0, 0, 0.8);
            }
          }
        }
      }
    }
    
    .preview-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
      
      .preview-label {
        font-weight: bold;
        display: flex;
        gap: 10px;
        align-items: center;
      }
      
      .preview-box {
        width: 300px;
        height: 400px;
        border-radius: 8px;
        overflow: hidden;
      }
    }

    .hint-text {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .dpi-settings {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }

    .dpi-input {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
  }

  :deep(.section-card) {
    box-shadow: none !important;
    border-radius: 8px !important;
    border: 1px solid var(--border-base) !important;
  }

  :deep(.el-form-item) {
    margin-bottom: 24px;
  }

  :deep(.el-card__body) {
    padding: 24px;
  }
}
</style>
