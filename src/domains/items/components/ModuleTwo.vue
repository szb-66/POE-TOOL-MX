<template>
  <div class="module-two">
    <div class="module-content">
      <!-- 顶部配置行：启用和模式选择 -->
      <div class="top-row">
        <el-checkbox v-model="form.enabled" @change="handleEnabledChange">
          <span v-if="!form.enabled">启用词缀制作</span>
        </el-checkbox>
        
        <template v-if="form.enabled">
          <div class="mode-selector">
            <el-select v-model="form.mode" @change="handleModeChange" style="width: 120px">
              <el-option label="改造石模式" value="alteration" />
              <el-option label="混沌模式" value="chaos" />
              <el-option label="点金石模式" value="alchemy" />
            </el-select>
          </div>
          <!-- 改造石模式配置 -->
          <div v-if="form.mode === 'alteration'" class="mode-options">
            <el-checkbox v-model="form.enableAugmentation" @change="handleAugmentationChange">
              启用增幅石
            </el-checkbox>
            <el-checkbox v-model="form.enableRegal" @change="handleRegalChange">
              启用富豪石
            </el-checkbox>
          </div>
          <!-- 混沌模式配置 -->
          <div v-if="form.mode === 'chaos'" class="mode-options">
            <el-checkbox v-model="form.enableExalted" @change="handleExaltedChange">
              启用崇高石
            </el-checkbox>
          </div>
        </template>
      </div>

      <div v-if="form.enabled" class="affix-config">
        <div class="affix-columns">
          <!-- 必选词缀列 -->
          <div class="affix-column required-affix-column">
            <div class="column-header figma-header">
              <span class="column-title figma-title">必选词缀</span>
              <el-tooltip placement="top" effect="light" content="这些词缀在制作中必须同时出现">
                <el-icon class="help-icon figma-icon">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>
            <div class="divider figma-divider"></div>
            <div class="affix-list figma-list">
              <div v-for="(affix, index) in form.requiredAffixes" :key="index" class="affix-item figma-item">
                <el-input
                  v-model="form.requiredAffixes[index]"
                  placeholder="请输入必选词缀"
                  @blur="handleRequiredAffixChange"
                  class="figma-input"
                  size="large"
                  clearable
                  />
                <el-button
                  class="figma-delete"
                  type="default"
                  :icon="Delete"
                  circle
                  size="small"
                  @click="handleRemoveRequiredAffix(index)"
                />
              </div>
              <el-button
                class="figma-add"
                type="text"
                :icon="Plus"
                size="small"
                @click="handleAddRequiredAffix">
                添加必选词缀
              </el-button>
            </div>
          </div>

          <!-- 挑选词缀列 -->
          <div class="affix-column selected-affix-column">
            <div class="column-header figma-header">
              <span class="column-title figma-title">挑选词缀</span>
              <el-tooltip placement="top" effect="light" content="可挑选其中若干个词缀即可满足条件">
                <el-icon class="help-icon figma-icon">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
              <div class="count-selector figma-count-selector">
                <span class="count-label figma-count-label" style="white-space: nowrap;">包含数</span>
                <el-input-number
                  v-model="form.selectedCount"
                  :min="1"
                  :max="Math.max(form.selectedAffixes.length, 1)"
                  controls-position="right"
                  size="small"
                  @change="handleSelectedCountChange"
                  class="figma-input-number"
                />
              </div>
            </div>
            <div class="divider figma-divider"></div>
            <div class="affix-list figma-list">
              <div v-for="(affix, index) in form.selectedAffixes" :key="index" class="affix-item figma-item">
                <el-input
                  v-model="form.selectedAffixes[index]"
                  placeholder="请输入挑选词缀"
                  @blur="handleSelectedAffixChange"
                  class="figma-input"
                  size="large"
                  clearable
                  />
                <el-button
                  class="figma-delete"
                  type="default"
                  :icon="Delete"
                  circle
                  size="small"
                  @click="handleRemoveSelectedAffix(index)"
                />
              </div>
              <el-button
                class="figma-add"
                type="text"
                :icon="Plus"
                size="small"
                @click="handleAddSelectedAffix">
                添加挑选词缀
              </el-button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Plus, Delete, QuestionFilled } from '@element-plus/icons-vue'
import { usePresetStore } from '../../../stores/preset'

const presetStore = usePresetStore()

const moduleTwo = computed(() => presetStore.currentItemPreset.moduleTwo)

const form = ref({
  enabled: moduleTwo.value.enabled,
  mode: moduleTwo.value.mode,
  requiredAffixes: [...moduleTwo.value.requiredAffixes],
  selectedAffixes: [...moduleTwo.value.selectedAffixes],
  selectedCount: moduleTwo.value.selectedCount,
  enableAugmentation: moduleTwo.value.enableAugmentation,
  enableRegal: moduleTwo.value.enableRegal,
  enableExalted: moduleTwo.value.enableExalted
})

