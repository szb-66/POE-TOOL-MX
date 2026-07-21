<template>
  <div class="planner-page">
    <header class="page-heading">
      <div>
        <h2>POE1 做装规划</h2>
        <p>选择底材与目标词缀，比较当前已支持工艺中的成本最优路径。</p>
      </div>
      <el-button :loading="store.planning" type="primary" :disabled="!canPlan" @click="calculate">
        {{ store.planning ? '计算中' : '计算最佳路径' }}
      </el-button>
    </header>

    <el-alert v-if="pageError" :title="pageError" type="error" show-icon closable @close="pageError = ''" />

    <section class="status-strip">
      <div>
        <strong>数据 {{ store.status?.league || '未知赛季' }} · {{ store.status?.patch || '未知版本' }}</strong>
        <span>{{ formatDate(store.status?.generatedAt) }} · {{ store.status?.counts?.bases || 0 }} 底材 / {{ store.status?.counts?.modifiers || 0 }} 词缀</span>
      </div>
      <el-tag v-if="store.status?.stale" type="warning">建议手动更新</el-tag>
      <el-button size="small" :loading="store.updating" @click="updateData">更新 POEDB 数据</el-button>
      <el-button v-if="store.updating" size="small" @click="store.cancelUpdate">取消</el-button>
      <el-button size="small" :loading="refreshingPrices" @click="refreshPrices">刷新物价</el-button>
      <el-button size="small" @click="priceDrawer = true">价格与覆盖</el-button>
    </section>
    <el-progress v-if="store.updating && store.updateProgress" :percentage="updatePercent" :status="store.updateError ? 'exception' : undefined" />
    <el-alert v-if="store.updateError" :title="`数据更新失败：${store.updateError}，当前快照未被替换。`" type="error" :closable="false" />

    <div class="workspace-grid">
      <div class="config-column">
        <el-card>
          <template #header><b>1. 选择底材</b></template>
          <div class="form-grid">
            <el-form-item label="分类">
              <el-cascader v-model="baseCategoryPath" :options="baseCategoryOptions" :props="{ expandTrigger: 'hover' }" clearable placeholder="全部分类" @change="categoryChanged" />
            </el-form-item>
            <el-form-item label="搜索底材" class="wide">
              <el-select v-model="form.baseId" filterable remote clearable placeholder="输入中文名称" :remote-method="searchBaseByName" @change="selectBase">
                <el-option v-for="base in store.bases" :key="base.id" :label="base.name" :value="base.id">
                  <span>{{ base.name }}</span><small>{{ itemClassName(base.itemClass) }}</small>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="物品等级">
              <el-input-number v-model="form.itemLevel" :min="1" :max="100" />
            </el-form-item>
            <el-form-item label="特殊状态">
              <el-select v-model="form.variant.kind" @change="variantChanged">
                <el-option label="普通" value="normal" />
                <el-option label="势力" value="influenced" />
                <el-option label="破裂" value="fractured" />
                <el-option label="追忆" value="synthesized" />
                <el-option label="异能" value="eldritch" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="form.variant.kind === 'influenced'" label="势力" class="wide">
              <el-select v-model="form.variant.influences" multiple :multiple-limit="2" placeholder="最多选择两个势力" @change="loadModifiers">
                <el-option v-for="item in influences" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="form.variant.kind === 'fractured'" label="破裂词缀" class="wide">
              <el-select v-model="form.variant.fracturedTierId" filterable placeholder="先添加目标，再选择其中一条破裂词缀">
                <el-option v-for="option in fractureOptions" :key="option.value" :label="option.label" :value="option.value" />
              </el-select>
            </el-form-item>
          </div>
          <div v-if="selectedBase" class="selected-base">
            <div><strong>{{ selectedBase.category }} / {{ itemClassName(selectedBase.itemClass) }} / {{ selectedBase.name }}</strong><span>需求等级 {{ selectedBase.requiredLevel }}</span></div>
          </div>
        </el-card>

        <el-card>
          <template #header><b>2. 添加目标词缀</b></template>
          <div class="modifier-search">
            <el-input v-model="modifierQuery" :disabled="!form.baseId" clearable placeholder="输入词缀名称或效果" @input="debouncedLoadModifiers" />
            <el-select v-model="modifierSource" :disabled="!form.baseId" @change="loadModifiers">
              <el-option label="天然或工艺" value="either" /><el-option label="仅天然" value="natural" /><el-option label="仅工艺台" value="crafted" />
            </el-select>
          </div>
          <el-tabs v-model="modifierAffixType" class="affix-tabs" @tab-change="loadModifiers">
            <el-tab-pane label="前缀" name="prefix" />
            <el-tab-pane label="后缀" name="suffix" />
          </el-tabs>
          <div class="modifier-options">
            <button v-for="modifier in store.modifiers" :key="modifier.id" type="button" @click="addTarget(modifier)">
              <span><el-tag size="small" :type="modifier.affixType === 'prefix' ? 'success' : 'warning'">{{ modifier.affixType === 'prefix' ? '前' : '后' }}</el-tag> {{ modifier.name }}</span>
              <small>{{ modifier.tiers[0]?.text }}</small>
            </button>
            <el-empty v-if="form.baseId && !store.modifiers.length" description="没有符合当前底材、等级与状态的词缀" :image-size="50" />
          </div>

          <div class="target-list">
            <div v-for="(target, index) in targets" :key="target.modifier.id" class="target-row">
              <div><strong>{{ target.modifier.name }}</strong><small>{{ target.modifier.affixType === 'prefix' ? '前缀' : '后缀' }}</small></div>
              <el-select v-model="target.minTier" title="最低阶级">
                <el-option v-for="tier in target.modifier.tiers" :key="tier.id" :label="`T${tier.tier} · ${tier.text}`" :value="tier.tier" />
              </el-select>
              <el-select v-model="target.sourcePolicy" title="来源">
                <el-option label="任一来源" value="either" /><el-option label="天然" value="natural" /><el-option label="工艺台" value="crafted" />
              </el-select>
              <el-button text type="danger" @click="targets.splice(index, 1)">删除</el-button>
            </div>
          </div>
          <el-alert v-if="targetWarning" :title="targetWarning" type="error" :closable="false" show-icon />
        </el-card>
      </div>

      <aside class="results-column">
        <el-card class="results-card">
          <template #header>
            <div class="result-title"><b>推荐路径</b><el-tag v-if="store.planPhase !== 'idle'">{{ phaseLabel }}</el-tag></div>
          </template>
          <el-progress v-if="store.planning" :percentage="planPercent" :indeterminate="!store.planProgress?.total" />
          <el-alert v-if="store.planError" :title="store.planError" type="warning" :closable="false" />
          <el-alert v-if="missingPlanResources.length" :title="`有 ${missingPlanResources.length} 种耗材缺少有效价格，请在“价格与覆盖”中填写后重算。`" type="warning" :closable="false" />
          <el-empty v-if="!store.plans.length && !store.planning" description="配置目标后开始计算；底材价格不会计入" />
          <article v-for="(plan, index) in store.plans" :key="plan.id" class="plan-card" :class="{ recommended: index === 0 }">
            <div class="plan-heading">
              <div><el-tag v-if="index === 0" type="success">推荐</el-tag><strong>{{ plan.name }}</strong></div>
              <b>{{ number(plan.expectedChaos) }} C</b>
            </div>
            <div class="metrics">
              <span>单次成功 {{ percent(plan.successProbability) }}</span>
              <span>P50 {{ number(plan.p50Chaos) }} C</span>
              <span>P90 {{ number(plan.p90Chaos) }} C</span>
              <span>尝试 {{ number(plan.expectedAttempts) }} 次</span>
            </div>
            <p class="confidence">95% 成本区间 {{ number(plan.expectedChaosConfidence95?.low) }}–{{ number(plan.expectedChaosConfidence95?.high) }} C · {{ plan.scopeNotice }}</p>
            <el-collapse>
              <el-collapse-item title="查看耗材与完整步骤">
                <div class="resources"><span v-for="resource in plan.resources" :key="resource.resourceId">{{ resource.resourceName }} × {{ number(resource.amount) }}</span></div>
                <ol><li v-for="step in plan.steps" :key="step.name"><b>{{ step.name }}</b><br><small>成功：{{ step.success }}；失败：{{ step.failure }}</small></li></ol>
              </el-collapse-item>
            </el-collapse>
          </article>
          <el-button v-if="store.planning" class="cancel-plan" @click="store.cancelPlan">取消计算</el-button>
        </el-card>
      </aside>
    </div>

    <el-drawer v-model="priceDrawer" title="耗材价格（混沌石）" size="600px">
      <el-alert title="优先使用 poecurrency.top 卖方均价；卖方为 0 时回退买方均价。API 完全缺失、异常或过期的价格需手动覆盖。底材成本恒为 0。" type="warning" :closable="false" />
      <div v-if="missingPlanResources.length" class="manual-price">
        <b>本次路径缺价资源</b>
        <div v-for="resource in missingPlanResources" :key="resource.resourceId">
          <span><strong>{{ resource.resourceName }}</strong><code>{{ resource.resourceId }}</code></span>
          <el-input-number v-model="priceInputs[resource.resourceId]" :min="0.0001" :precision="4" :controls="false" placeholder="混沌价" />
          <el-button size="small" @click="savePrice(resource.resourceId)">保存</el-button>
        </div>
      </div>
      <div v-if="!store.prices.records?.length" class="drawer-empty"><el-empty description="尚无价格缓存，请点击刷新物价" /></div>
      <div v-for="record in store.prices.records" :key="record.resourceId" class="price-row">
        <div><strong>{{ record.itemName }}</strong><small :class="{ invalid: !record.valid }">{{ record.valid ? `${number(record.chaosValue)} C · ${priceSourceLabel(record.source)}` : record.reason }}</small></div>
        <el-input-number v-model="priceInputs[record.resourceId]" :min="0.0001" :precision="4" :controls="false" placeholder="覆盖价" />
        <div class="price-actions">
          <el-button size="small" @click="savePrice(record.resourceId)">保存</el-button>
          <el-button v-if="store.prices.overrides?.[record.resourceId]" size="small" text @click="removePrice(record.resourceId)">清除</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useCraftingStore } from './craftingStore.js'

