<template>
  <section class="mapping-dashboard" :class="{ collapsed: !store.enabled }" aria-label="刷图数据大盘">
    <header><h2>今日刷图</h2><div class="actions"><el-switch :model-value="store.enabled" :disabled="store.busy" active-text="地图追踪" @change="enable" /><el-button @click="$emit('configure')">刷图设置</el-button><el-button @click="$emit('history')">历史战绩</el-button></div></header>
    <template v-if="store.enabled">
    <div class="metrics" aria-label="今日统计指标">
      <button v-for="metric in metrics" :key="metric.key" type="button" :class="{ selected: selectedMetric === metric.key }" :aria-pressed="selectedMetric === metric.key" aria-controls="mapping-metric-content" @click="selectedMetric = metric.key">
        <span>{{ metric.label }}</span><strong>{{ metric.value }}<small v-if="metric.unit"> {{ metric.unit }}</small></strong>
      </button>
    </div>
    <section id="mapping-metric-content" class="metric-content" :aria-label="panelTitle">
      <div class="chart-heading"><strong>{{ panelTitle }}</strong><div class="range-options" aria-label="最近时间范围"><button v-for="hours in [24, 6, 1]" :key="hours" type="button" :aria-pressed="selectedHours === hours" :class="{ selected: selectedHours === hours }" @click="selectedHours = hours">{{ hours }} 小时</button></div></div>
      <p>最近 {{ selectedHours }} 小时 · {{ timeLabel(panel.start) }} — {{ timeLabel(panel.end) }}</p>
      <template v-if="selectedMetric === 'count' || selectedMetric === 'loot'">
        <div v-if="barTotal" class="hour-chart" :aria-label="panelTitle">
          <div v-for="(bucket, index) in panel.buckets" :key="index" class="hour" tabindex="0" :title="`${timeLabel(bucket.start)} — ${timeLabel(bucket.end)} · ${bucket[selectedMetric]} ${selectedMetric === 'count' ? '张' : '件'}`" :aria-label="`${timeLabel(bucket.start)}：${bucket[selectedMetric]}${selectedMetric === 'count' ? '张' : '件'}`">
            <span class="bar-value">{{ bucket[selectedMetric] || '' }}</span><span class="bar" :style="{ height: `${bucket[selectedMetric] / peak * 110}px` }"/><small>{{ index % labelInterval === 0 ? shortTime(bucket.start) : '' }}</small>
          </div>
        </div>
        <p v-else class="empty-state">{{ selectedMetric === 'count' ? '所选时段暂无完成地图' : '所选时段暂无入库记录' }}</p>
        <template v-if="selectedMetric === 'loot'">
          <el-table :data="panel.items" max-height="320" stripe empty-text="所选时段暂无入库记录" aria-label="入库物品明细">
            <el-table-column prop="name" label="物品名称" min-width="160"/><el-table-column prop="baseType" label="基底" min-width="140"><template #default="{ row }">{{ row.baseType || '—' }}</template></el-table-column><el-table-column prop="quantity" label="累计数量" width="110"/>
          </el-table>
        </template>
      </template>
      <template v-else-if="selectedMetric === 'experience'">
        <p>{{ store.snapshot.settings.selectedCharacter?.name || '经验未采集' }} · 每图结算采样 · 时段净变化：{{ panel.experience.delta?.toLocaleString() ?? '未采集' }}</p>
        <div v-if="experiencePoints.length > 1" class="experience-plot">
          <div class="chart-heading"><small>{{ experienceChart.maximum.toLocaleString() }}</small><small>净经验</small></div>
          <svg viewBox="0 0 600 110" preserveAspectRatio="none" role="img" aria-label="经验增长走势"><path :d="`M0 ${experienceChart.zeroY}H600`" class="baseline"/><polyline :points="experienceChart.line" class="experience-line"/><circle v-for="(point, index) in experienceChart.points" :key="index" :cx="point.x" :cy="point.y" r="3" class="experience-point"><title>{{ timeLabel(point.at) }} · {{ point.value.toLocaleString() }}</title></circle></svg>
          <small>{{ experienceChart.minimum.toLocaleString() }}</small>
        </div>
        <p v-else class="empty-state">未采集：所选时段有效经验采样不足，不估算缺失经验。</p>
      </template>
      <el-table v-else :data="panel.durations" max-height="380" stripe empty-text="所选时段暂无完成地图" aria-label="地图平均用时">
        <el-table-column label="地图名称" min-width="140"><template #default="{ row }">{{ mapLabel(row.name) }}</template></el-table-column><el-table-column label="阶级" width="85"><template #default="{ row }">{{ row.mapTier == null ? '未采集' : `T${row.mapTier}` }}</template></el-table-column><el-table-column prop="count" label="完成次数" width="100"/><el-table-column label="总有效用时" min-width="120"><template #default="{ row }">{{ duration(row.totalDurationMs) }}</template></el-table-column><el-table-column label="平均用时" min-width="110"><template #default="{ row }">{{ duration(row.averageDurationMs) }}</template></el-table-column>
      </el-table>
    </section>
    </template>
    <el-alert v-if="store.error || store.snapshot.errors?.length" :title="store.error || store.snapshot.errors.join('；')" type="error" :closable="false" />
  </section>
