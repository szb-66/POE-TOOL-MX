<template>
  <div class="overlay-shell">
    <header class="topbar">
      <button class="icon-button" title="显示或隐藏查询设置" @click="settingsCollapsed = !settingsCollapsed">⚙</button>
      <div class="dc-rate">{{ dcRateText }}</div>
      <div class="shortcut">Ctrl+D</div>
      <button class="close-button" aria-label="关闭" @click="close">×</button>
    </header>

    <main v-if="state" class="content">
      <section v-if="!settingsCollapsed" class="panel settings-grid">
        <label>在线状态
          <select v-model="queryOptions.status" @change="syncSetting('status')">
            <option value="available">在线可交易</option>
            <option value="instant">即时购买</option>
            <option value="any">包含离线</option>
          </select>
        </label>
        <label>挂单时间
          <select v-model="queryOptions.listed" @change="syncSetting('listed')">
            <option value="any">所有时间</option>
            <option value="1day">1 天内</option>
            <option value="3days">3 天内</option>
            <option value="1week">1 周内</option>
            <option value="2weeks">2 周内</option>
            <option value="1month">1 月内</option>
            <option value="2months">2 月内</option>
          </select>
        </label>
        <label>通货
          <select v-model="queryOptions.currency" @change="syncSetting('currency')">
            <option value="any">任意通货</option>
            <option value="chaos">混沌石</option>
            <option value="divine">神圣石</option>
            <option value="chaos_divine">混沌或神圣</option>
          </select>
        </label>
        <label>词缀初选
          <select v-model="queryOptions.initialSelection" @change="syncSetting('initialSelection')">
            <option value="auto">自动</option>
            <option value="all">全部</option>
            <option value="none">无</option>
          </select>
        </label>
        <label>手动 DC
          <input v-model.number="queryOptions.manualDcRate" class="setting-number" type="number" min="0" @change="syncSetting('manualDcRate')" />
        </label>
        <label class="check-label"><input v-model="queryOptions.collapseListings" type="checkbox" @change="syncSetting('collapseListings')" /> 合并重复挂单</label>
      </section>

      <section v-if="state.model" class="panel identity">
        <div class="identity-main">
          <div
            v-if="state.model.identity?.name"
            class="identity-name filter-row"
            :class="{ enabled: nameFilterEnabled, disabled: !canToggleName }"
            role="checkbox"
            :aria-checked="nameFilterEnabled"
            :aria-disabled="!canToggleName"
            tabindex="0"
            :title="canToggleName ? '选中或取消具体物品名称' : '无法识别物品大类，必须保留具体名称'"
            @click="toggleNameFilter"
            @keydown.enter.prevent="toggleNameFilter"
            @keydown.space.prevent="toggleNameFilter"
          >
            <strong>{{ state.model.identity.name }}</strong>
            <small v-if="!canToggleName">大类不可用，名称必须保留</small>
          </div>
          <strong v-else class="identity-static-name">{{ state.model.identity?.displayName || state.model.item.name || state.model.item.baseType }}</strong>
          <span class="identity-meta">
            {{ state.model.item.rarity }} · {{ state.model.identity?.categoryLabel || state.model.item.category || '未知大类' }} · {{ state.model.item.baseType }} · {{ state.league }}
          </span>
        </div>
        <div class="identity-side">
          <div class="flags">
            <span v-for="flag in activeFlags" :key="flag">{{ flag }}</span>
          </div>
          <div v-if="state.status === 'ready-to-query'" class="identity-hint">物品已读取，请确认条件后点击“搜索”</div>
        </div>
      </section>

      <div v-if="state.status === 'loading'" class="state-message">正在查询官方挂单…</div>
      <div v-else-if="state.status === 'error'" class="state-message error">{{ stateErrorText }}</div>
      <div v-if="rateLimitText" class="warning rate-limit-warning">{{ rateLimitText }}</div>

      <section v-if="state.status === 'identity-required'" class="panel identity-resolver">
        <h3>请选择未鉴定传奇</h3>
        <p>{{ state.model.identityResolution?.baseType }} 可能对应以下物品：</p>
        <button
          v-for="candidate in state.model.identityResolution?.candidates || []"
          :key="candidate.key"
          class="candidate"
          :disabled="busy"
          @click="resolveIdentity(candidate.key)"
        >
          <img :src="candidate.imageUrl" :alt="candidate.name" @error="useCandidatePlaceholder">
          <span class="candidate-label">
            <span class="candidate-title">
              <strong>{{ candidate.name }}</strong>
              <span v-if="candidate.legacy" class="legacy-tag">遗产</span>
            </span>
            <small>{{ candidate.baseType }}</small>
          </span>
        </button>
      </section>

      <template v-if="state.model && !filtersCollapsed">
        <section class="panel state-filter-panel">
          <div class="panel-heading">
            <h3>状态过滤</h3>
            <button
              class="panel-toggle"
              type="button"
              :aria-expanded="!stateFiltersCollapsed"
              aria-controls="price-check-state-filters"
              @click="stateFiltersCollapsed = !stateFiltersCollapsed"
            >{{ stateFiltersCollapsed ? '展开' : '折叠' }}</button>
          </div>
          <div v-if="!stateFiltersCollapsed" id="price-check-state-filters" class="state-filter-grid">
            <label v-for="definition in stateDefinitions" :key="definition.key">
              <span>{{ definition.label }}</span>
              <select v-model="state.model.stateFilters[definition.key]">
                <option value="any">任意</option>
                <option value="true">是</option>
                <option value="false">否</option>
              </select>
            </label>
          </div>
        </section>

        <section v-if="state.model.properties?.length" class="panel filter-list">
          <h3>物品属性</h3>
          <div class="property-grid">
            <div
              v-for="property in state.model.properties"
              :key="property.id"
              class="filter-row property-row"
              :class="{ enabled: property.enabled }"
              role="checkbox"
              :aria-checked="property.enabled"
              tabindex="0"
              @click="toggleFilter(property)"
              @keydown.enter.prevent="toggleFilter(property)"
              @keydown.space.prevent="toggleFilter(property)"
            >
              <span class="filter-name" :title="property.label">{{ property.label }}</span>
              <template v-if="property.options?.length">
                <select v-model="property.value" class="property-option" @click.stop @keydown.stop>
                  <option v-for="option in property.options" :key="option.id" :value="option.id">{{ option.label }}</option>
                </select>
              </template>
              <template v-else>
                <input v-model.number="property.min" class="number" type="number" :min="property.label === '佣兵等级' ? 1 : undefined" :max="property.label === '佣兵等级' ? 100 : undefined" placeholder="最小" @click.stop @keydown.stop />
                <input v-model.number="property.max" class="number" type="number" :min="property.label === '佣兵等级' ? 1 : undefined" :max="property.label === '佣兵等级' ? 100 : undefined" placeholder="最大" @click.stop @keydown.stop />
              </template>
            </div>
          </div>
        </section>

        <section v-if="state.model.mercenarySkillGroups?.length" class="panel mercenary-panel">
          <h3>技能组</h3>
          <div
            v-for="group in state.model.mercenarySkillGroups"
            :key="group.key"
            class="mercenary-group"
            :class="{ enabled: group.enabled }"
          >
            <div
              class="mercenary-skill"
              role="checkbox"
              :aria-checked="group.enabled"
              tabindex="0"
              @click="toggleMercenaryGroup(group)"
              @keydown.enter.prevent="toggleMercenaryGroup(group)"
              @keydown.space.prevent="toggleMercenaryGroup(group)"
            >
              <span class="mercenary-label">技能组</span>
              <strong>{{ group.skill.text }}</strong>
            </div>
            <div v-if="group.supports?.length" class="mercenary-supports">
              <button
                v-for="support in group.supports"
                :key="support.key"
                type="button"
                class="mercenary-support"
                :class="{ enabled: support.enabled }"
                :aria-pressed="support.enabled"
                @click="toggleMercenarySupport(group, support)"
              >{{ support.name }}<small v-if="support.tier">（等阶 {{ support.tier }}）</small></button>
            </div>
            <small v-else class="mercenary-empty">此主动技能没有辅助技能</small>
          </div>
        </section>

        <section v-if="state.model.information?.length" class="panel information-panel">
          <h3>仅供参考</h3>
          <div class="information-grid">
            <span v-for="entry in state.model.information" :key="entry.id">
              {{ entry.label }}：{{ entry.value }}{{ entry.suffix }}
            </span>
          </div>
          <small>官方过滤目录没有对应字段，不会写入查询。</small>
        </section>

        <section v-if="state.model.stats?.length || state.model.unknownStats?.length" class="panel filter-list">
          <h3>词缀</h3>
          <div
            v-for="stat in state.model.stats"
            :key="stat.key"
            class="filter-row stat-row"
            :class="{ enabled: stat.enabled }"
            role="checkbox"
            :aria-checked="stat.enabled"
            tabindex="0"
            @click="toggleFilter(stat)"
            @keydown.enter.prevent="toggleFilter(stat)"
            @keydown.space.prevent="toggleFilter(stat)"
          >
            <span class="stat-source" :class="statTypeClass(stat.type)">{{ typeLabel(stat.type) }}</span>
            <span class="tier" :class="{ known: stat.tier }">{{ stat.tier ? `T${stat.tier}` : '—' }}</span>
            <span class="filter-name">
              {{ stat.text }}
              <small v-if="stat.tags?.length">{{ stat.tags.join('、') }}</small>
            </span>
            <input v-model.number="stat.min" class="number" type="number" min="0" placeholder="最小" @click.stop @keydown.stop />
            <input v-model.number="stat.max" class="number" type="number" min="0" placeholder="最大" @click.stop @keydown.stop />
          </div>
          <div v-for="unknown in state.model.unknownStats || []" :key="unknown.key || `${unknown.type}:${unknown.text}`" class="unknown-block">
            <div class="filter-row unknown">
              <span class="stat-source" :class="statTypeClass(unknown.type)">{{ typeLabel(unknown.type) }}</span>
              <span class="tier">T{{ unknown.tier || '?' }}</span>
              <span class="filter-name">{{ unknown.text }}<small>未加入本次查询 · {{ unknown.reason }}</small></span>
              <span></span><span></span>
            </div>
            <div v-if="unknown.candidates?.length" class="stat-candidates">
              <button
                v-for="candidate in unknown.candidates"
                :key="candidate.id"
                :disabled="busy"
                :title="candidate.id"
                @click="selectStatCandidate(unknown, candidate)"
              >使用 {{ candidate.label }}</button>
            </div>
          </div>
        </section>
      </template>

      <section class="action-row">
        <button class="search" :disabled="busy || !state.model || state.status === 'identity-required'" @click="rerun">搜索</button>
        <button @click="filtersCollapsed = !filtersCollapsed">{{ filtersCollapsed ? '展开过滤器' : '折叠过滤器' }}</button>
        <button class="market" :disabled="state.status !== 'ready'" @click="openOfficial">网页市集</button>
      </section>

      <section v-if="state.result" class="results">
        <div class="result-heading">
          <strong>共找到 {{ state.result.total }} 个物品</strong>
          <small>已展示 {{ state.result.listings?.length || 0 }} / 最多 50 条</small>
        </div>
        <div class="result-tabs">
          <button :class="{ active: resultView === 'list' }" @click="resultView = 'list'">挂单</button>
          <button :class="{ active: resultView === 'distribution' }" @click="showDistribution">价格分布</button>
        </div>
        <template v-if="resultView === 'list'">
          <div class="listing-head">
            <span>价格</span><span>物等</span><span>状态</span><span>时间</span><span>卖家</span><span></span>
          </div>
          <div v-for="listing in state.result.listings || []" :key="listing.id" class="listing">
            <strong>{{ listing.amount || '—' }} {{ currencyLabel(listing.currency, listing.currencyLabel) }}</strong>
            <span>{{ listing.itemLevel || '—' }}</span>
            <span :class="{ instant: listing.instantBuyout }">{{ statusLabel(listing) }}</span>
            <span>{{ relativeTime(listing.indexed) }}</span>
            <span class="seller">{{ listing.seller || '未知' }}</span>
            <button v-if="listing.whisper" class="copy" title="复制私聊文本" @click="copyWhisper(listing.whisper)">复制</button>
          </div>
          <button
            v-if="(state.result.listings?.length || 0) < Math.min(50, state.result.total || 0)"
            class="load-more"
            :disabled="busy"
            @click="loadMore"
          >加载更多</button>
        </template>
        <template v-else>
          <div class="distribution-summary">
            已分析 {{ state.result.distribution?.usable || 0 }} 个有效卖家样本
            · 已抓取 {{ state.result.distribution?.fetched || 0 }} / {{ state.result.distribution?.target || 100 }}
            <span v-if="distributionLoading"> · 加载中…</span>
          </div>
          <div
            v-for="group in state.result.distribution?.groups || []"
            :key="group.key"
            class="distribution-row"
            :class="{ highest: group.highest }"
          >
            <div class="distribution-label">
              <strong>{{ distributionPrice(group) }}</strong>
              <span>{{ group.count }} 条 · {{ group.percent }}%</span>
              <small v-if="group.divineCount || group.chaosCount">D {{ group.divineCount }} / C {{ group.chaosCount }}</small>
            </div>
            <div class="distribution-track"><span :style="{ width: `${Math.max(group.percent, 1)}%` }"></span></div>
          </div>
          <p class="distribution-note">{{ state.result.distribution?.disclaimer }}</p>
        </template>
      </section>

      <div v-if="state.catalog?.warning" class="warning catalog-warning">
        <span>{{ state.catalog.warning }}</span>
        <button v-if="state.catalog.degraded && !state.catalog.loading" :disabled="busy" @click="retryCatalog">重试目录</button>
      </div>
      <div v-if="state.catalog" class="catalog-status">
        目录：{{ state.catalog.provider === 'official' ? '腾讯官方' : '内置' }}
        · {{ state.catalog.gameVersion || '未知版本' }}
        · {{ state.catalog.counts?.stats || 0 }} 条词缀
      </div>
      <div class="disclaimer">挂单参考，不代表成交价</div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { electronApi } from '@/api/electron'
