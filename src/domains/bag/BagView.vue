<template>
  <div class="bag-page">
    <el-scrollbar>
      <div class="bag-content">
        <!-- 模块开关 -->
        <div class="section-header">
          <h3 class="section-title">背包自动入库</h3>
        </div>
        <el-card class="section-card">
          <el-form label-width="120px" label-position="left">
            <el-form-item label="启用模块">
              <el-switch
                v-model="moduleEnabled"
                @change="handleModuleToggle"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>
            <el-form-item label="显示红框">
              <el-switch
                v-model="showDebugOverlay"
                active-text="显示"
                inactive-text="隐藏"
              />
              <span class="hint-text" style="margin-left: 10px">在屏幕上显示当前配置的检测区域</span>
            </el-form-item>
            <el-form-item label="入库快捷键">
              <KeyCaptureInput :model-value="settingsStore.globalShortcuts.stashStart" @change="saveStashShortcut" />
            </el-form-item>
            <el-form-item label="检测状态">
              <el-tag :type="detectionStatus.type">{{ detectionStatus.text }}</el-tag>
            </el-form-item>
            <el-form-item label="入库状态" v-if="isStashing">
              <el-progress
                :percentage="stashProgress"
                :status="stashProgress === 100 ? 'success' : undefined"
                :text-inside="true"
                :stroke-width="20"
              />
            </el-form-item>
            <el-form-item v-if="moduleEnabled && isMatched && !isStashing">
              <el-button type="primary" @click="handleStartStash" :icon="Upload">
                开始入库
              </el-button>
            </el-form-item>
            <el-form-item v-if="isStashing">
              <el-button type="danger" @click="handleStopStash" :icon="VideoPause">
                停止入库
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 模板配置 -->
        <div class="section-header">
          <h3 class="section-title">模板配置</h3>
        </div>
        <el-card class="section-card">
          <el-form :model="templates" label-width="120px" label-position="left">
