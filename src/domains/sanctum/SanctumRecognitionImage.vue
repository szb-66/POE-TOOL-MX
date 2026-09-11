<template>
  <section class="recognition">
    <p>{{ stage }}<span v-if="reason"> · {{ reason }}</span></p>
    <p v-if="loading">正在读取截图…</p><p v-if="error">{{ error }}</p>
    <template v-if="frame">
      <el-button v-if="kind !== 'effect' && frame.kind !== 'room-crop'" size="small" @click="full = !full">{{ full ? '查看识别区域' : '查看完整截图' }}</el-button>
      <p v-if="kind !== 'effect' && !region">未定位到词缀范围，显示本次完整冻结画面。</p>
      <svg :viewBox="`${view.x} ${view.y} ${view.width} ${view.height}`" :style="{aspectRatio:`${view.width}/${view.height}`}" role="img" aria-label="冻结截图与自动识别区域">
        <image :href="frame.dataUrl" :width="frame.width" :height="frame.height" />
        <rect v-if="region" v-bind="region" />
      </svg>
    </template>
    <p v-else-if="!loading && !error">{{ /等待|正在|queued|reading|capturing|处理中/.test(stage || '') ? '截图处理中…' : '未保存截图；重新采集后可核对。' }}</p>
    <pre>{{ texts?.join('\n') || '尚无识别文字' }}</pre>
  </section>
</template>
<script setup>
import {computed,ref,watch} from 'vue'
const props=defineProps({binding:Object,kind:String,region:Object,texts:Array,stage:String,reason:String})
const frame=ref(null),loading=ref(false),error=ref(''),full=ref(false)
let serial=0
const region=computed(()=>props.kind==='effect' || frame.value?.kind==='room-crop' ? frame.value?.region : props.region || frame.value?.region)
const view=computed(()=>!full.value && region.value ? region.value : {x:0,y:0,width:frame.value?.width || 1,height:frame.value?.height || 1})
watch(()=>JSON.stringify(props.binding),async()=>{
  const request=++serial
  frame.value=null;error.value='';full.value=false;loading.value=false
  if(!props.binding?.evidenceId)return
  loading.value=true
  try {
    const result=await window.electronAPI.sanctum[props.kind==='effect'?'getEffectEvidence':'getRoomEvidence']({...props.binding})
    if(request!==serial)return
    if(!result.success)throw new Error(result.error)
    if(props.kind==='effect' && (result.data?.kind!=='effect-crop' || !result.data?.region))throw new Error('本次未定位到独立效果浮窗')
    frame.value=result.data
  } catch(e){if(request===serial)error.value=e.message}
  finally{if(request===serial)loading.value=false}
},{immediate:true})
</script>
<style scoped lang="less">
.recognition{margin:12px 0;padding:12px;border:1px solid var(--el-border-color);border-radius:6px}
svg{display:block;width:100%;height:auto;background:#111;margin-top:8px}rect{fill:none;stroke:#57c9ff;stroke-width:3;vector-effect:non-scaling-stroke}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}
</style>
