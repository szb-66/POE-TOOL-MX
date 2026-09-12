<template>
  <el-dialog :model-value="Boolean(selection)" title="核对并纠正状态" width="min(900px, 96vw)" append-to-body @close="emit('close')">
    <p v-if="loading">正在读取识别记录…</p>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <template v-if="review">
      <el-alert v-if="review.reason || stale" :title="stale ? '状态或纠正规则已更新，请关闭后重新核对；当前草稿未应用' : review.reason" type="info" :closable="false" />
      <p v-if="review.previous">上次采集 · 仅供核对</p>
      <SanctumRecognitionImage kind="effect" :binding="review.binding" :region="review.target?.region" :texts="review.target?.texts" stage="原始识别证据" :reason="review.target?.reason" />
      <template v-if="review.original">
        <h3>逐条核对原文</h3>
        <p>对照截图选择词条；同名词条请按完整描述区分。删除效果请选择“非效果文字，排除”。</p>
        <section v-for="source in review.sources" :key="source.id" class="source-row">
          <p>{{ source.rawText }}</p><small>{{ source.reason || '原始识别：'+source.name }}</small>
          <small v-if="source.ruleId">已应用记住的纠正</small><small v-if="source.local">含本次人工修改</small>
          <el-select v-model="selections[source.id]" filterable :fit-input-width="true" :disabled="!editable" :aria-label="'核对原文：'+source.rawText">
            <el-option label="保留原始识别（未知文字继续待核对）" value="keep" />
            <el-option label="非效果文字，排除" value="ignore" />
            <el-option class="effect-option" v-for="option in review.options" :key="option.id" :value="option.id" :label="optionLabel(option)" />
          </el-select>
        </section>
        <h3>额外添加</h3>
        <p>没有对应原文的手动添加仅作用于本次，不创建长期规则。</p>
        <div v-for="(id,index) in addedEntryIds" :key="index" class="entry-row">
          <el-select v-model="addedEntryIds[index]" filterable :fit-input-width="true" :disabled="!editable" :aria-label="'额外效果 '+(index+1)">
            <el-option class="effect-option" v-for="option in review.options" :key="option.id" :value="option.id" :label="optionLabel(option)" />
          </el-select>
          <el-button :disabled="!editable" @click="addedEntryIds.splice(index,1)">删除</el-button>
        </div>
        <el-button :disabled="!editable" @click="addedEntryIds.push('')">添加词条</el-button>
        <p><el-checkbox v-model="remember" :disabled="!editable">记住相同文字的纠正</el-checkbox></p>
        <small>取消勾选仅修改本次。重读、重置本轮及重启不会删除已记住的规则。</small>
        <details v-if="review.target?.memoryHits?.length || review.target?.correctionHistory?.length || review.target?.correction">
          <summary>纠正来源和修改详情</summary>
          <p v-for="hit in review.target.memoryHits || []" :key="hit.id">原文：{{ hit.rawText }} → {{ hit.action === 'ignore' ? '忽略' : optionLabel(hit.entrySnapshot) }} · 规则版本 {{ hit.revision }}</p>
          <p v-if="review.target.correction">当前人工修订 {{ review.target.correction.revision }}；额外添加 {{ review.target.correction.addedEntryIds?.length || 0 }} 项。</p>
          <p v-for="record in review.target.correctionHistory || []" :key="record.revision">修订 {{ record.revision }} · {{ record.remember ? '记住相同文字' : '仅本次' }}：{{ record.sourceEdits.map(edit=>edit.rawText+' → '+(edit.action === 'ignore' ? '忽略' : edit.action === 'keep' ? '保留原始识别' : review.options.find(option=>option.id === edit.entryId)?.name || edit.entryId)).join('；') }}</p>
        </details>
        <p v-if="review.group?.entries?.some(entry=>entry.calculationStatus === 'unsupported')">未支持计算的词条仍会保留原因，手动选择不会改变计算支持情况。</p>
      </template>
    </template>
    <template #footer>
      <el-button :disabled="saving" @click="emit('manage-rules')">管理已记住的纠正</el-button>
      <el-button :disabled="store.readOnly || store.busy || !store.state.floor?.identityConfirmed || saving" @click="rescan">重读状态栏</el-button>
      <el-button :disabled="saving" @click="emit('close')">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="!editable || addedEntryIds.some(id=>!id)" @click="apply">应用纠正</el-button>
    </template>
  </el-dialog>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import { useSanctumStore } from './sanctumStore.js'
import { observationBinding } from '../../../shared/sanctumPresentation.js'
import SanctumRecognitionImage from './SanctumRecognitionImage.vue'
import { effectOptionLabel as optionLabel } from './effectCorrectionPresentation.js'
const props = defineProps({selection:Object})
const emit = defineEmits(['close','manage-rules'])
const store = useSanctumStore(), review = ref(null), loading = ref(false), saving = ref(false), error = ref('')
const addedEntryIds = ref([]), selections = ref({}), remember=ref(true)
let request = 0
const stale = computed(() => {
  if (!review.value?.editable) return false
  const binding = review.value.binding, floor = store.state.floor
  const target = floor?.effectScan?.targets?.find(target=>target.targetId === binding.targetId)
  return observationBinding(floor) !== binding.observationKey || !target || target.evidenceId !== binding.evidenceId
    || (target.correction?.revision || 0) !== binding.correctionRevision || !floor.identityConfirmed
    || store.state.effectCorrectionMemory?.revision !== binding.memoryRevision
})
const editable = computed(()=>review.value?.editable && !stale.value && !store.readOnly && !store.busy && !saving.value)
watch(()=>props.selection,async selection=>{
  const serial = ++request
  review.value=null;error.value='';loading.value=Boolean(selection);remember.value=true
  if (!selection) return
  try {
    const result = await store.call('getEffectReview',selection)
    if (serial !== request) return
    review.value=result
    addedEntryIds.value=[...(result.target?.correction?.addedEntryIds || [])]
    selections.value=Object.fromEntries((result.sources || []).map(source=>[source.id,source.selection]))
  } catch (failure) { if (serial === request) error.value=failure.message }
  finally { if (serial === request) loading.value=false }
},{immediate:true})
async function apply() {
  if (!editable.value) return
  saving.value=true;error.value=''
  try {
    const sourceEdits=review.value.sources.filter(source=>source.ruleId || source.local || selections.value[source.id] !== (source.entryId || 'keep'))
      .map(source=>{
        const value=selections.value[source.id]
        return {sourceId:source.id,action:['ignore','keep'].includes(value)?value:'replace',...(!['ignore','keep'].includes(value)?{entryId:value}:{})}
      })
    await store.action('correctEffectTarget',review.value.binding,{sourceEdits,addedEntryIds:[...addedEntryIds.value],remember:remember.value})
    emit('close')
  } catch (failure) { error.value=failure.message }
  finally { saving.value=false }
}
async function rescan() {
  emit('close')
  try { await store.action('rescanEffects') } catch { /* Page displays the store error. */ }
}
</script>
<style scoped lang="less">
.effect-option { height:auto; min-height:34px; white-space:normal; line-height:1.5; padding-top:8px; padding-bottom:8px; overflow-wrap:anywhere; }
.entry-row { display:flex; gap:8px; margin:10px 0; .el-select { flex:1; min-width:0; } }
.source-row { margin:12px 0; padding:12px; border:1px solid var(--el-border-color); border-radius:6px; p { white-space:pre-wrap; } small { display:block; margin-bottom:8px; } .el-select { width:100%; } }
</style>
