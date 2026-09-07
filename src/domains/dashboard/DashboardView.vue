<template>
  <div class="dashboard-page primary-page primary-page__scroll primary-page__content">
    <header class="page-heading">
      <div>
        <h1>数据看板</h1>
        <p>记录每一张地图，观察今日刷图节奏与角色成长。</p>
      </div>
    </header>

    <MapTrackerDashboard @configure="mapTrackerSettingsVisible = true; mapTrackerDetailsVisible = false" @history="mapTrackerDetailsVisible = true; mapTrackerSettingsVisible = false" />


    <section class="health-panel" :class="{ warning: healthHasIssues }">
      <header>
        <div>
          <el-icon><Monitor /></el-icon>
          <strong>运行与系统环境</strong>
          <el-tag v-if="healthHasIssues" size="small" type="warning">需要关注</el-tag>
          <el-tag v-else size="small" type="success">全部正常</el-tag>
        </div>
        <el-button size="small" :icon="Refresh" :loading="refreshing" @click="refresh">刷新状态</el-button>
      </header>
      <div class="summary-band" aria-label="模块状态汇总">
        <button v-for="item in summaryItems" :key="item.state" type="button" :class="`summary-${item.state}`" aria-haspopup="dialog" @click="selectedState = item.state">
          <span class="summary-icon"><component :is="item.icon" /></span>
          <span class="summary-copy">
            <strong>{{ item.state === 'environment' ? (healthHasIssues ? '需要关注' : '全部正常') : summary[item.state] }}</strong>
            <span>{{ item.label }}</span>
          </span>
          <el-icon class="summary-arrow"><ArrowRight /></el-icon>
        </button>
      </div>
    </section>

    <section class="business-sections" aria-label="业务模块">
      <section
        v-for="group in moduleGroups"
        :key="group.id"
        class="module-section"
        :aria-labelledby="`module-group-${group.id}`"
      >
        <div class="section-title">
          <div>
            <h2 :id="`module-group-${group.id}`">{{ group.title }}</h2>
            <span>{{ group.modules.length }} 个模块</span>
          </div>
        </div>

        <el-row class="module-grid app-grid" :gutter="16">
          <el-col v-for="module in group.modules" :key="module.id" :xs="24" :sm="12" :md="8">
            <ModuleStatusCard
              :module="module"
              :icon="moduleIcons[module.id]"
              @action="runAction"
              @open="openDashboardModule"
              @control="changeModuleControl"
            />
          </el-col>
        </el-row>
      </section>
    </section>

    <DashboardStatusDialog
      v-for="item in summaryItems"
      :key="item.state"
      :model-value="selectedState === item.state"
      :kind="item.state"
      :modules="modules.filter(module => module.state === item.state)"
      :health-items="healthItems"
      :module-icons="moduleIcons"
      @update:model-value="value => { if (!value) selectedState = '' }"
      @open-module="module => openAfterDetailsClose(() => openDashboardModule(module))"
      @open-health="action => openAfterDetailsClose(() => openHealthAction(action))"
      @closed="finishDetailsClose"
    />
    <MapTrackerDrawer v-model="mapTrackerDetailsVisible" />
    <MapTrackerSettingsDrawer v-model="mapTrackerSettingsVisible" />

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  ArrowRight,
  Box,
  Briefcase,
  Coin,
  FirstAidKit,
  MapLocation,
  LocationInformation,
  Monitor,
  Notebook,
  Refresh,
  ShoppingBag,
  Tools,
  VideoPlay,
  WarningFilled
} from '@element-plus/icons-vue'
import DashboardStatusDialog from './components/DashboardStatusDialog.vue'
import ModuleStatusCard from './components/ModuleStatusCard.vue'
import MapTrackerSettingsDrawer from '@/domains/mapTracker/MapTrackerSettingsDrawer.vue'
import MapTrackerDrawer from '@/domains/mapTracker/MapTrackerDrawer.vue'
import MapTrackerDashboard from '@/domains/mapTracker/MapTrackerDashboard.vue'
import { groupDashboardModules } from './dashboardGroups'
import { useDashboard } from './useDashboard'
import { reportStartupEvent } from '../../utils/startupReporter'

const emit = defineEmits(['open-health-help'])
const selectedState = ref('')
const mapTrackerDetailsVisible = ref(false)
const mapTrackerSettingsVisible = ref(false)
const moduleIcons = {
  items: Box,
  bag: Briefcase,
  map: MapLocation,
  mapTracker: LocationInformation,
  combat: FirstAidKit,
  story: Notebook,
  shop: ShoppingBag,
  priceCheck: Coin,
  crafting: Tools
}
const summaryItems = [
  { state: 'running', label: '运行中', icon: VideoPlay },
  { state: 'error', label: '异常', icon: WarningFilled },
  { state: 'environment', label: '系统环境', icon: Monitor }
]

