<template>
  <el-card shadow="never">
    <template #header>当前位置的实际状态</template>
    <p v-if="state.restoredFromSave">上次采集 · {{ sanctumSavedLabel(state.savedAt) }}；以下为保存时的状态，再次采集可更新。</p>
    <div class="summary-grid">
      <article><span>坚毅</span><strong>{{ summary.resolve ?? '待确认' }} <small>/ {{ summary.maxResolve ?? '?' }}</small></strong><el-progress v-if="summary.percent !== null" :percentage="summary.percent" :show-text="false" /></article>
      <article><span>启迪</span><strong>{{ summary.inspiration ?? '待确认' }}</strong></article>
      <article><span>耀金币</span><strong>{{ summary.coins ?? '待确认' }}</strong></article>
    </div>
    <div class="effect-groups"><article v-for="(group, i) in effectGroups" :key="i"><b>{{ group.label || '未知类别' }}</b><el-tag size="small">{{ effectLabels[group.status] || '待确认' }}</el-tag><p v-for="(text, j) in group.texts || []" :key="j">{{ text }}</p><small v-for="entry in (group.entries || []).filter(e=>e.calculationStatus === 'unsupported')" :key="entry.entryId">{{ entry.name }}：{{ entry.supportReason || '规则未确认' }}</small><small v-for="entry in (group.entries || []).filter(e=>e.calculationStatus === 'supported')" :key="`support-${entry.entryId}`">{{ entry.name }}：已纳入路线评估，按实际资源和触发条件计算</small><small v-if="!group.complete">{{ group.reason || '列表未完整读取' }}</small></article></div>
    <div v-if="state.floor?.effectScan?.rewardGroups?.length" class="ledger-groups">
      <section v-for="group in state.floor.effectScan.rewardGroups" :key="group.targetId">
        <b>状态栏奖励</b><el-tag size="small">{{ effectLabels[group.status] }}</el-tag>
        <article v-for="reward in group.rewards" :key="reward.row"><b>{{ reward.currency }} × {{ reward.quantity }}</b><small>{{ reward.timing === 'floor' ? '楼层结束时领取' : '完成禁域时领取' }} · 已选未领</small></article>
        <p v-for="(item,i) in group.unresolved" :key="i">{{ item.rawText }}<small>{{ item.reason }}</small></p>
        <small v-if="!group.complete">{{ group.reason || '奖励列表未完整读取' }}</small>
      </section>
    </div>
    <el-button @click="evidence = !evidence">{{ evidence ? '关闭截图' : '核对识别截图' }}</el-button>
    <template v-if="evidence">
      <p v-if="!state.floor?.effectScan?.targets?.length">本次尚未截取效果浮窗，请查看采集记录中的失败阶段。</p>
      <article v-for="target in evidenceTargets" :key="target.targetId">
        <strong>{{ effectTargetLabel(target) }}</strong>
        <p v-if="target.previousCapture">上次采集 · {{ target.reason || '本次采集尚未完成' }}</p>
        <SanctumRecognitionImage kind="effect" :binding="target.previousCapture?.binding || {runId:state.floor.runId,floorId:state.floor.floorId,targetId:target.targetId,evidenceId:target.evidenceId}" :region="(target.previousCapture?.result || target).region" :texts="(target.previousCapture?.result || target).texts" :stage="stages[target.stage] || target.stage" :reason="target.reason ? effectReadReason(target) : null" />
      </article>
    </template>
    <p v-if="!state.floor?.effectScan?.groups?.length">效果尚未确认，请在当前位置读取。</p>
    <p v-if="!state.floor?.identityConfirmed">当前地图身份待确认，旧结果仅供查看。</p>
    <el-button :disabled="disabled" @click="action('rescanEffects')">手动重读状态栏</el-button>
    <details><summary>读取或校正实际资源</summary>
    <p v-if="state.runObservation?.key !== binding">当前资源尚未确认，旧资源不参与计算。</p>
    <el-form inline label-position="top" :disabled="disabled">
      <el-form-item v-for="(label,key) in labels" :key="key" :label="label">
        <el-input-number v-model="resources[key]" :min="0" :max="1000000000" :precision="0" placeholder="未知" />
      </el-form-item>
    </el-form>
    <el-button :disabled="disabled" @click="action('readRunPanel','resources')">读取资源范围</el-button>
    <el-button :disabled="disabled" @click="action('correctRunResources',binding,resources)">确认实际资源</el-button>
    </details>
    <el-divider />
    <h3>奖励账本</h3>
    <p v-if="!(state.restoredFromSave ? state.rewardLedger?.savedComplete : state.rewardLedger?.complete)">列表尚未核对完整，暂无记录不代表没有奖励。</p>
    <p v-if="state.rewardLedger?.key !== binding || !state.floor?.identityConfirmed">以下记录尚未在当前位置核对。</p>
    <div class="ledger-groups"><section v-for="(label, key) in states" :key="key"><h4>{{ label }}</h4><p v-if="!savedItems.some(item => item.state === key)">暂无记录</p><article v-for="item in savedItems.filter(item => item.state === key)" :key="item.id"><b>{{ item.currency || '未知奖励' }} × {{ item.quantity ?? '?' }}</b><small>{{ timings[item.timing] || '领取时机未知' }}{{ item.groupId ? ` · 选项组：${item.groupId}` : '' }}</small><small v-if="item.observationKey && item.observationKey !== binding">尚未在当前位置核对</small></article></section></div>
    <details><summary>读取或编辑奖励账本</summary>
    <p>逐项记录奖励，奖励房的互斥选项使用同一个组名。经过房间不会自动入账。只勾选经核对符合复制条件的奖励。</p>
    <p v-if="state.rewardLedger?.key !== binding">账本尚未在当前位置核对，复制判断暂停。</p>
    <div v-for="(item,index) in ledger.items" :key="item.id" class="reward-row">
      <el-input v-model="item.currency" placeholder="奖励名称" :disabled="disabled" />
      <el-input-number v-model="item.quantity" :min="1" :max="1000000000" :precision="0" placeholder="数量未知" :disabled="disabled" />
      <el-input v-model="item.groupId" placeholder="来源组选项（可空）" :disabled="disabled" />
      <el-select v-model="item.state" :disabled="disabled"><el-option v-for="(label,key) in states" :key="key" :label="label" :value="key" /></el-select>
      <el-select v-model="item.timing" :disabled="disabled"><el-option v-for="(label,key) in timings" :key="key" :label="label" :value="key" /></el-select>
      <el-checkbox v-model="item.eligible" :disabled="disabled">符合复制条件</el-checkbox>
      <el-button :disabled="disabled" @click="ledger.items.splice(index,1)">删除</el-button>
    </div>
    <el-checkbox v-model="ledger.complete" :disabled="disabled">已核对完整列表及领取状态</el-checkbox>
    <div class="actions">
      <el-button :disabled="disabled" @click="add">添加奖励项</el-button>
      <el-button :disabled="disabled" @click="action('readRunPanel','rewards')">读取奖励范围</el-button>
      <el-button :disabled="disabled" @click="saveLedger">确认奖励账本</el-button>
    </div>
    </details>
    <p v-if="state.recommendation?.hour?.active">{{ state.recommendation.hour.reason }}</p>
  </el-card>
