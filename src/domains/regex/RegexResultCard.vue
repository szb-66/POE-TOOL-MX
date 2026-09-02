<template>
  <el-card class="result-card">
    <template #header>
      <div class="result-header">
        <span>{{ title }}</span>
        <el-tag :type="result.overLimit ? 'danger' : 'info'">{{ result.length }} / 250</el-tag>
      </div>
    </template>
    <div class="selection-summary">
      <span>已选 <strong>{{ result.includeCount }}</strong> 项</span>
      <span>排除 <strong>{{ result.excludeCount }}</strong> 项</span>
    </div>
    <el-input :model-value="result.regex" type="textarea" :rows="10" readonly resize="none" placeholder="选择条件后将在这里生成正则" />
    <div v-if="result.warnings.length" class="warnings">
      <el-alert v-for="warning in result.warnings" :key="warning" :title="warning" type="warning" :closable="false" show-icon />
    </div>
    <el-button type="primary" :icon="CopyDocument" :disabled="!result.regex" class="full-button" @click="$emit('copy')">复制正则</el-button>
    <el-button :icon="RefreshLeft" class="full-button reset-button" @click="$emit('reset')">重置条件</el-button>
  </el-card>
</template>

<script setup>
import { CopyDocument, RefreshLeft } from '@element-plus/icons-vue'
defineProps({ title: { type: String, required: true }, result: { type: Object, required: true } })
defineEmits(['copy', 'reset'])
</script>

<style scoped lang="less">
.result-card { border: 1px solid var(--border-base); box-shadow: none; }
.result-header, .selection-summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.selection-summary { margin-bottom: 14px; color: var(--text-secondary); font-size: 13px; }
.selection-summary strong { color: var(--text-primary); }
.warnings { display: grid; gap: 8px; margin-top: 12px; }
.full-button { width: 100%; margin: 14px 0 0; }
.reset-button { margin-left: 0; }
</style>
