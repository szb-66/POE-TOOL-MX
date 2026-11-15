<template>
  <section class="server-mode-settings" aria-labelledby="server-mode-heading">
    <div class="section-header"><h3 id="server-mode-heading" class="section-title">游戏服务器</h3></div>
    <el-card class="section-card">
      <el-form label-width="120px" label-position="left">
        <el-form-item label="服务器模式">
          <el-select v-model="selected" :disabled="busy" aria-label="服务器模式">
            <el-option label="国服（简体中文客户端）" value="cn" />
            <el-option label="国际服（英文／受管汉化客户端）" value="international" />
          </el-select>
          <el-button :disabled="selected === currentServer.id || !desktop" :loading="busy" @click="switchMode">切换并重启</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { currentServer } from '../../utils/serverContext.js'

const desktop = Boolean(window.electronAPI)
const selected = ref(currentServer.id)
const busy = ref(false)
async function switchMode() {
  busy.value = true
  try {
    const result = await window.electronAPI.switchServerMode(selected.value)
    if (!result.success) throw new Error(result.error?.message || result.error)
  } catch (error) { ElMessage.error(error.message); busy.value = false }
}
</script>

<style scoped lang="less">
.server-mode-settings { margin-bottom: var(--spacing-xl); }
.section-header { margin-bottom: var(--spacing-sm); padding-left: var(--spacing-xs); }
.section-title { margin: 0; font-size: var(--font-size-md); font-weight: 600; color: var(--text-primary); }
.section-card { margin-bottom: 0; }
.el-select { width: min(360px, 100%); }
.server-mode-settings :deep(.el-form .el-form-item) { margin-bottom: 0; }
:deep(.el-form-item__content) { gap: 12px; }
</style>
