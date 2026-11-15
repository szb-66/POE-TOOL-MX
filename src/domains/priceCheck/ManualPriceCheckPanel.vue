<template>
  <div class="manual-price primary-page primary-page__scroll primary-page__content">
    <header class="page-heading"><h2>国际服手动查价</h2><p>粘贴英文或当前汉化资源对应的简体、繁体混合物品文本，查询国际服官网挂单。此入口无需启动游戏，关闭快捷查价后仍可使用。</p></header>
    <el-card>
      <AccountLeagueConfigurationField />
      <p>交易目录：{{ catalog?.counts?.stats || 0 }} 条词缀（{{ catalog?.gameVersion === 'live' ? '官网实时快照' : catalog?.gameVersion || '尚未加载' }}）</p>
      <el-alert v-if="catalog?.warning" :title="catalog.warning" type="warning" :closable="false" />
      <el-form label-position="top">
        <el-form-item label="完整物品文本"><el-input v-model="text" type="textarea" :rows="9" :disabled="busy" placeholder="粘贴包含物品类别和稀有度（或 Item Class / Rarity）的完整物品文本" /></el-form-item>
        <el-form-item label="词缀条件"><el-select v-model="initialSelection" :disabled="busy"><el-option label="自动选择可识别词缀" value="auto" /><el-option label="不附加词缀条件" value="none" /><el-option label="选择全部可识别词缀" value="all" /></el-select></el-form-item>
      </el-form>
      <div class="actions">
        <el-button type="primary" :loading="busy" :disabled="!text.trim() || !account.settings.league || !account.status.authenticated || !catalog?.counts?.stats" @click="search">查询挂单</el-button>
        <el-button :disabled="busy" @click="text = example">填入示例物品</el-button>
        <el-button :loading="busy" @click="refreshCatalog">刷新官方目录</el-button>
        <el-button v-if="result?.result?.queryId" :disabled="busy" @click="openOfficial">打开官网查询</el-button>
      </div>
      <el-alert v-if="error" :title="error" type="error" :closable="false" />
      <el-alert v-if="result && !result.result" :title="result.model?.identityResolution?.message || '物品身份需要进一步确认，请补充完整文本或使用官网查询'" type="warning" :closable="false" />
      <el-form v-if="result?.model?.identityResolution?.required" label-position="top">
        <el-form-item label="选择未鉴定传奇的实际名称">
          <div class="actions identity-candidates">
            <el-button v-for="candidate in result.model.identityResolution.candidates" :key="candidate.key" :disabled="busy" @click="resolveIdentity(candidate.key)">{{ gameText(candidate.name) }}{{ candidate.legacy ? `（${gameText('遗产')}）` : '' }}</el-button>
          </div>
        </el-form-item>
      </el-form>
      <el-alert v-if="result?.model?.unknownStats?.length" :title="`${result.model.unknownStats.length} 条词缀尚未唯一识别，请更新资源或补充完整文本后重新查询`" type="warning" :closable="false" />
      <template v-if="result?.result">
        <p>官方匹配 {{ result.result.total }} 条；当前显示 {{ result.result.listings.length }} 条去重挂单。结果不是实际成交价。</p>
        <el-table :data="result.result.listings" empty-text="没有符合条件的公开挂单">
          <el-table-column prop="amount" label="价格" width="100" /><el-table-column label="通货"><template #default="{ row }">{{ gameText(row.currencyLabel || row.currency) }}</template></el-table-column>
          <el-table-column prop="seller" label="卖家" /><el-table-column label="联系"><template #default="{ row }"><el-button :disabled="!row.whisper" link @click="copyWhisper(row.whisper)">复制私聊</el-button></template></el-table-column>
        </el-table>
        <el-button :loading="busy" :disabled="!result.remainingResultIds?.length" @click="loadMore">加载更多</el-button>
      </template>
    </el-card>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import AccountLeagueConfigurationField from '@/components/configuration/AccountLeagueConfigurationField.vue'
