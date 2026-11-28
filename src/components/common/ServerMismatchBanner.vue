<template>
  <div v-if="store.visible" class="server-mismatch-banner" role="alert">
    <div class="server-mismatch-banner__content">
      <el-icon class="server-mismatch-banner__icon"><WarningFilled /></el-icon>
      <span class="server-mismatch-banner__text">
        检测到正在运行 <strong>{{ store.detectedServerLabel }}</strong> 客户端，当前助手为
        <strong>{{ store.currentServerLabel }}</strong> 模式，可能导致游戏窗口无法识别或功能异常。
      </span>
    </div>
    <div class="server-mismatch-banner__actions">
      <el-button
        type="warning"
        size="small"
        :loading="store.switching"
        @click="handleSwitch"
      >切换至{{ store.detectedServerLabel }}并重启</el-button>
      <el-button
        size="small"
        text
        :disabled="store.switching"
        @click="store.dismiss()"
      >暂不提示</el-button>
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import { useServerMismatchStore } from '@/stores/serverMismatch'

const store = useServerMismatchStore()

async function handleSwitch() {
  const result = await store.switchToDetectedServer()
  if (result && !result.success) {
    ElMessage.error(result.error || '切换服务器模式失败')
  }
}
</script>

<style scoped lang="less">
.server-mismatch-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  background: color-mix(in srgb, var(--el-color-warning, #e6a23c) 14%, var(--surface-1, var(--bg-primary)));
  border-bottom: 1px solid color-mix(in srgb, var(--el-color-warning, #e6a23c) 40%, var(--border-base));
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.4;
  flex-shrink: 0;
}

.server-mismatch-banner__content {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.server-mismatch-banner__icon {
  color: var(--el-color-warning, #e6a23c);
  font-size: 16px;
  flex-shrink: 0;
}

.server-mismatch-banner__text {
  min-width: 0;
}

.server-mismatch-banner__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

@media (max-width: 720px) {
  .server-mismatch-banner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
