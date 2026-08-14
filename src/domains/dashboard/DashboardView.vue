<template>
  <div class="dashboard-page primary-page primary-page__scroll primary-page__content">
    <header class="page-heading">
      <div>
        <h1>数据看板</h1>
        <p>集中查看模块运行、配置完整性与系统环境，并快速处理常用操作。</p>
      </div>
      <div class="heading-actions">
        <el-button :icon="Download" :loading="diagnosticsExporting" @click="exportDiagnostics()">导出当前诊断</el-button>
        <el-button
          v-if="!diagnosticCapture"
          type="primary"
          :loading="diagnosticCaptureLoading"
          @click="captureDialogVisible = true"
        >开始诊断会话</el-button>
        <template v-else>
          <el-button
            type="warning"
            :loading="diagnosticCaptureLoading || diagnosticsExporting"
            @click="finishAndExportDiagnosticCapture"
          >{{ diagnosticCapture.status === 'active' ? '结束并导出' : '导出诊断会话' }}</el-button>
          <el-button @click="cancelDiagnosticCapture">取消会话</el-button>
        </template>
        <el-button :icon="Refresh" :loading="refreshing" @click="refresh">刷新状态</el-button>
      </div>
    </header>

    <el-alert
      v-if="diagnosticCapture"
      class="capture-alert"
      :closable="false"
      :type="diagnosticCapture.status === 'active' ? 'warning' : 'info'"
      :title="captureStatusText"
    />

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

    <el-dialog v-model="captureDialogVisible" title="开始诊断会话" width="420px">
      <el-form label-position="top">
        <el-form-item label="受影响模块" required>
          <el-select v-model="captureArea" placeholder="请选择模块" style="width: 100%">
            <el-option v-for="item in captureAreas" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="问题现象" required>
          <el-select v-model="captureSymptom" placeholder="请选择现象" style="width: 100%">
            <el-option v-for="item in captureSymptoms" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-alert :closable="false" type="info" title="会话最长 15 分钟，仅记录结构化故障与恢复事件。" />
      </el-form>
      <template #footer>
        <el-button @click="captureDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!captureArea || !captureSymptom" @click="beginCapture">开始</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
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
import { reportStartupEvent } from '../../utils/startupReporter'

const healthExpanded = ref(false)
const captureDialogVisible = ref(false)
const captureArea = ref('')
const captureSymptom = ref('')
const captureAreas = [
  { value: 'system', label: '系统环境' }, { value: 'shortcuts', label: '快捷键' },
  { value: 'items', label: '物品制作' }, { value: 'bag', label: '背包入库' },
  { value: 'map', label: '地图洗图' }, { value: 'combat', label: '战斗辅助' },
  { value: 'story', label: '剧情指引' }, { value: 'shop', label: '商城配方' },
  { value: 'priceCheck', label: '国服查价' }, { value: 'crafting', label: '做装模拟' },
  { value: 'stashPickup', label: '仓库取件' }, { value: 'puzzle', label: '海图拼图' },
  { value: 'junfeng', label: '君锋镇取件' }
]
const captureSymptoms = [
  { value: 'cannot_start', label: '无法启动' }, { value: 'wrong_result', label: '结果错误' },
  { value: 'stops_during_use', label: '中途停止' }, { value: 'slow_or_stuck', label: '卡顿' },
  { value: 'intermittent', label: '偶发失效' }, { value: 'crash_or_exit', label: '崩溃退出' },
  { value: 'other_unexpected', label: '其他异常' }
]
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
  diagnosticCapture,
  diagnosticCaptureLoading,
  refresh,
  exportDiagnostics,
  startDiagnosticCapture,
  finishAndExportDiagnosticCapture,
  cancelDiagnosticCapture,
  runAction,
  changeModuleControl,
  openModule,
  openSettings
} = useDashboard()

const captureStatusText = computed(() => {
  if (!diagnosticCapture.value) return ''
  const labels = { active: '诊断会话正在记录，请复现问题后结束并导出。', completed: '诊断会话已结束，可以导出。',
    timed_out: '诊断会话已达到 15 分钟上限，可以导出已记录内容。', interrupted: '检测到上次异常中断的诊断会话，可以导出。' }
  return labels[diagnosticCapture.value.status] || '诊断会话可以导出。'
})

async function beginCapture() {
  if (await startDiagnosticCapture(captureArea.value, captureSymptom.value)) {
    captureDialogVisible.value = false
    captureArea.value = ''
    captureSymptom.value = ''
  }
}

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
.capture-alert { margin-bottom: 14px; }
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
