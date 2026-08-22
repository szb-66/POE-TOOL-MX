<template>
  <div class="overlay-shell" :class="{ preview: props.previewMode }">
    <header class="topbar">
      <button class="icon-button" title="显示或隐藏查询设置" @click="settingsCollapsed = !settingsCollapsed">⚙</button>
      <div class="dc-rate">{{ dcRateText }}</div>
      <span v-if="props.previewMode" class="preview-badge">预览模式</span>
      <div class="shortcut">Ctrl+D</div>
      <button class="close-button" aria-label="关闭" :disabled="props.previewMode" :title="props.previewMode ? '预览模式不会关闭真实浮窗' : '关闭'" @click="close">×</button>
    </header>

    <main v-if="state" class="content">
      <section v-if="!settingsCollapsed" class="panel settings-grid">
        <label>在线状态
          <el-select v-model="queryOptions.status" popper-class="price-check-select-popper" @change="syncSetting('status')">
            <el-option label="在线可交易" value="available" />
            <el-option label="即时购买" value="instant" />
            <el-option label="包含离线" value="any" />
          </el-select>
        </label>
        <label>挂单时间
          <el-select v-model="queryOptions.listed" popper-class="price-check-select-popper" @change="syncSetting('listed')">
            <el-option label="所有时间" value="any" />
            <el-option label="1 天内" value="1day" />
            <el-option label="3 天内" value="3days" />
            <el-option label="1 周内" value="1week" />
            <el-option label="2 周内" value="2weeks" />
            <el-option label="1 月内" value="1month" />
            <el-option label="2 月内" value="2months" />
          </el-select>
        </label>
        <label>通货
          <el-select v-model="queryOptions.currency" popper-class="price-check-select-popper" @change="syncSetting('currency')">
            <el-option label="任意通货" value="any" />
            <el-option label="混沌石" value="chaos" />
            <el-option label="神圣石" value="divine" />
            <el-option label="混沌或神圣" value="chaos_divine" />
          </el-select>
        </label>
        <label>词缀初选
          <el-select v-model="queryOptions.initialSelection" popper-class="price-check-select-popper" @change="syncSetting('initialSelection')">
            <el-option label="自动" value="auto" />
            <el-option label="全部" value="all" />
            <el-option label="无" value="none" />
          </el-select>
        </label>
        <label>手动 DC
          <el-input-number :model-value="queryOptions.manualDcRate" class="setting-number" size="small" :min="0" :controls="false" @update:model-value="setNumericField(queryOptions, 'manualDcRate', $event)" @change="syncSetting('manualDcRate')" />
        </label>
        <label class="check-label"><input v-model="queryOptions.collapseListings" type="checkbox" @change="syncSetting('collapseListings')" /> 合并重复挂单</label>
      </section>

      <section v-if="state.model" class="panel identity">
        <div class="identity-main">
          <button
            v-if="state.model.identity?.name"
            type="button"
            class="identity-name filter-row"
            :class="{ enabled: nameFilterEnabled, disabled: !canToggleName }"
            :aria-pressed="nameFilterEnabled"
            :disabled="!canToggleName"
            :title="canToggleName ? '选中或取消具体物品名称' : '无法识别物品大类，必须保留具体名称'"
            @click="setNameFilterEnabled(!nameFilterEnabled)"
            @keydown.enter.prevent="setNameFilterEnabled(!nameFilterEnabled)"
            @keydown.space.prevent="setNameFilterEnabled(!nameFilterEnabled)"
          >
            <strong>{{ state.model.identity.name }}</strong>
            <small v-if="!canToggleName">大类不可用，名称必须保留</small>
          </button>
          <strong v-else class="identity-static-name">{{ state.model.identity?.displayName || state.model.item.name || state.model.item.baseType }}</strong>
          <span class="identity-meta">
            {{ state.model.item.rarity }} · {{ state.model.identity?.categoryLabel || state.model.item.category || '未知大类' }} · {{ state.model.item.baseType }} · {{ state.league }}
          </span>
        </div>
        <div v-if="activeFlags.length" class="identity-side">
          <div class="flags">
            <span v-for="flag in activeFlags" :key="flag">{{ flag }}</span>
          </div>
        </div>
      </section>

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
          <button
            class="panel-heading"
            type="button"
            :aria-expanded="!stateFiltersCollapsed"
            aria-controls="price-check-state-filters"
            @click="stateFiltersCollapsed = !stateFiltersCollapsed"
          >
            <span class="panel-heading-title" role="heading" aria-level="3">状态过滤</span>
            <el-icon class="panel-toggle-icon" :class="{ expanded: !stateFiltersCollapsed }" aria-hidden="true"><ArrowDown /></el-icon>
          </button>
          <div v-if="!stateFiltersCollapsed" id="price-check-state-filters" class="state-filter-grid">
            <label v-for="definition in stateDefinitions" :key="definition.key">
              <span>{{ definition.label }}</span>
              <el-select v-model="state.model.stateFilters[definition.key]" popper-class="price-check-select-popper">
                <el-option label="任意" value="any" />
                <el-option label="是" value="true" />
                <el-option label="否" value="false" />
              </el-select>
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
                <el-select v-model="property.value" class="property-option" popper-class="price-check-select-popper" @click.stop @keydown.stop>
                  <el-option v-for="option in property.options" :key="option.id" :label="option.label" :value="option.id" />
                </el-select>
              </template>
              <template v-else>
                <el-input-number :model-value="property.min" class="number" size="small" :min="property.label === '佣兵等级' ? 1 : undefined" :max="property.label === '佣兵等级' ? 100 : undefined" :controls="false" placeholder="最小" @update:model-value="setNumericField(property, 'min', $event)" @click.stop @keydown.stop />
                <el-input-number :model-value="property.max" class="number" size="small" :min="property.label === '佣兵等级' ? 1 : undefined" :max="property.label === '佣兵等级' ? 100 : undefined" :controls="false" placeholder="最大" @update:model-value="setNumericField(property, 'max', $event)" @click.stop @keydown.stop />
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
              <small v-if="stat.queryVariants?.length > 1" class="equivalence-hint">已合并多个官方同文案过滤项</small>
            </span>
            <el-input-number :model-value="stat.min" class="number" size="small" :min="0" :controls="false" placeholder="最小" @update:model-value="setNumericField(stat, 'min', $event)" @click.stop @keydown.stop />
            <el-input-number :model-value="stat.max" class="number" size="small" :min="0" :controls="false" placeholder="最大" @update:model-value="setNumericField(stat, 'max', $event)" @click.stop @keydown.stop />
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
        <button class="primary" :disabled="props.previewMode || busy || !state.model || state.status === 'identity-required'" :title="props.previewMode ? '预览模式不会发起查询' : '按当前条件搜索'" @click="rerun">搜索</button>
        <button class="secondary" @click="filtersCollapsed = !filtersCollapsed">{{ filtersCollapsed ? '展开过滤器' : '折叠过滤器' }}</button>
        <button class="secondary" :disabled="props.previewMode || state.status !== 'ready'" :title="props.previewMode ? '预览模式不会打开网页' : '打开官方网页市集'" @click="openOfficial">网页市集</button>
      </section>

      <div v-if="state.status === 'loading'" class="state-message" aria-live="polite">正在查询官方挂单…</div>
      <div v-else-if="state.status === 'error'" class="state-message error" role="alert">{{ stateErrorText }}</div>
      <div v-if="rateLimitText" class="warning rate-limit-warning" role="alert">{{ rateLimitText }}</div>

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
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, toRaw, watch } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { electronApi } from '@/api/electron'
import { PRICE_CHECK_STATE_FILTERS, PRICE_CHECK_STAT_TYPES } from '../../../shared/priceCheckMetadata.js'