const store = useCraftingStore()
const pageError = ref('')
const selectedBase = ref(null)
const targets = reactive([])
const baseQuery = reactive({ category: '', itemClass: '', query: '' })
const baseCategoryPath = ref([])
const modifierQuery = ref('')
const modifierSource = ref('either')
const modifierAffixType = ref('prefix')
const priceDrawer = ref(false)
const refreshingPrices = ref(false)
const priceInputs = reactive({})
const form = reactive({ baseId: '', itemLevel: 86, variant: { kind: 'normal', influences: [], fracturedTierId: null, implicits: [] } })
const influences = [
  { label: '塑界者', value: 'shaper' }, { label: '裂界者', value: 'elder' }, { label: '圣战者', value: 'crusader' },
  { label: '救赎者', value: 'redeemer' }, { label: '狩猎者', value: 'hunter' }, { label: '督军', value: 'warlord' }
]
let modifierTimer = null

const targetWarning = computed(() => {
  if (!selectedBase.value) return ''
  const prefixCount = targets.filter((entry) => entry.modifier.affixType === 'prefix').length
  const suffixCount = targets.filter((entry) => entry.modifier.affixType === 'suffix').length
  if (prefixCount > selectedBase.value.maxAffixes.prefix || suffixCount > selectedBase.value.maxAffixes.suffix) return '目标词缀超过该底材的前缀或后缀容量。'
  const groups = targets.map((entry) => entry.modifier.groupId)
  if (new Set(groups).size !== groups.length) return '目标词缀存在 Mod Group 冲突，无法同时生成。'
  if (form.variant.kind === 'fractured' && !form.variant.fracturedTierId) return '破裂底材必须指定一条破裂词缀。'
  return ''
})
const canPlan = computed(() => form.baseId && targets.length > 0 && !store.updating && !targetWarning.value)
const updatePercent = computed(() => {
  const progress = store.updateProgress
  return progress?.total ? Math.min(100, Math.round(progress.completed / progress.total * 100)) : 0
})
const planPercent = computed(() => {
  const progress = store.planProgress
  return progress?.total ? Math.min(100, Math.round(progress.completed / progress.total * 100)) : 0
})
const phaseLabel = computed(() => ({ starting: '准备中', quick: '快速估算', refined: '精算', complete: '已完成', cancelled: '已取消', error: '失败' }[store.planPhase] || store.planPhase))
const fractureOptions = computed(() => targets.flatMap((target) => target.modifier.tiers.map((tier) => ({ value: tier.id, label: `${target.modifier.name} · T${tier.tier} · ${tier.text}` }))))
const baseCategoryOptions = computed(() => store.categories.map((category) => ({
  value: category.name,
  label: `${category.name} (${category.count})`,
  children: category.children?.map((item) => ({ value: item.itemClass, label: `${item.name} (${item.count})` })) || []
})))
const missingPlanResources = computed(() => {
  const resources = new Map()
  store.unpriced.flatMap((entry) => entry.missingPrices || []).forEach((resource) => {
    const item = typeof resource === 'string' ? { resourceId: resource, resourceName: resourceName(resource) } : resource
    if (item?.resourceId) resources.set(item.resourceId, { resourceId: item.resourceId, resourceName: item.resourceName || resourceName(item.resourceId) })
  })
  return [...resources.values()]
})

