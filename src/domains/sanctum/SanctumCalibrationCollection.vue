<template>
  <div class="collection">
    <p>按照以下步骤获取游戏内对应界面截图</p>
    <div class="sources">
      <section v-for="source in sources" :key="source.number">
        <div class="buttons">
          <el-button type="primary" :disabled="disabled || pending" @click="capture">获取截图{{ source.number }}</el-button>
          <el-button @click="example = source.url">查看示例{{ source.number }}</el-button>
        </div>
        <p>{{ source.hint }}</p>
      </section>
    </div>
    <p v-if="pending" role="status">{{ pendingLabel }} <el-button v-if="capturing" size="small" @click="cancelCapture">取消采集</el-button></p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="progress-heading"><b>{{ count === elements.length ? '校准完整' : `已收集 ${count} / ${elements.length} 项` }}</b><span v-if="draft.dirty">有尚未保存的确认结果</span></div>
    <div class="progress-items">
      <el-tag v-for="item in elements" :key="item.key" :type="draft.items[item.key] ? 'success' : 'info'">
        {{ item.label }} · {{ draft.items[item.key] ? (draft.items[item.key].saved ? '已保存' : '已确认') : `待收集 · 示例${item.example === 1 ? '一' : '二'}` }}
      </el-tag>
    </div>
    <p v-if="missing.length">参考对应示例补齐待收集项，也可先保存已确认的部分。</p>
    <div class="buttons">
      <el-button type="primary" :disabled="disabled || pending || !draft.dirty || Boolean(draft.current)" @click="save">保存已确认校准</el-button>
      <el-button :disabled="disabled || pending || !draft.id" @click="discard(true)">丢弃草稿 / 重新收集</el-button>
    </div>

    <section v-if="draft.current" class="review">
      <h3>核对当前截图</h3>
      <p>{{ draft.current.message }} 点击标注选择元素；拖动选框可移动，拖动右下角可调整大小，也可在空白处重新框选。</p>
      <el-select v-model="activeKey" placeholder="选择元素以调整或补框" aria-label="选择校准元素" style="width: 300px">
        <el-option v-for="item in elements" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>
      <p v-if="activeKey">正在编辑：{{ label(activeKey) }}。未自动识别的元素，请仅在画面实际包含它时补框。</p>
      <div class="frame">
        <img :src="currentUrl" alt="当前游戏截图" draggable="false" />
        <svg :viewBox="`0 0 ${draft.current.environment.width} ${draft.current.environment.height}`" @pointerdown="begin($event, 'draw')" @pointermove="move" @pointerup="end" @pointercancel="end">
          <g v-for="candidate in candidates" :key="candidate.key" :class="{ active: activeKey === candidate.key }">
            <rect v-bind="candidate.region" class="selection" @pointerdown.stop="begin($event, 'move', candidate.key)" />
            <text :x="candidate.region.x" :y="Math.max(20, candidate.region.y - 7)" :font-size="draft.current.environment.width / 85">{{ label(candidate.key) }}</text>
            <rect v-if="activeKey === candidate.key" :x="candidate.region.x + candidate.region.width - handleSize" :y="candidate.region.y + candidate.region.height - handleSize" :width="handleSize * 2" :height="handleSize * 2" class="handle" @pointerdown.stop="begin($event, 'resize', candidate.key)" />
          </g>
        </svg>
      </div>
      <div class="candidate-grid">
        <section v-for="candidate in candidates" :key="candidate.key" :class="{ chosen: activeKey === candidate.key }" @click="activeKey = candidate.key">
          <el-checkbox v-model="candidate.selected" :disabled="pending || disabled">{{ draft.items[candidate.key] ? '用本次结果替换：' : '确认：' }}{{ label(candidate.key) }}</el-checkbox>
          <p>{{ candidate.reason }}</p>
          <div class="previews">
            <div><small>本次截图</small><svg :viewBox="rectView(candidate.region)" role="img" :aria-label="`${label(candidate.key)}本次预览`"><defs><clipPath :id="`calibration-preview-${candidate.key}`"><rect v-bind="candidate.region" /></clipPath></defs><image :clip-path="`url(#calibration-preview-${candidate.key})`" :href="currentUrl" :width="draft.current.environment.width" :height="draft.current.environment.height" /></svg></div>
            <div v-if="draft.items[candidate.key]"><small>已确认结果（默认保留）</small><img :src="pngUrl(draft.items[candidate.key].png)" :alt="`${label(candidate.key)}旧预览`" /></div>
          </div>
        </section>
      </div>
      <div class="buttons">
        <el-button type="primary" :disabled="disabled || pending || !candidates.some(item => item.selected)" @click="confirm">确认本次结果</el-button>
        <el-button :disabled="disabled || pending" @click="discard(false)">取消本次截图</el-button>
      </div>
    </section>
    <details v-if="!draft.id" class="advanced"><summary>高级手动校准</summary><slot /></details>
    <p v-else>需要逐项截图或调整 HSV 时，请先保存或丢弃草稿，再打开高级手动校准。</p>
    <el-image-viewer v-if="example" :url-list="[example]" :teleported="true" @close="example = null" />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { ElImageViewer } from 'element-plus'
