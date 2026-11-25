<template>
  <el-dialog
    :model-value="modelValue"
    class="price-check-error-log-dialog"
    width="min(1040px, 92vw)"
    top="6vh"
    title="查价错误记录"
    destroy-on-close
    @update:model-value="value => emit('update:modelValue', value)"
    @open="refresh"
  >
    <div class="error-log-toolbar">
      <el-checkbox
        v-if="entries.length"
        class="error-log-select-all"
        :model-value="allSelected"
        :indeterminate="isIndeterminate"
        @change="toggleSelectAll"
      >全选（{{ selectedEntries.length }}/{{ entries.length }}）</el-checkbox>
      <el-button
        type="primary"
        :disabled="!selectedEntries.length"
        :loading="copying"
        @click="copySelected"
      >导出所选{{ selectedEntries.length ? `（${selectedEntries.length}）` : '' }}</el-button>
      <el-button
        :type="selectedEntries.length ? 'default' : 'primary'"
        :plain="Boolean(selectedEntries.length)"
        :disabled="!snapshot.count"
        :loading="copying"
        @click="copyAll"
      >一键复制全部</el-button>
      <el-button :loading="store.errorLogLoading" @click="refresh">刷新</el-button>
      <span class="error-log-hint">
        本次启动后共 {{ snapshot.count }} 条错误（重复错误已自动去重）。勾选记录可按需导出，复制内容包含物品完整文本、解析结果和查价模型，可直接发给 AI 排查。
      </span>
    </div>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <el-empty v-if="!snapshot.count" description="本次启动后还没有查价报错" />
    <div v-else class="error-log-list">
      <el-collapse v-model="expandedIds">
        <el-collapse-item v-for="entry in entries" :key="entry.id" :name="entry.id">
          <template #title>
            <div class="error-log-title">
              <span class="error-log-checkbox" @click.stop>
                <el-checkbox
                  :model-value="isSelected(entry.id)"
                  :aria-label="`选择错误记录 ${entry.message}`"
                  @change="checked => toggleSelection(entry.id, checked)"
                />
              </span>
              <el-tag type="danger" size="small" effect="plain">{{ entry.stageLabel }}</el-tag>
              <el-tag size="small" effect="plain" type="info">{{ entry.code }}</el-tag>
              <span class="error-log-message">{{ entry.message }}</span>
              <el-tag v-if="entry.repeatCount > 1" size="small" type="warning">×{{ entry.repeatCount }}</el-tag>
              <span class="error-log-meta">{{ formatTime(entry.timestamp) }}</span>
              <el-button
                class="error-log-delete-btn"
                type="danger"
                link
                size="small"
                :loading="deletingId === entry.id"
                :disabled="Boolean(deletingId)"
                @click.stop="removeEntry(entry)"
              >删除</el-button>
            </div>
          </template>
          <div class="error-log-detail">
            <p v-if="entry.itemName">
              <strong>物品：</strong>{{ entry.itemName }}
              <span v-if="itemMeta(entry)" class="muted">（{{ itemMeta(entry) }}）</span>
            </p>
            <p>
              <strong>来源：</strong>{{ sourceLabel(entry.source) }}
              · <strong>联赛：</strong>{{ entry.league || '未设置' }}
              <span v-if="entry.catalog?.gameVersion" class="muted"> · 交易目录 {{ entry.catalog.gameVersion }}</span>
            </p>
            <p v-if="entry.configurationIssueId"><strong>配置项：</strong>{{ entry.configurationIssueId }}</p>
            <p v-if="entry.failureCode"><strong>失败码：</strong>{{ entry.failureCode }}</p>
            <div v-if="expandedIds.includes(entry.id)" class="error-log-payload">
              <h4>物品完整文本</h4>
              <el-input
                :model-value="entry.itemText || '（本次错误没有可用的物品原始文本）'"
                type="textarea"
                :rows="8"
                readonly
              />
              <template v-if="entry.details && Object.keys(entry.details).length">
                <h4>错误详情</h4>
                <pre>{{ formatJson(entry.details) }}</pre>
              </template>
              <template v-if="entry.item">
                <h4>解析后的物品</h4>
                <pre>{{ formatJson(entry.item) }}</pre>
              </template>
              <template v-if="entry.model">
                <h4>查价模型</h4>
                <pre>{{ formatJson(entry.model) }}</pre>
              </template>
              <template v-if="entry.query">
                <h4>官方查询</h4>
                <pre>{{ formatJson(entry.query) }}</pre>
              </template>
              <template v-if="entry.stack">
                <h4>调用栈</h4>
                <pre>{{ entry.stack }}</pre>
              </template>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { electronApi } from '@/api/electron.js'