<!-- ... (rest of the file until script) ... -->
<!-- Script setup section changes -->
            <el-row :gutter="40">
              <el-col :span="12">
                <el-form-item label="仓库标题模板">
                  <el-upload
                    class="template-upload"
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="(file) => handleTemplateUpload(file, 'stashTitle')"
                    accept="image/*"
                  >
                    <template #trigger>
                      <div class="upload-area">
                        <div v-if="templates.stashTitle && typeof templates.stashTitle === 'string'">
                          <img :src="getTemplatePreview(templates.stashTitle)" class="template-preview" />
                          <div class="template-path">{{ getFileName(templates.stashTitle) }}</div>
                        </div>
                        <div v-else class="upload-placeholder">
                          <el-icon><Plus /></el-icon>
                          <div>点击上传模板图片</div>
                        </div>
                      </div>
                    </template>
                  </el-upload>
                  <div class="region-config">
                    <div class="region-title">仓库标题匹配区域：</div>
                    <div class="region-inputs">
                      <div class="coordinate-group">
                        <span class="coordinate-label">左上</span>
                        <el-input-number
                          v-model="templates.stashRegion.left"
                          placeholder="X"
                          :min="0"
                          :max="9999"
                          :controls="false"
                          style="width: 100px"
                        />
                        <span class="separator">,</span>
                        <el-input-number
                          v-model="templates.stashRegion.top"
                          placeholder="Y"
                          :min="0"
                          :max="9999"
                          :controls="false"
                          style="width: 100px"
                        />
                      </div>
                      <span class="separator">-</span>
                      <div class="coordinate-group">
                        <span class="coordinate-label">右下</span>
                        <el-input-number
                          v-model="templates.stashRegion.right"
                          placeholder="X"
                          :min="0"
                          :max="9999"
                          :controls="false"
                          style="width: 100px"
                        />
                        <span class="separator">,</span>
                        <el-input-number
                          v-model="templates.stashRegion.bottom"
                          placeholder="Y"
                          :min="0"
                          :max="9999"
                          :controls="false"
                          style="width: 100px"
                        />
                      </div>
                    </div>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="背包道具标题模板">
                  <el-upload
                    class="template-upload"
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="(file) => handleTemplateUpload(file, 'inventoryTitle')"
                    accept="image/*"
                  >
                    <template #trigger>
                      <div class="upload-area">
                        <div v-if="templates.inventoryTitle && typeof templates.inventoryTitle === 'string'">
                          <img :src="getTemplatePreview(templates.inventoryTitle)" class="template-preview" />
                          <div class="template-path">{{ getFileName(templates.inventoryTitle) }}</div>
                        </div>
                        <div v-else class="upload-placeholder">
                          <el-icon><Plus /></el-icon>
                          <div>点击上传模板图片</div>
                        </div>
                      </div>
                    </template>
                  </el-upload>
                  <div class="region-config">
                    <div class="region-title">道具标题匹配区域：</div>
                    <div class="region-inputs">
                      <div class="coordinate-group">
                        <span class="coordinate-label">左上</span>
                        <el-input-number
                          v-model="templates.inventoryRegion.left"
                          placeholder="X"
                          :min="0"
                          :max="9999"
                          :controls="false"
                          style="width: 100px"
                        />
                        <span class="separator">,</span>
                        <el-input-number
                          v-model="templates.inventoryRegion.top"
                          placeholder="Y"
                          :min="0"
                          :max="9999"
                          :controls="false"
                          style="width: 100px"
                        />
                      </div>
                      <span class="separator">-</span>
                      <div class="coordinate-group">
                        <span class="coordinate-label">右下</span>
                        <el-input-number
                          v-model="templates.inventoryRegion.right"
                          placeholder="X"
                          :min="0"
                          :max="9999"
                          :controls="false"
                          style="width: 100px"
                        />
                        <span class="separator">,</span>
                        <el-input-number
                          v-model="templates.inventoryRegion.bottom"
                          placeholder="Y"
                          :min="0"
                          :max="9999"
                          :controls="false"
                          style="width: 100px"
                        />
                      </div>
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="40">
              <el-col :span="12">
                <el-form-item label="匹配阈值">
                  <el-slider
                    v-model="matchThreshold"
                    :min="0.1"
                    :max="1.0"
                    :step="0.05"
                    :show-input="true"
                    :input-size="'small'"
                    @change="handleMatchThresholdChange"
                  />
                  <div class="hint-text">推荐值：0.7-0.9，越高越精确但可能匹配失败</div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>


        <!-- 按钮位置配置 -->
        <div class="section-header">
          <h3 class="section-title">按钮位置配置</h3>
        </div>
        <el-card class="section-card">
          <el-form :model="buttonPosition" label-width="120px" label-position="left">
            <el-row :gutter="40">
              <el-col :span="12">
                <el-form-item label="一键入库按钮位置">
                  <div class="position-input">
                    <el-input-number
                      v-model="buttonPosition.x"
                      placeholder="X"
                      :min="0"
                      :controls="false"
                      style="width: 80px"
                      @change="handleButtonPositionChange"
                    />
                    <span class="separator">,</span>
                    <el-input-number
                      v-model="buttonPosition.y"
                      placeholder="Y"
                      :min="0"
                      :controls="false"
                      style="width: 80px"
                      @change="handleButtonPositionChange"
                    />
                  </div>
                  <div class="hint-text">按钮将在 overlay 窗口中显示，默认位置 3600, 1000</div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBagStore } from '@/stores/bag'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import { electronApi } from '@/api/electron'
import { Plus, Upload, VideoPause } from '@element-plus/icons-vue'
import KeyCaptureInput from '@/components/common/KeyCaptureInput.vue'
import { commitGlobalShortcut } from '@/utils/scriptService'
import { startBagStash as handleStartStash } from '@/utils/bagService'

const bagStore = useBagStore()
const settingsStore = useSettingsStore()

// 响应式数据
const moduleEnabled = ref(bagStore.moduleEnabled)
const templates = ref({ ...bagStore.templates })
const matchThreshold = ref(bagStore.matchThreshold)
const buttonPosition = ref({ ...bagStore.buttonPosition })
const isMatched = ref(bagStore.isMatched)
const isStashing = ref(bagStore.isStashing)
const stashProgress = ref(bagStore.stashProgress)
const showDebugOverlay = ref(false)

// 更新调试覆盖层
const updateDebugOverlay = () => {
  if (!showDebugOverlay.value) return

  const rects = []
  if (templates.value.stashRegion) {
    rects.push({
      left: Number(templates.value.stashRegion.left || 0),
      top: Number(templates.value.stashRegion.top || 0),
      right: Number(templates.value.stashRegion.right || 0),
      bottom: Number(templates.value.stashRegion.bottom || 0),
      label: '仓库标题区域',
      color: 'red'
    })
  }
  if (templates.value.inventoryRegion) {
    rects.push({
      left: Number(templates.value.inventoryRegion.left || 0),
      top: Number(templates.value.inventoryRegion.top || 0),
      right: Number(templates.value.inventoryRegion.right || 0),
      bottom: Number(templates.value.inventoryRegion.bottom || 0),
      label: '道具标题区域',
      color: 'blue'
    })
  }

  electronApi.window.updateDebugOverlay({ rectangles: rects })
}

