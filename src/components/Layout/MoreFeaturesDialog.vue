<template>
  <el-dialog :model-value="modelValue" class="more-features-dialog" width="min(620px, 92vw)" title="更多功能" append-to-body @update:model-value="emit('update:modelValue', $event)">
    <section class="feature-section" aria-labelledby="enabled-feature-heading">
      <h3 id="enabled-feature-heading">已添加功能</h3>
      <div v-if="featureStore.enabledFeatures.length" class="feature-grid">
        <article v-for="feature in featureStore.enabledFeatures" :key="feature.id" class="feature-card is-enabled" tabindex="0" role="button" :aria-label="`打开${feature.label}`" @click="openFeature(feature)" @keydown.enter.prevent="openFeature(feature)" @keydown.space.prevent="openFeature(feature)">
          <el-button class="feature-toggle" circle text type="danger" :loading="pendingId === feature.id" :aria-label="`取消添加${feature.label}`" :title="`取消添加${feature.label}`" @click.stop="removeFeature(feature)"><el-icon><Minus /></el-icon></el-button>
          <el-icon class="feature-icon"><component :is="featureIcons[feature.icon]" /></el-icon><span>{{ feature.label }}</span>
        </article>
      </div>
      <el-empty v-else :image-size="42" description="暂无已添加功能" />
    </section>
    <section class="feature-section" aria-labelledby="disabled-feature-heading">
      <h3 id="disabled-feature-heading">未添加功能</h3>
      <div v-if="featureStore.disabledFeatures.length" class="feature-grid">
        <article v-for="feature in featureStore.disabledFeatures" :key="feature.id" class="feature-card is-disabled" :aria-label="`${feature.label}未添加`">
          <el-button class="feature-toggle" circle text type="primary" :loading="pendingId === feature.id" :aria-label="`添加${feature.label}`" :title="`添加${feature.label}`" @click.stop="addFeature(feature)"><el-icon><Plus /></el-icon></el-button>
          <el-icon class="feature-icon"><component :is="featureIcons[feature.icon]" /></el-icon><span>{{ feature.label }}</span>
        </article>
      </div>
      <el-empty v-else :image-size="42" description="全部功能均已添加" />
    </section>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Box, Coin, Connection, DataAnalysis, FirstAidKit, Guide, MapLocation, Minus, Notebook, Operation, Plus, PriceTag, SetUp, ShoppingBag, SuitcaseLine } from '@element-plus/icons-vue'
import { useFeatureModulesStore } from '@/stores/featureModules'
import { disableFeatureModule, enableFeatureModule, isFeatureRuntimeBusy } from '@/features/featureRuntime.js'

defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue'])
const router = useRouter()
const featureStore = useFeatureModulesStore()
const pendingId = ref('')
const featureIcons = { Box, Coin, Connection, DataAnalysis, FirstAidKit, Guide, MapLocation, Notebook, Operation, PriceTag, SetUp, ShoppingBag, SuitcaseLine }

function openFeature(feature) { emit('update:modelValue', false); void router.push(feature.route) }

async function removeFeature(feature) {
  if (pendingId.value) return
  pendingId.value = feature.id
  try {
    if (await isFeatureRuntimeBusy(feature.id)) {
      try {
        await ElMessageBox.confirm(`${feature.label}正在运行。取消添加会立即安全停止相关任务，是否继续？`, `停止并取消添加${feature.label}`, { type: 'warning', confirmButtonText: '停止并取消添加', cancelButtonText: '取消' })
      } catch { return }
    }
    const result = await disableFeatureModule(feature.id, { store: featureStore, router })
    if (!result.success) ElMessage.error(`${feature.label}停用失败：${result.error}`)
  } finally { pendingId.value = '' }
}

async function addFeature(feature) {
  if (pendingId.value) return
  pendingId.value = feature.id
  try {
    const result = await enableFeatureModule(feature.id, { store: featureStore })
    if (result.warnings.length) ElMessage.warning(`${feature.label}已添加；${result.warnings.join('；')}`)
  } finally { pendingId.value = '' }
}
</script>

<style scoped lang="less">
.feature-section + .feature-section { margin-top: 22px; }
.feature-section h3 { margin: 0 0 10px; color: var(--text-secondary); font-size: 13px; font-weight: 500; }
.feature-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 10px; }
.feature-card { position: relative; display: flex; min-height: 92px; box-sizing: border-box; flex-direction: column; align-items: center; justify-content: center; gap: 9px; border: 1px solid var(--border-base); border-radius: 10px; color: var(--text-primary); background: var(--surface-2, var(--bg-secondary)); cursor: default; transition: border-color .15s ease, background-color .15s ease, transform .15s ease; }
.feature-card.is-enabled { cursor: pointer; }
.feature-card.is-enabled:hover { background: var(--surface-hover); transform: translateY(-1px); }
.feature-card:focus-visible { outline: 2px solid var(--brand-color); outline-offset: 2px; }
.feature-card.is-disabled { color: var(--text-secondary); }
.feature-icon { font-size: 26px; }
.feature-card > span { font-size: 13px; }
.feature-toggle { position: absolute; top: 5px; right: 5px; opacity: 0; transform: scale(.82); transition: opacity .15s ease, transform .15s ease; }
.feature-card:hover .feature-toggle, .feature-card:focus-within .feature-toggle { opacity: 1; transform: scale(1); }
@media (hover: none) { .feature-toggle { opacity: 1; transform: scale(1); } }
:deep(.el-empty) { padding: 8px 0 4px; }
</style>

<style lang="less">
.more-features-dialog .el-dialog__body { max-height: min(68vh, 680px); overflow-y: auto; padding-top: 8px; }
</style>
