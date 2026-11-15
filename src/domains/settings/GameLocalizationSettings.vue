<template>
  <section class="game-localization">
    <h3>Steam 国际服游戏汉化</h3>
    <p>退出游戏后，点击“切简体”自动检测版本、更新所需资源并应用；点击“切繁体”直接使用游戏自带的官方繁体资源，无需联网。</p>
    <el-alert v-if="!desktop" title="请在流放助手桌面版中使用游戏汉化" type="info" :closable="false" />
    <el-alert v-if="state.error || error" :title="state.error || error" type="error" :closable="false" />
    <el-alert v-if="state.mappingWarning" :title="state.mappingWarning" type="warning" :closable="false" />
    <el-alert v-if="desktop && !state.helperAvailable" title="未找到游戏资源读写组件，请重启助手；仍不可用时请重新安装完整桌面版。" type="warning" :closable="false" />
    <el-card>
      <el-form label-position="top">
        <el-form-item label="Steam 游戏安装目录">
          <div class="directory-row"><el-input v-model="gameDirectory" :disabled="busy" placeholder="留空自动检测，或选择 Steam 库中的 Path of Exile 文件夹" /><el-button :disabled="busy || !desktop" @click="pickDirectory">选择目录</el-button></div>
          <el-select v-if="state.games?.length > 1" v-model="gameDirectory" :disabled="busy" placeholder="选择已检测到的游戏"><el-option v-for="game in state.games" :key="game.gameDirectory" :label="game.gameDirectory" :value="game.gameDirectory" /></el-select>
        </el-form-item>
      </el-form>
      <div class="actions">
        <el-button type="primary" :loading="busy && targetMode === 'simplified'" :disabled="busy || !desktop || !state.helperAvailable" @click="run('apply', input('simplified'))">切简体</el-button>
        <el-button :loading="busy && targetMode === 'traditional'" :disabled="busy || !desktop || !state.helperAvailable" @click="run('apply', input('traditional'))">切繁体</el-button>
        <el-button :loading="busy && !targetMode && (state.phase === 'restore' || pendingOperation === 'restore')" :disabled="busy || !desktop || !state.helperAvailable || !gameDirectory" @click="run('restore', input())">恢复原版</el-button>
      </div>
      <div class="market-translation-row">
        <span>市集翻译</span>
        <el-switch :model-value="marketState.autoEnabled" :disabled="busy || marketBusy || !desktop || marketState.closing" :loading="marketWaiting" aria-label="市集翻译" @change="value => runMarket(value ? 'enable' : 'disable')" />
      </div>
      <p v-if="marketNotice" class="market-notice" role="status" aria-live="polite">{{ marketNotice }}</p>
      <p v-if="busy" role="status" aria-live="polite">{{ phaseLabel }}<span v-if="state.progress?.total">：{{ state.progress.completed }} / {{ state.progress.total }}</span></p>
      <el-alert v-else-if="applied && state.mappingState !== 'unavailable' && !state.error && !error" :title="appliedMode === 'traditional' ? '已切换繁体，可以启动游戏。' : '已切换简体，可以启动游戏。'" type="success" :closable="false" />
      <dl>
        <dt>游戏版本</dt><dd>{{ state.scan?.gameVersion || '点击切换按钮后自动检测' }}</dd>
        <dt>汉化状态</dt><dd>{{ localizationStatus }}</dd>
        <template v-if="applied && appliedMode === 'simplified' && counts.simplified != null">
          <dt>简体 / 繁体 / 英文</dt><dd>{{ counts.simplified }} / {{ counts.traditional ?? 0 }} / {{ counts.english ?? 0 }}</dd>
        </template>
      </dl>
      <p>助手会自动备份应用前的文件。游戏更新后，再点击所需的语言按钮即可。简体模式中未匹配的内容保留繁体或英文。</p>
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
const pendingMode = ref(null)
const pendingOperation = ref('')
const gameDirectory = ref('')
const marketState = ref({ state: 'disabled', autoEnabled: false, enabled: false, busy: false, helperAvailable: false })
const marketWaiting = ref(false)
const marketError = ref('')
const marketBusy = computed(() => marketWaiting.value || marketState.value.busy)
const marketNotice = computed(() => marketError.value || (marketState.value.state === 'error' || (marketState.value.restartRequired && marketState.value.state !== 'active') ? marketState.value.reason || '重启游戏后生效' : ''))
const busy = computed(() => waiting.value || state.value.busy || state.value.closing)
const targetMode = computed(() => state.value.targetMode || pendingMode.value)
const applied = computed(() => Boolean(state.value.mode || state.value.resourceVersion || state.value.scan?.applied))
const appliedMode = computed(() => state.value.mode || state.value.scan?.mode || 'simplified')
const counts = computed(() => state.value.scan?.counts || {})
const localizationStatus = computed(() => state.value.mappingState === 'unavailable' ? '需要重新切换语言' : applied.value ? appliedMode.value === 'traditional' ? '已切换繁体' : '已切换简体' : state.value.scan ? '尚未切换' : '等待检测')
const phaseLabel = computed(() => ({ scan: '正在检测游戏版本', check: '正在检查汉化资源更新', download: '正在下载汉化资源', apply: targetMode.value === 'traditional' ? '正在切换繁体' : '正在切换简体', restore: '正在恢复原版' })[state.value.phase] || (state.value.closing ? '正在退出或重启' : '正在准备'))
let unsubscribe = null
let unsubscribeMarket = null
let disposed = false
function receive(next) {
  if (disposed) return
  const directoryChanged = state.value.gameDirectory !== next.gameDirectory
  state.value = next
  if (next.gameDirectory && (!gameDirectory.value || directoryChanged)) gameDirectory.value = next.gameDirectory
}
function input(mode) { return { gameDirectory: gameDirectory.value, ...(mode ? { mode } : {}) } }
async function run(operation, payload) {
  if (busy.value) return
  waiting.value = true; error.value = ''; pendingMode.value = payload?.mode || null; pendingOperation.value = operation
  try {
    const response = await electronApi.localization[operation](payload)
    if (!response?.success) throw new Error(response?.error?.message || '汉化操作失败')
    receive(response.data)
  } catch (reason) { if (!disposed) error.value = reason.message }
  finally { if (!disposed) { waiting.value = false; pendingMode.value = null; pendingOperation.value = '' } }
}
async function pickDirectory() {
  try { const response = await electronApi.localization.pickDirectory(); if (!response?.success) throw new Error(response?.error?.message || '无法选择目录'); if (!response.canceled) gameDirectory.value = response.gameDirectory }
  catch (reason) { error.value = reason.message }
}
function receiveMarket(next) { if (!disposed) marketState.value = next }
async function runMarket(operation) {
  if (marketWaiting.value || (operation === 'enable' && (marketState.value.autoEnabled || busy.value))) return
  marketWaiting.value = true; marketError.value = ''
  try {
    const response = await electronApi.marketLocalization[operation]()
    if (!response?.success) throw new Error(response?.error?.message || '市集翻译操作失败')
    receiveMarket(response.data)
  } catch (reason) { if (!disposed) marketError.value = reason.message }
  finally { if (!disposed) marketWaiting.value = false }
}
onMounted(() => {
  unsubscribe = electronApi.localization.onState(receive); void run('status')
  if (electronApi.marketLocalization) {
    unsubscribeMarket = electronApi.marketLocalization.onState(receiveMarket)
    void runMarket('status')
  }
})
onBeforeUnmount(() => { disposed = true; unsubscribe?.(); unsubscribeMarket?.() })
</script>

<style scoped lang="less">
.game-localization { max-width: 1000px; }
p { color: var(--text-secondary); line-height: 1.7; }
.el-alert { margin: 12px 0; }
.directory-row { display: flex; width: 100%; gap: 12px; }
.actions { display: flex; flex-wrap: wrap; gap: 10px; }
.actions .el-button { margin-left: 0; }
.market-translation-row { display: flex; align-items: center; gap: 16px; margin-top: 20px; }
.market-notice { margin: 4px 0 0; font-size: 13px; }
dl { display: grid; grid-template-columns: 140px 1fr; gap: 10px; margin-top: 24px; }
dt { color: var(--text-secondary); }
dd { margin: 0; overflow-wrap: anywhere; }
</style>
