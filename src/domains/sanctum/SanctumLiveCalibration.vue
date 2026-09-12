<template>
  <div class="calibration-groups">
    <el-card v-for="group in visibleGroups" :key="group.id" shadow="never">
      <template #header><div class="group-heading"><b>{{ group.label }}</b><span>{{ group.items.filter(item => capture(item.key)).length }} / {{ group.items.length }} 已配置</span></div></template>
      <p class="group-hint">{{ group.hint }}</p>
      <div class="capture-grid">
        <section v-for="item in group.items" :key="item.key" class="capture-item">
          <div class="item-heading"><b>{{ item.label }}</b><el-tag size="small" :type="capture(item.key) ? 'success' : 'info'">{{ capture(item.key) ? '已配置' : '待配置' }}</el-tag></div>
          <p class="item-hint">{{ item.hint }}</p>
          <div class="actions">
            <el-button :disabled="busy || pending" @click="act('captureCalibration', item.key)">{{ capture(item.key) ? '重新框选' : '框选截图' }}</el-button>
            <el-button :disabled="busy || pending || !saved(item.key)" @click="act('clearLiveCalibration', item.key)">清除</el-button>
          </div>
          <details v-if="capture(item.key)" class="preview">
            <summary>查看截图{{ item.key === 'pathColor' ? ' / 点击取色' : '' }}</summary>
            <img :src="image(capture(item.key))" :alt="`${item.label}预览`" :class="{ eyedropper: item.key === 'pathColor' }" @click="item.key === 'pathColor' && pickColor($event)" />
            <small>{{ capture(item.key).environment.width }} × {{ capture(item.key).environment.height }} · DPI {{ capture(item.key).environment.dpi }}</small>
          </details>
          <small v-else-if="saved(item.key)">旧区域已保留，请重新框选补充截图。</small>
          <small v-if="publicTitles?.issues?.[item.key]" role="alert">{{ publicTitles.issues[item.key] }}</small>
        </section>
      </div>
      <details v-if="group.id === 'map'" class="advanced"><summary>路径颜色高级调整（HSV）</summary>
        <div v-for="(row, i) in hsv" :key="i" class="hsv-row"><span>{{ i ? '上限' : '下限' }}</span>
          <el-input-number v-for="(_, j) in row" :key="j" v-model="hsv[i][j]" :min="0" :max="j === 0 ? 179 : 255" :precision="0" :disabled="busy || pending" :aria-label="`${i ? '上限' : '下限'} ${['H','S','V'][j]}`" />
        </div><el-button :disabled="busy || pending || !profile?.captures?.pathColor" @click="act('selectPathColor', { pathHsv: hsv })">保存颜色范围</el-button>
      </details>
    </el-card>
  </div>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
const props = defineProps({ profile: Object, publicTitles: Object, busy: Boolean, action: Function, section: { type: String, default: 'map' } })
const pending = ref(false), hsv = ref([[12, 95, 42], [40, 255, 255]])
const groups = [
  { id: 'map', label: '地图识别', hint: '打开圣所地图后框选。标题用于确认地图打开，楼层与区域等级来自游戏日志。', items: [
    { key: 'sanctum-map', label: '地图标题', hint: '框选地图顶部的稳定标题。' },
    { key: 'mapRegion', label: '地图范围', hint: '覆盖完整房间和连线。' },
    { key: 'roomSize', label: '房间内框', hint: '框选一个房间的内框，确定房间尺寸。' },
    { key: 'pathColor', label: '路径颜色', hint: '框选路径样本后，展开截图并点击路径颜色。' }
  ] },
  { id: 'embedded', label: '地图内状态栏', hint: '地图与状态栏同时显示时配置。金币与坚毅启迪分开框选；完整识别时自动更新资源。旧坚毅、启迪小框已停用，请重新框选完整模块。', items: [
    {key:'coinsRegion',label:'金币图标与数量',hint:'框选地图右上角完整金币面板，包含金币图标及其右侧数量。'},
    {key:'mapResourcesRegion',label:'坚毅与启迪完整模块',hint:'包含文字、数值、完整边框及少量边距，覆盖启迪出现及坚毅上下移动的位置。'},
    { key: 'sanctum-map-hud', label: '状态栏识别锚点', hint: '框选稳定装饰，避开数值与效果图标。' },
    { key: 'mapEffectIconsRegion', label: '状态及奖励图标范围', hint: '覆盖状态和奖励入口图标可能占用的位置，并留少量边距。读取时自动悬停展开，无需框选弹框。' }
  ] },
  { id: 'standalone', label: '独立状态栏', hint: '关闭地图后配置。此布局的位置与地图内状态栏分别保存。', items: [
    {key:'hudResourcesRegion',label:'完整状态栏资源',hint:'一次框住整个状态栏，包含金币图标及数量、坚毅与启迪文字数值，保留完整边框和少量边距。'},
    {key:'sanctum-map-entry',label:'禁域地图入口',hint:'地图关闭时框选场景中的“禁域地图”文字。读取独立状态栏后，将识别并点击此入口恢复可选房地图。'},
    { key: 'effectIconsRegion', label: '状态及奖励图标范围', hint: '覆盖整条状态和奖励入口图标可能占用的范围。读取时自动悬停展开，无需框选弹框。' }
  ] }
]
const visibleGroups = computed(() => groups.filter(group => props.section === 'map' ? group.id === 'map' : group.id !== 'map'))
const capture = key => key.startsWith('sanctum-') ? props.publicTitles?.templates?.[key] : props.profile?.captures?.[key]
const saved = key => capture(key) || props.profile?.[key]
const image = value => `data:image/png;base64,${value.png}`
watch(() => props.profile?.calibration?.pathHsv, value => { if (value) hsv.value = value.map(row => [...row]) }, { immediate: true })
async function act(name, ...args) { if (props.busy || pending.value) return; pending.value = true; try { await props.action(name, ...args) } finally { pending.value = false } }
function pickColor(event) {
  const img = event.currentTarget, r = img.getBoundingClientRect()
  return act('selectPathColor', { x: Math.min(img.naturalWidth - 1, Math.floor((event.clientX - r.left) * img.naturalWidth / r.width)), y: Math.min(img.naturalHeight - 1, Math.floor((event.clientY - r.top) * img.naturalHeight / r.height)) })
}
</script>
<style scoped lang="less">
.calibration-groups { display: grid; gap: 16px; }
.group-heading, .item-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.group-heading span, small { color: var(--el-text-color-secondary); font-size: 12px; }
.group-hint { margin: 0 0 16px; color: var(--el-text-color-secondary); line-height: 1.6; }
.capture-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 16px; }
.capture-item { min-width: 0; border: 1px solid var(--el-border-color-light); border-radius: 8px; padding: 16px; }
.item-hint { color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.6; min-height: 42px; margin: 10px 0; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; :deep(.el-button + .el-button) { margin-left: 0; } }
summary { cursor: pointer; color: var(--el-text-color-secondary); padding: 12px 0; font-size: 13px; }
.preview img { display: block; max-width: 100%; max-height: 200px; object-fit: contain; margin-bottom: 8px; }
.eyedropper { cursor: crosshair; }
.advanced { margin-top: 16px; border-top: 1px solid var(--el-border-color-light); }
.hsv-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
</style>
