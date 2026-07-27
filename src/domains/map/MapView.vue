<template>
  <div class="map-page">
    <SupportedFormatPanel :guidance="MAP_FORMAT_GUIDANCE" />

    <div class="map-header">
      <div class="header-top">
        <div class="form-item">
          <label class="form-label">洗图方法</label>
          <el-select v-model="mapConfig.method" placeholder="请选择" class="form-select">
            <el-option label="点金石" value="alchemy" />
            <el-option label="混沌石" value="chaos" />
          </el-select>
        </div>
        
        <div class="form-item">
          <label class="form-label">开始</label>
          <KeyCaptureInput :model-value="shortcuts.mapStart" class="form-input-short" @change="saveShortcut('mapStart', $event)" />
        </div>

        <div class="form-item">
          <label class="form-label">结束</label>
          <KeyCaptureInput :model-value="shortcuts.end" class="form-input-short" @change="saveShortcut('end', $event)" />
        </div>

        <div class="form-item">
          <label class="form-label">预设</label>
          <PresetSelector type="map" />
        </div>
      </div>

      <div class="header-bottom">
        <el-checkbox v-model="mapConfig.vaal.enabled" label="瓦尔宝珠" size="large">
           <template #default>
            <div class="checkbox-label">
              <img :src="vaalIcon" alt="瓦尔宝珠" class="icon-image" />
              瓦尔宝珠
            </div>
          </template>
        </el-checkbox>
        <el-checkbox v-model="mapConfig.autoStash" label="符合条件存仓" size="large">
           <template #default>
            <div class="checkbox-label">
              符合条件存仓
              <el-tooltip content="当地图满足配置条件时，自动存入仓库" placement="top">
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-checkbox>
      </div>
    </div>
    
    <div class="map-content">
      <!-- Map Base Section -->
      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <span class="title">地图基底</span>
             <el-tooltip content="设置地图的基本属性要求" placement="top">
               <el-icon class="help-icon"><QuestionFilled /></el-icon>
             </el-tooltip>
          </div>
        </template>
        
        <div class="base-content">
          <div class="base-column">
            <div class="column-header">
              <span>必选基底</span>
               <el-tooltip content="必须满足所有勾选的条件" placement="top">
                 <el-icon class="help-icon"><QuestionFilled /></el-icon>
               </el-tooltip>
            </div>
            <div class="conditions-list">
              <div class="condition-row" v-for="(key, label) in mandatoryStatKeys" :key="key">
                <el-checkbox v-model="getMandatoryStat(key).enabled">{{ label }}</el-checkbox>
                <span class="separator">>=</span>
                <el-input-number v-model="getMandatoryStat(key).value" :min="0" controls-position="right" class="number-input" />
              </div>
            </div>
          </div>

          <div class="base-column">
             <div class="column-header">
              <span>挑选基底</span>
               <el-tooltip content="满足其中N项即可" placement="top">
                 <el-icon class="help-icon"><QuestionFilled /></el-icon>
               </el-tooltip>
               <div class="count-select">
                 <span>包含数</span>
                 <el-input-number v-model="mapConfig.match.selectedCount" :min="1" :max="6" controls-position="right" size="small" style="width: 60px;" />
               </div>
            </div>
             <div class="conditions-list">
               <div class="condition-row" v-for="(key, label) in optionalStatKeys" :key="key">
                <el-checkbox v-model="getOptionalStat(key).enabled">{{ label }}</el-checkbox>
                <span class="separator">>=</span>
                <el-input-number v-model="getOptionalStat(key).value" :min="0" controls-position="right" class="number-input" />
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Modifiers Section -->
      <div class="modifiers-section">
        <!-- Blacklist -->
        <el-card class="section-card modifier-card">
           <template #header>
            <div class="card-header">
              <span class="title">黑名单词缀</span>
               <el-tooltip content="遇到这些词缀会重洗" placement="top">
                 <el-icon class="help-icon"><QuestionFilled /></el-icon>
               </el-tooltip>
            </div>
          </template>
          <div class="modifier-list">
             <div v-for="(mod, index) in mapConfig.match.blacklist" :key="index" class="modifier-item">
               <el-input v-model="mapConfig.match.blacklist[index]" placeholder="请输入词缀" />
               <el-button type="danger" link @click="removeModifier('blacklist', index)">
                 <el-icon><Delete /></el-icon>
               </el-button>
             </div>
             <el-button class="add-btn" text type="primary" @click="addModifier('blacklist')">
               <el-icon><Plus /></el-icon> 添加词缀
             </el-button>
          </div>
        </el-card>

        <!-- Whitelist -->
        <el-card class="section-card modifier-card">
           <template #header>
            <div class="card-header">
              <span class="title">白名单词缀</span>
               <el-tooltip content="必须包含这些词缀" placement="top">
                 <el-icon class="help-icon"><QuestionFilled /></el-icon>
               </el-tooltip>
            </div>
          </template>
           <div class="modifier-list">
             <div v-for="(mod, index) in mapConfig.match.whitelist" :key="index" class="modifier-item">
               <el-input v-model="mapConfig.match.whitelist[index]" placeholder="暴击伤害" />
               <el-button type="danger" link @click="removeModifier('whitelist', index)">
                 <el-icon><Delete /></el-icon>
               </el-button>
             </div>
             <el-button class="add-btn" text type="primary" @click="addModifier('whitelist')">
               <el-icon><Plus /></el-icon> 添加词缀
             </el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { QuestionFilled, Delete, Plus } from '@element-plus/icons-vue'