import { PRICE_CHECK_STATE_FILTERS, PRICE_CHECK_STAT_TYPES } from '../../../shared/priceCheckMetadata.js'

const state = ref(null)
const busy = ref(false)
const filtersCollapsed = ref(false)
const stateFiltersCollapsed = ref(true)
const settingsCollapsed = ref(true)
const resultView = ref('list')
const distributionLoading = ref(false)
const queryOptions = reactive({
  status: 'available',
  listed: 'any',
  currency: 'any',
  collapseListings: false,
  initialSelection: 'auto',
  manualDcRate: 0
})
let removeListener
let removeSettingsListener
let settingsRevision = 0

const stateDefinitions = PRICE_CHECK_STATE_FILTERS
const activeFlags = computed(() => stateDefinitions
  .filter(({ key }) => key !== 'identified' && state.value?.model?.facts?.[key])
  .map(({ label }) => label))
const nameFilterEnabled = computed(() => {
  const identity = state.value?.model?.identity
  return !identity?.category || identity.nameEnabled !== false
})
const canToggleName = computed(() => Boolean(
  state.value?.model?.identity?.name && state.value?.model?.identity?.category
))
const dcRateText = computed(() => {
  const rate = Number(state.value?.dcRate?.value)
  if (!(rate > 0)) return 'DC 暂不可用'
  const source = ({ 'poecurrency.top': '第三方', manual: '手动' })[state.value.dcRate.source] || '缓存'
  return `1D ≈ ${rate}C · ${source}`
})
function formatRateLimit(error) {
  if (!error) return ''
  const retryAfter = Number(error.details?.retryAfter)
  return Number.isFinite(retryAfter)
    ? `官方接口限制请求频率，请在 ${Math.max(0, Math.ceil(retryAfter))} 秒后重试`
    : '官方接口限制请求频率，但未提供恢复时间'
}
const stateErrorText = computed(() => state.value?.error?.code === 'RATE_LIMITED'
  ? formatRateLimit(state.value.error)
  : state.value?.error?.message || '')
