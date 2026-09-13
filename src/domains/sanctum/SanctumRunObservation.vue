<template>
  <el-card shadow="never">
    <template #header>当前位置的实际状态</template>
    <p v-if="state.restoredFromSave">上次采集 · {{ sanctumSavedLabel(state.savedAt) }}；以下为保存时的状态，再次采集可更新。</p>
    <p v-if="state.floor?.effectScan?.updateMode === 'append'">已按完成房间加入明确痛苦，本次未重读状态栏。</p>
    <p v-else-if="state.floor?.effectScan?.updateMode === 'reuse'">已完成房间没有不确定效果变化，沿用当前状态，本次未重读状态栏。</p>
    <el-button @click="emit('manage-rules')">管理已记住的纠正</el-button>
    <div class="summary-grid">
      <article><span>坚毅</span><strong>{{ summary.resolve ?? '待确认' }} <small>/ {{ summary.maxResolve ?? '?' }}</small></strong><el-progress v-if="summary.percent !== null" :percentage="summary.percent" :show-text="false" /></article>
      <article><span>启迪</span><strong>{{ summary.inspiration ?? '待确认' }}</strong></article>
      <article><span>耀金币</span><strong>{{ summary.coins ?? '待确认' }}</strong></article>
    </div>
    <div class="effect-groups"><article v-for="(group, i) in effectGroups" :key="i"><b>{{ group.label || '未知类别' }}</b><el-tag size="small">{{ effectLabels[group.status] || '待确认' }}</el-tag><p v-for="(text, j) in group.texts || []" :key="j">{{ text }}</p><small v-for="entry in (group.entries || []).filter(e=>e.calculationStatus === 'unsupported')" :key="entry.entryId">{{ entry.name }}：{{ entry.supportReason || '规则未确认' }}</small><el-tag v-if="group.manual || group.entries?.some(entry=>entry.manual)" size="small">已人工修正</el-tag><small v-if="!group.complete">{{ group.reason || '列表未完整读取' }}</small><el-button v-if="!group.complete" size="small" @click="emit('review',group)">核对并纠正</el-button></article></div>
    <div class="review-targets"><el-button v-for="target in evidenceTargets" :key="target.targetId" size="small" @click="emit('review',target)">核对：{{ effectTargetLabel(target) }}</el-button></div>
    <el-button @click="evidence = !evidence">{{ evidence ? '关闭截图' : '核对识别截图' }}</el-button>
    <template v-if="evidence">
      <p v-if="state.floor?.effectScan?.updateMode !== 'scan' && state.floor?.effectScan?.updateMode">以下为沿用状态及已完成房间的原始识别截图。</p>
      <p v-else-if="!state.floor?.effectScan?.targets?.length">本次尚未截取效果浮窗，请查看采集记录中的失败阶段。</p>
      <article v-for="entry in roomEffectEntries" :key="entry.entryId">
        <strong>{{ entry.name }} · 完成房间 {{ entry.source.roomId }} 后自动加入</strong>
        <SanctumRecognitionImage kind="room" :binding="entry.source" :region="entry.source.region" :texts="[entry.rawText]" stage="房间识别" />
      </article>
      <article v-for="target in evidenceTargets" :key="target.targetId">
        <strong>{{ effectTargetLabel(target) }}</strong><el-button size="small" @click="emit('review',target)">核对并纠正</el-button>
        <p v-if="target.previousCapture">上次采集 · {{ target.reason || '本次采集尚未完成' }}</p>
        <SanctumRecognitionImage kind="effect" :binding="target.previousCapture?.binding || {runId:target.runId || state.floor.runId,floorId:target.floorId || state.floor.floorId,targetId:target.targetId,evidenceId:target.evidenceId}" :region="(target.previousCapture?.result || target).region" :texts="(target.previousCapture?.result || target).texts" :stage="stages[target.stage] || target.stage" :reason="target.reason ? effectReadReason(target) : null" />
      </article>
    </template>
    <p v-if="!state.floor?.effectScan?.groups?.length">效果尚未确认，请在当前位置读取。</p>
    <p v-if="!state.floor?.identityConfirmed">当前地图身份待确认，旧结果仅供查看。</p>
    <el-button :disabled="disabled" @click="action('rescanEffects')">手动重读状态栏</el-button>
    <details><summary>读取或校正实际资源</summary>
    <p>完整识别会自动更新当前可见布局的资源；也可在地图内或独立状态栏单独读取。</p>
    <p v-if="state.runObservation?.key === binding && state.runObservation?.reason">{{ state.runObservation.reason }}</p>
    <p v-if="state.runObservation?.key !== binding">当前资源尚未确认，旧资源不参与计算。</p>
    <el-form inline label-position="top" :disabled="disabled">
      <el-form-item v-for="(label,key) in labels" :key="key" :label="label">
        <el-input-number v-model="resources[key]" :min="0" :max="1000000000" :precision="0" placeholder="未知" />
      </el-form-item>
    </el-form>
    <el-button :disabled="disabled" @click="action('readRunPanel','resources')">读取实际资源</el-button>
    <el-button :disabled="disabled" @click="action('correctRunResources',binding,resources)">确认实际资源</el-button>
    </details>
  </el-card>