import { usePriceCheckStore } from '@/stores/priceCheck'
import { formatPriceCheckErrorLog, selectPriceCheckErrorEntries } from './priceCheckErrorReport.js'

defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const SOURCE_LABELS = {
  capture: '自动查价（快捷键捕获）',
  manual: '手动粘贴查价',
  rerun: '重新查询或选择候选'
}

const store = usePriceCheckStore()
const expandedIds = ref([])
const selectedIds = ref([])
const copying = ref(false)
const deletingId = ref('')
const error = ref('')

const snapshot = computed(() => store.errorLog)
const entries = computed(() => [...(snapshot.value?.entries || [])].reverse())
const selectedIdSet = computed(() => new Set(selectedIds.value))
const selectedEntries = computed(() => selectPriceCheckErrorEntries(entries.value, selectedIds.value))
const allSelected = computed(() => entries.value.length > 0 && selectedEntries.value.length === entries.value.length)
const isIndeterminate = computed(() => selectedEntries.value.length > 0 && selectedEntries.value.length < entries.value.length)

watch(entries, nextEntries => {
  const validIds = new Set(nextEntries.map(entry => entry.id))
  if (selectedIds.value.some(id => !validIds.has(id))) {
    selectedIds.value = selectedIds.value.filter(id => validIds.has(id))
  }
  if (expandedIds.value.some(id => !validIds.has(id))) {
    expandedIds.value = expandedIds.value.filter(id => validIds.has(id))
  }
})

function isSelected(id) {
  return selectedIdSet.value.has(id)
}

function toggleSelection(id, checked) {
  if (Boolean(checked)) {
    if (!selectedIdSet.value.has(id)) selectedIds.value = [...selectedIds.value, id]
    return
  }
  selectedIds.value = selectedIds.value.filter(item => item !== id)
}

function toggleSelectAll(checked) {
  selectedIds.value = Boolean(checked) ? entries.value.map(entry => entry.id) : []
}

function sourceLabel(value) {
  return SOURCE_LABELS[value] || '自动查价'
}

function itemMeta(entry) {
  return [entry.itemRarity, entry.itemCategory, entry.itemBaseType].filter(Boolean).join(' · ')
}

function formatJson(value) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function formatTime(value) {
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toLocaleString('zh-CN', { hour12: false }) : String(value || '')
}

async function refresh() {
  error.value = ''
  try {
    await store.refreshErrorLog()
  } catch (reason) {
    error.value = reason?.message || '读取错误记录失败'
  }
}

async function copyEntries(targetEntries, selectedOnly = false) {
  if (!targetEntries.length || copying.value) return
  copying.value = true
  try {
    const report = formatPriceCheckErrorLog({ ...snapshot.value, entries: targetEntries })
    await electronApi.clipboard.writeText(report)
    ElMessage.success(`已复制 ${targetEntries.length} 条${selectedOnly ? '所选' : ''}查价错误记录`)
  } catch (reason) {
    ElMessage.error(reason?.message || '复制错误记录失败')
  } finally {
    copying.value = false
  }
}

async function copySelected() {
  await copyEntries(selectedEntries.value, true)
}

async function copyAll() {
  await copyEntries(entries.value, false)
}

async function removeEntry(entry) {
  if (!entry?.id || deletingId.value) return
  deletingId.value = entry.id
  error.value = ''
  try {
    await store.deleteErrorLogEntry(entry.id)
    selectedIds.value = selectedIds.value.filter(id => id !== entry.id)
    expandedIds.value = expandedIds.value.filter(id => id !== entry.id)
    ElMessage.success('已删除该条错误记录')
  } catch (reason) {
    error.value = reason?.message || '删除错误记录失败'
    ElMessage.error(error.value)
  } finally {
    deletingId.value = ''
  }
}
</script>

<style scoped lang="less">
.error-log-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.error-log-select-all { margin-right: 4px; }
.error-log-hint { color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.6; }
.error-log-list { max-height: 64vh; overflow-y: auto; padding-right: 6px; }
.error-log-title { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; padding-right: 8px; }
.error-log-checkbox { display: inline-flex; align-items: center; flex-shrink: 0; }
.error-log-message { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.error-log-meta { margin-left: auto; flex-shrink: 0; color: var(--el-text-color-secondary); font-size: 12px; }
.error-log-delete-btn { flex-shrink: 0; margin-left: 4px; }
.error-log-detail p { margin: 0 0 8px; font-size: 13px; line-height: 1.7; }
.error-log-payload h4 { margin: 16px 0 6px; font-size: 13px; }
.error-log-payload pre {
  max-height: 280px;
  margin: 0;
  padding: 10px;
  overflow: auto;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
.muted { color: var(--el-text-color-secondary); }
</style>
