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
          </el-form>
        </el-card>

        <!-- 模板配置 -->
        <div class="section-header">
          <h3 class="section-title">模板配置</h3>
        </div>
        <el-card class="section-card">
          <el-form :model="templates" label-width="120px" label-position="left">
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
                    <div class="position-input">
                      <el-input-number
                        v-model="templates.stashRegion.left"
                        placeholder="左上X"
                        :min="0"
                        :max="9999"
                        controls-position="right"
                      />
                      <el-input-number
                        v-model="templates.stashRegion.top"
                        placeholder="左上Y"
                        :min="0"
                        :max="9999"
                        controls-position="right"
                      />
                      <el-input-number
                        v-model="templates.stashRegion.right"
                        placeholder="右下X"
                        :min="0"
                        :max="9999"
                        controls-position="right"
                      />
                      <el-input-number
                        v-model="templates.stashRegion.bottom"
                        placeholder="右下Y"
                        :min="0"
                        :max="9999"
                        controls-position="right"
                      />
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
                    <div class="position-input">
                      <el-input-number
                        v-model="templates.inventoryRegion.left"
                        placeholder="左上X"
                        :min="0"
                        :max="9999"
                        controls-position="right"
                      />
                      <el-input-number
                        v-model="templates.inventoryRegion.top"
                        placeholder="左上Y"
                        :min="0"
                        :max="9999"
                        controls-position="right"
                      />
                      <el-input-number
                        v-model="templates.inventoryRegion.right"
                        placeholder="右下X"
                        :min="0"
                        :max="9999"
                        controls-position="right"
                      />
                      <el-input-number
                        v-model="templates.inventoryRegion.bottom"
                        placeholder="右下Y"
                        :min="0"
                        :max="9999"
                        controls-position="right"
                      />
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBagStore } from '@/stores/bag'
import { electronApi } from '@/api/electron'
import { Plus } from '@element-plus/icons-vue'

const bagStore = useBagStore()

// 响应式数据
const moduleEnabled = ref(bagStore.moduleEnabled)
const templates = ref({ ...bagStore.templates })
const matchThreshold = ref(bagStore.matchThreshold)
const buttonPosition = ref({ ...bagStore.buttonPosition })
const isStashing = ref(false)
const stashProgress = ref(0)
const matchRegion = ref({ ...bagStore.templates.stashRegion })
const stashConfig = ref({ startPos: { x: 2658, y: 1199 }, slotSize: { w: 100, h: 100 } })

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
      if (!matchRegion.value.left && !matchRegion.value.top && !matchRegion.value.right && !matchRegion.value.bottom) {
        ElMessage.warning('请先配置匹配区域')
        moduleEnabled.value = false
        return
      }
      if (!stashConfig.value.startPos.x || !stashConfig.value.startPos.y) {
        ElMessage.warning('请先配置仓库首格位置')
        moduleEnabled.value = false
        return
      }

      const detectionConfig = {
        templates: {
          stashTitle: templates.value.stashTitle || '',
          inventoryTitle: templates.value.inventoryTitle || ''
        },
        matchRegion: {
          x: matchRegion.value.left,
          y: matchRegion.value.top,
          width: matchRegion.value.right - matchRegion.value.left,
          height: matchRegion.value.bottom - matchRegion.value.top
        },
        matchThreshold: matchThreshold.value
      }

      console.log('传递给 electronApi 的配置:', JSON.stringify(detectionConfig, null, 2))
      console.log('matchRegion 原始值:', JSON.stringify(matchRegion.value, null, 2))
      console.log('templates 原始值:', JSON.stringify(templates.value, null, 2))

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

// 监听状态变化
onMounted(() => {
  // 监听检测状态变化
  bagStore.$subscribe((mutation, state) => {
    moduleEnabled.value = state.moduleEnabled
    templates.value = { ...state.templates }
    matchThreshold.value = state.matchThreshold
    buttonPosition.value = { ...state.buttonPosition }
  })

  // 监听入库状态
  electronApi.events.onBagStashStatus?.((status) => {
    isStashing.value = status.isRunning
    stashProgress.value = status.progress || 0
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
