<template>
  <el-card shadow="never">
    <template #header>圣物网格校准</template>
    <el-radio-group v-model="selected" :disabled="pending"><el-radio-button value="altar">祭坛 5×4</el-radio-button><el-radio-button value="locker">圣物仓库</el-radio-button></el-radio-group>
    <section class="title-calibration">
      <div class="title-heading"><b>{{ selected === 'altar' ? '祭坛标题' : '圣物仓库标题' }}</b><el-tag size="small" :type="titleCapture ? 'success' : 'info'">{{ titleCapture ? '已配置' : '待配置' }}</el-tag></div>
      <p>打开对应界面，框选顶部稳定标题。</p>
      <el-button :disabled="busy || pending" @click="act('captureCalibration', `sanctum-${selected}`)">{{ titleCapture ? '重新框选标题' : '框选标题' }}</el-button>
      <el-button :disabled="busy || pending || !titleCapture" @click="act('clearLiveCalibration', `sanctum-${selected}`)">清除标题</el-button>
      <p v-if="publicTitles?.issues?.[`sanctum-${selected}`]" role="alert">{{ publicTitles.issues[`sanctum-${selected}`] }}</p>
      <details v-if="titleCapture"><summary>查看标题截图</summary><img :src="image(titleCapture.png)" :alt="selected === 'altar' ? '祭坛标题预览' : '圣物仓库标题预览'" /></details>
    </section>
    <p>先在游戏中拉出完整网格，再点击下方截图修改格子属性。手动编辑不会改变游戏物品。</p>
    <div v-if="selected === 'locker'"><label>列 <el-input-number v-model="columns" :min="1" :max="24" :precision="0" :disabled="busy || pending" /></label>
      <label>行 <el-input-number v-model="rows" :min="1" :max="24" :precision="0" :disabled="busy || pending" /></label></div>
    <el-button :disabled="busy || pending" @click="capture">{{ profile ? '重新拉网格' : '拉网格截图' }}</el-button>
    <el-button :disabled="busy || pending || !profile" @click="act('clearLiveCalibration', selected)">清除</el-button>
    <p>重新框选时应用行列数，并重置属性和样本；取消保留原网格。</p>
    <template v-if="profile?.preview">
      <p>已保存 {{ profile.columns }}×{{ profile.rows }} · DPI {{ profile.environment.dpi }}</p>
      <div class="legend"><span class="usable">可用：参与扫描和确认后的摆放</span><span class="locked">锁定：不扫描、不摆放</span><span class="ignored">忽略：不扫描、不确认位置</span></div>
      <el-radio-group v-model="mode" :disabled="busy || pending"><el-radio-button value="edit">修改属性</el-radio-button><el-radio-button value="empty">选择空格样本</el-radio-button><el-radio-button value="locked">选择锁格样本</el-radio-button></el-radio-group>
      <p>{{ mode === 'edit' ? '点击按“可用 → 锁定 → 忽略”循环。锁定、忽略不会删除历史物品。' : '点击一个格子提取样本；不改变该格属性。' }}</p>
      <div class="grid-preview"><img :src="image(profile.preview.png)" alt="圣物网格截图" />
        <div class="cells" :style="{ gridTemplateColumns: `repeat(${profile.columns}, 1fr)`, gridTemplateRows: `repeat(${profile.rows}, 1fr)` }">
          <button v-for="(state, index) in profile.cellStates" :key="index" :class="state" :disabled="busy || pending" :aria-label="`第 ${index + 1} 格：${labels[state]}`" @click="clickCell(index)">{{ state === 'locked' ? '锁' : state === 'ignored' ? '略' : '' }}</button>
        </div>
      </div>
      <el-button :disabled="busy || pending" @click="act('saveGridCells', selected, Array(profile.columns * profile.rows).fill('usable'))">全部恢复可用</el-button>
      <div class="samples"><span v-for="key in ['empty', 'locked']" :key="key">{{ key === 'empty' ? '空格样本' : '锁格样本' }}<img v-if="profile.templates[key]" :src="image(profile.templates[key])" :alt="key === 'empty' ? '空格样本' : '锁格样本'" /><small v-else>尚未选择</small></span></div>
    </template>
    <p v-else>{{ profile ? '旧区域已保留，请重新拉网格补充截图预览。' : '尚未框选网格。' }}</p>
  </el-card>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
const props = defineProps({ profiles: Object, publicTitles: Object, busy: Boolean, action: Function })
const selected = ref('altar'), columns = ref(12), rows = ref(12), mode = ref('edit'), pending = ref(false)
const profile = computed(() => props.profiles?.[selected.value]), labels = { usable: '可用', locked: '锁定', ignored: '忽略' }
const titleCapture = computed(() => props.publicTitles?.templates?.[`sanctum-${selected.value}`])
const image = png => `data:image/png;base64,${png}`
watch(() => props.profiles?.locker, value => { if (value) { columns.value = value.columns; rows.value = value.rows } }, { immediate: true })
watch(selected, () => { mode.value = 'edit' })
async function act(name, ...args) { if (props.busy || pending.value) return; pending.value = true; try { await props.action(name, ...args) } finally { pending.value = false } }
function capture() { mode.value = 'edit'; return act('captureCalibration', selected.value, { columns: selected.value === 'altar' ? 5 : columns.value, rows: selected.value === 'altar' ? 4 : rows.value }) }
async function clickCell(index) {
  if (mode.value !== 'edit') { await act('selectSampleCell', selected.value, mode.value, index); mode.value = 'edit'; return }
  const cells = [...profile.value.cellStates], states = ['usable', 'locked', 'ignored']
  cells[index] = states[(states.indexOf(cells[index]) + 1) % 3]
  await act('saveGridCells', selected.value, cells)
}
</script>
<style scoped>
.title-calibration { margin-top: 16px; padding: 16px; border: 1px solid var(--el-border-color-light); border-radius: 8px; }
.title-heading { display: flex; align-items: center; gap: 12px; }
.title-calibration summary { cursor: pointer; margin-top: 12px; color: var(--el-text-color-secondary); }
.title-calibration img { display: block; max-width: 100%; max-height: 160px; margin-top: 12px; }
.grid-preview { position: relative; width: fit-content; max-width: 100%; margin: 12px 0; }
.grid-preview > img { display: block; max-width: 100%; max-height: 640px; }
.cells { position: absolute; inset: 0; display: grid; }
.cells button { min-width: 0; padding: 0; border: 1px solid #22d3ee88; color: white; cursor: pointer; }
.usable { background: #22d3ee14; } .locked { background: #ef444478; } .ignored { background: #64748b99; }
.legend { display: flex; gap: 12px; flex-wrap: wrap; margin: 12px 0; } .legend span { padding: 6px; }
.samples { display: flex; gap: 20px; margin-top: 12px; } .samples span { display: flex; align-items: center; gap: 8px; } .samples img { max-width: 80px; max-height: 80px; }
</style>
