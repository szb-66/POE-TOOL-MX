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

        <!-- 快捷键设置 -->
        <div class="section-header">
          <h3 class="section-title">快捷键设置</h3>
        </div>
        <el-card class="section-card">
          <el-form :model="shortcuts" label-width="120px" label-position="left">
            <el-row :gutter="40">
              <el-col :span="8">
                <el-form-item label="物品开始">
                  <el-input
                    v-model="shortcuts.itemStart"
                    placeholder="例如：Alt+1"
                    @blur="handleShortcutsChange"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="地图开始">
                  <el-input
                    v-model="shortcuts.mapStart"
                    placeholder="例如：Alt+2"
                    @blur="handleShortcutsChange"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="结束">
                  <el-input
                    v-model="shortcuts.end"
                    placeholder="例如：Alt+3"
                    @blur="handleShortcutsChange"
                  />
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
                      :min="0"
                      :controls="false"
                      style="width: 80px"
                      @change="handleInventoryChange"
                    />
                    <span class="separator">,</span>
                    <el-input-number
                      v-model="inventory.startPos.y"
                      placeholder="Y"
                      :min="0"
                      :controls="false"
                      style="width: 80px"
                      @change="handleInventoryChange"
                    />
                  </div>
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
                      :min="0"
                      :controls="false"
                      style="width: 80px"
                      @change="handlePositionChange(key)"
                    />
                    <span class="separator">,</span>
                    <el-input-number
                      v-model="positions[key].y"
                      placeholder="Y"
                      :min="0"
                      :controls="false"
                      style="width: 80px"
                      @change="handlePositionChange(key)"
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
                      :min="0"
                      :controls="false"
                      style="width: 80px"
                      @change="handleItemPositionChange"
                    />
                    <span class="separator">,</span>
                    <el-input-number
                      v-model="itemPosition.y"
                      placeholder="Y"
                      :min="0"
                      :controls="false"
                      style="width: 80px"
                      @change="handleItemPositionChange"
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
              <div class="dpi-input">
                <el-input-number
                  v-model="dpiScale"
                  :min="1.0"
                  :max="3.0"
                  :step="0.25"
                  :precision="2"
                  controls-position="right"
                  style="width: 120px"
                  @change="handleDpiScaleChange"
                />
                <span class="hint-text">如果不准确，请设置缩放比例 (如150%填1.5)</span>
              </div>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 操作延迟 -->
        <div class="section-header">
          <h3 class="section-title">操作延迟</h3>
        </div>
        <el-card class="section-card">
          <el-form :model="delays" label-width="180px" label-position="left">
            <el-row :gutter="40">
              <el-col :span="12" :lg="8">
                <el-form-item label="鼠标移动延迟">
                  <el-input-number
                    v-model="delays.mouseMove"
                    :min="0"
                    :max="1000"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleDelaysChange"
                  >
                    <template #suffix>ms</template>
                  </el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12" :lg="8">
                <el-form-item label="鼠标点击延迟">
                  <el-input-number
                    v-model="delays.mouseClick"
                    :min="0"
                    :max="1000"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleDelaysChange"
                  >
                    <template #suffix>ms</template>
                  </el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12" :lg="8">
                <el-form-item label="按键延迟">
                  <el-input-number
                    v-model="delays.keyPress"
                    :min="0"
                    :max="1000"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleDelaysChange"
                  >
                    <template #suffix>ms</template>
                  </el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12" :lg="8">
                <el-form-item label="读取剪切板延迟">
                  <el-input-number
                    v-model="delays.clipboardRead"
                    :min="0"
                    :max="1000"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleDelaysChange"
                  >
                    <template #suffix>ms</template>
                  </el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12" :lg="8">
                <el-form-item label="右键通货延迟">
                  <el-input-number
                    v-model="delays.currencyRightClick"
                    :min="0"
                    :max="1000"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleDelaysChange"
                  >
                    <template #suffix>ms</template>
                  </el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12" :lg="8">
                <el-form-item label="左键物品延迟">
                  <el-input-number
                    v-model="delays.itemLeftClick"
                    :min="0"
                    :max="1000"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleDelaysChange"
                  >
                    <template #suffix>ms</template>
                  </el-input-number>
                </el-form-item>
              </el-col>
            </el-row>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Close } from '@element-plus/icons-vue'
import { useSettingsStore } from './settingsStore'
import { CURRENCY_NAMES } from '../../utils/constants'
import { updateShortcuts } from '../../utils/scriptService'
import { validateShortcuts } from '../../utils/shortcutValidator'
import { electronApi } from '@/api/electron'
import OverlayContent from '@/domains/overlay/components/OverlayContent.vue'
import { generateRandomItem } from '@/utils/mockItem'

const settingsStore = useSettingsStore()

const shortcuts = ref({ ...settingsStore.globalShortcuts })
const positions = ref({ ...settingsStore.currencyPositions })
const inventory = ref({ ...settingsStore.inventory })
const delays = ref({ ...settingsStore.delays })
const itemPosition = ref({ ...settingsStore.itemPosition })
const dpiScale = ref(settingsStore.dpiScale || 1.0)
const overlaySettings = ref({ ...settingsStore.overlaySettings })
const backgroundHistory = ref([...settingsStore.backgroundHistory])

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
watch(() => settingsStore.delays, (val) => {
  delays.value = { ...val }
}, { deep: true })
watch(() => settingsStore.itemPosition, (val) => {
  itemPosition.value = { ...val }
}, { deep: true })
watch(() => settingsStore.dpiScale, (val) => {
  dpiScale.value = val
})
watch(() => settingsStore.overlaySettings, (val) => {
  overlaySettings.value = { ...val }
}, { deep: true })
watch(() => settingsStore.backgroundHistory, (val) => {
  backgroundHistory.value = [...val]
}, { deep: true })

function getCurrencyName(key) {
  return CURRENCY_NAMES[key] || key
}

async function handleShortcutsChange() {
  // 使用工具函数验证快捷键
  const validation = validateShortcuts(shortcuts.value)
  if (!validation.isValid) {
    ElMessage.error(validation.error)
    // 恢复原值
    shortcuts.value = { ...settingsStore.globalShortcuts }
    return
  }

  settingsStore.updateGlobalShortcuts({
    itemStart: shortcuts.value.itemStart,
    mapStart: shortcuts.value.mapStart,
    end: shortcuts.value.end
  })
  
  // 更新快捷键注册
  if (window.electronAPI) {
    try {
      await updateShortcuts()
      ElMessage.success('快捷键已保存并注册')
    } catch (error) {
      ElMessage.warning('快捷键已保存，但注册失败')
    }
  } else {
    ElMessage.success('快捷键已保存')
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

function handleItemPositionChange() {
  settingsStore.updateItemPosition({
    x: itemPosition.value.x,
    y: itemPosition.value.y
  })
}

function handleDpiScaleChange() {
  settingsStore.updateDpiScale(dpiScale.value)
}

function handleDelaysChange() {
  settingsStore.updateDelays({
    mouseMove: delays.value.mouseMove,
    mouseClick: delays.value.mouseClick,
    keyPress: delays.value.keyPress,
    clipboardRead: delays.value.clipboardRead,
    currencyRightClick: delays.value.currencyRightClick,
    itemLeftClick: delays.value.itemLeftClick
  })
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

    // 同步本地 ref
    shortcuts.value = { ...settingsStore.globalShortcuts }
    positions.value = { ...settingsStore.currencyPositions }
    delays.value = { ...settingsStore.delays }
    itemPosition.value = { ...settingsStore.itemPosition }
    dpiScale.value = settingsStore.dpiScale
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
