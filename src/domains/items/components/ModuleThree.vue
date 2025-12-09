<template>
  <div class="module-three">
    <div class="module-content">
      <!-- 启用复选框 -->
      <div class="enable-row">
        <el-checkbox v-model="form.enabled" @change="handleEnabledChange">
          启用插槽制作
        </el-checkbox>
      </div>

      <div v-if="form.enabled" class="socket-config">
        <div class="socket-columns">
          <!-- 开孔 -->
          <div class="socket-column">
            <div class="column-header figma-header">
              <el-checkbox v-model="form.socket.enabled" @change="handleSocketEnabledChange">
                <span class="column-title figma-title">开孔</span>
              </el-checkbox>
            </div>
            <div class="divider figma-divider"></div>
            <div class="socket-input figma-input-group">
              <label class="input-label figma-label">数量</label>
              <el-input-number
                v-model="form.socket.count"
                :min="0"
                :max="6"
                :controls="false"
                size="large"
                @change="handleSocketCountChange"
                class="figma-input-number"
              />
            </div>
          </div>

          <!-- 链接 -->
          <div class="socket-column">
            <div class="column-header figma-header">
              <el-checkbox v-model="form.link.enabled" @change="handleLinkEnabledChange">
                <span class="column-title figma-title">链接</span>
              </el-checkbox>
              <el-tooltip placement="top" effect="light" content="配置物品的连接数量要求">
                <el-icon class="help-icon figma-icon">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>
            <div class="divider figma-divider"></div>
            <div class="socket-input figma-input-group">
              <label class="input-label figma-label">链接数</label>
              <el-input-number
                v-model="form.link.count"
                :min="0"
                :max="6"
                :controls="false"
                size="large"
                @change="handleLinkCountChange"
                class="figma-input-number"
              />
            </div>
          </div>

          <!-- 颜色 -->
          <div class="socket-column color-column">
            <div class="column-header figma-header">
              <el-checkbox v-model="form.color.enabled" @change="handleColorEnabledChange">
                <span class="column-title figma-title">颜色</span>
              </el-checkbox>
            </div>
            <div class="divider figma-divider"></div>
            <div class="color-inputs figma-color-inputs">
              <div class="color-item figma-color-item">
                <div class="color-label figma-color-label">
                  <span class="color-dot red"></span>
                  <span>红</span>
                </div>
                <el-input-number
                  v-model="form.color.red"
                  :min="0"
                  :max="6"
                  controls-position="right"
                  size="large"
                  @change="handleColorChange"
                  class="figma-input-number"
                />
              </div>
              <div class="color-item figma-color-item">
                <div class="color-label figma-color-label">
                  <span class="color-dot green"></span>
                  <span>绿</span>
                </div>
                <el-input-number
                  v-model="form.color.green"
                  :min="0"
                  :max="6"
                  controls-position="right"
                  size="large"
                  @change="handleColorChange"
                  class="figma-input-number"
                />
              </div>
              <div class="color-item figma-color-item">
                <div class="color-label figma-color-label">
                  <span class="color-dot blue"></span>
                  <span>蓝</span>
                </div>
                <el-input-number
                  v-model="form.color.blue"
                  :min="0"
                  :max="6"
                  controls-position="right"
                  size="large"
                  @change="handleColorChange"
                  class="figma-input-number"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import { usePresetStore } from '../../../stores/preset'

const presetStore = usePresetStore()

const moduleThree = computed(() => presetStore.currentItemPreset.moduleThree)

const form = ref({
  enabled: moduleThree.value.enabled,
  socket: { ...moduleThree.value.socket },
  link: { ...moduleThree.value.link },
  color: { ...moduleThree.value.color }
})

