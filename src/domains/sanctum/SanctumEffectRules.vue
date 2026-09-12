<template>
  <el-dialog :model-value="open" title="管理已记住的纠正" width="min(900px, 96vw)" append-to-body @close="emit('close')">
    <p>规则保存在本机，按原文精确匹配。修改会更新当前有效状态及下次识别，历史记录保留当时结果。</p>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <el-alert v-if="stale" title="纠正规则已更新，请刷新后再修改。当前草稿未保存。" type="info" :closable="false" />
    <el-input v-model="search" placeholder="搜索原文或效果名称" aria-label="搜索已记住的纠正" clearable />
    <p v-if="loading">正在加载…</p>
    <p v-else-if="!filtered.length">{{ library?.rules.length ? '没有匹配的纠正' : '尚未记住纠正' }}</p>
    <section v-for="rule in filtered" :key="rule.id" class="rule-row">
      <p class="raw">{{ rule.rawText }}</p>
      <p>{{ rule.action === 'ignore' ? '忽略此文字' : optionLabel(rule.entrySnapshot) }}</p>
      <small>版本 {{ rule.revision }} · {{ rule.active ? '生效中' : rule.reason }}</small>
      <details v-if="rule.source" @toggle="sourceOpen=$event.target.open ? rule.id:null"><summary>原始识别来源</summary>
        <SanctumRecognitionImage v-if="sourceOpen === rule.id" kind="effect" :binding="rule.source" :region="rule.source.region" :texts="rule.source.texts" stage="保存纠正时的原始证据" />
      </details>
      <template v-if="editing === rule.id">
        <el-select v-model="selection" filterable :fit-input-width="true" :disabled="disabled" aria-label="更改纠正方式或效果">
          <el-option label="非效果文字，忽略" value="ignore" />
          <el-option v-for="option in library.options" class="effect-option" :key="option.id" :value="option.id" :label="optionLabel(option)" />
        </el-select>
        <div class="actions"><el-button :disabled="saving" @click="editing=null">取消修改</el-button><el-button type="primary" :disabled="disabled || !validSelection" :loading="saving" @click="save(rule)">保存规则</el-button></div>
      </template>
      <div v-else class="actions"><el-button :disabled="disabled" @click="edit(rule)">编辑规则</el-button><el-button :disabled="disabled" @click="remove(rule)">删除规则</el-button></div>
    </section>
    <template #footer><el-button :disabled="saving" @click="reload">刷新规则</el-button><el-button :disabled="saving" @click="emit('close')">关闭</el-button></template>
  </el-dialog>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import { useSanctumStore } from './sanctumStore.js'
import { effectOptionLabel as optionLabel } from './effectCorrectionPresentation.js'
import SanctumRecognitionImage from './SanctumRecognitionImage.vue'
const props=defineProps({open:Boolean}),emit=defineEmits(['close']),store=useSanctumStore()
const library=ref(null),search=ref(''),editing=ref(null),selection=ref('ignore'),error=ref(''),loading=ref(false),saving=ref(false),sourceOpen=ref(null)
let request=0
const stale=computed(()=>library.value && library.value.revision !== store.state.effectCorrectionMemory?.revision)
const disabled=computed(()=>store.busy || store.readOnly || saving.value || loading.value || stale.value)
const validSelection=computed(()=>selection.value === 'ignore' || library.value?.options.some(option=>option.id === selection.value))
const filtered=computed(()=>{
  const query=search.value.normalize('NFKC').toLocaleLowerCase().replace(/\s/gu,'')
  return (library.value?.rules || []).filter(rule=>`${rule.rawText}${rule.entrySnapshot?.name || ''}${rule.action === 'ignore' ? '忽略' : ''}`.normalize('NFKC').toLocaleLowerCase().replace(/\s/gu,'').includes(query))
})
watch(()=>props.open,open=>{if(open){search.value='';reload()}else request++},{immediate:true})
async function reload(){
  const serial=++request;loading.value=true;error.value='';editing.value=null
  try { const result=await store.call('getEffectCorrectionRules');if(serial === request) library.value=result }
  catch(failure){if(serial === request) error.value=failure.message}
  finally{if(serial === request) loading.value=false}
}
function edit(rule){editing.value=rule.id;selection.value=rule.action === 'ignore'?'ignore':rule.entryId;error.value=''}
async function mutate(rule,remove=false){
  if(disabled.value)return
  saving.value=true;error.value=''
  try{
    const binding={id:rule.id,revision:rule.revision,memoryRevision:library.value.revision}
    if(remove)await store.action('deleteEffectCorrectionRule',binding)
    else await store.action('updateEffectCorrectionRule',binding,selection.value === 'ignore'?{action:'ignore'}:{action:'replace',entryId:selection.value})
    await reload()
  }catch(failure){error.value=failure.message}
  finally{saving.value=false}
}
const save=rule=>mutate(rule),remove=rule=>mutate(rule,true)
</script>
<style scoped lang="less">
.rule-row { border:1px solid var(--el-border-color); border-radius:6px; margin-top:12px; padding:12px; .raw {white-space:pre-wrap;overflow-wrap:anywhere;} small {display:block;margin-bottom:8px;} .el-select {width:100%;} }
.actions {margin-top:8px;}
.effect-option {height:auto;min-height:34px;white-space:normal;line-height:1.5;padding-top:8px;padding-bottom:8px;overflow-wrap:anywhere;}
</style>