import { usePoeAccountStore } from '@/stores/poeAccount.js'
import { electronApi } from '@/api/electron.js'
const account = usePoeAccountStore()
const example = 'Item Class: Rings\nRarity: Normal\nCoral Ring\n--------\nItem Level: 80'
const text = ref('')
const initialSelection = ref('auto')
const busy = ref(false)
const error = ref('')
const result = ref(null)
const gameText = value => result.value?.model?.presentation?.texts?.[value] || value
const catalog = ref(null)
let disposed = false
let generation = 0
let statusGeneration = 0
let unsubscribe = null
watch(() => [account.status.authenticated, account.status.accountName, account.settings.league, text.value, initialSelection.value], () => {
  generation++; busy.value = false; result.value = null; error.value = ''
  void electronApi.priceCheck.closeOverlay().catch(() => {})
})
async function readStatus() {
  const request = ++statusGeneration
  try { const response = await electronApi.priceCheck.getStatus(); if (!disposed && request === statusGeneration && response?.success) applyCatalog({ ...response.data.catalog, localizationRevision: response.data.localizationRevision }) } catch { /* 查询失败由显式查询操作报告 */ }
}
function applyCatalog(next) {
  if (!Object.hasOwn(next, 'localizationRevision')) next = { ...next, localizationRevision: catalog.value?.localizationRevision }
  statusGeneration++
  if (catalog.value && (next.generatedAt !== catalog.value.generatedAt || next.localizationRevision !== catalog.value.localizationRevision)) {
    generation++; busy.value = false; result.value = null; error.value = ''
  }
  catalog.value = next
}
onMounted(() => { void readStatus(); unsubscribe = electronApi.priceCheck.onCatalogUpdated?.(readStatus) })
async function run(operation) {
  if (busy.value) return
  const requestGeneration = ++generation
  busy.value = true; error.value = ''
  try {
    const response = await operation(() => !disposed && requestGeneration === generation)
    if (!response?.success) throw new Error(response?.error?.message || '查询失败')
    if (!disposed && requestGeneration === generation) return response.data
  } catch (reason) { if (!disposed && requestGeneration === generation) error.value = reason.message }
  finally { if (requestGeneration === generation) busy.value = false }
}
async function search() {
  if (busy.value) return
  result.value = null
  const pending = run(() => electronApi.priceCheck.checkText({ text: text.value, league: account.settings.league, options: { initialSelection: initialSelection.value } }))
  const queryGeneration = generation
  const next = await pending
  if (!disposed && queryGeneration === generation) result.value = next
}
async function resolveIdentity(candidateKey) {
  if (busy.value || !result.value?.model?.identityResolution?.required) return
  const pending = run(async isCurrent => {
    const selected = await electronApi.priceCheck.resolveIdentity(candidateKey)
    if (isCurrent() && selected?.success && selected.data?.model?.identityResolution?.required === false && !selected.data.result) {
      return electronApi.priceCheck.rerun({ league: selected.data.league, options: selected.data.options || {} })
    }
    return selected
  })
  const selectionGeneration = generation
  const next = await pending
  if (!disposed && selectionGeneration === generation && next) result.value = next
}
async function refreshCatalog() { const next = await run(() => electronApi.priceCheck.retryCatalog()); if (next) applyCatalog(next); else await readStatus() }
async function loadMore() { const next = await run(() => electronApi.priceCheck.loadMore()); if (next) result.value = next }
async function openOfficial() { await run(() => electronApi.priceCheck.openOfficial()) }
async function copyWhisper(value) { try { await electronApi.clipboard.writeText(value); ElMessage.success('私聊文本已复制') } catch { ElMessage.error('复制失败') } }
onBeforeUnmount(() => { disposed = true; generation++; unsubscribe?.(); void electronApi.priceCheck.closeOverlay().catch(() => {}) })
</script>

<style scoped lang="less">
.actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.actions :deep(.el-button + .el-button) { margin-left: 0; }
.el-alert { margin-top: 12px; }
.identity-candidates { margin-top: 12px; }
p { color: var(--text-secondary); }
</style>
