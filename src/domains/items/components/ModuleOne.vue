<template>
  <div class="module-one">
    <div class="module-content">
      <div class="form-row">
        <div class="form-item">
          <label class="form-label">物品开始</label>
          <KeyCaptureInput :model-value="form.itemStart" class="form-input" @change="handleSave" />
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
import { usePresetStore } from '../../../stores/preset'
import { useSettingsStore } from '../../settings/settingsStore'
import PresetSelector from '../../../components/common/PresetSelector.vue'
import KeyCaptureInput from '../../../components/common/KeyCaptureInput.vue'
import { commitGlobalShortcut } from '../../../utils/scriptService'

const presetStore = usePresetStore()
const settingsStore = useSettingsStore()

const form = ref({
  itemStart: settingsStore.globalShortcuts.itemStart || 'Alt+1'
})

// 监听设置变化，同步到form
watch(() => settingsStore.globalShortcuts.itemStart, (val) => {
  form.value.itemStart = val || 'Alt+1'
})

async function handleSave(value) {
  try {
    await commitGlobalShortcut('itemStart', value)
  } catch (error) {
    form.value.itemStart = settingsStore.globalShortcuts.itemStart
    ElMessage.error(error.message)
  }
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

