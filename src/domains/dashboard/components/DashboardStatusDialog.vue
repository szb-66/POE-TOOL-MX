<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="720px"
    align-center
    class="dashboard-status-dialog"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    @update:model-value="$emit('update:modelValue', $event)"
    @closed="$emit('closed')"
  >
    <template #header="{ titleId, titleClass }">
      <div class="status-dialog-heading">
        <span class="status-dialog-eyebrow">运行与系统环境</span>
        <div class="status-dialog-title">
          <h2 :id="titleId" :class="titleClass">{{ title }}</h2>
          <el-tag size="small" :type="kind === 'error' ? 'danger' : kind === 'running' ? 'success' : 'info'">{{ entries.length }} 项</el-tag>
        </div>
        <p>{{ subtitle }}</p>
      </div>
    </template>
    <div class="status-detail-list">
      <article v-for="item in entries" :key="item.id" class="status-detail-card" :class="`is-${item.state || item.status}`">
        <span class="status-detail-icon"><component :is="kind === 'environment' ? Monitor : (moduleIcons[item.id] || Monitor)" /></span>
        <div class="status-detail-content">
          <div class="status-detail-title">
            <strong>{{ item.title || item.label }}</strong>
            <el-tag size="small" :type="statusType(item)">{{ statusLabel(item) }}</el-tag>
          </div>
          <p>{{ kind === 'environment' ? item.text : item.statusText }}</p>
        </div>
        <el-button v-if="kind !== 'environment'" class="status-detail-action" size="small" plain :aria-label="`${item.title}：${kind === 'error' ? '前往处理' : '进入模块'}`" @click="$emit('open-module', item)">{{ kind === 'error' ? '前往处理' : '进入模块' }}<el-icon><ArrowRight /></el-icon></el-button>
        <el-button v-else-if="item.action" class="status-detail-action" size="small" plain type="primary" :aria-label="`${item.label}：${item.action.label}`" @click="$emit('open-health', item.action)">{{ item.action.label }}</el-button>
      </article>
      <el-empty v-if="!entries.length" :image-size="72" :description="kind === 'error' ? '当前没有异常模块' : kind === 'running' ? '暂无运行中的模块' : '暂无环境检查结果'" />
    </div>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowRight, Monitor } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: Boolean,
  kind: { type: String, required: true },
  modules: { type: Array, default: () => [] },
  healthItems: { type: Array, default: () => [] },
  moduleIcons: { type: Object, default: () => ({}) }
})
defineEmits(['update:modelValue', 'closed', 'open-module', 'open-health'])
const title = computed(() => ({ running: '运行中的模块', error: '异常模块', environment: '系统环境' }[props.kind]))
const subtitle = computed(() => ({ running: '查看当前运行状态，进入模块管理详细配置。', error: '查看异常原因，进入对应模块处理。', environment: '查看运行环境检查结果与对应处理入口。' }[props.kind]))
const entries = computed(() => props.kind === 'environment' ? props.healthItems : props.modules)
const statusType = item => ({ running: 'success', ready: 'success', error: 'danger', attention: 'warning', pending: 'info' }[item.state || item.status] || 'info')
const statusLabel = item => ({ running: '运行中', ready: '正常', error: '异常', attention: '需要关注', pending: '检测中' }[item.state || item.status] || '未知')
</script>

<style lang="less">
html.app-dark-theme .el-dialog.dashboard-status-dialog,
.el-dialog.dashboard-status-dialog {
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 0;
  border: 1px solid var(--border-base);
  border-radius: 12px;
  background: var(--surface-1, var(--bg-primary));
  color: var(--text-primary);
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0, 0, 0, .4);

  .el-dialog__header { flex: 0 0 auto; margin: 0; padding: 24px 56px 20px 24px; border-bottom: 1px solid var(--border-base); }
  .el-dialog__headerbtn { top: 12px; right: 12px; }
  .el-dialog__body { min-height: 0; overflow-y: auto; padding: 20px 24px 24px; }
  .status-dialog-eyebrow { color: var(--el-color-primary); font-size: 12px; }
  .status-dialog-title { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
  .status-dialog-title h2 { margin: 0; font-size: 20px; font-weight: 600; color: var(--text-primary); }
  .status-dialog-heading p { margin: 8px 0 0; color: var(--text-secondary); font-size: 13px; line-height: 1.6; }
  .status-detail-list { display: grid; gap: 12px; }
  .status-detail-card { display: flex; align-items: flex-start; gap: 14px; padding: 18px; border: 1px solid var(--border-base); border-radius: 8px; background: var(--surface-2, var(--el-fill-color-light)); }
  .status-detail-icon { display: grid; place-items: center; flex: 0 0 36px; width: 36px; height: 36px; color: var(--el-color-primary); background: var(--surface-1, var(--bg-primary)); border-radius: 8px; }
  .status-detail-icon svg { width: 22px; height: 22px; }
  .is-running .status-detail-icon, .is-ready .status-detail-icon { color: var(--el-color-success); }
  .is-error .status-detail-icon { color: var(--el-color-danger); }
  .is-attention .status-detail-icon { color: var(--el-color-warning); }
  .status-detail-content { flex: 1; min-width: 0; }
  .status-detail-title { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
  .status-detail-title strong { font-size: 14px; overflow-wrap: anywhere; }
  .status-detail-content p { margin: 8px 0 0; font-size: 13px; line-height: 1.7; color: var(--text-secondary); white-space: pre-wrap; overflow-wrap: anywhere; }
  .status-detail-action { flex-shrink: 0; align-self: center; }
  .status-detail-action .el-icon { margin-left: 4px; }
  @media (max-width: 560px) {
    .status-detail-card { flex-wrap: wrap; padding: 14px; }
    .status-detail-content { flex-basis: calc(100% - 50px); }
    .status-detail-action { margin-left: 50px; }
  }
}
</style>
