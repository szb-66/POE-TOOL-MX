<template>
  <div class="dashboard-page">
    <header class="page-heading">
      <div>
        <h1>数据看板</h1>
        <p>集中查看模块运行、配置完整性与系统环境，并快速处理常用操作。</p>
      </div>
      <div class="heading-actions">
        <el-button :icon="Download" :loading="diagnosticsExporting" @click="exportDiagnostics">导出诊断</el-button>
        <el-button :icon="Refresh" :loading="refreshing" @click="refresh">刷新状态</el-button>
      </div>
    </header>

    <section class="summary-grid" aria-label="模块状态汇总">
      <article v-for="item in summaryItems" :key="item.state" :class="`summary-${item.state}`">
        <span class="summary-icon"><component :is="item.icon" /></span>
        <div><strong>{{ summary[item.state] }}</strong><span>{{ item.label }}</span></div>
      </article>
    </section>

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
        <div v-if="healthExpanded" class="health-list">
          <article v-for="item in healthItems" :key="item.id">
            <span class="health-dot" :class="item.status" />
            <div><strong>{{ item.label }}</strong><p>{{ item.text }}</p></div>
          </article>
        </div>
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

        <div class="module-grid">
          <ModuleStatusCard
            v-for="module in group.modules"
            :key="module.id"
            :module="module"
            :icon="moduleIcons[module.id]"
            @action="runAction"
            @open="openModule"
            @control="changeModuleControl"
          />
        </div>
      </section>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  Box,
  Briefcase,
  CircleCheck,
  Coin,
  Download,
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
  diagnosticsExporting,
  refresh,
  exportDiagnostics,
  runAction,
  changeModuleControl,
  openModule,
  openSettings
} = useDashboard()

const moduleGroups = computed(() => groupDashboardModules(modules.value))
</script>

<style scoped lang="less">
.dashboard-page {
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 22px;
  color: var(--text-primary);
  background:
    radial-gradient(circle at 90% 0, color-mix(in srgb, var(--el-color-primary) 8%, transparent), transparent 30%),
    var(--bg-secondary);
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}
.summary-grid article {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid var(--border-base);
  border-radius: 10px;
  background: var(--bg-primary);
}
.summary-icon {
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 9px;
  background: var(--el-fill-color);
  font-size: 19px;
}
.summary-grid strong { display: block; font-size: 22px; line-height: 1; }
.summary-grid span { color: var(--text-secondary); font-size: 12px; }
.summary-running .summary-icon { color: var(--el-color-success); background: var(--el-color-success-light-9); }
.summary-ready .summary-icon { color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.summary-attention .summary-icon { color: var(--el-color-warning); background: var(--el-color-warning-light-9); }
.summary-error .summary-icon { color: var(--el-color-danger); background: var(--el-color-danger-light-9); }

.health-panel {
  margin-bottom: 20px;
  border: 1px solid var(--border-base);
  border-radius: 10px;
  background: var(--bg-primary);
  overflow: hidden;
}
.health-panel.warning { border-color: var(--el-color-warning-light-5); }
.health-panel header { justify-content: space-between; min-height: 48px; padding: 0 14px; }
.health-panel header > div { gap: 8px; }
.health-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  border-top: 1px solid var(--border-base);
  background: var(--border-base);
}
.health-list article { display: flex; align-items: flex-start; gap: 9px; min-width: 0; padding: 12px 14px; background: var(--bg-primary); }
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
.module-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }

@media (max-width: 1100px) {
  .module-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 780px) {
  .dashboard-page { padding: 15px; }
  .page-heading { align-items: flex-start; }
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .health-list, .module-grid { grid-template-columns: 1fr; }
}
@media (max-width: 500px) {
  .page-heading { flex-direction: column; }
  .heading-actions { width: 100%; }
  .summary-grid { grid-template-columns: 1fr; }
}
</style>