const props = defineProps({
  previewMode: { type: Boolean, default: false },
  previewState: { type: Object, default: null },
  previewOptions: { type: Object, default: null }
})

function clonePreviewInput(value) {
  return value == null ? value : structuredClone(toRaw(value))
}

const state = ref(props.previewMode ? clonePreviewInput(props.previewState) : null)
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
  manualDcRate: 0,
  ...(props.previewMode && props.previewOptions ? clonePreviewInput(props.previewOptions) : {})
})
let removeListener
let removeSettingsListener
let settingsRevision = 0
let renderGeneration = 0

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
  if (props.previewMode) return
  const response = await electronApi.priceCheck.updateSettings({ [key]: queryOptions[key] })
  if (response?.success && response.data?.settingsRevision) settingsRevision = response.data.settingsRevision
}

function setNumericField(target, key, value) {
  target[key] = value == null ? undefined : value
}

async function applySnapshot(snapshot, presentation = null) {
  if (props.previewMode) return
  state.value = snapshot
  if (!snapshot) return
  const displayGeneration = Number(presentation?.generation)
  if (!Number.isSafeInteger(displayGeneration)) return
  const renderId = ++renderGeneration
  await nextTick()
  await new Promise((resolve) => requestAnimationFrame(resolve))
  if (renderId === renderGeneration) electronApi.priceCheck.rendered(displayGeneration)
}

