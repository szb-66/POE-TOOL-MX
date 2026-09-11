<template>
  <el-card shadow="never">
    <template #header>样本校准</template>
    <p>参数仅应用于所选裁剪图。DPI 未确认，不能用于实时输入。保存后重新回放可比较房间和连线。</p>
    <el-select v-model="sampleId" placeholder="选择校准样本" aria-label="校准样本" style="width: 320px">
      <el-option v-for="sample in samples" :key="sample.id" :value="sample.id" :label="`${sample.title} · ${sample.id}`" />
    </el-select>
    <template v-if="draft">
      <p>裁剪图：{{ draft.imageSize.join(' × ') }} 像素 · {{ calibrations[sampleId] ? '已有保存参数' : '自动参数' }}</p>
      <el-form label-position="top" :disabled="busy">
        <div class="fields">
          <el-form-item v-for="(label, i) in ['区域左边', '区域上边', '区域宽度', '区域高度']" :key="label" :label="label">
            <el-input-number v-model="draft.region[i]" :min="i < 2 ? 0 : 1" :max="draft.imageSize[i % 2]" :precision="0" />
          </el-form-item>
        </div>
        <el-checkbox v-model="customRoom">指定房间内框尺寸</el-checkbox>
        <div v-if="customRoom" class="fields">
          <el-form-item v-for="(label, i) in ['房间宽度', '房间高度']" :key="label" :label="label">
            <el-input-number v-model="roomSize[i]" :min="24" :max="1000" :precision="0" />
          </el-form-item>
          <el-button :disabled="floor?.sampleId !== sampleId || !selectedRoom" @click="useRoom">使用楼层页选中房间</el-button>
        </div>
        <p>路径颜色使用 HSV 范围：色相 0–179，饱和度与亮度 0–255。</p>
        <div v-for="(row, index) in draft.pathHsv" :key="index" class="fields">
          <el-form-item v-for="(label, channel) in ['色相', '饱和度', '亮度']" :key="channel" :label="`${label}${index ? '上限' : '下限'}`">
            <el-input-number v-model="row[channel]" :min="0" :max="channel ? 255 : 179" :precision="0" />
          </el-form-item>
        </div>
        <el-button type="primary" :disabled="busy" @click="$emit('save', { ...draft, roomSize: customRoom ? roomSize : null })">保存样本校准</el-button>
        <el-button :disabled="busy" @click="$emit('reset', sampleId)">恢复自动参数</el-button>
        <el-button :disabled="busy" @click="$emit('replay', sampleId)">按已保存参数回放</el-button>
      </el-form>
    </template>
  </el-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
const props = defineProps({ samples: { type: Array, default: () => [] }, calibrations: { type: Object, default: () => ({}) },
  floor: { type: Object, default: null }, selectedRoom: { type: Object, default: null }, busy: Boolean })
defineEmits(['save', 'reset', 'replay'])
const sampleId = ref(''), draft = ref(null), customRoom = ref(false), roomSize = ref([100, 150])
const sample = computed(() => props.samples.find(item => item.id === sampleId.value))
watch([sample, () => JSON.stringify(props.calibrations[sampleId.value])], () => {
  if (!sample.value) { draft.value = null; return }
  const crop = sample.value.crop, imageSize = [crop[2] - crop[0], crop[3] - crop[1]]
  const saved = props.calibrations[sampleId.value]
  draft.value = JSON.parse(JSON.stringify(saved || { version: 1, scope: 'sample', sampleId: sampleId.value,
    imageSize, region: [0, 0, ...imageSize], roomSize: null, pathHsv: [[12, 95, 42], [40, 255, 255]] }))
  customRoom.value = Boolean(saved?.roomSize)
  roomSize.value = saved?.roomSize ? [...saved.roomSize] : [100, 150]
})
function useRoom() { if (props.selectedRoom && props.floor?.sampleId === sampleId.value) roomSize.value = [props.selectedRoom.width, props.selectedRoom.height] }
</script>

<style scoped lang="less">
.fields { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 12px; }
p { color: var(--el-text-color-secondary); line-height: 1.6; }
</style>