// 监听store变化，同步到form
watch(() => moduleThree.value.enabled, (val) => {
  form.value.enabled = val
})
watch(() => moduleThree.value.socket, (val) => {
  form.value.socket = { ...val }
}, { deep: true })
watch(() => moduleThree.value.link, (val) => {
  form.value.link = { ...val }
}, { deep: true })
watch(() => moduleThree.value.color, (val) => {
  form.value.color = { ...val }
}, { deep: true })

function handleEnabledChange() {
  presetStore.updateCurrentItemPreset({
    moduleThree: {
      ...moduleThree.value,
      enabled: form.value.enabled
    }
  })
  if (!form.value.enabled) {
    ElMessage.info('已禁用插槽制作')
  }
}

function handleSocketEnabledChange() {
  presetStore.updateCurrentItemPreset({
    moduleThree: {
      ...moduleThree.value,
      socket: {
        ...moduleThree.value.socket,
        enabled: form.value.socket.enabled
      }
    }
  })
}

function handleSocketCountChange() {
  presetStore.updateCurrentItemPreset({
    moduleThree: {
      ...moduleThree.value,
      socket: {
        ...moduleThree.value.socket,
        count: form.value.socket.count
      }
    }
  })
}

function handleLinkEnabledChange() {
  presetStore.updateCurrentItemPreset({
    moduleThree: {
      ...moduleThree.value,
      link: {
        ...moduleThree.value.link,
        enabled: form.value.link.enabled
      }
    }
  })
}

function handleLinkCountChange() {
  presetStore.updateCurrentItemPreset({
    moduleThree: {
      ...moduleThree.value,
      link: {
        ...moduleThree.value.link,
        count: form.value.link.count
      }
    }
  })
}

function handleColorEnabledChange() {
  presetStore.updateCurrentItemPreset({
    moduleThree: {
      ...moduleThree.value,
      color: {
        ...moduleThree.value.color,
        enabled: form.value.color.enabled
      }
    }
  })
}

function handleColorChange() {
  presetStore.updateCurrentItemPreset({
    moduleThree: {
      ...moduleThree.value,
      color: {
        ...moduleThree.value.color,
        red: form.value.color.red,
        green: form.value.color.green,
        blue: form.value.color.blue
      }
    }
  })
}
</script>

<style scoped lang="less">
.module-three {
  width: 100%;
  
  .socket-config {
    margin-top: var(--spacing-md);

    .socket-columns {
      display: flex;
      gap: var(--spacing-lg);

      .socket-column {
        flex: 1;

        &.color-column {
          flex: 1.5;
        }

        .column-header,
        .figma-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          margin-bottom: var(--spacing-sm);

          .column-title,
          .figma-title {
            font-size: 16px; /* Changed to 16px */
            font-weight: 600;
            color: var(--text-primary);
          }

          .help-icon,
          .figma-icon {
            font-size: 16px;
            color: var(--text-secondary);
            cursor: help;
          }
        }

        .divider,
        .figma-divider {
          height: 1px;
          background-color: var(--border-lighter);
          margin: var(--spacing-sm) 0 var(--spacing-md);
        }

        .socket-input,
        .figma-input-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);

          .input-label,
          .figma-label {
            font-size: var(--font-size-sm);
            color: var(--text-regular);
          }
        }
      }
    }

    .color-inputs,
    .figma-color-inputs {
      display: flex;
      flex-direction: row; /* Keep row layout for the group */
      gap: 24px;
      
      .color-item,
      .figma-color-item {
        flex: 1; /* Auto adaptive width */
        display: flex;
        flex-direction: column; /* Title above input */
        gap: var(--spacing-xs);

        .color-label,
        .figma-color-label {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--font-size-sm);
          color: var(--text-regular);
        }
      }
    }
  }

  .figma-input-number {
    width: 100%; /* Fill parent container */
  }

  .color-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;

    &.red {
      background-color: #f56c6c;
    }

    &.green {
      background-color: #67c23a;
    }

    &.blue {
      background-color: #409eff;
    }
  }

  .disabled-tip {
    margin-top: var(--spacing-md);
  }
}
</style>
