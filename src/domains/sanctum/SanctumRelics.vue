<template>
<section class="sanctum-section">
          <div class="toolbar">
            <el-button :disabled="store.readOnly || store.busy || !store.state.relicCalibrations?.altar" @click="perform('scanRelics', 'altar')">扫描祭坛</el-button>
            <el-button :disabled="store.readOnly || store.busy || !store.state.relicCalibrations?.locker" @click="perform('scanRelics', 'locker')">扫描当前仓库页</el-button>
            <span>点击后切回游戏；只复制文本，不移动或装备圣物。</span>
          </div>
          <el-card shadow="never"><template #header><div class="section-heading"><b>实际祭坛</b><el-tag :type="store.state.altar.confirmed ? 'success' : 'warning'">{{ store.state.altar.confirmed ? '已确认装备' : '待扫描确认' }}</el-tag></div></template>
            <SanctumAltarGrid :width="store.state.altar.width" :height="store.state.altar.height" :unlocked="store.state.altar.unlocked" :placements="store.state.altar.items" :inventory="store.state.inventory" :selected-id="selectedRelicId" @select="selectedRelicId = $event" />
          </el-card>
          <div class="toolbar"><label for="sanctum-target-level">搭配目标区域等级（可选）</label>
            <el-input-number id="sanctum-target-level" :model-value="store.state.loadoutPreferences.targetAreaLevel ?? null" :min="1" :max="100" :precision="0"
              :disabled="store.readOnly || store.busy" @change="value => perform('saveLoadoutPreferences', { ...store.state.loadoutPreferences, targetAreaLevel: value ?? null })" />
            <span>仅约束候选，不修改游戏状态；留空使用已确认的当前区域等级。</span>
          </div>
          <p>揭图搭配比较额外揭示房间数；速刷搭配比较遗物数量增幅。先固定需要保留的续航圣物，候选不代表实际装备。</p>
          <div class="toolbar"><el-input v-model="filter" placeholder="筛选名称、底材或词缀" clearable style="max-width: 360px" />
            <el-button type="primary" :disabled="store.readOnly || !store.state.inventory.some(item => item.status === 'matched')" :loading="store.state.solving" @click="perform('solveLoadout')">推荐搭配</el-button>
            <el-button :disabled="store.readOnly || !store.state.solving" @click="perform('cancelSolve')">取消求解</el-button>
            <el-button @click="perform('saveLoadoutPreferences', { fixed: [], excluded: [], selectedUniques: [] })" :disabled="store.readOnly">清空搭配约束</el-button></div>
          <el-table :data="filteredItems" empty-text="尚无圣物，请打开游戏祭坛或仓库后扫描" row-key="id">
            <el-table-column label="圣物"><template #default="{ row }">{{ row.name || row.baseId || '未识别' }}<small>{{ (row.modifiers || []).slice(0, 2).map(mod => mod.rawText).join(' · ') || '词缀待确认' }}</small><el-button link type="primary" @click="selectedRelicId = row.id">查看详情</el-button></template></el-table-column>
            <el-table-column label="位置"><template #default="{ row }">{{ row.regionId === 'altar' ? '祭坛' : row.regionId === 'locker' ? '仓库' : '未知位置' }}（{{ row.x + 1 }}, {{ row.y + 1 }}）· {{ row.width }}×{{ row.height }}
              <el-button link type="primary" :disabled="store.readOnly || store.busy || row.status !== 'matched' || !store.state.relicCalibrations?.[row.regionId]" @click="perform('highlightRelic', row.id)">高亮位置（5 秒）</el-button>
            </template></el-table-column>
            <el-table-column label="状态"><template #default="{ row }">{{ row.status === 'matched' ? '已确认' : '需重扫' }}</template></el-table-column>
            <el-table-column label="约束" width="260"><template #default="{ row }">
              <el-checkbox :model-value="store.state.loadoutPreferences.fixed.includes(row.id)" @change="togglePreference('fixed', row.id)" :disabled="store.readOnly">固定</el-checkbox>
              <el-checkbox :model-value="store.state.loadoutPreferences.excluded.includes(row.id)" @change="togglePreference('excluded', row.id)" :disabled="store.readOnly">排除</el-checkbox>
              <el-checkbox v-if="row.unique" :model-value="store.state.loadoutPreferences.selectedUniques.includes(row.id)" @change="togglePreference('selectedUniques', row.id)" :disabled="store.readOnly">指定传奇</el-checkbox>
            </template></el-table-column>
          </el-table>
          <p>词缀汇总：{{ formatParts(store.state.inventorySummary?.totals || {}) || '暂无已确认数值' }}</p>
          <p v-for="(gap, index) in store.state.inventorySummary?.unknown || []" :key="index">未确认：{{ gap.rawText }}</p>
          <p v-if="store.state.loadouts">{{ store.state.loadouts.reason || '搜索完成' }} · {{ store.state.loadouts.optimal ? '已证明最优' : '尚未证明最优' }}</p>
          <p v-if="store.state.loadouts">等级依据：{{ store.state.loadouts.areaLevelSource === 'target' ? '用户指定的目标' : store.state.loadouts.areaLevelSource === 'observed' ? '本次求解开始前已确认的区域' : '尚未确认' }} {{ store.state.loadouts.areaLevel ?? '' }}</p>
          <h3>推荐方案 <small>仅供摆放参考，扫描后确认实际装备</small></h3><div class="loadouts"><el-card v-for="(candidate, index) in store.state.loadouts?.candidates || []" :key="index" shadow="never">
            <template #header>候选 {{ index + 1 }} · {{ Number.isFinite(candidate.score) ? candidate.score.toFixed(2) : '待确认' }} 分</template>
            <SanctumAltarGrid :width="store.state.altar.width" :height="store.state.altar.height" :unlocked="store.state.altar.unlocked" :placements="candidate.placements" :inventory="store.state.inventory" :selected-id="selectedRelicId" @select="selectedRelicId = $event" />
            <p v-for="gap in candidate.unknown" :key="gap">评分缺口：{{ gap }}</p>
            <el-button @click="preview(index)">假设装备后预览路线</el-button>
          </el-card></div>
          <el-alert v-if="previewResult" :title="`${previewResult.label}：${previewResult.recommendation.reason}`" type="info" :closable="false" />

          <el-drawer :model-value="Boolean(selectedRelic)" title="圣物详情" size="min(460px, 100vw)" append-to-body @close="selectedRelicId = ''">
            <template v-if="selectedRelic"><h3>{{ selectedRelic.name || '未识别圣物' }}</h3><p>{{ selectedRelic.width }}×{{ selectedRelic.height }} · 固定朝向</p>
              <p v-for="(mod, i) in selectedRelic.modifiers || []" :key="i">{{ mod.rawText }}</p><pre class="raw-text">{{ selectedRelic.rawText }}</pre>
              <el-button :disabled="store.readOnly || store.busy || selectedRelic.status !== 'matched' || !store.state.relicCalibrations?.[selectedRelic.regionId]" @click="perform('highlightRelic', selectedRelic.id)">在游戏中高亮位置</el-button>
            </template>
          </el-drawer>