</template>
<script setup>
import { computed, reactive, watch, ref } from 'vue'
import SanctumRecognitionImage from './SanctumRecognitionImage.vue'
const evidence=ref(false)
const stages={capturing:'正在截图',queued:'等待文字识别',reading:'正在识别文字',matched:'识别完成',failed:'识别未完成','capture-failed':'截图失败','ocr-failed':'文字识别失败','scan-failed':'状态栏检查失败','restore-failed':'恢复地图失败',skipped:'未执行'}
import { observationBinding, resourceSummary, sanctumSavedLabel } from '../../../shared/sanctumPresentation.js'
import { emptyEffectGroups, completedEffectGroups, effectEvidenceTargets, effectTargetLabel, effectScanFinished, effectReadReason } from '../../../shared/sanctumEffects.js'
const props=defineProps({state:Object,disabled:Boolean,action:Function})
const binding=computed(()=>observationBinding(props.state.floor))
const savedItems=computed(()=>props.state.rewardLedger?.runId === (props.state.floor?.sanctumRunId || props.state.floor?.runId) ? props.state.rewardLedger?.items || [] : [])
const summary=computed(()=>resourceSummary(props.state))
const effectGroups=computed(()=>{
  const scan=props.state.floor?.effectScan
  const groups=scan?.groups?.length ? scan.groups : emptyEffectGroups()
  return scan && !props.state.running ? completedEffectGroups(groups,effectScanFinished(scan)) : groups
})
const evidenceTargets=computed(()=>effectEvidenceTargets(props.state.floor))
const effectLabels={read:'已读取',unmatched:'待核对',failed:'读取失败',absent:'无',unconfirmed:'待确认'}
const labels={resolve:'坚毅',maxResolve:'最大坚毅',inspiration:'启迪',coins:'耀金币'}
const states={candidate:'候选',pending:'已选未领',claimed:'已领取'},timings={unknown:'领取时机未知',immediate:'立即',floor:'本层',run:'本轮'}
const resources=reactive({}),ledger=reactive({complete:false,items:[]})
watch([()=>binding.value,()=>JSON.stringify(props.state.runObservation)],()=>{for(const key of Object.keys(labels)) resources[key]=props.state.runObservation?.key===binding.value?props.state.runObservation[key]:null},{immediate:true})
watch([()=>binding.value,()=>JSON.stringify(props.state.rewardLedger)],()=>{
  const f=props.state.floor,sameRun=props.state.rewardLedger?.runId===(f?.sanctumRunId||f?.runId)
  ledger.items=JSON.parse(JSON.stringify(sameRun?props.state.rewardLedger?.items||[]:[]))
  ledger.complete=props.state.rewardLedger?.key===binding.value&&props.state.rewardLedger?.complete===true
},{immediate:true})
function add(){ledger.items.push({id:crypto.randomUUID(),currency:'',quantity:null,state:'candidate',timing:'unknown',eligible:false,groupId:''})}
function saveLedger(){return props.action('correctRewardLedger',binding.value,{complete:ledger.complete,items:ledger.items.map(item=>({...item,quantity:item.quantity??null}))})}
</script>
<style scoped lang="less">
@import "./sanctumSection.less";
.summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.effect-groups, .ledger-groups { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 12px; margin: 16px 0; article, section { padding: 12px; border: 1px solid var(--el-border-color-light); border-radius: 6px; } small { display: block; margin-top: 6px; } .el-tag { margin-left: 8px; } }
.reward-row {display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.reward-row>.el-input,.reward-row>.el-select{width:160px}.actions{margin-top:12px}
</style>