const {
  modules,
  summary,
  healthItems,
  healthHasIssues,
  refreshing,
  refresh,
  runAction,
  changeModuleControl,
  openModule,
  openHealthAction
} = useDashboard({ openHelp: topicId => emit('open-health-help', topicId) })

let pendingDetailsAction = null
const openAfterDetailsClose = action => {
  pendingDetailsAction = action
  selectedState.value = ''
}
const finishDetailsClose = () => {
  const action = pendingDetailsAction
  pendingDetailsAction = null
  action?.()
}

const moduleGroups = computed(() => groupDashboardModules(modules.value))
const openDashboardModule = module => {
  if (module.id === 'mapTracker' && !module.featureDisabled) { mapTrackerSettingsVisible.value = true; return }
  return openModule(module)
}

onMounted(() => reportStartupEvent('dashboard-ready'))
</script>

<style scoped lang="less">
.dashboard-page {
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 20px;
  color: var(--text-primary);
  background: var(--app-bg, var(--bg-secondary));
}
.page-heading,
.health-panel header,
.health-panel header > div,
.section-title,
.section-title > div {
  display: flex;
  align-items: center;
}
.page-heading { justify-content: space-between; gap: 20px; margin-bottom: 18px; }
h1 { margin: 0 0 5px; font-size: 25px; letter-spacing: .02em; }
.page-heading p { margin: 0; color: var(--text-secondary); font-size: 13px; }

.summary-band {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0 16px 16px;
  overflow: hidden;
  border: 1px solid var(--border-base);
  border-radius: 8px;
  background: var(--surface-1, var(--bg-primary));
}
.summary-band > button {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  min-height: 76px;
  padding: 14px 18px;
  border: 0;
  border-right: 1px solid var(--border-base);
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background .15s ease;
}
.summary-band > button:last-child { border-right: 0; }
.summary-band > button:hover { background: var(--surface-2, var(--el-fill-color-light)); }
.summary-band > button:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -3px; }
.summary-icon { display: grid; flex: 0 0 36px; width: 36px; height: 36px; place-items: center; }
.summary-icon svg { width: 28px; height: 28px; }
.summary-copy { min-width: 0; }
.summary-copy strong { display: block; font-family: var(--font-numeric); font-size: 22px; line-height: 1.3; }
.summary-copy > span { display: block; margin-top: 4px; color: var(--text-secondary); font-size: 12px; }
.summary-arrow { margin-left: auto; color: var(--text-secondary); }
.summary-running .summary-icon { color: var(--el-color-success); }
.summary-error .summary-icon { color: var(--el-color-danger); }
.summary-environment .summary-icon { color: var(--el-color-primary); }
.summary-environment .summary-copy strong { font-family: inherit; font-size: 16px; }

.health-panel {
  margin-bottom: 20px;
  border: 1px solid var(--border-base);
  border-radius: 8px;
  background: var(--surface-1, var(--bg-primary));
  box-shadow: inset 0 1px rgba(255,255,255,.025);
  overflow: hidden;
}
.health-panel.warning { border-color: var(--el-color-warning-light-5); }
.health-panel header { justify-content: space-between; gap: 12px; min-height: 52px; padding: 0 16px; }
.health-panel header > div { gap: 8px; flex-wrap: wrap; }

.business-sections { display: grid; gap: 22px; padding-bottom: 4px; }
.module-section { min-width: 0; }
.section-title { justify-content: space-between; gap: 12px; margin: 0 1px 11px; }
.section-title > div { gap: 9px; }
.section-title h2 { margin: 0; font-size: 17px; }
.section-title span, .section-title small { color: var(--text-secondary); font-size: 12px; }
.module-grid { margin-bottom: 0; }
.module-grid > .el-col { display: flex; }
.module-grid :deep(.module-card) { width: 100%; }

@media (max-width: 780px) {
  .dashboard-page { padding: 15px; }
  .page-heading { align-items: flex-start; }
  .summary-band { grid-template-columns: 1fr; }
  .summary-band > button { border-right: 0; border-bottom: 1px solid var(--border-base); }
  .summary-band > button:last-child { border-bottom: 0; }
}
@media (max-width: 500px) {
  .health-panel header { align-items: flex-start; padding-top: 12px; padding-bottom: 12px; }
}
</style>
