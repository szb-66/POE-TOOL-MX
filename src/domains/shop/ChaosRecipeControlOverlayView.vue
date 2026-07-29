<template>
  <div class="control-shell">
    <div
      class="drag-handle"
      title="拖动商店配方按钮组"
      @pointerdown="drag.pointerDown"
      @pointermove="drag.pointerMove"
      @pointerup="drag.pointerUp"
      @pointercancel="drag.pointerUp"
    >
      <span></span><span></span><span></span>
    </div>
    <button
      :disabled="!state.canRefresh || busy !== ''"
      :title="state.refreshReason || '重新读取已选择的仓库页'"
      @pointerdown.stop.prevent="runFromPointer('refresh', $event)"
    >{{ busy === 'refresh' ? '刷新中…' : state.refreshLabel }}</button>
    <button
      :class="{ active: state.previewActive }"
      :disabled="!state.canPreview || busy !== ''"
      :title="state.previewReason || '在当前仓库页预览目标物品'"
      @pointerdown.stop.prevent="runFromPointer('preview', $event)"
    >{{ state.previewLabel }}</button>
    <button
      class="primary"
      :class="{ danger: state.automation?.status === 'running' }"
      :disabled="!state.canRun || busy !== ''"
      :title="state.actionReason || state.message || state.actionLabel"
      @pointerdown.stop.prevent="runFromPointer('action', $event)"
    >{{ busy === 'action' ? '处理中…' : state.actionLabel }}</button>
    <div class="status-message" :class="{ ready: state.canRun }">
      {{ state.statusMessage || '正在同步商店配方状态…' }}
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { electronApi } from '@/api/electron'
import { createOverlayDrag } from '@/utils/useOverlayDrag'

const state = reactive({
  visible: false,
  canRefresh: false,
  canPreview: false,
  canRun: false,
  refreshLabel: '刷新仓库',
  previewLabel: '预览高亮',
  previewActive: false,
  actionLabel: '自动取件',
  statusMessage: '正在同步商店配方状态…',
  automation: { status: 'idle' }
})
const busy = ref('')
let disposeState
const drag = createOverlayDrag((message) => electronApi.chaosRecipe.moveControl(message))

function applyState(response) {
  const snapshot = response?.success ? response.data : response
  if (snapshot) Object.assign(state, snapshot)
}

async function run(kind) {
  if (busy.value) return
  busy.value = kind
  try {
    const response = kind === 'refresh'
      ? await electronApi.chaosRecipe.controlRefresh()
      : kind === 'preview'
        ? await electronApi.chaosRecipe.controlPreview()
        : await electronApi.chaosRecipe.controlAction()
    if (!response?.success) state.actionReason = response?.error?.message || '操作失败'
  } finally {
    busy.value = ''
    applyState(await electronApi.chaosRecipe.getControlState())
  }
}

function runFromPointer(kind, event) {
  if (event.button === 0) void run(kind)
}

onMounted(async () => {
  disposeState = electronApi.chaosRecipe.onControlState(applyState)
  applyState(await electronApi.chaosRecipe.getControlState())
})
onUnmounted(() => disposeState?.())
</script>

<style scoped>
:global(html), :global(body), :global(#app) {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: transparent !important;
}
.control-shell {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 28px repeat(3, 1fr);
  grid-template-rows: 38px 20px;
  column-gap: 7px;
  row-gap: 3px;
  width: 100%;
  height: 100%;
  padding: 7px;
  border: 1px solid rgba(119, 157, 219, .55);
  border-radius: 12px;
  background: rgba(18, 26, 42, .94);
  box-shadow: 0 8px 24px rgba(0, 0, 0, .45);
  font-family: "Microsoft YaHei", sans-serif;
  user-select: none;
}
.drag-handle {
  grid-row: 1 / 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: move;
  touch-action: none;
}
.drag-handle span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(218, 230, 255, .75);
}
button {
  border: 1px solid rgba(132, 178, 255, .5);
  border-radius: 8px;
  color: #edf4ff;
  background: linear-gradient(145deg, #3a659d, #294c78);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .12), 0 2px 6px rgba(0, 0, 0, .28);
  font: 700 14px/1 "Microsoft YaHei", sans-serif;
  cursor: pointer;
  transition: filter .12s ease, transform .08s ease, box-shadow .12s ease;
}
button.primary { background: linear-gradient(145deg, #2f78cf, #24569a); }
button.active { background: linear-gradient(145deg, #d58a2f, #9a5d1f); }
button.danger { background: linear-gradient(145deg, #c75252, #8e3030); }
button:not(:disabled):hover {
  filter: brightness(1.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .2), 0 3px 9px rgba(0, 0, 0, .35);
}
button:not(:disabled):active {
  filter: brightness(.94);
  transform: translateY(1px);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, .28);
}
button:disabled {
  color: rgba(230, 235, 245, .45);
  border-color: rgba(120, 130, 148, .3);
  background: rgba(48, 53, 63, .9);
  box-shadow: none;
  cursor: not-allowed;
}
.status-message {
  grid-column: 2 / -1;
  overflow: hidden;
  color: #ffd18a;
  font-size: 12px;
  line-height: 20px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.status-message.ready { color: #91e2ad; }
</style>
