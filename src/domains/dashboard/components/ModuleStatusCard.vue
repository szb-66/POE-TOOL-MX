<template>
  <el-card class="module-card" :class="`state-${module.state}`" shadow="never">
    <template #header>
      <div class="card-heading">
        <div class="module-identity">
          <span class="module-icon"><component :is="icon" /></span>
          <div>
            <h3>{{ module.title }}</h3>
            <p>{{ module.description }}</p>
          </div>
        </div>
        <el-tag :type="tagType" effect="light">{{ stateLabel }}</el-tag>
      </div>
    </template>

    <div class="status-line">
      <span class="status-dot" />
      <strong>{{ module.statusText }}</strong>
    </div>

    <div v-if="module.issues.length" class="issues">
      <button v-if="module.issues.length > 1" type="button" class="issues-toggle" @click="showIssues = !showIssues">
        {{ showIssues ? '收起问题' : `查看全部 ${module.issues.length} 项问题` }}
        <el-icon><ArrowDown :class="{ rotated: showIssues }" /></el-icon>
      </button>
      <el-collapse-transition>
        <ul v-if="showIssues && module.issues.length > 1">
          <li v-for="issue in module.issues" :key="issue">{{ issue }}</li>
        </ul>
      </el-collapse-transition>
    </div>

    <div v-if="module.controls?.length" class="quick-controls">
      <label v-for="control in module.controls" :key="control.id" class="quick-control">
        <span>{{ control.label }}</span>
        <el-switch
          v-if="control.type === 'switch'"
          :model-value="control.value"
          :disabled="control.disabled"
          size="small"
          @change="$emit('control', module, control, $event)"
        />
        <el-select
          v-else
          :model-value="control.value"
          :disabled="control.disabled"
          size="small"
          @change="$emit('control', module, control, $event)"
        >
          <el-option
            v-for="option in control.options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </label>
    </div>

    <dl v-if="module.metrics.length" class="metrics">
      <div v-for="metric in module.metrics" :key="metric.label">
        <dt>{{ metric.label }}</dt>
        <dd>{{ metric.value }}</dd>
      </div>
    </dl>

    <div class="card-actions">
      <el-button
        v-for="action in module.actions"
        :key="action.id"
        size="small"
        :type="action.type === 'default' ? undefined : action.type"
        :disabled="action.disabled"
        :loading="module.pending"
        @click="$emit('action', module, action)"
      >
        {{ action.label }}
      </el-button>
      <el-button size="small" text type="primary" @click="$emit('open', module)">
        详细配置
        <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>
  </el-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ArrowDown, ArrowRight } from '@element-plus/icons-vue'

const props = defineProps({
  module: { type: Object, required: true },
  icon: { type: Object, required: true }
})
defineEmits(['action', 'open', 'control'])

const showIssues = ref(false)
const stateLabel = computed(() => ({
  error: '异常',
  running: '运行中',
  attention: '需配置',
  ready: '可用'
})[props.module.state] || '未知')
const tagType = computed(() => ({
  error: 'danger',
  running: 'success',
  attention: 'warning',
  ready: 'info'
})[props.module.state] || 'info')
</script>

<style scoped lang="less">
.module-card {
  position: relative;
  min-height: 260px;
  border: 1px solid var(--border-base);
  border-top: 3px solid var(--el-color-info);
  border-top-width: 2px;
  background: var(--surface-1, var(--bg-primary));
  transition: border-color .18s ease, transform .18s ease;

  &:hover { border-color: #3A434F; transform: translateY(-1px); }
  &.state-error { border-top-color: var(--el-color-danger); }
  &.state-running { border-top-color: var(--el-color-success); }
  &.state-attention { border-top-color: var(--el-color-warning); }
  &.state-ready { border-top-color: var(--el-color-info); }
}

.card-heading,
.module-identity,
.status-line,
.card-actions,
.issues-toggle {
  display: flex;
  align-items: center;
}

.card-heading { justify-content: space-between; gap: 12px; }
.module-identity { min-width: 0; gap: 12px; }
.module-icon {
  display: grid;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  place-items: center;
  color: var(--el-color-info);
  font-size: 21px;
}
h3 { margin: 0 0 3px; font-size: 16px; }
p { margin: 0; color: var(--text-secondary); font-size: 12px; line-height: 1.45; }

.status-line {
  min-height: 42px;
  gap: 9px;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--text-primary);
  font-size: 13px;
}
.status-dot {
  flex: 0 0 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-info);
}
.state-error .status-dot { background: var(--el-color-danger); }
.state-running .status-dot { background: var(--el-color-success); }
.state-attention .status-dot { background: var(--el-color-warning); }

.issues { margin-top: 9px; }
.issues-toggle {
  gap: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--el-color-warning);
  font-size: 12px;
  cursor: pointer;
}
.issues-toggle .el-icon { transition: transform .18s ease; }
.issues-toggle .rotated { transform: rotate(180deg); }
.issues ul {
  margin: 8px 0 0;
  padding: 8px 10px 8px 27px;
  border-radius: 7px;
  background: var(--el-color-warning-light-9);
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.65;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 12px 0;
}
.quick-controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}
.quick-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 9px;
  min-width: 0;
  padding: 7px 9px;
  border: 1px solid var(--border-base);
  border-radius: 7px;
  color: var(--text-secondary);
  font-size: 12px;
}
.quick-control > span { flex: 0 0 auto; white-space: nowrap; }
.quick-control :deep(.el-select) { flex: 1; min-width: 0; }
.metrics div { min-width: 0; padding: 8px 10px; border: 1px solid var(--border-base); border-radius: 7px; }
.metrics dt { color: var(--text-secondary); font-size: 11px; }
.metrics dd { overflow: hidden; margin: 3px 0 0; color: var(--text-primary); font-family: var(--font-numeric); font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }

@media (prefers-reduced-motion: reduce) { .module-card { transform: none !important; } }

.card-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
  margin-top: auto;
  padding-top: 2px;
}
.card-actions :deep(.el-button + .el-button) { margin-left: 0; }

@media (max-width: 560px) {
  .quick-controls { grid-template-columns: 1fr; }
}
</style>
