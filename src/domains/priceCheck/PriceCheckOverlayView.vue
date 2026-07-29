<template>
  <div class="overlay-shell">
    <header class="topbar">
      <button class="icon-button" title="显示或隐藏查询设置" @click="settingsCollapsed = !settingsCollapsed">⚙</button>
      <div class="shortcut">Ctrl+D</div>
      <button class="close-button" aria-label="关闭" @click="close">×</button>
    </header>

    <main v-if="state" class="content">
      <section v-if="!settingsCollapsed" class="panel settings-grid">
        <label>在线状态
          <select v-model="queryOptions.status">
            <option value="available">在线可交易</option>
            <option value="instant">即时购买</option>
            <option value="any">包含离线</option>
          </select>
        </label>
        <label>挂单时间
          <select v-model="queryOptions.listed">
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
          <select v-model="queryOptions.currency">
            <option value="any">任意通货</option>
            <option value="chaos">混沌石</option>
            <option value="divine">神圣石</option>
            <option value="chaos_divine">混沌或神圣</option>
          </select>
        </label>
        <label class="check-label"><input v-model="queryOptions.collapseListings" type="checkbox" /> 合并重复挂单</label>
      </section>

      <section v-if="state.model" class="panel identity">
        <div>
          <strong>{{ state.model.item.name || state.model.item.baseType }}</strong>
          <span>{{ state.model.item.rarity }} · {{ state.model.item.baseType }} · {{ state.league }}</span>
        </div>
        <div class="flags">
          <span v-for="flag in activeFlags" :key="flag">{{ flag }}</span>
        </div>
      </section>

      <div v-if="state.status === 'loading'" class="state-message">正在查询官方挂单…</div>
      <div v-else-if="state.status === 'error'" class="state-message error">{{ state.error?.message }}</div>

      <template v-if="state.model && !filtersCollapsed">
        <section v-if="state.model.properties?.length" class="panel filter-list">
          <h3>物品属性</h3>
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
            <span class="filter-name">{{ property.label }}</span>
            <input v-model.number="property.min" class="number" type="number" placeholder="最小" @click.stop @keydown.stop />
            <input v-model.number="property.max" class="number" type="number" placeholder="最大" @click.stop @keydown.stop />
          </div>
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
            <span class="tier" :class="{ known: stat.tier }">T{{ stat.tier || '?' }}</span>
            <span class="filter-name">
              {{ stat.text }}
              <small>{{ typeLabel(stat.type) }}<template v-if="stat.tags?.length"> · {{ stat.tags.join('、') }}</template></small>
            </span>
            <input v-model.number="stat.min" class="number" type="number" placeholder="最小" @click.stop @keydown.stop />
            <input v-model.number="stat.max" class="number" type="number" placeholder="最大" @click.stop @keydown.stop />
          </div>
          <div v-for="unknown in state.model.unknownStats || []" :key="`${unknown.type}:${unknown.text}`" class="filter-row unknown">
            <span class="tier">T{{ unknown.tier || '?' }}</span>
            <span class="filter-name">{{ unknown.text }}<small>未映射 · {{ unknown.reason }}</small></span>
            <span></span><span></span>
          </div>
        </section>
      </template>

      <section class="action-row">
        <button class="search" :disabled="busy || !state.model" @click="rerun">搜索</button>
        <button @click="filtersCollapsed = !filtersCollapsed">{{ filtersCollapsed ? '展开过滤器' : '折叠过滤器' }}</button>
        <button class="market" :disabled="state.status !== 'ready'" @click="openOfficial">网页市集</button>
      </section>

      <section v-if="state.result" class="results">
        <div class="result-heading">
          <strong>共找到 {{ state.result.total }} 个物品</strong>
          <small>已展示 {{ state.result.listings?.length || 0 }} / 最多 50 条</small>
        </div>
        <div class="listing-head">
          <span>价格</span><span>物等</span><span>状态</span><span>时间</span><span>卖家</span><span></span>
        </div>
        <div v-for="listing in state.result.listings || []" :key="listing.id" class="listing">
          <strong>{{ listing.amount || '—' }} {{ currencyLabel(listing.currency) }}</strong>
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
      </section>

      <div v-if="state.catalog?.warning" class="warning">{{ state.catalog.warning }}</div>
      <div class="disclaimer">挂单参考，不代表成交价</div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { electronApi } from '@/api/electron'

const state = ref(null)
const busy = ref(false)
const filtersCollapsed = ref(false)
const settingsCollapsed = ref(true)
const queryOptions = reactive({
  status: 'available',
  listed: 'any',
  currency: 'any',
  collapseListings: false
})
let removeListener

