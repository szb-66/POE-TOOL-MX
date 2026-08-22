<template>
  <div class="dashboard-page primary-page primary-page__scroll primary-page__content">
    <header class="page-heading">
      <div>
        <h1>数据看板</h1>
        <p>集中查看模块运行、配置完整性与系统环境，并快速处理常用操作。</p>
      </div>
      <div class="heading-actions">
        <el-button :icon="Refresh" :loading="refreshing" @click="refresh">刷新状态</el-button>
      </div>
    </header>

    <el-row class="summary-band" :gutter="0" aria-label="模块状态汇总">
      <el-col v-for="item in summaryItems" :key="item.state" tag="article" :xs="24" :sm="12" :md="6" :class="`summary-${item.state}`">
        <span class="summary-icon"><component :is="item.icon" /></span>
        <div><strong>{{ summary[item.state] }}</strong><span>{{ item.label }}</span></div>
      </el-col>
    </el-row>

    <section class="health-panel" :class="{ warning: healthHasIssues }">
      <header>
        <div>
          <el-icon><Monitor /></el-icon>
          <strong>系统环境</strong>
          <el-tag v-if="healthHasIssues" size="small" type="warning">需要关注</el-tag>
          <el-tag v-else size="small" type="success">全部正常</el-tag>
        </div>
        <div>
          <el-button v-if="healthHasIssues" size="small" text type="primary" @click="openSettings">前往设置</el-button>
          <el-button size="small" text @click="healthExpanded = !healthExpanded">
            {{ healthExpanded ? '收起' : '查看' }}
          </el-button>
        </div>
      </header>
      <el-collapse-transition>
        <el-row v-if="healthExpanded" class="health-list" :gutter="10">
          <el-col v-for="item in healthItems" :key="item.id" :xs="24" :sm="12" :md="8">
            <article class="health-card">
              <span class="health-dot" :class="item.status" />
              <div><strong>{{ item.label }}</strong><p>{{ item.text }}</p></div>
            </article>
          </el-col>
        </el-row>
      </el-collapse-transition>
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
              @open="openModule"
              @control="changeModuleControl"
            />
          </el-col>
        </el-row>
      </section>
    </section>

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  Box,
  Briefcase,
  CircleCheck,
  Coin,
  FirstAidKit,
  MapLocation,
  Monitor,
  Notebook,
  Refresh,
  ShoppingBag,
  Tools,
  VideoPlay,
  WarningFilled
} from '@element-plus/icons-vue'
import ModuleStatusCard from './components/ModuleStatusCard.vue'
import { groupDashboardModules } from './dashboardGroups'
import { useDashboard } from './useDashboard'
import { reportStartupEvent } from '../../utils/startupReporter'

const healthExpanded = ref(false)
const moduleIcons = {
  items: Box,
  bag: Briefcase,
  map: MapLocation,
  combat: FirstAidKit,
  story: Notebook,
  shop: ShoppingBag,
  priceCheck: Coin,
  crafting: Tools
}
const summaryItems = [
  { state: 'running', label: '运行中', icon: VideoPlay },
  { state: 'ready', label: '可用', icon: CircleCheck },
  { state: 'attention', label: '需配置', icon: Tools },
  { state: 'error', label: '异常', icon: WarningFilled }
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
  openSettings
} = useDashboard()

const moduleGroups = computed(() => groupDashboardModules(modules.value))

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
.heading-actions { display: flex; gap: 8px; }
h1 { margin: 0 0 5px; font-size: 25px; letter-spacing: .02em; }
.page-heading p { margin: 0; color: var(--text-secondary); font-size: 13px; }

.summary-band {
  margin-bottom: 14px;
  overflow: hidden;
  border: 1px solid var(--border-base);
  border-radius: 8px;
  background: var(--surface-1, var(--bg-primary));
  box-shadow: inset 0 1px rgba(255,255,255,.025);
}
.summary-band > .el-col {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 60px;
  padding: 10px 14px;
  border-right: 1px solid var(--border-base);
}
.summary-band > .el-col:last-child { border-right: 0; }
.summary-icon {
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 6px;
  font-size: 19px;
}
.summary-band strong { display: block; font-family: var(--font-numeric); font-size: 20px; line-height: 1; }
.summary-band span { color: var(--text-secondary); font-size: 12px; }
.summary-running .summary-icon { color: var(--el-color-success); }
.summary-ready .summary-icon { color: var(--el-color-primary); }
.summary-attention .summary-icon { color: var(--el-color-warning); }
.summary-error .summary-icon { color: var(--el-color-danger); }

.health-panel {
  margin-bottom: 20px;
  border: 1px solid var(--border-base);
  border-radius: 8px;
  background: var(--surface-1, var(--bg-primary));
  box-shadow: inset 0 1px rgba(255,255,255,.025);
  overflow: hidden;
}
.health-panel.warning { border-color: var(--el-color-warning-light-5); }
.health-panel header { justify-content: space-between; min-height: 48px; padding: 0 14px; }
.health-panel header > div { gap: 8px; }
.health-list {
  margin: 0 !important;
  row-gap: 10px;
  padding: 10px 5px;
  border-top: 1px solid var(--border-base);
  background: var(--surface-1, var(--bg-primary));
}
.health-list > .el-col { min-width: 0; }
.health-card {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  min-width: 0;
  min-height: 58px;
  box-sizing: border-box;
  margin: 0;
  padding: 10px 12px;
  border: 1px solid var(--border-base);
  border-radius: 6px;
  background: var(--surface-2, var(--el-fill-color-light));
}
.health-list strong { font-size: 12px; }
.health-list p { overflow: hidden; margin: 3px 0 0; color: var(--text-secondary); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.health-dot { flex: 0 0 8px; width: 8px; height: 8px; margin-top: 5px; border-radius: 50%; background: var(--el-color-info); }
.health-dot.ready { background: var(--el-color-success); }
.health-dot.attention, .health-dot.pending { background: var(--el-color-warning); }
.health-dot.error { background: var(--el-color-danger); }

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
  .summary-band > .el-col:nth-child(2) { border-right: 0; }
  .summary-band > .el-col:nth-child(-n+2) { border-bottom: 1px solid var(--border-base); }
}
@media (max-width: 500px) {
  .page-heading { flex-direction: column; }
  .heading-actions { width: 100%; }
  .summary-band > .el-col { border-right: 0; border-bottom: 1px solid var(--border-base); }
  .summary-band > .el-col:last-child { border-bottom: 0; }
}
</style>
