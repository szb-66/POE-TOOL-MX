<template>
  <section class="primary-page sanctum-page"><div class="primary-page__content">
    <header class="section-heading"><div><h2>圣所</h2><p>看清路线，从容选择</p></div><div class="toolbar">
      <el-tag>{{ store.state.running ? '采集中' : store.state.enabled ? '已开启' : '已关闭' }}</el-tag>
      <label for="sanctum-enabled">启用圣所</label><el-switch id="sanctum-enabled" :model-value="store.state.configuredEnabled === true" :loading="store.toggling" :disabled="store.toggling" @change="store.setEnabled" />
    </div></header>
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon />
    <el-alert v-if="store.state.saveWarning" :title="store.state.saveWarning" type="warning" :closable="false" show-icon />
    <el-alert v-if="store.state.restoredFromSave" :title="`${sanctumSavedLabel(store.state.savedAt)}；已恢复保存结果，游戏进度变化后请再次采集更新`" type="info" :closable="false" />
    <el-alert v-if="store.state.overlayRestoreWarning" :title="store.state.overlayRestoreWarning" type="warning" :closable="false" />
    <el-alert v-if="positionUnconfirmed" title="本次识别未确定当前房间；地图已更新但不标注位置。请重新采集，或打开房间详情点击“设为当前位置”。" type="warning" :closable="false" show-icon />
    <el-alert v-if="!store.state.enabled" title="圣所已关闭，开启后可采集和编辑；已有结果仍可查看。" type="info" :closable="false" />
    <el-tabs v-model="tab">
      <el-tab-pane label="楼层规划" name="floor">
        <div class="summary-grid">
          <article><span>当前楼层</span><strong>{{ visibleIdentity ? `第 ${floor.floorNumber ?? '?'} 层` : '待确认' }}</strong></article>
          <article><span>区域等级</span><strong>{{ visibleIdentity ? floor.areaLevel ?? '未知' : '待确认' }}</strong></article>
          <article><span>当前位置</span><strong>{{ visibleIdentity ? floor.initialSelection ? '选择首个房间' : floor.currentRoomId || '待确认' : '待确认' }}</strong></article>
          <article><span>当前策略</span><strong>{{ SANCTUM_PRESETS[store.state.strategy.preset]?.label || '自定义' }}</strong></article>
        </div>
        <div class="section-heading"><div class="toolbar">
          <el-button type="primary" :loading="store.state.running" :disabled="store.readOnly || store.busy || button.disabled || !store.state.liveCaptureAvailable" @click="perform('startLive')">{{ button.label }}</el-button>
          <el-button :disabled="store.readOnly || store.busy" @click="perform('resetRun')">重置本轮</el-button><el-button link @click="openCalibration">识别设置</el-button>
        </div><small>停止快捷键：{{ settings.globalShortcuts.end || '未设置' }}</small></div>
        <div v-if="missingCalibration.length || !store.state.liveCaptureAvailable" class="setup-hint"><span>{{ !store.state.liveCaptureAvailable ? '采集服务未就绪，请检查应用运行状态' : `待配置：${missingCalibration.join('、')}` }}</span><el-button link type="primary" @click="openCalibration">前往设置</el-button></div>
        <div v-else-if="!visibleIdentity" class="setup-hint"><span>打开圣所地图后开始采集，楼层与等级由游戏日志确认。</span><router-link to="/settings">配置游戏日志</router-link></div>
        <div v-if="store.state.progress || store.state.reason" class="capture-progress" role="status">{{ store.state.running || store.state.captureDraining ? sanctumProgressText(store.state.progress) || '正在准备采集' : store.state.reason }}<el-progress v-if="store.state.running && progressPercent !== null" :percentage="progressPercent" :show-text="false" /></div>
        <details v-if="store.state.floor?.captureDiagnostics?.length"><summary>本次采集记录</summary><p v-for="(entry, index) in store.state.floor.captureDiagnostics" :key="index">{{ sanctumProgressText({ stage: entry.stage }) }} · {{ { started:'开始', complete:'完成', failed:'失败', partial:'部分完成', stopped:'停止' }[entry.outcome] }}<span v-if="Number.isFinite(entry.elapsedMs)"> · {{ entry.elapsedMs }}ms</span><span v-if="Number.isFinite(entry.remainingMs)"> · 剩余 {{ entry.remainingMs }}ms</span><span v-if="entry.reason"> · {{ entry.reason }}</span></p></details>
        <div class="floor-layout">
          <el-card shadow="never" class="map-panel"><template #header><div class="section-heading"><b>楼层地图</b><small>{{ rooms.length ? `${rooms.length} 个房间` : '等待采集' }}</small></div></template>
            <div v-if="rooms.length" class="map-scroll"><svg class="floor-map" :style="{ minWidth: `${display.minWidth}px` }" :viewBox="display.viewBox" role="group" aria-label="圣所楼层房间与连线"><SanctumMapGraph :rooms="display.rooms" :lines="display.lines" interactive :selected-id="selectedId" marker-id="sanctum-page-arrow" @select="selectRoom" /></svg></div>
            <el-empty v-else description="打开圣所地图，开始采集房间与路线" /><SanctumMapLegend v-if="rooms.length" /><small v-if="rooms.length">点击房间查看详情；地图较宽时可横向滚动</small>
          </el-card>
          <aside><el-card shadow="never"><template #header>推荐路线</template>
            <el-alert v-if="historyRoute" :title="`${sanctumSavedLabel(historyRoute.savedAt)}；${historyRoute.incomplete ? '状态识别不完整，路线按当时已识别信息评估' : '再次采集可更新路线'}`" type="info" :closable="false" show-icon />
            <el-alert v-else-if="store.state.restoredFromSave" title="尚无已保存路线，再次采集可生成" type="info" :closable="false" />
            <el-alert v-else-if="!store.state.running && recommendation && floor?.effectScan?.complete !== true" title="状态识别不完整；路线按已识别信息评估" type="warning" :closable="false" show-icon />
            <details v-if="readIssues.length" open><summary>读取失败与缺失项（{{ readIssues.length }}）</summary><p v-for="issue in readIssues" :key="effectIssueText(issue)">{{ effectIssueText(issue) }}<el-button v-if="issue.stage !== 'scan' && issue.targetId" size="small" @click="openEffectReview(issue,floor)">核对并纠正</el-button></p><el-button size="small" :disabled="store.readOnly || store.busy || !identity" @click="perform('rescanEffects')">重读状态栏</el-button></details>
            <template v-if="routes.length"><span class="eyebrow">推荐下一房</span><h2 class="next-room">{{ roomName(routes[0].nextRoomId) }}</h2><el-tag>{{ routes[0].nextRoomId }}</el-tag>
              <p>{{ recommendation.reason }}</p><details v-if="routes[0].conditions?.length"><summary>状态影响与计算依据</summary><p v-for="condition in routes[0].conditions" :key="condition">{{ condition }}</p></details><p v-for="reason in routes[0].reasons || []" :key="reason">{{ reason }}</p><p v-for="risk in routes[0].risks || []" :key="risk" class="risk">{{ risk }}</p>
              <div class="route-steps" aria-label="条件性路线预览"><template v-for="(id, i) in routes[0].rooms" :key="id"><span v-if="i">→</span><button @click="selectId(id)">{{ id }}</button></template></div><small>后续路线按当前可见信息预览</small>
              <details v-if="routes.length > 1"><summary>其他路线（{{ routes.length - 1 }}）</summary><article v-for="(route, i) in routes.slice(1)" :key="i" class="alternative"><b>{{ roomName(route.nextRoomId) }} · {{ route.nextRoomId }}</b><p v-for="reason in route.reasons || []" :key="reason">{{ reason }}</p><p v-for="risk in route.risks || []" :key="risk" class="risk">{{ risk }}</p><p>{{ route.rooms.join(' → ') }}</p></article></details>
            </template>
            <el-empty v-else :image-size="64" :description="recommendation?.reason || '确认楼层与当前位置后生成路线'" />
            <details v-if="recommendation?.unknown?.length" open><summary>待确认信息（{{ recommendation.unknown.length }}）</summary><p v-for="gap in recommendation.unknown" :key="gap">{{ gap }}</p></details>
          </el-card></aside>
        </div>
        <SanctumRunObservation :state="store.state" :disabled="store.readOnly || store.busy || !identity" :action="perform" @review="openEffectReview($event,store.state.floor)" @manage-rules="openEffectRules" />
        <el-drawer :model-value="Boolean(selectedRoom)" title="房间详情" size="min(720px, 100vw)" append-to-body @close="selectedId = ''"><SanctumRoomDetails v-if="selectedRoom" :key="`${floor.runId}:${floor.floorId}:${selectedId}`" :room="selectedRoom" :floor="floor" /></el-drawer>
      </el-tab-pane>
      <el-tab-pane label="圣物管理" name="relics"><SanctumRelics /></el-tab-pane>
      <el-tab-pane label="设置" name="settings"><SanctumSettings v-model:section="settingsSection" /></el-tab-pane>
    </el-tabs>
    <SanctumEffectReview :selection="effectSelection" @close="effectSelection=null" @manage-rules="openEffectRules" />
    <SanctumEffectRules :open="effectRulesOpen" @close="effectRulesOpen=false" />
  </div></section>
