<template>
  <section class="game-localization">
    <h3>Steam 国际服游戏汉化</h3>
    <p>官方繁体为基础，匹配到的官方简体优先。未匹配内容保留繁体；所有检查、下载和替换都由你手动触发。</p>
    <el-alert v-if="!desktop" title="请在流放助手桌面版中使用游戏汉化" type="info" :closable="false" />
    <el-alert v-if="state.error || error" :title="state.error || error" type="error" :closable="false" />
    <el-alert v-if="state.mappingWarning" :title="state.mappingWarning" type="warning" :closable="false" />
    <el-alert v-if="desktop && !state.helperAvailable" title="游戏资源读写组件尚未就绪，请先完成组件构建与验证。当前不会修改游戏。" type="warning" :closable="false" />
    <el-card>
      <el-form label-position="top">
        <el-form-item label="Steam 游戏安装目录">
          <div class="directory-row"><el-input v-model="gameDirectory" :disabled="busy" placeholder="选择 Steam 库中的 Path of Exile 文件夹" /><el-button :disabled="busy || !desktop" @click="pickDirectory">选择目录</el-button></div>
          <el-select v-if="state.games?.length > 1" v-model="gameDirectory" :disabled="busy" placeholder="选择已检测到的游戏"><el-option v-for="game in state.games" :key="game.gameDirectory" :label="game.gameDirectory" :value="game.gameDirectory" /></el-select>
        </el-form-item>
      </el-form>
      <div class="actions">
        <el-button :disabled="busy || !desktop" @click="run('scan', input())">检测并扫描</el-button>
        <el-button :disabled="busy || !desktop" @click="run('check')">检查资源更新</el-button>
        <el-button :disabled="busy || !state.update" @click="run('download')">下载变化资源</el-button>
        <el-button :disabled="busy || !state.helperAvailable || !gameDirectory" @click="run('preview', input())">预览匹配结果</el-button>
      </div>
      <dl>
        <dt>游戏版本</dt><dd>{{ state.scan?.gameVersion || '尚未扫描' }}<span v-if="state.scan?.buildId">（Steam {{ state.scan.buildId }}）</span></dd>
        <dt>已应用词库</dt><dd>{{ state.resourceVersion || '尚未应用服务器词库' }}</dd>
        <dt>已下载词库</dt><dd>{{ state.readyVersion || '尚未下载' }}</dd>
        <dt>可更新词库</dt><dd>{{ state.update?.releaseId || '尚未检查' }}</dd>
        <dt>本次下载</dt><dd>{{ state.update ? formatBytes(state.update.downloadBytes) + '，' + state.update.missingObjects + ' 个变化块' : '点击检查资源更新后计算' }}</dd>
        <dt>简体 / 繁体 / 英文</dt><dd>{{ counts.simplified ?? '—' }} / {{ counts.traditional ?? '—' }} / {{ counts.english ?? '—' }}</dd>
        <dt>基线状态</dt><dd>{{ state.scan?.baseline?.ready ? '原版基线已验证' : state.scan?.baseline?.reason || '首次应用前须在 Steam 验证游戏文件完整性，再重新扫描' }}</dd>
      </dl>
      <p>首次使用请先退出游戏，在 Steam → 游戏属性 → 已安装文件中验证完整性，避免旧补丁进入基线。游戏更新后需要重新生成；恢复原版仅适用于同一游戏版本。</p>
      <el-checkbox v-model="baselineConfirmed" :disabled="busy">我已完成 Steam 游戏文件完整性验证（组件仍会核对验证记录）</el-checkbox>
      <div class="actions apply-actions">
        <el-button type="primary" :disabled="busy || !state.helperAvailable || !gameDirectory" @click="run('apply', input())">应用汉化</el-button>
        <el-button :disabled="busy || !state.helperAvailable || !gameDirectory" @click="run('restore', input())">恢复原版</el-button>
      </div>
      <p v-if="busy" role="status">{{ phaseLabel }}<span v-if="state.progress?.total">：{{ state.progress.completed }} / {{ state.progress.total }}</span></p>
      <p v-if="state.scan?.applied">汉化已应用，请重新启动游戏。游戏内网页内容不属于本地汉化资源。</p>
    </el-card>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { electronApi } from '../../api/electron.js'

const desktop = Boolean(window.electronAPI)
const state = ref({ supported: false, busy: false, helperAvailable: false })
const error = ref('')
const waiting = ref(false)
const gameDirectory = ref('')
const baselineConfirmed = ref(false)
const busy = computed(() => waiting.value || state.value.busy || state.value.closing)
const counts = computed(() => state.value.preview?.counts || state.value.scan?.counts || {})
const phaseLabel = computed(() => ({ scan: '扫描游戏资源', check: '检查资源更新', download: '下载变化资源', preview: '预览匹配结果', apply: '应用汉化', restore: '恢复原版' })[state.value.phase] || (state.value.closing ? '正在退出或重启' : '正在处理'))
let unsubscribe = null
let disposed = false
function receive(next) {
  if (disposed) return
  const directoryChanged = state.value.gameDirectory !== next.gameDirectory
  state.value = next
  if (next.gameDirectory && (!gameDirectory.value || directoryChanged)) gameDirectory.value = next.gameDirectory
}
function input() { return { gameDirectory: gameDirectory.value, baselineConfirmed: baselineConfirmed.value } }
function formatBytes(value) { const size = Number(value) || 0; return size < 1024 ? `${size} B` : size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / 1024 / 1024).toFixed(2)} MB` }
async function run(operation, payload) {
  waiting.value = true; error.value = ''
  try {
    const response = await electronApi.localization[operation](payload)
    if (!response?.success) throw new Error(response?.error?.message || '汉化操作失败')
    receive(response.data)
  } catch (reason) { if (!disposed) error.value = reason.message }
  finally { if (!disposed) waiting.value = false }
}
async function pickDirectory() {
  try { const response = await electronApi.localization.pickDirectory(); if (!response?.success) throw new Error(response?.error?.message || '无法选择目录'); if (!response.canceled) gameDirectory.value = response.gameDirectory }
  catch (reason) { error.value = reason.message }
}
onMounted(() => { unsubscribe = electronApi.localization.onState(receive); void run('status') })
onBeforeUnmount(() => { disposed = true; unsubscribe?.() })
</script>

<style scoped lang="less">
.game-localization { max-width: 1000px; }
p { color: var(--text-secondary); line-height: 1.7; }
.el-alert { margin: 12px 0; }
.directory-row { display: flex; width: 100%; gap: 12px; }
.actions { display: flex; flex-wrap: wrap; gap: 10px; }
.actions .el-button { margin-left: 0; }
.apply-actions { margin-top: 16px; }
dl { display: grid; grid-template-columns: 140px 1fr; gap: 10px; margin-top: 24px; }
dt { color: var(--text-secondary); }
dd { margin: 0; overflow-wrap: anywhere; }
</style>
