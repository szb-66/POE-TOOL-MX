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
        <div class="form-item initial-check-item">
          <label class="form-label">首次识别</label>
          <el-checkbox v-model="checkInitialItem">开启</el-checkbox>
        </div>
        <div class="form-item">
          <label class="form-label">词缀参考</label>
          <a href="https://poedb.tw/cn/Modifiers" target="_blank" rel="noopener noreferrer" class="poedb-link">
            <el-button type="primary" plain>国服流亡编年史·查看词缀</el-button>
          </a>
        </div>
        <div class="form-item">
          <label class="form-label">操作</label>
          <el-button
            type="primary"
            :loading="starting"
            :disabled="starting || scriptStore.isRunning"
            @click="handleStart"
          >
            {{ isCurrentModeRunning ? '运行中' : '启动' }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { usePresetStore } from '../../../stores/preset'
import { useSettingsStore } from '../../settings/settingsStore'
import { useScriptStore } from '../../../stores/script'
import PresetSelector from '../../../components/common/PresetSelector.vue'
import KeyCaptureInput from '../../../components/common/KeyCaptureInput.vue'
import { commitGlobalShortcut, startCrafting } from '../../../utils/scriptService'

const presetStore = usePresetStore()
const settingsStore = useSettingsStore()
const scriptStore = useScriptStore()
const starting = ref(false)
const isCurrentModeRunning = computed(() => scriptStore.isRunning && scriptStore.mode === 'items')
const checkInitialItem = computed({
  get: () => presetStore.currentItemPreset.checkInitialItem !== false,
  set: value => presetStore.updateCurrentItemPreset({ checkInitialItem: Boolean(value) })
})

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

async function handleStart() {
  if (starting.value || scriptStore.isRunning) return
  starting.value = true
  try {
    await startCrafting()
  } finally {
    starting.value = false
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

        .poedb-link {
          display: inline-flex;
          text-decoration: none;
        }

      }
    }
  }
}
</style>