</template>
<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { effectEvidenceTargets, effectReadIssues, effectIssueText } from '../../../shared/sanctumEffects.js'
import { sanctumProgressText } from '../../../shared/sanctumProgress.js'
import { sanctumPositionUnconfirmed } from '../../../shared/sanctumDisplay.js'
import { captureButton, roomTitle, calibrationIssues, sanctumPageDisplay, sanctumSavedLabel, sanctumDisplayFloors } from '../../../shared/sanctumPresentation.js'
import { SANCTUM_PRESETS } from '../../../shared/sanctum.js'
import { useSettingsStore } from '../settings/settingsStore'
import { useSanctumActions } from './useSanctumActions.js'
import SanctumMapGraph from './SanctumMapGraph.vue'
import SanctumMapLegend from './SanctumMapLegend.vue'
import SanctumRoomDetails from './SanctumRoomDetails.vue'
import SanctumRunObservation from './SanctumRunObservation.vue'
import SanctumEffectReview from './SanctumEffectReview.vue'
import SanctumEffectRules from './SanctumEffectRules.vue'
import SanctumRelics from './SanctumRelics.vue'
import SanctumSettings from './SanctumSettings.vue'
const { store, perform } = useSanctumActions(), settings = useSettingsStore()
const effectSelection = ref(null)
const effectRulesOpen = ref(false)
function openEffectRules() {effectSelection.value=null;effectRulesOpen.value=true}
function openEffectReview(source,sourceFloor) {
  const target=effectEvidenceTargets(sourceFloor).find(target=>target.targetId === source.targetId && (!source.evidenceId || target.evidenceId === source.evidenceId))
  effectSelection.value=target?.previousCapture?.binding || {runId:target?.runId || sourceFloor?.runId,floorId:target?.floorId || sourceFloor?.floorId,targetId:source.targetId,evidenceId:source.evidenceId || target?.evidenceId}
}
const tab = ref('floor'), selectedId = ref(''), settingsSection = ref('strategy')
function openCalibration() { settingsSection.value = 'calibration'; tab.value = 'settings' }
const views = computed(() => sanctumDisplayFloors(store.state))
const floor = computed(() => views.value.floor), identity = computed(() => store.state.floor?.identityConfirmed === true)
const visibleIdentity = computed(() => Boolean(floor.value && (floor.value.identityConfirmed || store.state.restoredFromSave)))
const rooms = computed(() => floor.value?.rooms || []), selectedRoom = computed(() => rooms.value.find(room => room.id === selectedId.value))
const historyRoute = computed(() => views.value.history)
const shownRecommendation = computed(() => historyRoute.value?.recommendation || store.state.recommendation)
const display = computed(() => sanctumPageDisplay(floor.value, shownRecommendation.value, historyRoute.value?.marks || store.state.marks, historyRoute.value ? null : store.state.progress))
const positionUnconfirmed = computed(() => !store.state.running && !store.state.captureDraining && sanctumPositionUnconfirmed(store.state.floor))
const recommendation = computed(() => floor.value?.identityConfirmed && ['runId', 'floorId', 'revision'].every(key => floor.value[key] === shownRecommendation.value?.[key]) ? shownRecommendation.value : null)
const routes = computed(() => display.value.nextRoomId ? recommendation.value?.paths || [] : [])
const readIssues = computed(() => !store.state.running && floor.value ? effectReadIssues(floor.value.effectScan) : [])
const errorMessage = computed(() => store.error || store.state.saveError || (store.state.status === 'error' ? store.state.reason : ''))
const button = computed(() => captureButton(store.state))
const missingCalibration = computed(() => calibrationIssues(store.state))
const progressPercent = computed(() => { const p = store.state.progress; return Number.isFinite(p?.current) && p.total > 0 ? Math.max(0, Math.min(100, Math.round(p.current / p.total * 100))) : null })
const roomName = id => roomTitle(rooms.value.find(room => room.id === id))
function selectRoom(room) { selectedId.value = room.id }
function selectId(id) { if (rooms.value.some(room => room.id === id)) selectedId.value = id }
watch(() => [floor.value?.runId, floor.value?.floorId, floor.value?.mapKey], () => { selectedId.value = '' })
onMounted(() => perform('getState'))
</script>
<style scoped lang="less">
@import './sanctumSection.less';
.sanctum-page { overflow: auto; h2 { margin: 0; } header p { margin: 6px 0 0; } }
.floor-layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; align-items: start; gap: 16px; margin-bottom: 16px; }
.map-panel { min-width: 0; }.map-scroll { overflow: auto; }
.floor-map { display: block; width: 100%; min-width: 540px; min-height: 300px; max-height: 560px; background: var(--el-fill-color-light); border-radius: 8px; }
.capture-progress { margin: 0 0 16px; color: var(--el-text-color-secondary); font-size: 13px; .el-progress { margin-top: 8px; } }
.next-room { margin: 8px 0 !important; font-size: 23px; }.eyebrow { font-size: 12px; color: var(--el-color-primary); }
.route-steps { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 16px 0 8px; button { border: 1px solid var(--el-border-color); border-radius: 5px; background: var(--el-fill-color-light); color: var(--el-text-color-primary); padding: 5px 8px; cursor: pointer; } }
.alternative { padding-top: 12px; border-top: 1px solid var(--el-border-color-light); }.risk { color: var(--el-color-warning-dark-2); }
@media (max-width: 1100px) { .floor-layout { grid-template-columns: minmax(0, 1fr); } }
</style>