</template>
<script setup>
import { computed, reactive, watch, ref } from 'vue'
import SanctumRecognitionImage from './SanctumRecognitionImage.vue'
const emit=defineEmits(['review','manage-rules'])
const evidence=ref(false)
const stages={capturing:'正在截图',queued:'等待文字识别',reading:'正在识别文字',matched:'识别完成',failed:'识别未完成','capture-failed':'截图失败','ocr-failed':'文字识别失败','scan-failed':'状态栏检查失败','restore-failed':'恢复地图失败',skipped:'未执行'}
import { observationBinding, resourceSummary, sanctumSavedLabel } from '../../../shared/sanctumPresentation.js'
import { emptyEffectGroups, completedEffectGroups, effectEvidenceTargets, effectTargetLabel, effectScanFinished, effectReadReason } from '../../../shared/sanctumEffects.js'
const props=defineProps({state:Object,disabled:Boolean,action:Function})
const binding=computed(()=>observationBinding(props.state.floor))
const summary=computed(()=>resourceSummary(props.state))
const effectGroups=computed(()=>{
  const scan=props.state.floor?.effectScan
  const groups=scan?.groups?.length ? scan.groups : emptyEffectGroups()
  return scan && !props.state.running ? completedEffectGroups(groups,effectScanFinished(scan)) : groups
})
const evidenceTargets=computed(()=>effectEvidenceTargets(props.state.floor))
const roomEffectEntries=computed(()=>effectGroups.value.flatMap(group=>(group.entries || []).filter(entry=>entry.source?.kind === 'room')))
const effectLabels={read:'已读取',unmatched:'待核对',failed:'读取失败',absent:'无',unconfirmed:'待确认'}
const labels={resolve:'坚毅',maxResolve:'最大坚毅',inspiration:'启迪',coins:'耀金币'}
const resources=reactive({})
watch([()=>binding.value,()=>JSON.stringify(props.state.runObservation)],()=>{for(const key of Object.keys(labels)) resources[key]=props.state.runObservation?.key===binding.value?props.state.runObservation[key]:null},{immediate:true})
</script>
<style scoped lang="less">
@import "./sanctumSection.less";
.summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.review-targets {display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;.el-button {margin-left:0;white-space:normal;height:auto;min-height:28px;text-align:left;}}
.effect-groups { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 12px; margin: 16px 0; article, section { padding: 12px; border: 1px solid var(--el-border-color-light); border-radius: 6px; } small { display: block; margin-top: 6px; } .el-tag { margin-left: 8px; } }
</style>
