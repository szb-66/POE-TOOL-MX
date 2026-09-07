<template>
  <el-drawer :model-value="modelValue" title="历史战绩" size="min(960px, 92vw)" @update:model-value="$emit('update:modelValue', $event)" @open="load">
    <div class="tracker-drawer">
      <el-card shadow="never">
        <template #header><div class="heading"><strong>历史记录</strong><el-button @click="exportCsv">导出当前筛选 CSV</el-button></div></template>
        <el-form class="filters" inline><el-form-item label="地图"><el-input v-model="filters.map" clearable /></el-form-item><el-form-item label="日期"><el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" /></el-form-item><el-button type="primary" @click="search">筛选</el-button></el-form>
        <el-alert v-for="message in store.history.errors" :key="message" :title="message" type="error" :closable="false" />
        <el-table :data="store.history.items" stripe>
          <el-table-column type="expand"><template #default="{ row }"><dl class="details"><div><dt>内部区域 ID</dt><dd>{{ row.areaId }}</dd></div><div><dt>结束原因</dt><dd>{{ endReason(row.endReason) }}</dd></div></dl></template></el-table-column>
          <el-table-column prop="startedAt" label="日期时间" width="170" show-overflow-tooltip /><el-table-column label="地图" min-width="130" show-overflow-tooltip><template #default="{ row }">{{ mapLabel(row.areaName) }}</template></el-table-column><el-table-column label="阶级/等级" width="100"><template #default="{ row }">{{ tierAndLevel(row) }}</template></el-table-column><el-table-column label="时长" width="80"><template #default="{ row }">{{ duration(row.activeDurationMs) }}</template></el-table-column><el-table-column label="等级收益系数" width="90"><template #default="{ row }">{{ row.experienceEfficiency == null ? '未采集' : `${Math.round(row.experienceEfficiency * 100)}%` }}</template></el-table-column><el-table-column prop="deaths" label="死亡" width="65" /><el-table-column prop="portalsUsed" label="传送门" width="75" />
          <el-table-column label="本图采样净经验" width="130"><template #default="{ row }">{{ runExperienceDelta(row)?.toLocaleString() ?? '未采集' }}</template></el-table-column>
          <el-table-column label="采样折算经验/时" width="130"><template #default="{ row }">{{ runExperiencePerHour(row)?.toLocaleString() ?? '未采集' }}</template></el-table-column>
          <el-table-column label="操作" width="130" fixed="right"><template #default="{ row }"><el-button link type="danger" @click="remove(row)">删除</el-button></template></el-table-column>
        </el-table>
        <el-pagination v-model:current-page="filters.page" v-model:page-size="filters.pageSize" layout="total, sizes, prev, pager, next" :total="store.history.total" :page-sizes="[15, 25, 50, 100]" @change="search" />
      </el-card>
    </div>
  </el-drawer>
</template>
<script setup>
import { mapLabel } from '../../../shared/mapTrackerLabels.js'
import { reactive, ref, watch } from 'vue'
import { runExperienceDelta, runExperiencePerHour } from '../../../shared/experienceStatistics.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { electronApi } from '@/api/electron.js'
import { useMapTrackerStore } from '@/stores/mapTracker.js'
const props = defineProps({ modelValue: Boolean }); defineEmits(['update:modelValue'])
const store = useMapTrackerStore(); const dateRange = ref([]); const filters = reactive({ map: '', from: '', to: '', page: 1, pageSize: 25 })
const duration = value => { const seconds = Math.floor((Number(value) || 0) / 1000); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` }
const tierAndLevel = row => [Number.isInteger(row.mapTier) ? `T${row.mapTier}` : '', Number.isInteger(row.areaLevel) ? `Lv.${row.areaLevel}` : ''].filter(Boolean).join(' · ') || '未采集'
const endReason = value => ({ manual: '手动保存', disabled: '关闭追踪', 'next-map': '进入新地图', 'app-exit': '应用退出', 'area-left': '离开地图', disconnect: '游戏断线', 'process-exit': '游戏退出' }[value] || value || '未记录')
function queryInput(){ return { ...filters, from: dateRange.value?.[0] ? `${dateRange.value[0]}T00:00:00.000Z` : '', to: dateRange.value?.[1] ? `${dateRange.value[1]}T23:59:59.999Z` : '' } }
const load = async () => { try { await Promise.all([store.refresh(), store.query(queryInput())]) } catch (error) { ElMessage.error(error.message) } }
const search = () => store.query(queryInput())
watch(() => store.snapshot.historyRevision, () => { if (props.modelValue) void search().catch(error => ElMessage.error(error.message)) })
async function remove(row){ await ElMessageBox.confirm(`确定删除“${row.areaName}”记录？`, '删除记录', { type: 'warning' }); const result = await electronApi.mapTracker.remove(row.id, true); if (result?.success === false) throw new Error(result.error?.message); await search() }
async function exportCsv(){ const result = await electronApi.mapTracker.exportCsv(queryInput()); if (result?.success === false) throw new Error(result.error?.message); if (!result?.data?.canceled) ElMessage.success(`已导出 ${result.data.count} 条记录`) }
</script>

<style scoped lang="less">
.tracker-drawer{display:grid;gap:14px}.heading{display:flex;align-items:center;justify-content:space-between;gap:10px}.filters{display:flex;flex-wrap:wrap}.details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 18px;padding:8px 18px}.details div{min-width:0}.details dt{color:var(--text-secondary)}.details dd{margin:3px 0;overflow-wrap:anywhere}.el-pagination{justify-content:flex-end;margin-top:14px}@media(max-width:700px){.details{grid-template-columns:1fr}.filters :deep(.el-form-item){width:100%;margin-right:0}.filters :deep(.el-input),.filters :deep(.el-date-editor){width:100%}}
</style>