// 监听开关变化

watch(showDebugOverlay, (val) => {
  if (val) {
    electronApi.window.openDebugOverlay()
    setTimeout(updateDebugOverlay, 500) // 等待窗口创建
  } else {
    electronApi.window.closeDebugOverlay()
  }
})

// 监听区域变化自动更新
watch(templates, () => {
  if (showDebugOverlay.value) {
    updateDebugOverlay()
  }
}, { deep: true })

onUnmounted(() => {
  if (showDebugOverlay.value) {
    electronApi.window.closeDebugOverlay()
  }
})

// 计算属性
const detectionStatus = computed(() => {
  if (!moduleEnabled.value) {
    return { type: 'info', text: '模块未启用' }
  }
  return bagStore.isDetecting
    ? { type: 'success', text: '检测中...' }
    : { type: 'warning', text: '等待检测' }
})

// 事件处理
async function handleModuleToggle(enabled) {
  try {
    if (enabled) {
      // 检查配置是否完整
      if (!templates.value.stashTitle || !templates.value.inventoryTitle) {
        ElMessage.warning('请先配置模板图片')
        moduleEnabled.value = false
        return
      }

      // 调试输出：查看模板的当前值
      console.log('stashTitle:', templates.value.stashTitle, 'type:', typeof templates.value.stashTitle)
      console.log('inventoryTitle:', templates.value.inventoryTitle, 'type:', typeof templates.value.inventoryTitle)

      // 检查模板路径是否为有效字符串
      if (typeof templates.value.stashTitle !== 'string' || templates.value.stashTitle.includes('error')) {
        ElMessage.warning('仓库标题模板无效，请重新上传')
        moduleEnabled.value = false
        return
      }
      if (typeof templates.value.inventoryTitle !== 'string' || templates.value.inventoryTitle.includes('error')) {
        ElMessage.warning('背包道具标题模板无效，请重新上传')
        moduleEnabled.value = false
        return
      }

      const detectionConfig = {
        templates: {
          stashTitle: String(templates.value.stashTitle || ''),
          inventoryTitle: String(templates.value.inventoryTitle || ''),
          stashRegion: {
            left: Number(templates.value.stashRegion?.left || 0),
            top: Number(templates.value.stashRegion?.top || 0),
            right: Number(templates.value.stashRegion?.right || 1920),
            bottom: Number(templates.value.stashRegion?.bottom || 1080)
          },
          inventoryRegion: {
            left: Number(templates.value.inventoryRegion?.left || 0),
            top: Number(templates.value.inventoryRegion?.top || 0),
            right: Number(templates.value.inventoryRegion?.right || 1920),
            bottom: Number(templates.value.inventoryRegion?.bottom || 1080)
          }
        },
        matchThreshold: Number(matchThreshold.value)
      }

      console.log('[检测配置]', JSON.stringify(detectionConfig, null, 2))

      await electronApi.bag.startDetection(detectionConfig)
      ElMessage.success('背包检测已启动')
    } else {
      await electronApi.bag.stopDetection()
      ElMessage.success('背包检测已停止')
    }

    bagStore.setModuleEnabled(enabled)
  } catch (error) {
    ElMessage.error('操作失败: ' + error.message)
    moduleEnabled.value = !enabled
  }
}

async function saveStashShortcut(value) {
  try {
    await commitGlobalShortcut('stashStart', value)
    ElMessage.success(`快捷键已更新为: ${value}`)
  } catch (error) {
    ElMessage.error(error.message)
  }
}