const flagLabels = {
  corrupted: '已腐化',
  unidentified: '未鉴定',
  mirrored: '镜像',
  split: '分裂',
  fractured: '破裂'
}
const activeFlags = computed(() => Object.entries(state.value?.model?.flags || {})
  .filter(([, active]) => active)
  .map(([key]) => flagLabels[key] || key))

watch(() => state.value?.options, (options) => {
  if (options) Object.assign(queryOptions, options)
}, { immediate: true })

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
function close() { void electronApi.priceCheck.closeOverlay() }
function openOfficial() {
  void electronApi.priceCheck.openOfficial()
}
function copyWhisper(text) { void electronApi.clipboard.writeText(text) }
function toggleFilter(filter) { filter.enabled = !filter.enabled }
function typeLabel(type) {
  return ({ explicit: '外延', implicit: '基底', fractured: '破裂', crafted: '工艺', enchant: '附魔', pseudo: '伪属性' })[type] || type
}
function currencyLabel(currency) {
  return ({ chaos: '混沌石', divine: '神圣石' })[currency] || currency
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
  void load()
})
onUnmounted(() => removeListener?.())
</script>

<style scoped>
* { box-sizing: border-box; }
.overlay-shell { min-height: 100vh; color: #e8ebf2; background: #12141a; border: 1px solid #303642; border-radius: 9px; overflow: hidden; font: 12px/1.3 "Microsoft YaHei", sans-serif; }
.topbar { height: 44px; display: flex; align-items: center; padding: 5px 9px; background: #1a1d25; border-bottom: 1px solid #2b303a; -webkit-app-region: drag; }
.icon-button, .close-button, .shortcut { -webkit-app-region: no-drag; }
.icon-button { width: 32px; height: 32px; padding: 0; font-size: 18px; background: #292e55; }
.shortcut { margin-left: auto; padding: 5px 10px; color: #9bc5ff; background: #1d3558; border-radius: 5px; font-weight: 700; }
.close-button { margin-left: 6px; padding: 0 5px; border: 0; background: transparent; font-size: 21px; }
.content { height: calc(100vh - 44px); overflow: auto; padding: 6px 7px 10px; }
.panel { margin-bottom: 5px; padding: 7px; background: #191c23; border: 1px solid #292e38; border-radius: 6px; }
.settings-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 10px; }
.settings-grid label { display: grid; grid-template-columns: 66px 1fr; align-items: center; color: #cbd0dc; }
.settings-grid .check-label { display: flex; gap: 8px; }
select, .number { min-width: 0; height: 27px; color: #e8ebf2; background: #111319; border: 1px solid #444b58; border-radius: 4px; padding: 3px 6px; font-size: 12px; }
.identity { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.identity div:first-child { display: flex; flex-direction: column; }
.identity strong { color: #8bbcff; font-size: 14px; }
.identity span, small { color: #9da5b3; }
.flags { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
.flags span { padding: 2px 5px; color: #ffcc85; border: 1px solid #795a2d; border-radius: 4px; font-size: 10px; }
h3 { position: sticky; top: 0; z-index: 1; margin: 0 0 4px; padding: 2px 0; font-size: 12px; color: #cfd5e2; background: #191c23; }
.filter-list { max-height: 255px; overflow-y: auto; padding: 5px; }
.filter-row { display: grid; gap: 5px; align-items: center; height: 32px; padding: 2px 5px; border: 1px solid transparent; border-radius: 4px; cursor: pointer; }
.filter-row.enabled { background: #182a47; border-color: #4285e8; }
.filter-row:focus-visible { outline: 1px solid #65b4ff; outline-offset: -1px; }
.property-row { grid-template-columns: minmax(0, 1fr) 64px 64px; }
.stat-row, .unknown { grid-template-columns: 34px minmax(0, 1fr) 64px 64px; }
.tier { display: inline-flex; justify-content: center; padding: 2px; color: #a5aab5; border: 1px solid #4b5260; border-radius: 3px; font-size: 10px; }
.tier.known { color: #47e89b; border-color: #1ebc6b; }
.filter-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.filter-name small { margin-left: 6px; font-size: 10px; }
.unknown { opacity: .65; cursor: default; }
.action-row { position: sticky; bottom: 0; z-index: 2; display: flex; justify-content: center; gap: 7px; padding: 6px 0; background: #12141aeF; }
button { color: #e9eef8; background: #242936; border: 1px solid #414958; border-radius: 5px; padding: 5px 10px; cursor: pointer; font-size: 12px; }
button:disabled { opacity: .45; cursor: default; }
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
.disclaimer { color: #808896; text-align: center; margin-top: 6px; font-size: 10px; }
</style>