async function load() {
  if (props.previewMode) return
  const response = await electronApi.priceCheck.getOverlayState()
  if (response?.success) await applySnapshot(response.data, response.presentation)
}
async function rerun() {
  if (props.previewMode) return
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
  if (props.previewMode) return
  busy.value = true
  try { await electronApi.priceCheck.loadMore() } finally { busy.value = false }
}
async function retryCatalog() {
  if (props.previewMode) return
  busy.value = true
  try {
    const response = await electronApi.priceCheck.retryCatalog()
    if (response?.success && state.value) state.value.catalog = response.data
  } finally { busy.value = false }
}
async function showDistribution() {
  resultView.value = 'distribution'
  if (props.previewMode) return
  if (state.value?.result?.distribution?.complete || distributionLoading.value) return
  distributionLoading.value = true
  try { await electronApi.priceCheck.loadDistribution() } finally { distributionLoading.value = false }
}
async function resolveIdentity(candidateKey) {
  if (props.previewMode) return
  busy.value = true
  try { await electronApi.priceCheck.resolveIdentity(candidateKey) } finally { busy.value = false }
}
async function selectStatCandidate(unknown, candidate) {
  if (props.previewMode) return
  busy.value = true
  try { await electronApi.priceCheck.resolveStatCandidate(unknown.key, candidate.id) } finally { busy.value = false }
}
function useCandidatePlaceholder(event) {
  const placeholder = 'price-check-image://snapshot/placeholder'
  if (event.currentTarget.src !== placeholder) event.currentTarget.src = placeholder
}
function close() {
  if (props.previewMode) return
  void electronApi.priceCheck.closeOverlay()
}
function openOfficial() {
  if (props.previewMode) return
  void electronApi.priceCheck.openOfficial()
}
function copyWhisper(text) {
  if (props.previewMode) return
  void electronApi.clipboard.writeText(text)
}
function toggleFilter(filter) { filter.enabled = !filter.enabled }
function toggleMercenaryGroup(group) { group.enabled = !group.enabled }
function toggleMercenarySupport(group, support) {
  support.enabled = !support.enabled
  if (support.enabled) group.enabled = true
}
function setNameFilterEnabled(enabled) {
  const identity = state.value?.model?.identity
  if (!identity?.name) return
  if (!canToggleName.value) {
    identity.nameEnabled = true
    return
  }
  identity.nameEnabled = enabled !== false
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
  if (props.previewMode) return
  removeListener = electronApi.priceCheck.onOverlayState((snapshot, presentation) => { void applySnapshot(snapshot, presentation) })
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
.overlay-shell { min-height: 100vh; color: var(--text-primary); background: var(--app-bg); border: 1px solid var(--overlay-border); border-radius: var(--overlay-radius-md); overflow: hidden; font: var(--overlay-font-size)/1.3 var(--font-ui); animation: none; transition: none; }
.overlay-shell.preview { height: 640px; min-height: 0; }
.overlay-shell.preview .content { height: calc(100% - 38px); }
.overlay-shell.preview .topbar { cursor: default; -webkit-app-region: no-drag; }
.topbar { height: 38px; display: flex; align-items: center; padding: var(--overlay-space-1) var(--overlay-space-3); background: var(--surface-1); border-bottom: 1px solid var(--border-base); cursor: grab; -webkit-app-region: drag; }
.topbar:active { cursor: grabbing; }
.icon-button, .close-button, .shortcut, .dc-rate { -webkit-app-region: no-drag; }
.icon-button { width: var(--overlay-control-height-large); height: var(--overlay-control-height-large); padding: 0; font-size: 17px; background: var(--surface-2); }
.dc-rate { margin-left: var(--overlay-space-3); color: color-mix(in srgb, var(--warning-color) 78%, white); font-size: var(--overlay-font-size-small); }
.preview-badge { margin-left: var(--overlay-space-3); padding: 2px var(--overlay-space-2); color: color-mix(in srgb, var(--warning-color) 84%, white); background: color-mix(in srgb, var(--warning-color) 14%, var(--surface-2)); border: 1px solid color-mix(in srgb, var(--warning-color) 50%, var(--border-base)); border-radius: var(--overlay-radius-sm); font-size: var(--overlay-font-size-small); font-weight: 700; }
.shortcut { margin-left: auto; padding: var(--overlay-space-1) var(--overlay-space-3); color: color-mix(in srgb, var(--brand-color) 78%, white); background: color-mix(in srgb, var(--brand-color) 14%, var(--surface-2)); border-radius: var(--overlay-radius-sm); font-weight: 700; }
.close-button { margin-left: 6px; padding: 0 5px; border: 0; background: transparent; font-size: 21px; }
.content { height: calc(100vh - 38px); overflow: auto; padding: var(--overlay-space-2); }
.panel { margin-bottom: var(--overlay-space-1); padding: var(--overlay-space-2); background: var(--surface-1); border: 1px solid var(--border-base); border-radius: var(--overlay-radius-md); }
.settings-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 10px; }
.settings-grid label { display: grid; grid-template-columns: 66px 1fr; align-items: center; color: var(--text-regular); }
.settings-grid .check-label { display: flex; gap: 8px; }
.check-label input[type="checkbox"] { appearance: none; position: relative; flex: 0 0 auto; width: 14px; height: 14px; margin: 0; background: var(--surface-2); border: 1px solid var(--border-base); border-radius: 3px; cursor: pointer; transition: background-color .15s ease, border-color .15s ease, outline-color .15s ease; }
.check-label input[type="checkbox"]:not(:disabled):hover { border-color: var(--control-hover-border); }
.check-label input[type="checkbox"]:checked { background: var(--checkbox-checked-bg); border-color: var(--checkbox-checked-bg); }
.check-label input[type="checkbox"]:checked::after { content: ''; position: absolute; left: 4px; top: 1px; width: 3px; height: 7px; border: solid var(--checkbox-check-color); border-width: 0 2px 2px 0; transform: rotate(45deg); }
.check-label input[type="checkbox"]:focus-visible { outline: 2px solid var(--checkbox-focus-ring); outline-offset: 2px; }
.panel-heading { display: flex; width: 100%; min-height: 24px; align-items: center; justify-content: space-between; gap: 8px; padding: 2px 0; color: var(--text-primary); background: transparent; border: 0; border-radius: var(--overlay-radius-sm); text-align: left; }
.panel-heading:hover:not(:disabled) { color: var(--text-primary); background: var(--surface-hover); border-color: transparent; }
.panel-heading:focus-visible { outline: 2px solid var(--brand-color); outline-offset: 1px; }
.panel-heading-title { font-size: var(--overlay-font-size); font-weight: 700; }
.panel-toggle-icon { flex: 0 0 auto; margin-right: var(--overlay-space-1); transform: rotate(-90deg); transition: transform .15s ease; }
.panel-toggle-icon.expanded { transform: rotate(0deg); }
.state-filter-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 5px; }
.state-filter-grid label { display: grid; grid-template-columns: minmax(48px, auto) 1fr; align-items: center; gap: var(--overlay-space-1); color: var(--text-regular); }
.settings-grid :deep(.el-select),
.settings-grid :deep(.el-input-number),
.state-filter-grid :deep(.el-select),
.property-option,
.number { width: 100%; min-width: 0; }
:deep(.el-select__wrapper),
:deep(.el-input__wrapper) { min-height: var(--overlay-control-height); padding-top: 2px; padding-bottom: 2px; font-size: var(--overlay-font-size); }
.number :deep(.el-input__inner),
.setting-number :deep(.el-input__inner) { text-align: left; }
.number :deep(.el-input),
.setting-number :deep(.el-input) { height: 24px; }
.number :deep(.el-input__wrapper),
.setting-number :deep(.el-input__wrapper) { min-height: 22px; padding-top: 0; padding-bottom: 0; }
.identity { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.identity-main { display: flex; min-width: 0; flex: 1 1 auto; flex-direction: column; gap: 3px; }
.identity-name { appearance: none; display: flex; width: fit-content; max-width: 100%; min-height: 28px; height: auto; align-items: center; gap: 7px; padding: 3px 6px; color: inherit; background: transparent; font: inherit; text-align: left; }
.identity-name.disabled { cursor: not-allowed; opacity: .72; }
.filter-row.identity-name.disabled:hover { background: color-mix(in srgb, var(--brand-color) 12%, var(--surface-1)); border-color: var(--brand-color); }
.identity-name small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.identity-static-name { padding: 3px 6px; }
.identity-meta { padding-left: 6px; }
.identity strong { color: color-mix(in srgb, var(--brand-color) 78%, white); font-size: 13px; }
.identity span, small { color: var(--text-secondary); }
.identity-side { display: flex; min-width: 180px; max-width: 46%; flex: 0 1 auto; flex-wrap: wrap; justify-content: flex-end; gap: 5px 8px; text-align: right; }
.flags { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
.flags span { padding: 2px 5px; color: #ffcc85; border: 1px solid #795a2d; border-radius: 4px; font-size: 10px; }
h3 { position: sticky; top: 0; z-index: 1; margin: 0 0 var(--overlay-space-1); padding: 2px 0; font-size: var(--overlay-font-size); color: var(--text-primary); background: var(--surface-1); }
.filter-list { max-height: 255px; overflow-y: auto; padding: 5px; }
.property-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; }
.filter-row { display: grid; gap: 5px; align-items: center; height: 32px; padding: 2px 5px; border: 1px solid transparent; border-radius: 4px; cursor: pointer; }
.filter-row:not(.unknown):hover { background: var(--surface-hover); border-color: var(--border-lighter); }
.filter-row.enabled { background: color-mix(in srgb, var(--brand-color) 14%, var(--surface-1)); border-color: var(--brand-color); }
.filter-row.enabled:hover { background: color-mix(in srgb, var(--brand-color) 19%, var(--surface-1)); border-color: color-mix(in srgb, var(--brand-color) 84%, white); }
.filter-row:focus-visible { outline: 1px solid var(--brand-color); outline-offset: -1px; }
.property-row { grid-template-columns: minmax(0, 1fr) 52px 52px; }
.property-row:has(.property-option) { grid-template-columns: minmax(0, 1fr) 109px; }
.information-grid { display: flex; flex-wrap: wrap; gap: 6px 12px; color: var(--text-regular); }
.information-panel small { display: block; margin-top: 5px; }
.mercenary-panel { max-height: 360px; overflow-y: auto; padding: 5px; }
.mercenary-group { margin-top: 5px; padding: var(--overlay-space-2); border: 1px dashed var(--border-base); border-radius: var(--overlay-radius-sm); background: var(--surface-1); }
.mercenary-group:first-of-type { margin-top: 0; }
.mercenary-group.enabled { border-style: solid; border-color: #c98922; background: #332815; }
.mercenary-skill { display: flex; align-items: center; gap: 8px; min-height: 28px; padding: 2px 5px; border-radius: 4px; cursor: pointer; }
.mercenary-skill:hover { background: var(--surface-hover); }
.mercenary-group.enabled .mercenary-skill:hover { background: #44351c; }
.mercenary-skill:focus-visible { outline: 1px solid #f0a82f; }
.mercenary-skill strong { color: var(--text-primary); font-size: 13px; }
.mercenary-group.enabled .mercenary-skill strong { color: #ffbd32; }
.mercenary-label { padding: 2px 5px; color: #cfb4f3; background: #4a2c68; border-radius: 3px; }
.mercenary-supports { display: flex; flex-wrap: wrap; gap: 5px; padding: 3px 5px 0 82px; }
.mercenary-support { padding: 3px 7px; color: var(--text-regular); background: var(--surface-2); border-color: var(--border-base); }
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
.unknown-block { padding-bottom: 3px; border-bottom: 1px solid var(--border-base); }
.stat-candidates { display: flex; flex-wrap: wrap; gap: 4px; padding: 2px 5px 5px 90px; }
.stat-candidates button { padding: 3px 6px; color: color-mix(in srgb, var(--brand-color) 78%, white); font-size: 10px; text-align: left; }
.action-row { position: sticky; bottom: 0; z-index: 2; display: flex; justify-content: center; gap: var(--overlay-space-2); padding: var(--overlay-space-2) 0; background: color-mix(in srgb, var(--app-bg) 94%, transparent); }
button { min-height: var(--overlay-control-height); color: var(--text-primary); background: var(--surface-2); border: 1px solid var(--border-base); border-radius: var(--overlay-radius-sm); padding: var(--overlay-space-1) var(--overlay-space-3); cursor: pointer; font-size: var(--overlay-font-size); }
button:hover:not(:disabled) { background: var(--surface-hover); border-color: color-mix(in srgb, var(--brand-color) 55%, var(--border-base)); }
button:focus-visible { outline: 2px solid var(--brand-color); outline-offset: 1px; }
button:disabled { opacity: .45; cursor: default; }
.identity-resolver p { margin: 4px 0 8px; color: var(--text-regular); }
.candidate { display: flex; align-items: center; gap: 9px; width: 100%; min-height: 56px; margin-top: 5px; text-align: left; }
.candidate img { flex: 0 0 48px; width: 48px; height: 48px; object-fit: contain; }
.candidate-label { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.candidate-title { display: flex; min-width: 0; align-items: center; gap: 6px; }
.candidate-title strong { overflow: hidden; color: #d7a95b; text-overflow: ellipsis; white-space: nowrap; }
.legacy-tag { flex: 0 0 auto; padding: 1px 5px; color: #c9a6ff; border: 1px solid #72539b; border-radius: 3px; font-size: 10px; line-height: 15px; }
.candidate-label small { margin: 0; }
.result-tabs { display: flex; gap: 5px; margin: 6px 0; }
.result-tabs button.active { color: var(--brand-on-color); background: var(--brand-color); border-color: var(--brand-color); }
.distribution-summary { padding: 6px 4px; color: var(--text-regular); }
.distribution-row { padding: 6px 4px; border-radius: 4px; }
.distribution-row:hover { background: var(--surface-hover); }
.distribution-row.highest { background: #1d2f25; }
.distribution-label { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 8px; align-items: baseline; }
.distribution-label small { color: #d3a85e; }
.distribution-track { height: 6px; margin-top: 4px; overflow: hidden; background: var(--surface-2); border-radius: 3px; }
.distribution-track span { display: block; height: 100%; min-width: 2px; background: var(--brand-color); border-radius: inherit; }
.distribution-row.highest .distribution-track span { background: #48c985; }
.distribution-note { margin: 8px 4px 2px; color: #858d9c; font-size: 10px; }
.rate-limit-warning { margin: 0 4px; }
.action-row .primary { color: var(--brand-on-color); background: var(--brand-color); border-color: var(--brand-color); }
.action-row .primary:hover:not(:disabled) { color: var(--brand-on-color); background: color-mix(in srgb, var(--brand-color) 84%, white); border-color: color-mix(in srgb, var(--brand-color) 84%, white); }
.action-row .secondary { color: var(--text-primary); background: var(--surface-2); border-color: var(--border-base); }
.action-row .secondary:hover:not(:disabled) { color: var(--text-primary); background: var(--surface-hover); border-color: var(--control-hover-border); }
.action-row button { min-height: 24px; padding: 2px var(--overlay-space-2); font-size: var(--overlay-font-size-small); }
.result-heading { display: flex; justify-content: center; align-items: baseline; gap: 8px; padding: 5px; font-size: 14px; }
.listing-head, .listing { display: grid; grid-template-columns: 1.1fr 38px 66px 60px minmax(72px, 1fr) 40px; gap: 5px; align-items: center; padding: 5px 6px; }
.listing-head { color: var(--text-secondary); background: var(--app-bg); font-weight: 700; }
.listing { min-height: 36px; border-bottom: 1px solid var(--border-base); background: var(--surface-1); }
.listing .instant { color: #fff; background: #e52d35; border-radius: 4px; padding: 3px 5px; text-align: center; }
.seller { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.copy { padding: 4px 7px; color: color-mix(in srgb, var(--brand-color) 78%, white); }
.load-more { display: block; margin: 7px auto; }
.state-message { padding: 10px; text-align: center; color: color-mix(in srgb, var(--brand-color) 78%, white); }
.error, .warning { color: color-mix(in srgb, var(--warning-color) 78%, white); padding: 5px 0; }
.catalog-warning { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.catalog-warning button { flex: 0 0 auto; padding: 3px 7px; }
.catalog-status { color: #747d8c; text-align: center; font-size: 10px; }
.disclaimer { color: #808896; text-align: center; margin-top: 6px; font-size: 10px; }
</style>