// 模板上传处理
async function handleTemplateUpload(file, type) {
  try {
    const templatePath = await electronApi.bag.uploadTemplate(file.raw.path, type)
    
    console.log('uploadTemplate 返回值:', templatePath, 'type:', typeof templatePath)
    
    if (templatePath.success === false) {
      ElMessage.error(`上传失败: ${templatePath.error}`)
      return
    }

    if (type === 'stashTitle') {
      templates.value.stashTitle = templatePath.path
      bagStore.setTemplate('stashTitle', templatePath.path)
    } else if (type === 'inventoryTitle') {
      templates.value.inventoryTitle = templatePath.path
      bagStore.setTemplate('inventoryTitle', templatePath.path)
    }

    ElMessage.success('模板图片已上传')
  } catch (error) {
    ElMessage.error('上传失败: ' + error.message)
  }
}

function handleTemplateRegionChange(type) {
  bagStore.setTemplateRegion(type, templates.value[`${type}Region`])
}

function handleMatchThresholdChange() {
  bagStore.setMatchThreshold(matchThreshold.value)
}

function handleButtonPositionChange() {
  bagStore.setButtonPosition(buttonPosition.value)
}

// 获取文件名
function getFileName(path) {
  if (!path || typeof path !== 'string') return ''
  return path.split(/[\\/]/).pop()
}

// 获取模板预览图（如果是本地文件路径）
function getTemplatePreview(path) {
  if (!path || typeof path !== 'string') return ''
  // 如果是本地文件路径，直接返回（Electron 中可以显示本地文件）
  if (path.startsWith('/') || path.includes(':')) {
    return path
  }
  return ''
}

async function handleStopStash() {
  try {
    await electronApi.bag.stopStash()
    bagStore.setStashingStatus(false, 0)
    ElMessage.info('已停止入库')
  } catch (error) {
    ElMessage.error('停止入库失败: ' + error.message)
  }
}

// 监听状态变化
onMounted(async () => {
  // 监听检测状态变化
  bagStore.$subscribe((mutation, state) => {
    moduleEnabled.value = state.moduleEnabled
    templates.value = { ...state.templates }
    matchThreshold.value = state.matchThreshold
    buttonPosition.value = { ...state.buttonPosition }
    isMatched.value = state.isMatched
    isStashing.value = state.isStashing
    stashProgress.value = state.stashProgress
  })

  // 监听检测匹配结果
  electronApi.events.onBagDetectionMatch?.((data) => {
    console.log('[检测] 匹配结果:', data)
    bagStore.setMatchedStatus(data.matched)
    isMatched.value = data.matched
    if (data.matched) {
      bagStore.setDetectionStatus(true)
    }
  })

  // 监听入库进度
  electronApi.events.onBagStashProgress?.((data) => {
    console.log('[入库] 进度:', data.progress)
    bagStore.setStashingStatus(true, data.progress)
    stashProgress.value = data.progress
  })

  // 监听入库完成
  electronApi.events.onBagStashCompleted?.(() => {
    console.log('[入库] 完成')
    bagStore.setStashingStatus(false, 100)
    ElMessage.success('自动入库完成！')
    setTimeout(() => {
      stashProgress.value = 0
    }, 2000)
  })

  // 监听入库停止
  electronApi.events.onBagStashStopped?.((data) => {
    console.log('[入库] 停止:', data)
    bagStore.setStashingStatus(false, 0)
  })

  // 监听检测停止
  electronApi.events.onBagDetectionStopped?.((data) => {
    console.log('[检测] 停止:', data)
    bagStore.setDetectionStatus(false)
    bagStore.setMatchedStatus(false)
    isMatched.value = false
  })
})

onUnmounted(() => {
  // 清理监听器
})
</script>

<style scoped lang="less">
.bag-page {
  height: 100%;
  background-color: var(--bg-secondary);

  .bag-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;

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

    .hint-text {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .template-upload {
      width: 100%;
      .upload-area {
        width: 100%;
        height: 150px;
        border: 1px dashed var(--border-base);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        position: relative;

        &:hover {
          border-color: var(--primary-color);
        }

        .upload-placeholder {
          text-align: center;
          color: var(--text-secondary);
          font-size: 14px;
        }

        .template-preview {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 8px;
        }

        .template-path {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          color: white;
          font-size: 12px;
          padding: 4px 8px;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }

    .region-config {
      margin-top: 12px;

      .region-title {
        font-size: 13px;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }

      .region-inputs {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;

        .coordinate-group {
          display: flex;
          align-items: center;
          gap: 6px;

          .coordinate-label {
            font-size: 13px;
            color: var(--text-primary);
            font-weight: 500;
            min-width: 32px;
          }
        }

        .separator {
          margin: 0 4px;
          color: var(--text-secondary);
          font-weight: bold;
        }
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