</template>
<script setup>
import { mapLabel } from '../../../shared/mapTrackerLabels.js'
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useMapTrackerStore } from '@/stores/mapTracker.js'
defineEmits(['configure', 'history'])
const store = useMapTrackerStore()
const summary = computed(() => store.snapshot.summary || {})
const selectedMetric = ref('count')
const selectedHours = ref(24)
const metrics = computed(() => [
  { key: 'count', label: '今日完成', value: summary.value.todayCount || 0, unit: '张' },
  { key: 'loot', label: '今日入库', value: summary.value.todayLoot || 0, unit: '件' },
  { key: 'experience', label: '今日经验', value: summary.value.experienceGrowth?.toLocaleString() ?? '未采集' },
  { key: 'duration', label: '平均用时', value: summary.value.todayCount ? duration(summary.value.averageDurationMs) : '暂无' }
])
const panelTitle = computed(() => ({ count: '完成地图趋势', loot: '入库物品记录', experience: '经验增长走势', duration: '各地图平均用时' }[selectedMetric.value]))
const panel = computed(() => summary.value.windows?.[selectedHours.value] || { buckets: [], items: [], durations: [], experience: { points: [], delta: null } })
const barTotal = computed(() => panel.value.buckets.reduce((total, bucket) => total + (bucket[selectedMetric.value] || 0), 0))
const peak = computed(() => Math.max(1, ...panel.value.buckets.map(bucket => bucket[selectedMetric.value] || 0)))
const labelInterval = computed(() => Math.max(1, Math.ceil(panel.value.buckets.length / 6)))
const experiencePoints = computed(() => panel.value.experience.points)
const experienceChart = computed(() => {
  const values = experiencePoints.value.map(point => point.value)
  const minimum = Math.min(0, ...values); const maximum = Math.max(0, ...values)
  const y = value => 100 - (value - minimum) / Math.max(1, maximum - minimum) * 90
  const points = experiencePoints.value.map(point => ({ ...point, x: (Date.parse(point.at) - panel.value.start) / Math.max(1, panel.value.end - panel.value.start) * 600, y: y(point.value) }))
  return { minimum, maximum, zeroY: y(0), points, line: points.map(point => `${point.x},${point.y}`).join(' ') }
})
const timeLabel = value => value == null ? '—' : new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
const shortTime = value => new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
const duration = value => { const seconds = Math.floor((Number(value) || 0) / 1000); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` }
async function enable(value) { try { await store.setEnabled(value) } catch (error) { ElMessage.error(error.message) } }
</script>
<style scoped>
.mapping-dashboard{margin-bottom:22px;padding:26px;border:1px solid var(--border-base);border-radius:16px;background:radial-gradient(ellipse at top right,rgba(176,139,76,.18),transparent 65%),var(--surface-1,var(--bg-primary));color:var(--text-primary)}
.mapping-dashboard.collapsed{padding:12px 18px}.collapsed h2{font-size:18px;margin:0}
.actions :deep(.el-button){margin-left:16px}
header,.actions,.chart-heading{display:flex;align-items:center;justify-content:space-between;gap:16px}header small{color:#b08b4c;letter-spacing:.15em}h2{font-size:30px;margin:8px 0}p,.chart-heading small{font-size:12px;color:var(--text-secondary)}
.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin:24px 0;gap:12px}.metrics button{display:grid;gap:12px;text-align:left;padding:18px;min-width:0;border:1px solid var(--border-base);border-radius:10px;background:transparent;color:inherit;cursor:pointer;font-family:inherit}.metrics button:hover{background:rgba(176,139,76,.08)}.metrics button.selected{border-color:#b08b4c;background:rgba(176,139,76,.14);box-shadow:inset 0 -3px #b08b4c}.metrics span{font-size:12px;color:var(--text-secondary)}.metrics strong{font-size:clamp(18px,2.3vw,32px);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.metrics small{font-size:13px;font-weight:400}
.range-options{display:flex;gap:4px;flex-shrink:0}.range-options button{border:1px solid var(--border-base);background:transparent;color:var(--text-secondary);border-radius:6px;padding:7px 12px;cursor:pointer}.range-options button.selected{background:rgba(176,139,76,.18);border-color:#b08b4c;color:var(--text-primary)}button:focus-visible,.hour:focus-visible{outline:2px solid #b08b4c;outline-offset:3px}.metric-content{padding:0 0 18px}.empty-state{padding:40px 0;text-align:center}
.hour-chart{height:166px;display:flex;align-items:end;gap:6px;margin:20px 0}.hour{flex:1;display:flex;flex-direction:column;justify-content:end;min-width:0;gap:7px}.bar{display:block;background:linear-gradient(#c3a26a,#88724d);border-radius:3px 3px 0 0}.hour small{height:15px;font-size:10px;color:var(--text-secondary);white-space:nowrap}.bar-value{font-size:10px;text-align:center;overflow:hidden;color:var(--text-secondary)}
.experience-plot small{color:var(--text-secondary);font-size:12px}.experience-plot svg{display:block;width:100%;height:150px;margin:8px 0}.baseline{stroke:var(--border-base);stroke-width:1}.experience-line{fill:none;stroke:#78bfa3;stroke-width:2;vector-effect:non-scaling-stroke}.experience-point{fill:#78bfa3}
@media(max-width:800px){header{align-items:start;flex-direction:column}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.mapping-dashboard{padding:18px}.actions{flex-wrap:wrap}}@media(max-width:500px){.metric-content>.chart-heading{align-items:start;flex-direction:column}.metrics button{padding:12px}.hour-chart{gap:3px}}
</style>