</section>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import { useSanctumActions } from './useSanctumActions.js'
const { store, perform } = useSanctumActions()
import SanctumAltarGrid from './SanctumAltarGrid.vue'
const filter = ref(''), previewResult = ref(null), selectedRelicId = ref('')
const selectedRelic = computed(() => store.state.inventory.find(item => item.id === selectedRelicId.value) || store.state.altar.items.find(item => item.id === selectedRelicId.value))
const filteredItems = computed(() => store.state.inventory.filter(item => [item.name, item.baseId, item.rawText].join(' ').includes(filter.value)))
const formatParts = parts => Object.entries(parts).map(([key, value]) => `${store.state.catalogSummary?.modifiers?.find(mod => mod.id === key)?.label || key} ${Number(value).toFixed(2)}`).join(' · ')
function togglePreference(key, id) {
  const preferences = JSON.parse(JSON.stringify(store.state.loadoutPreferences))
  preferences[key] = preferences[key].includes(id) ? preferences[key].filter(value => value !== id) : [...preferences[key], id]
  void perform('saveLoadoutPreferences', preferences)
}
async function preview(index) { try { previewResult.value = await store.call('previewLoadout', index) } catch { /* store shows the failure */ } }
watch(() => JSON.stringify(store.state.loadouts), () => { previewResult.value = null })

</script>
<style scoped lang="less">
@import "./sanctumSection.less";
</style>
