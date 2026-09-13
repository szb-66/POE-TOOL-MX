<template>
  <section class="launcher-panel" aria-labelledby="pob-launcher-heading" :aria-busy="busy">
    <div class="launcher-heading"><h2 id="pob-launcher-heading">PoB 快速启动</h2><span>安装、更新与启动 PoeCharm 中文版</span></div>
    <div class="launcher-actions">
      <el-button v-if="activeOperation === 'install'" type="danger" :disabled="!canStop" @click="stop">{{ stopping ? '正在停止…' : '停止' }}</el-button>
      <el-button v-else type="primary" :disabled="busy || ready || !state.supported" @click="perform('install')">安装</el-button>
      <el-button v-if="activeOperation === 'update'" type="danger" :disabled="!canStop" @click="stop">{{ stopping ? '正在停止…' : '停止' }}</el-button>
      <el-button v-else :disabled="busy || !ready || !state.supported" @click="perform('update')">更新</el-button>
      <el-button type="success" :disabled="busy || !ready || !state.supported" @click="perform('start')">启动</el-button>
    </div>
    <label for="pob-launcher-directory">PoeCharm 目录</label>
    <div class="directory-row">
      <el-input id="pob-launcher-directory" v-model="directory" :disabled="busy || !state.supported" placeholder="请选择本地 PoeCharm 目录，或输入后按回车保存" @keyup.enter="saveDirectory" />
      <el-button v-if="directory.trim() !== state.directory" :disabled="busy || !state.supported" @click="saveDirectory">保存</el-button>
      <el-button :disabled="busy || !state.supported" @click="perform('pickDirectory')">选择目录</el-button>
      <el-button :disabled="busy || !directory || !state.supported" @click="clearDirectory">清空</el-button>
    </div>
    <div class="component-status">
      <span v-for="component in components" :key="component.key">
        {{ component.label }}：<el-tag :type="state[component.key].installed ? 'success' : 'info'" size="small">{{ state[component.key].installed ? '已安装' : '未安装' }}</el-tag>
        <small v-if="state[component.key].installed" :title="state[component.key].version">{{ versionLabel(component.key) }}</small>
      </span>
    </div>
    <p class="hint">首次安装会下载 PoeCharm 和 PoB Portable。清空目录只解除关联，更新前请关闭 PoB。安装和更新需要科学上网，请自备梯子</p>
    <p v-if="!state.supported" class="hint">安装和启动功能需要在 Windows 桌面版中使用。</p>
    <div v-if="busy" class="progress" role="status">
      <p>{{ state.message }}<span v-if="progressDetail"> · {{ progressDetail }}</span></p>
      <el-progress :percentage="state.progress?.percent ?? 35" :indeterminate="state.progress?.percent == null" :show-text="state.progress?.percent != null" />
    </div>
    <p v-if="!busy && state.message && !error" class="status-message" role="status">{{ state.message }}</p>
    <el-alert v-if="state.warning" :title="state.warning" type="warning" show-icon :closable="false" />
    <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
    <el-button v-if="error" class="retry" :disabled="busy" size="small" @click="perform('getState')">重新检测</el-button>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { electronApi } from '@/api/electron'