const rateLimitText = computed(() => formatRateLimit(state.value?.rateLimit))

watch(() => state.value?.options, (options) => {
  if (options) Object.assign(queryOptions, options)
}, { immediate: true })

async function syncSetting(key) {
  const response = await electronApi.priceCheck.updateSettings({ [key]: queryOptions[key] })
  if (response?.success && response.data?.settingsRevision) settingsRevision = response.data.settingsRevision
}

async function load() {
  const response = await electronApi.priceCheck.getOverlayState()
  if (response?.success) state.value = response.data
}
async function rerun() {
  if (!state.value?.model || !state.value?.league) return
  busy.value = true
  try {
    await electronApi.priceCheck.rerun({
      league: state.value.league,
      model: state.value.model,
      options: { ...queryOptions }
    })
  } finally { busy.value = false }
}
async function loadMore() {
  busy.value = true
  try { await electronApi.priceCheck.loadMore() } finally { busy.value = false }
}
async function retryCatalog() {
  busy.value = true
  try {
    const response = await electronApi.priceCheck.retryCatalog()
    if (response?.success && state.value) state.value.catalog = response.data
  } finally { busy.value = false }
}
async function showDistribution() {
  resultView.value = 'distribution'
  if (state.value?.result?.distribution?.complete || distributionLoading.value) return
  distributionLoading.value = true
  try { await electronApi.priceCheck.loadDistribution() } finally { distributionLoading.value = false }
}
async function resolveIdentity(candidateKey) {
  busy.value = true
  try { await electronApi.priceCheck.resolveIdentity(candidateKey) } finally { busy.value = false }
}
async function selectStatCandidate(unknown, candidate) {
  busy.value = true
  try { await electronApi.priceCheck.resolveStatCandidate(unknown.key, candidate.id) } finally { busy.value = false }
}
function useCandidatePlaceholder(event) {
  const placeholder = 'price-check-image://snapshot/placeholder'
  if (event.currentTarget.src !== placeholder) event.currentTarget.src = placeholder
}
function close() { void electronApi.priceCheck.closeOverlay() }
function openOfficial() {
  void electronApi.priceCheck.openOfficial()
}
function copyWhisper(text) { void electronApi.clipboard.writeText(text) }
function toggleFilter(filter) { filter.enabled = !filter.enabled }
function toggleMercenaryGroup(group) { group.enabled = !group.enabled }
function toggleMercenarySupport(group, support) {
  support.enabled = !support.enabled
  if (support.enabled) group.enabled = true
}
function toggleNameFilter() {
  const identity = state.value?.model?.identity
  if (!identity?.name) return
  if (!canToggleName.value) {
    identity.nameEnabled = true
    return
  }
  identity.nameEnabled = !nameFilterEnabled.value
}
function typeLabel(type) {
  return PRICE_CHECK_STAT_TYPES[type]?.label || '其他'
}
function statTypeClass(type) { return `stat-source-${PRICE_CHECK_STAT_TYPES[type]?.token || 'unknown'}` }
function currencyLabel(currency, localized = '') {
  return localized || ({ chaos: '混沌石', divine: '神圣石' })[currency] || currency
}
function distributionPrice(group) {
  if (group.currency === 'chaos') {
    const rate = Number(state.value?.dcRate?.value)
    const divine = rate > 0 ? group.amount / rate : 0
    return divine >= 0.1 ? `${group.amount} C（≈ ${Number(divine.toFixed(2))} D）` : `${group.amount} C`
  }
  return `${group.amount} ${currencyLabel(group.currency, group.currencyLabel)}`
}
function statusLabel(listing) {
  if (listing.instantBuyout) return '即时购买'
  if (listing.afk) return '暂离'
  return listing.online ? '在线' : '离线'
}
function relativeTime(value) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return '未知'
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (seconds < 60) return '刚刚'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`
  return `${Math.floor(seconds / 86400)} 天前`
}
onMounted(() => {
  removeListener = electronApi.priceCheck.onOverlayState((snapshot) => { state.value = snapshot })
  removeSettingsListener = electronApi.priceCheck.onSettingsChanged((snapshot) => {
    const revision = Number(snapshot?.settingsRevision) || 0
    if (revision < settingsRevision || !snapshot?.options) return
    settingsRevision = revision
    Object.assign(queryOptions, snapshot.options)
    if (state.value) {
      state.value.options = { ...snapshot.options }
      state.value.settingsRevision = revision
      if (snapshot.dcRate) state.value.dcRate = snapshot.dcRate
    }
  })
  void load()
})
onUnmounted(() => {
  removeListener?.()
  removeSettingsListener?.()
})
</script>

<style scoped>
* { box-sizing: border-box; }
.overlay-shell { min-height: 100vh; color: #e8ebf2; background: #12141a; border: 1px solid #303642; border-radius: 9px; overflow: hidden; font: 12px/1.3 "Microsoft YaHei", sans-serif; }
.topbar { height: 44px; display: flex; align-items: center; padding: 5px 9px; background: #1a1d25; border-bottom: 1px solid #2b303a; cursor: grab; -webkit-app-region: drag; }
.topbar:active { cursor: grabbing; }
.icon-button, .close-button, .shortcut, .dc-rate { -webkit-app-region: no-drag; }
.icon-button { width: 32px; height: 32px; padding: 0; font-size: 18px; background: #292e55; }
.dc-rate { margin-left: 8px; color: #f4c56a; font-size: 11px; }
.shortcut { margin-left: auto; padding: 5px 10px; color: #9bc5ff; background: #1d3558; border-radius: 5px; font-weight: 700; }
.close-button { margin-left: 6px; padding: 0 5px; border: 0; background: transparent; font-size: 21px; }
.content { height: calc(100vh - 44px); overflow: auto; padding: 6px 7px 10px; }
.panel { margin-bottom: 5px; padding: 7px; background: #191c23; border: 1px solid #292e38; border-radius: 6px; }
.settings-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 10px; }
.settings-grid label { display: grid; grid-template-columns: 66px 1fr; align-items: center; color: #cbd0dc; }
.settings-grid .check-label { display: flex; gap: 8px; }
.panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.panel-heading h3 { flex: 1; margin: 0; }
.panel-toggle { padding: 2px 7px; font-size: 11px; }
.state-filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(118px, 1fr)); gap: 5px; }
.state-filter-grid label { display: grid; grid-template-columns: minmax(48px, auto) 1fr; align-items: center; gap: 5px; color: #cbd0dc; }
.state-filter-grid select { width: 100%; }
select, .number { min-width: 0; height: 27px; color: #e8ebf2; background: #111319; border: 1px solid #444b58; border-radius: 4px; padding: 3px 6px; font-size: 12px; }
.setting-number { width: 100%; min-width: 0; height: 27px; color: #e8ebf2; background: #111319; border: 1px solid #444b58; border-radius: 4px; padding: 3px 6px; }
.identity { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.identity-main { display: flex; min-width: 0; flex: 1 1 auto; flex-direction: column; gap: 3px; }
.identity-name { display: flex; width: fit-content; max-width: 100%; min-height: 28px; height: auto; align-items: center; gap: 7px; padding: 3px 6px; }
.identity-name.disabled { cursor: not-allowed; opacity: .72; }
.filter-row.identity-name.disabled:hover { background: #182a47; border-color: #4285e8; }
.identity-name small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.identity-static-name { padding: 3px 6px; }
.identity-meta { padding-left: 6px; }
.identity strong { color: #8bbcff; font-size: 14px; }
.identity span, small { color: #9da5b3; }
.identity-side { display: flex; min-width: 180px; max-width: 46%; flex: 0 1 auto; flex-wrap: wrap; justify-content: flex-end; gap: 5px 8px; text-align: right; }
.identity-hint { flex: 1 1 180px; color: #55a9ff; }
.flags { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
.flags span { padding: 2px 5px; color: #ffcc85; border: 1px solid #795a2d; border-radius: 4px; font-size: 10px; }
h3 { position: sticky; top: 0; z-index: 1; margin: 0 0 4px; padding: 2px 0; font-size: 12px; color: #cfd5e2; background: #191c23; }
.filter-list { max-height: 255px; overflow-y: auto; padding: 5px; }
.property-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; }
.filter-row { display: grid; gap: 5px; align-items: center; height: 32px; padding: 2px 5px; border: 1px solid transparent; border-radius: 4px; cursor: pointer; }
.filter-row:not(.unknown):hover { background: #202b3b; border-color: #52627a; }
.filter-row.enabled { background: #182a47; border-color: #4285e8; }
.filter-row.enabled:hover { background: #1d365b; border-color: #65a4ff; }
.filter-row:focus-visible { outline: 1px solid #65b4ff; outline-offset: -1px; }
.property-row { grid-template-columns: minmax(0, 1fr) 52px 52px; }
.property-row:has(.property-option) { grid-template-columns: minmax(0, 1fr) 109px; }
.property-option { width: 100%; }
.information-grid { display: flex; flex-wrap: wrap; gap: 6px 12px; color: #cbd0dc; }
.information-panel small { display: block; margin-top: 5px; }
.mercenary-panel { max-height: 360px; overflow-y: auto; padding: 5px; }
.mercenary-group { margin-top: 5px; padding: 6px; border: 1px dashed #464d5a; border-radius: 5px; background: #171920; }
.mercenary-group:first-of-type { margin-top: 0; }
.mercenary-group.enabled { border-style: solid; border-color: #c98922; background: #332815; }
.mercenary-skill { display: flex; align-items: center; gap: 8px; min-height: 28px; padding: 2px 5px; border-radius: 4px; cursor: pointer; }
.mercenary-skill:hover { background: #252a34; }
.mercenary-group.enabled .mercenary-skill:hover { background: #44351c; }
.mercenary-skill:focus-visible { outline: 1px solid #f0a82f; }
.mercenary-skill strong { color: #d8dbe3; font-size: 13px; }
.mercenary-group.enabled .mercenary-skill strong { color: #ffbd32; }
.mercenary-label { padding: 2px 5px; color: #cfb4f3; background: #4a2c68; border-radius: 3px; }
.mercenary-supports { display: flex; flex-wrap: wrap; gap: 5px; padding: 3px 5px 0 82px; }
.mercenary-support { padding: 3px 7px; color: #aaaeb8; background: #1a1c22; border-color: #454952; }
.mercenary-support.enabled { color: #f0e7ff; background: #49325e; border-color: #ba8de1; }
.mercenary-support small { margin-left: 3px; color: inherit; }
.mercenary-empty { display: block; padding: 2px 5px 0 82px; color: #747985; }
.stat-row, .unknown { grid-template-columns: 46px 34px minmax(0, 1fr) 64px 64px; }
.stat-source { display: inline-flex; justify-content: center; padding: 3px 4px; border: 1px solid currentColor; border-radius: 3px; font-size: 10px; font-weight: 700; }
.stat-source-pseudo { color: #d9a5ff; background: #342444; }
.stat-source-explicit { color: #85bcf4; background: #1d3145; }
.stat-source-implicit { color: #e5c66f; background: #3c3218; }
.stat-source-enchant { color: #74d7d0; background: #173a38; }
.stat-source-fractured { color: #f4b55f; background: #432d16; }
.stat-source-crafted { color: #9bcf73; background: #243a19; }
.stat-source-veiled { color: #c3a4e8; background: #302342; }
.stat-source-scourge { color: #dc7f9d; background: #421d2b; }
.stat-source-imbued { color: #6ed0ef; background: #183847; }
.stat-source-delve { color: #f0c765; background: #403617; }
.stat-source-sanctum { color: #e8dfad; background: #3c3825; }
.stat-source-mercenary { color: #dcad78; background: #402e20; }
.stat-source-crucible { color: #f08355; background: #482619; }
.stat-source-ultimatum { color: #d38bdf; background: #3b2141; }
.stat-source-unknown { color: #a5aab5; background: #2a2d34; }
.tier { display: inline-flex; justify-content: center; padding: 2px; color: #a5aab5; border: 1px solid #4b5260; border-radius: 3px; font-size: 10px; }
.tier.known { color: #47e89b; border-color: #1ebc6b; }
.filter-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.filter-name small { margin-left: 6px; font-size: 10px; }
.unknown { opacity: .65; cursor: default; }
.unknown-block { padding-bottom: 3px; border-bottom: 1px solid #252a33; }
.stat-candidates { display: flex; flex-wrap: wrap; gap: 4px; padding: 2px 5px 5px 90px; }
.stat-candidates button { padding: 3px 6px; color: #9bc5ff; font-size: 10px; text-align: left; }
.action-row { position: sticky; bottom: 0; z-index: 2; display: flex; justify-content: center; gap: 7px; padding: 6px 0; background: #12141aeF; }
button { color: #e9eef8; background: #242936; border: 1px solid #414958; border-radius: 5px; padding: 5px 10px; cursor: pointer; font-size: 12px; }
button:hover:not(:disabled) { background: #303849; border-color: #65728a; }
button:focus-visible { outline: 2px solid #65b4ff; outline-offset: 1px; }
button:disabled { opacity: .45; cursor: default; }
.identity-resolver p { margin: 4px 0 8px; color: #aeb6c5; }
.candidate { display: flex; align-items: center; gap: 9px; width: 100%; min-height: 56px; margin-top: 5px; text-align: left; }
.candidate img { flex: 0 0 48px; width: 48px; height: 48px; object-fit: contain; }
.candidate-label { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.candidate-title { display: flex; min-width: 0; align-items: center; gap: 6px; }
.candidate-title strong { overflow: hidden; color: #d7a95b; text-overflow: ellipsis; white-space: nowrap; }
.legacy-tag { flex: 0 0 auto; padding: 1px 5px; color: #c9a6ff; border: 1px solid #72539b; border-radius: 3px; font-size: 10px; line-height: 15px; }
.candidate-label small { margin: 0; }
.result-tabs { display: flex; gap: 5px; margin: 6px 0; }
.result-tabs button.active { color: #9bc5ff; background: #18345a; border-color: #4285e8; }
.distribution-summary { padding: 6px 4px; color: #aeb6c5; }
.distribution-row { padding: 6px 4px; border-radius: 4px; }
.distribution-row:hover { background: #20252f; }
.distribution-row.highest { background: #1d2f25; }
.distribution-label { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 8px; align-items: baseline; }
.distribution-label small { color: #d3a85e; }
.distribution-track { height: 6px; margin-top: 4px; overflow: hidden; background: #101218; border-radius: 3px; }
.distribution-track span { display: block; height: 100%; min-width: 2px; background: #4e8de7; border-radius: inherit; }
.distribution-row.highest .distribution-track span { background: #48c985; }
.distribution-note { margin: 8px 4px 2px; color: #858d9c; font-size: 10px; }
.rate-limit-warning { margin: 0 4px; }
.search { background: #13aa58; border-color: #13aa58; }
.market { background: #3478d4; border-color: #3478d4; }
.result-heading { display: flex; justify-content: center; align-items: baseline; gap: 8px; padding: 5px; font-size: 14px; }
.listing-head, .listing { display: grid; grid-template-columns: 1.1fr 38px 66px 60px minmax(72px, 1fr) 40px; gap: 5px; align-items: center; padding: 5px 6px; }
.listing-head { color: #9da5b3; background: #08090c; font-weight: 700; }
.listing { min-height: 36px; border-bottom: 1px solid #2b3039; background: #191c23; }
.listing .instant { color: #fff; background: #e52d35; border-radius: 4px; padding: 3px 5px; text-align: center; }
.seller { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.copy { padding: 4px 7px; color: #69b4ff; }
.load-more { display: block; margin: 7px auto; }
.state-message { padding: 10px; text-align: center; color: #74b5ff; }
.error, .warning { color: #f1ad58; padding: 5px 0; }
.catalog-warning { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.catalog-warning button { flex: 0 0 auto; padding: 3px 7px; }
.catalog-status { color: #747d8c; text-align: center; font-size: 10px; }
.disclaimer { color: #808896; text-align: center; margin-top: 6px; font-size: 10px; }
</style>