// 监听store变化，同步到form
watch(() => moduleTwo.value.enabled, (val) => {
  form.value.enabled = val
})
watch(() => moduleTwo.value.mode, (val) => {
  form.value.mode = val
})
watch(() => moduleTwo.value.requiredAffixes, (val) => {
  form.value.requiredAffixes = [...val]
}, { deep: true })
watch(() => moduleTwo.value.selectedAffixes, (val) => {
  form.value.selectedAffixes = [...val]
}, { deep: true })
watch(() => moduleTwo.value.selectedCount, (val) => {
  form.value.selectedCount = val
})
watch(() => moduleTwo.value.enableAugmentation, (val) => {
  form.value.enableAugmentation = val
})
watch(() => moduleTwo.value.enableRegal, (val) => {
  form.value.enableRegal = val
})
watch(() => moduleTwo.value.enableExalted, (val) => {
  form.value.enableExalted = val
})

function handleEnabledChange() {
  presetStore.updateCurrentItemPreset({
    moduleTwo: {
      ...moduleTwo.value,
      enabled: form.value.enabled
    }
  })
  if (!form.value.enabled) {
    ElMessage.warning('已禁用词缀匹配')
  }
}

function handleModeChange() {
  presetStore.updateCurrentItemPreset({
    moduleTwo: {
      ...moduleTwo.value,
      mode: form.value.mode
    }
  })
}

function handleAugmentationChange() {
  presetStore.updateCurrentItemPreset({
    moduleTwo: {
      ...moduleTwo.value,
      enableAugmentation: form.value.enableAugmentation
    }
  })
}

function handleRegalChange() {
  presetStore.updateCurrentItemPreset({
    moduleTwo: {
      ...moduleTwo.value,
      enableRegal: form.value.enableRegal
    }
  })
}

function handleExaltedChange() {
  presetStore.updateCurrentItemPreset({
    moduleTwo: {
      ...moduleTwo.value,
      enableExalted: form.value.enableExalted
    }
  })
}

function handleAddRequiredAffix() {
  const newAffixes = [...moduleTwo.value.requiredAffixes, '']
  presetStore.updateCurrentItemPreset({
    moduleTwo: {
      ...moduleTwo.value,
      requiredAffixes: newAffixes
    }
  })
}

function handleRemoveRequiredAffix(index) {
  const newAffixes = [...moduleTwo.value.requiredAffixes]
  newAffixes.splice(index, 1)
  presetStore.updateCurrentItemPreset({
    moduleTwo: {
      ...moduleTwo.value,
      requiredAffixes: newAffixes
    }
  })
}

function handleRequiredAffixChange() {
  presetStore.updateCurrentItemPreset({
    moduleTwo: {
      ...moduleTwo.value,
      requiredAffixes: [...form.value.requiredAffixes]
    }
  })
}

function handleAddSelectedAffix() {
  const newAffixes = [...moduleTwo.value.selectedAffixes, '']
  presetStore.updateCurrentItemPreset({
    moduleTwo: {
      ...moduleTwo.value,
      selectedAffixes: newAffixes
    }
  })
}

function handleRemoveSelectedAffix(index) {
  const newAffixes = [...moduleTwo.value.selectedAffixes]
  newAffixes.splice(index, 1)
  presetStore.updateCurrentItemPreset({
    moduleTwo: {
      ...moduleTwo.value,
      selectedAffixes: newAffixes
    }
  })
}

function handleSelectedAffixChange() {
  presetStore.updateCurrentItemPreset({
    moduleTwo: {
      ...moduleTwo.value,
      selectedAffixes: [...form.value.selectedAffixes]
    }
  })
}

function handleSelectedCountChange() {
  presetStore.updateCurrentItemPreset({
    moduleTwo: {
      ...moduleTwo.value,
      selectedCount: form.value.selectedCount
    }
  })
}
</script>

<style scoped lang="less">
.module-two {
  width: 100%;

  .module-content {
    // padding-top: var(--spacing-sm);

    .top-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);

      .mode-selector {
        display: flex;
        align-items: center;
      }

      .mode-options {
        display: flex;
        gap: var(--spacing-md);
        align-items: center;
      }
    }

    .affix-config {
      margin-top: var(--spacing-md);

      .affix-columns {
        display: flex;
        gap: var(--spacing-lg);

        .affix-column {
          flex: 1;

          .column-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
            margin-bottom: var(--spacing-sm);

            .column-title {
              font-size: 16px; /* Changed to 16px */
              font-weight: 600;
              color: var(--text-primary);
            }

            .help-icon {
              font-size: 16px;
              color: var(--text-secondary);
              cursor: help;
            }

            .count-selector {
              margin-left: auto;
              display: flex;
              align-items: center;
              gap: var(--spacing-xs);

              .count-label {
                font-size: var(--font-size-xs);
                color: var(--text-secondary);
                white-space: nowrap;
              }
            }
          }

          .divider {
            height: 1px;
            background-color: var(--border-lighter);
            margin: var(--spacing-sm) 0 var(--spacing-md);
          }

          .affix-list {
            padding-top: var(--spacing-sm);

            .affix-item {
              display: flex;
              align-items: center;
              margin-bottom: var(--spacing-md);
              gap: var(--spacing-sm);

              .el-input {
                flex: 1;
              }
            }
          }
        }
      }
    }
  }

  .disabled-tip {
    margin-top: var(--spacing-md);
  }
}
</style>