onMounted(async () => {
  try { await store.initialize(); await loadBases() } catch (error) { pageError.value = error?.message || '做装数据初始化失败' }
})
onBeforeUnmount(() => { clearTimeout(modifierTimer); store.dispose() })
watch([() => form.itemLevel, () => form.variant.kind, () => form.variant.influences.join(','), targets], () => {
  if (store.planning) store.cancelPlan()
}, { deep: true })

async function loadBases() {
  await store.searchBases({ query: String(baseQuery.query || ''), category: String(baseQuery.category || ''), itemClass: String(baseQuery.itemClass || ''), page: 1, pageSize: 50 })
}
async function categoryChanged(path = []) {
  baseQuery.category = String(path?.[0] || '')
  baseQuery.itemClass = String(path?.[1] || '')
  form.baseId = ''
  selectedBase.value = null
  targets.splice(0)
  await loadBases()
}
function searchBaseByName(query) { baseQuery.query = query; loadBases() }
async function selectBase(id) {
  selectedBase.value = store.bases.find((item) => item.id === id) || null
  targets.splice(0)
  await loadModifiers()
}
function variantChanged() { form.variant.influences = []; form.variant.fracturedTierId = null; targets.splice(0); loadModifiers() }
function debouncedLoadModifiers() { clearTimeout(modifierTimer); modifierTimer = setTimeout(loadModifiers, 250) }
async function loadModifiers() {
  if (!form.baseId) return
  try {
    const variant = plainVariant(form.variant.kind === 'fractured' && !form.variant.fracturedTierId ? 'pending' : form.variant.fracturedTierId)
    await store.searchModifiers({ baseId: String(form.baseId), itemLevel: Number(form.itemLevel), variant, query: String(modifierQuery.value || ''), sourcePolicy: String(modifierSource.value), affixType: modifierAffixType.value, page: 1, pageSize: 100 })
  } catch (error) { pageError.value = error?.message || '词缀查询失败' }
}
function addTarget(modifier) {
  if (targets.some((entry) => entry.modifier.id === modifier.id)) return ElMessage.info('该词缀已添加')
  targets.push({ modifier, minTier: modifier.tiers[0]?.tier || 1, sourcePolicy: modifierSource.value })
  if (form.variant.kind === 'fractured' && !form.variant.fracturedTierId) form.variant.fracturedTierId = modifier.tiers[0]?.id || null
}
async function calculate() {
  if (!canPlan.value) return
  try {
    await store.startPlan({
      baseId: String(form.baseId), itemLevel: Number(form.itemLevel), variant: plainVariant(),
      targets: targets.map((entry) => ({ modifierId: entry.modifier.id, minTier: entry.minTier, sourcePolicy: entry.sourcePolicy }))
    })
  } catch (error) { store.planning = false; pageError.value = error?.message || '无法启动计算' }
}
function plainVariant(fracturedTierId = form.variant.fracturedTierId) {
  return {
    kind: String(form.variant.kind),
    influences: [...form.variant.influences].map(String),
    fracturedTierId: fracturedTierId ? String(fracturedTierId) : null,
    implicits: [...form.variant.implicits].map(String)
  }
}
async function updateData() {
  try {
    await store.updateData()
    await loadBases()
    ElMessage.success('POEDB 文字数据已更新，更新过程未请求物品图片')
  } catch {}
}
async function refreshPrices() {
  refreshingPrices.value = true
  try { await store.refreshPrices(true); ElMessage.success('物价已刷新') } catch (error) { pageError.value = `物价刷新失败：${error?.message || '网络不可用'}` } finally { refreshingPrices.value = false }
}
async function savePrice(resourceId) {
  try { await store.setPriceOverride(resourceId, priceInputs[resourceId]); ElMessage.success('本地覆盖已保存') } catch (error) { ElMessage.error(error?.message || '覆盖价无效') }
}
async function removePrice(resourceId) { await store.removePriceOverride(resourceId); delete priceInputs[resourceId] }
function itemClassName(itemClass) {
  for (const category of store.categories) {
    const item = category.children?.find((entry) => entry.itemClass === itemClass)
    if (item) return item.name
  }
  return itemClass
}
function resourceName(resourceId) {
  return ({
    'currency:chaos': '混沌石', 'currency:divine': '神圣石', 'currency:exalted': '崇高石',
    'currency:alteration': '改造石', 'currency:augmentation': '增幅石', 'currency:regal': '富豪石',
    'currency:alchemy': '点金石', 'currency:scouring': '重铸石', 'currency:transmutation': '蜕变石',
    'currency:annulment': '剥离石'
  })[resourceId] || resourceId
}
function priceSourceLabel(source) { return ({ override: '本地覆盖', 'remote-buy-fallback': '公开买方均价回退', remote: '公开卖方均价' })[source] || '公开价格' }
function formatDate(value) { return value ? new Date(value).toLocaleString('zh-CN') : '暂无更新时间' }
function number(value) { return Number.isFinite(Number(value)) ? Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 2 }) : '—' }
function percent(value) { return Number.isFinite(Number(value)) ? `${(Number(value) * 100).toFixed(2)}%` : '—' }
</script>