import 'element-plus/es/components/image-viewer/style/css'
import { useSanctumStore } from './sanctumStore.js'
import { COLLECTION_ELEMENTS } from '../../../shared/sanctumCalibrationCollection.js'
import exampleOne from '../../assets/images/sanctum-calibration/example-1.png'
import exampleTwo from '../../assets/images/sanctum-calibration/example-2.png'
const store = useSanctumStore(), elements = COLLECTION_ELEMENTS
const disabled = computed(() => store.busy || store.readOnly)
const sources = [
  { number: '一', url: exampleOne, hint: '首次截图需要将圣所进度推进到第二列房间，然后退出圣所再进入，使状态栏出现在地图内。当前截图会自动获取完整地图标题、所有房间和连线、金币面板、坚毅与启迪模块，以及状态和奖励图标。' },
  { number: '二', url: exampleTwo, hint: '在上一步的基础上，进入第三列房间的禁域地图操作台，当前截图会自动获取操作台的入口和单独显示的状态栏位置' }
]
const draft = ref({ items: {}, current: null }), candidates = ref([]), activeKey = ref(''), example = ref(null)
const pending = ref(false), capturing = ref(false), pendingLabel = ref(''), error = ref('')
const count = computed(() => elements.filter(item => draft.value.items[item.key]).length)
const missing = computed(() => elements.filter(item => !draft.value.items[item.key]))
const pngUrl = value => `data:image/png;base64,${value}`
const currentUrl = computed(() => pngUrl(draft.value.current?.png || ''))
const handleSize = computed(() => (draft.value.current?.environment.width || 1920) / 180)
const label = key => elements.find(item => item.key === key)?.label || key
const rectView = r => `${r.x} ${r.y} ${r.width} ${r.height}`
let drag = null, mounted = true
async function run(name, value, message = '正在处理…') {
  if (pending.value || disabled.value && name !== 'getCalibrationCollection') return
  pending.value = true; pendingLabel.value = message; error.value = ''
  try {
    const result = await store.call(name, ...(value === undefined ? [] : [value]))
    if (!mounted) return
    draft.value = result
    candidates.value = (result.current?.candidates || []).map(item => ({ ...item, selected: !result.items[item.key] }))
    activeKey.value = candidates.value[0]?.key || ''
  } catch (failure) { if (mounted) error.value = failure.message }
  finally { pending.value = false }
}
async function capture() { capturing.value = true; try { await run('captureCalibrationCollection', undefined, '正在获取游戏截图并自动分析，请稍候…') } finally { capturing.value = false } }
async function cancelCapture() { try { await store.call('cancelCalibrationCollection') } catch (failure) { error.value = failure.message } }
function confirm() { return run('confirmCalibrationCollection', { id: draft.value.id, frameId: draft.value.current.id,
  selections: candidates.value.filter(item => item.selected).map(item => ({ key: item.key, region: item.region, replace: Boolean(draft.value.items[item.key]) })) }) }
