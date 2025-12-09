<template>
  <div class="module-one">
    <div class="module-content">
      <div class="form-row">
        <div class="form-item">
          <label class="form-label">物品开始</label>
          <el-input
            v-model="form.itemStart"
            placeholder="例如：Alt+1"
            class="form-input"
            @blur="handleSave"
          />
        </div>
        <div class="form-item">
          <label class="form-label">预设</label>
          <PresetSelector type="item" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { usePresetStore } from '../../../stores/preset'
import { useSettingsStore } from '../../settings/settingsStore'
import { isShortcutConflict } from '../../../utils/shortcutValidator'
import PresetSelector from '../../../components/common/PresetSelector.vue'

const presetStore = usePresetStore()
const settingsStore = useSettingsStore()

const form = ref({
  itemStart: settingsStore.globalShortcuts.itemStart || 'Alt+1'
})

// 监听设置变化，同步到form
watch(() => settingsStore.globalShortcuts.itemStart, (val) => {
  form.value.itemStart = val || 'Alt+1'
})

function handleSave() {
  const newItemStart = form.value.itemStart?.trim()
  
  // 使用工具函数检查冲突
  if (isShortcutConflict(newItemStart, settingsStore.globalShortcuts, 'itemStart')) {
    ElMessage.error('物品开始快捷键不能与其他快捷键重复')
    // 恢复原值
    form.value.itemStart = settingsStore.globalShortcuts.itemStart
    return
  }

  settingsStore.updateGlobalShortcuts({
    itemStart: form.value.itemStart
  })
}
</script>

<style scoped lang="less">
.module-one {
  width: 100%;

  .module-content {
    // padding-top: var(--spacing-sm);

    .form-row {
      display: flex;
      gap: var(--spacing-md);
      align-items: flex-end;
      flex-wrap: wrap;

      .form-item {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);

        .form-label {
          font-size: var(--font-size-sm);
          color: var(--text-regular);
          font-weight: 500;
        }

        .form-input {
          width: 140px;
        }
      }
    }
  }
}
</style>