const api = electronApi.pobLauncher
const state = ref({ directory: '', charm: { installed: false, version: '' }, pob: { installed: false, version: '' }, busy: false, supported: true })
const directory = ref('')
const pending = ref(false)
const requestedOperation = ref('')
const stopPending = ref(false)
const error = ref('')
const busy = computed(() => pending.value || state.value.busy)
const ready = computed(() => state.value.charm.installed && state.value.pob.installed)
const activeOperation = computed(() => state.value.busy && state.value.operation ? state.value.operation : requestedOperation.value)
const stopping = computed(() => stopPending.value || state.value.stopping)
const canStop = computed(() => state.value.busy && state.value.cancellable && !stopping.value)
const progressDetail = computed(() => {
  const progress = state.value.progress
  if (!progress || progress.received == null) return ''
  const format = value => progress.unit === 'files' ? `${value} 个文件` : value < 1024 ? `${value} B` : value < 1024 ** 2 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1024 ** 2).toFixed(1)} MB`
  return progress.total ? `${format(progress.received)} / ${format(progress.total)}` : format(progress.received)
})
const components = [{ key: 'charm', label: 'PoeCharm' }, { key: 'pob', label: 'PoB Portable' }]
let unsubscribe
function apply(snapshot) {
  if (!snapshot || (snapshot.revision != null && snapshot.revision < (state.value.revision ?? -1))) return false
  state.value = snapshot
  error.value = snapshot.error || ''
  if (!snapshot.busy) directory.value = snapshot.directory
  return true
}
function versionLabel(key) {
  const version = state.value[key].version
  return version ? (key === 'charm' ? `提交 ${version.slice(0, 7)}` : version) : '版本未知'
}
async function perform(method, value) {
  if (busy.value) return
  pending.value = true
  requestedOperation.value = ['install', 'update'].includes(method) ? method : ''
  error.value = ''
  let previousOperationId = state.value.operationId
  try {
    // Commit an edited path before using an action, including click-before-blur cases.
    if (['install', 'update', 'start'].includes(method) && directory.value.trim() !== state.value.directory) {
      const saved = await api.setDirectory(directory.value)
      if (saved.state) apply(saved.state)
      if (!saved.success) { error.value = saved.error; return }
    }
    previousOperationId = state.value.operationId
    const result = await api[method](value)
    if (result.state && !apply(result.state)) return
    if (!result.success && !result.cancelled) error.value = result.error || '操作失败，请重试'
  } catch (failure) { await reconcile(failure, method, previousOperationId) }
  finally { pending.value = false; requestedOperation.value = '' }
}
async function reconcile(failure, method, previousOperationId) {
  try {
    const result = await api.getState()
    if (!result?.state) throw failure
    if (!apply(result.state)) return
    if (!result.success && !result.cancelled) error.value = result.error || '状态检测失败，请重试'
    else if (['install', 'update'].includes(method) &&
      (result.state.operation !== method || result.state.operationId === previousOperationId)) {
      error.value = '连接已恢复，但未能确认本次操作，请重新检测后重试'
    }
  } catch {
    error.value = `PoB 启动助手通信失败，请重启助手后重试（${failure?.name || 'IPCError'}）`
  }
}
async function stop() {
  if (!canStop.value) return
  stopPending.value = true
  try {
    const result = await api.stop(state.value.operationId)
    if (result.state && !apply(result.state)) return
    if (!result.success) error.value = result.error
  } catch (failure) { await reconcile(failure) }
  finally { stopPending.value = false }
}
function saveDirectory() { return perform('setDirectory', directory.value) }
function clearDirectory() { directory.value = ''; return saveDirectory() }
onMounted(() => { unsubscribe = api.onState(apply); perform('getState') })
onUnmounted(() => unsubscribe?.())
</script>

<style scoped lang="less">
.launcher-panel { padding: 22px; margin-bottom: 24px; border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-primary); }
.launcher-heading { display: flex; align-items: baseline; flex-wrap: wrap; gap: 12px; margin-bottom: 18px; h2 { margin: 0; font-size: 18px; } span { font-size: 12px; color: var(--text-secondary); } }
.launcher-actions { display: flex; gap: 10px; margin-bottom: 18px; .el-button { margin-left: 0; min-width: 80px; } }
label { display: block; font-size: 13px; margin-bottom: 8px; }
.directory-row { display: flex; gap: 10px; .el-input { flex: 1; min-width: 180px; } .el-button { margin-left: 0; } }
.component-status { display: flex; flex-wrap: wrap; gap: 12px 28px; margin-top: 16px; font-size: 13px; small { margin-left: 8px; color: var(--text-secondary); } }
.hint { margin: 12px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.7; }
.status-message { font-size: 13px; line-height: 1.7; overflow-wrap: anywhere; }
.progress, .el-alert { margin-top: 16px; }
.retry { margin-top: 10px; }
@media (max-width: 680px) { .directory-row { flex-wrap: wrap; .el-input { flex-basis: 100%; } } }
</style>