<style scoped lang="less">
.planner-page { min-height: 100%; padding: 20px; color: var(--text-primary); }
.page-heading, .status-strip, .result-title, .plan-heading, .modifier-search, .selected-base { display: flex; align-items: center; }
.page-heading { justify-content: space-between; gap: 20px; margin-bottom: 14px; h2 { margin: 0 0 5px; font-size: 22px; } p { margin: 0; color: var(--text-secondary); } }
.status-strip { margin: 12px 0; padding: 10px 14px; gap: 9px; background: var(--el-fill-color-light); border-radius: 8px; div:first-child { min-width: 0; flex: 1; display: flex; flex-direction: column; } span { color: var(--text-secondary); font-size: 12px; } }
.workspace-grid { display: grid; grid-template-columns: minmax(560px, 1.1fr) minmax(400px, .9fr); gap: 16px; margin-top: 14px; align-items: start; }
.config-column { display: grid; gap: 16px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; .wide { grid-column: 1 / -1; } :deep(.el-select), :deep(.el-input-number) { width: 100%; } }
:deep(.el-select-dropdown__item small) { float: right; color: var(--text-secondary); }
.selected-base { gap: 12px; padding: 10px; border: 1px solid var(--el-border-color); border-radius: 8px; div { display: flex; flex-direction: column; } }
.modifier-search { gap: 10px; .el-input { flex: 1; } .el-select { width: 140px; } }
.affix-tabs { margin-top: 8px; :deep(.el-tabs__header) { margin-bottom: 6px; } }
.modifier-options { max-height: 235px; overflow: auto; margin: 12px 0; display: grid; gap: 6px; button { border: 1px solid var(--el-border-color); background: transparent; color: inherit; text-align: left; padding: 8px; border-radius: 6px; cursor: pointer; display: flex; flex-direction: column; gap: 4px; &:hover { border-color: var(--el-color-primary); } small { color: var(--text-secondary); } } }
.target-list { display: grid; gap: 8px; }
.target-row { display: grid; grid-template-columns: minmax(150px, 1fr) 190px 110px auto; gap: 8px; align-items: center; padding: 9px; background: var(--el-fill-color-light); border-radius: 6px; > div { display: flex; flex-direction: column; } small { color: var(--text-secondary); } }
.results-column { position: sticky; top: 12px; }
.result-title, .plan-heading { justify-content: space-between; gap: 10px; }
.plan-card { margin-top: 12px; padding: 13px; border: 1px solid var(--el-border-color); border-radius: 8px; &.recommended { border-color: var(--el-color-success); } }
.plan-heading > div { display: flex; gap: 7px; align-items: center; }
.metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin: 12px 0; span { padding: 6px; background: var(--el-fill-color-light); border-radius: 5px; font-size: 13px; } }
.confidence { font-size: 12px; color: var(--text-secondary); }
.resources { display: flex; flex-wrap: wrap; gap: 7px; span { padding: 4px 7px; background: var(--el-fill-color); border-radius: 4px; } }
ol { padding-left: 22px; li { margin: 9px 0; } small { color: var(--text-secondary); } }
.cancel-plan { width: 100%; margin-top: 12px; }
.price-row { display: grid; grid-template-columns: minmax(180px, 1fr) 120px 115px; gap: 9px; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--el-border-color-lighter); > div:first-child { display: flex; flex-direction: column; min-width: 0; } small { color: var(--el-color-success); &.invalid { color: var(--el-color-danger); } } }
.price-actions { display: flex; align-items: center; justify-content: flex-end; gap: 4px; white-space: nowrap; }
.manual-price { margin: 14px 0; padding: 10px; background: var(--el-fill-color-light); border-radius: 7px; > div { display: grid; grid-template-columns: minmax(180px, 1fr) 120px 60px; gap: 9px; align-items: center; margin-top: 8px; } span { display: flex; flex-direction: column; min-width: 0; } code { overflow-wrap: anywhere; color: var(--text-secondary); font-size: 11px; } }
@media (max-width: 1100px) { .workspace-grid { grid-template-columns: 1fr; } .results-column { position: static; } }
</style>