function discard(all) { return run('discardCalibrationCollection', { id: draft.value.id, all }) }
function save() { return run('saveCalibrationCollection', { id: draft.value.id }, '正在保存校准…') }
function point(event) {
  const svg = event.currentTarget.tagName === 'svg' ? event.currentTarget : event.currentTarget.ownerSVGElement
  const box = svg.getBoundingClientRect(), env = draft.value.current.environment
  return { x: Math.round(Math.max(0, Math.min(env.width, (event.clientX-box.left)*env.width/box.width))),
    y: Math.round(Math.max(0, Math.min(env.height, (event.clientY-box.top)*env.height/box.height))), svg }
}
function begin(event, mode, key) {
  if (pending.value || disabled.value || event.button !== 0) return
  if (key) activeKey.value = key
  if (!activeKey.value) return
  const p = point(event)
  let item = candidates.value.find(item => item.key === activeKey.value)
  if (!item) { candidates.value.push({ key: activeKey.value, reason: '手动选框，请核对', selected: !draft.value.items[activeKey.value], region: {x:Math.min(p.x,draft.value.current.environment.width-1),y:Math.min(p.y,draft.value.current.environment.height-1),width:1,height:1} }); item = candidates.value.at(-1) }
  drag = { mode, start: p, item, original: { ...item.region } }
  p.svg.setPointerCapture(event.pointerId)
  event.preventDefault()
}
function move(event) {
  if (!drag) return
  const p = point(event), { original: r, start, item, mode } = drag, env = draft.value.current.environment
  if (mode === 'move') item.region = { ...r, x: Math.max(0,Math.min(env.width-r.width,r.x+p.x-start.x)), y: Math.max(0,Math.min(env.height-r.height,r.y+p.y-start.y)) }
  else if (mode === 'resize') item.region = { ...r, width: Math.max(1,p.x-r.x), height: Math.max(1,p.y-r.y) }
  else item.region = { x: Math.min(start.x,p.x,env.width-1), y: Math.min(start.y,p.y,env.height-1), width: Math.max(1,Math.abs(p.x-start.x)), height: Math.max(1,Math.abs(p.y-start.y)) }
}
function end() { drag = null }
onMounted(() => run('getCalibrationCollection'))
watch(() => [store.state.liveCalibration, store.state.publicTitles], () => { if (!draft.value.id && !pending.value) void run('getCalibrationCollection') })
onBeforeUnmount(() => { mounted = false; if (capturing.value) void cancelCapture() })
</script>

<style scoped lang="less">
.collection { display: grid; gap: 16px; }
p { color: var(--el-text-color-secondary); line-height: 1.7; margin: 0; }
.sources, .candidate-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(min(100%,330px),1fr)); gap: 16px; }
.sources section, .candidate-grid section { padding: 16px; border: 1px solid var(--el-border-color); border-radius: 8px; min-width: 0; }
.sources p { margin-top: 12px; }
.buttons, .progress-items, .progress-heading { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.buttons :deep(.el-button + .el-button) { margin-left: 0; }
.progress-heading span, small { color: var(--el-text-color-secondary); }
.review { display: grid; gap: 16px; }
.frame { position: relative; user-select: none; }
.frame > img { width: 100%; display: block; }
.frame > svg { position: absolute; inset: 0; width: 100%; height: 100%; touch-action: none; cursor: crosshair; }
.selection { fill: #409eff15; stroke: #409eff; stroke-width: 2; vector-effect: non-scaling-stroke; cursor: move; }
text { fill: white; stroke: #111; stroke-width: 3; paint-order: stroke; pointer-events: none; }
.active .selection { stroke: #e6a23c; }
.handle { fill: #e6a23c; cursor: nwse-resize; }
.candidate-grid .chosen { border-color: var(--el-color-primary); }
.previews { display: flex; gap: 12px; margin-top: 8px; }
.previews > div { flex: 1; min-width: 0; }
.previews svg, .previews img { display: block; width: 100%; height: 110px; object-fit: contain; background: #151515; margin-top: 6px; }
.error { color: var(--el-color-danger); }
.advanced summary { cursor: pointer; padding: 12px 0; }
</style>