import { useSettingsStore } from '../settings/settingsStore'
import { usePresetStore } from '../../stores/preset'
import PresetSelector from '@/components/common/PresetSelector.vue'
import vaalIcon from '@/assets/images/瓦尔宝珠.png'
import SupportedFormatPanel from '@/components/common/SupportedFormatPanel.vue'
import { MAP_FORMAT_GUIDANCE } from '@/utils/supportedItemFormats'
import { MAP_BASE_STATS, createDefaultMapConfig } from '@/utils/mapPresetMigration'
import KeyCaptureInput from '@/components/common/KeyCaptureInput.vue'
import { commitGlobalShortcut } from '@/utils/scriptService'

const settingsStore = useSettingsStore()
const presetStore = usePresetStore()

// Shortcuts binding
const shortcuts = computed(() => settingsStore.globalShortcuts)
async function saveShortcut(key, value) {
  try {
    await commitGlobalShortcut(key, value)
  } catch (error) {
    ElMessage.error(error.message)
  }
}

// Current Preset Config Accessor
const mapConfig = computed(() => {
  const preset = presetStore.currentMapPreset
  
  if (!preset.map) {
    preset.map = createDefaultMapConfig()
  }
  
  // 确保 autoStash 字段存在（兼容旧数据）
  if (preset.map.autoStash === undefined) {
    preset.map.autoStash = true
  }
  
  // Ensure critical nested objects exist
  if (!preset.map.grid) {
    preset.map.grid = { startX: 0, startY: 0, offsetX: 0, offsetY: 0, rows: 5, cols: 12 }
  }
  if (!preset.map.match) {
    preset.map.match = { blacklist: [], whitelist: [], mandatoryStats: {}, optionalStats: {} }
  }

  return preset.map
})

// Helper for dynamic stat binding
const getMandatoryStat = (key) => {
  if (!mapConfig.value.match.mandatoryStats[key]) {
    mapConfig.value.match.mandatoryStats[key] = { enabled: false, value: 0 }
  }
  return mapConfig.value.match.mandatoryStats[key]
}

const getOptionalStat = (key) => {
  if (!mapConfig.value.match.optionalStats[key]) {
    mapConfig.value.match.optionalStats[key] = { enabled: false, value: 0 }
  }
  return mapConfig.value.match.optionalStats[key]
}

// Stats Definitions
const mandatoryStatKeys = MAP_BASE_STATS
const optionalStatKeys = MAP_BASE_STATS


function addModifier(type) {
  if (!mapConfig.value.match[type]) mapConfig.value.match[type] = []
  mapConfig.value.match[type].push('')
}

function removeModifier(type, index) {
  mapConfig.value.match[type].splice(index, 1)
}

// Watch for changes to save
watch(() => presetStore.currentMapPreset, () => {
  presetStore.savePresets()
}, { deep: true })

</script>

<style scoped lang="less">
.map-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
  background-color: var(--bg-secondary);

  .map-header {
    background-color: var(--bg-primary);
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    
    .header-top {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 16px;
      flex-wrap: wrap;

      .form-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .form-label {
          font-size: 14px;
          color: var(--text-primary);
          white-space: nowrap;
        }

        .form-select {
          width: 120px;
        }

        .form-input-short {
          width: 80px;
        }
      }
    }

    .header-bottom {
      display: flex;
      gap: 24px;
      align-items: center;

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 4px;
        
        .icon-image {
          width: 18px;
          height: 18px;
          display: inline-block;
          object-fit: contain;
        }
        
        .help-icon {
          color: var(--text-secondary);
          margin-left: 4px;
          font-size: 14px;
        }
      }
    }
  }

  .map-content {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .section-card {
      border: none;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
      border-radius: 8px;
      
      :deep(.el-card__header) {
        padding: 16px 20px;
        border-bottom: 1px solid var(--border-lighter);
      }
      
      :deep(.el-card__body) {
        padding: 20px;
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .title {
          font-weight: 500;
          font-size: 16px;
          color: var(--text-primary);
        }

        .help-icon {
          color: var(--text-secondary);
          cursor: help;
        }

        .header-right {
          margin-left: auto;
        }
      }

      .grid-content {
        .form-row {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;

          .grid-item {
            display: flex;
            align-items: center;
            gap: 8px;
            
            label {
               font-size: 14px;
               color: var(--text-secondary);
            }

            :deep(.el-input-number) {
              width: 100px;
            }
          }
        }
      }
    }

    .base-content {
      display: flex;
      gap: 20px;

      .base-column {
        flex: 1;
        background-color: var(--bg-secondary);
        border-radius: 4px;
        padding: 16px;

        .column-header {
           display: flex;
           align-items: center;
           gap: 8px;
           margin-bottom: 16px;
           font-weight: 500;
           color: var(--text-primary);
           
           .help-icon {
             color: var(--text-secondary);
             font-size: 14px;
           }

           .count-select {
             margin-left: auto;
             display: flex;
             align-items: center;
             gap: 8px;
             font-size: 12px;
             font-weight: normal;
           }
        }

        .conditions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .condition-row {
            display: flex;
            align-items: center;
            
            :deep(.el-checkbox) {
               margin-right: 0;
               flex: 1;
            }

            .separator {
              margin: 0 12px;
              color: var(--text-secondary);
              font-size: 12px;
            }

            .number-input {
              width: 100px;
            }
          }
        }
      }
    }

    .modifiers-section {
      display: flex;
      gap: 20px;
      
      .modifier-card {
        flex: 1;
      }

      .modifier-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .modifier-item, .input-placeholder {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: var(--bg-secondary);
          padding: 4px 8px;
          border-radius: 4px;
          
          :deep(.el-input__wrapper) {
            box-shadow: none;
            background: transparent;
          }
        }

        .add-btn {
          margin-top: 8px;
          justify-content: flex-start;
          padding-left: 0;
        }
      }
    }
  }
}
</style>
