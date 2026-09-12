<template>
  <p v-if="room.previousCapture">上次采集 · {{ room.failureReason || '本次采集尚未完成' }}</p>
  <SanctumRecognitionImage :binding="binding" kind="room" :region="shown.recognition?.titleRegion ? shown.recognition.region : shown.recognition?.bodyRegion || shown.recognition?.region" :texts="[shown.rawText].filter(Boolean)" :stage="stage" :reason="room.failureReason" />
</template>
<script setup>
import {computed} from 'vue'
import SanctumRecognitionImage from './SanctumRecognitionImage.vue'
const props=defineProps({room:Object,floor:Object})
const shown=computed(()=>props.room.previousCapture?.result || props.room)
const binding=computed(()=>props.room.previousCapture?.binding || {runId:props.floor.runId,floorId:props.floor.floorId,roomId:props.room.id,evidenceId:props.room.recognition?.evidenceId})
const stage=computed(()=>({queued:'等待文字识别',reading:'正在识别文字',matched:'文字已识别',empty:'未读到文字',failed:'文字识别失败',timeout:'文字识别超时'}[props.room.readStages?.ocr] || '截图核对'))
</script>
