<template>
  <div
    ref="controlShell"
    class="control-shell"
  >
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
    <div class="button-row">
      <button
        v-if="state.recipeEnabled"
        v-show="!state.rewardDetected"
        :disabled="!state.canRefresh || busy !== ''"
        :title="state.refreshReason || '重新读取已选择的仓库页'"
        @pointerdown.stop.prevent="runFromPointer('refresh', $event)"
      >{{ busy === 'refresh' ? '刷新中…' : state.refreshLabel }}</button>
      <button
        v-if="state.recipeEnabled"
        v-show="!state.rewardDetected"
        :class="{ active: state.previewActive }"
        :disabled="!state.canPreview || busy !== ''"
        :title="state.previewReason || '在当前仓库页预览目标物品'"
        @pointerdown.stop.prevent="runFromPointer('preview', $event)"
      >{{ state.previewLabel }}</button>
      <div
        v-if="state.recipeEnabled"
        v-show="!state.rewardDetected"
        class="recipe-picker"
      >
        <button
          :class="{ active: recipeMenuOpen }"
          :disabled="!state.canSelectRecipe || busy !== ''"
          :title="state.recipeSelectionReason || '选择要取出的商城配方'"
          aria-label="取件配方"
          @pointerdown.stop.prevent="toggleRecipeMenu"
        >{{ activeRecipeOption?.label || '选择配方' }} ▾</button>
        <div v-if="recipeMenuOpen" class="recipe-menu">
          <button
            v-for="option in state.recipeOptions"
            :key="option.value"
            :class="{ active: option.value === state.activeRecipeId }"
            :disabled="busy !== ''"
            @pointerdown.stop.prevent="selectControlRecipe(option.value, $event)"
          >{{ option.label }}</button>
        </div>
      </div>
      <button
        v-if="state.recipeEnabled"
        v-show="!state.rewardDetected"
        class="primary"
        :class="{ danger: state.automation?.status === 'running' }"
        :disabled="!state.canRun || busy !== ''"
        :title="state.actionReason || state.message || state.actionLabel"
        @pointerdown.stop.prevent="runFromPointer('action', $event)"
      >{{ busy === 'action' ? '处理中…' : state.actionLabel }}</button>
      <button
        v-if="state.stashPickupEnabled"
        v-show="!state.rewardDetected"
        class="primary"
        :class="{ danger: state.stashPickupAutomation?.status === 'running' }"
        :disabled="!state.canStashPickup || busy !== ''"
        :title="state.stashPickupReason || state.stashPickupLabel"
        @pointerdown.stop.prevent="runFromPointer('stash', $event)"
      >{{ busy === 'stash' ? '处理中…' : state.stashPickupLabel }}</button>
      <button
        v-if="state.junfengEnabled && state.rewardDetected"
        class="primary"
        :class="{ danger: state.junfengRunning }"
        :disabled="!state.canJunfeng || Boolean(busy)"
        :title="state.junfengReason || state.junfengButtonLabel"
        @pointerdown.stop.prevent="runFromPointer('junfeng', $event)"
      >{{ busy === 'junfeng' ? '处理中…' : state.junfengButtonLabel }}</button>
    </div>
    <div class="status-message" :class="{ ready: state.canRun }">
      {{ state.statusMessage || '正在同步商店配方状态…' }}
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
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
  actionLabel: '取出配方',
  activeRecipeId: 'chaos',
  recipeOptions: [],
  canSelectRecipe: false,
  recipeSelectionReason: '',
  statusMessage: '正在同步商店配方状态…',
  automation: { status: 'idle' },
  recipeEnabled: false,
  stashPickupEnabled: false,
  canStashPickup: false,
  stashPickupAutomation: { status: 'idle' },
  rewardDetected: false,
  junfengEnabled: false,
  junfengReady: false,
  junfengRunning: false,
  canJunfeng: false,
  junfengButtonLabel: '取出高亮',
  junfengAutomation: { status: 'idle' }
})
const busy = ref('')
const recipeMenuOpen = ref(false)
const activeRecipeOption = computed(() =>
  state.recipeOptions.find((option) => option.value === state.activeRecipeId)
)
const controlShell = ref(null)
let disposeState
let resizeObserver
const drag = createOverlayDrag((message) => electronApi.chaosRecipe.moveControl(message))

function applyState(response) {
  const snapshot = response?.success ? response.data : response
  if (snapshot) Object.assign(state, snapshot)
  if (!state.canSelectRecipe) recipeMenuOpen.value = false
  void nextTick(reportContentSize)
}

function reportContentSize() {
  const bounds = controlShell.value?.getBoundingClientRect()
  if (!bounds?.width || !bounds?.height) return
  electronApi.chaosRecipe.resizeControl({
    width: Math.ceil(bounds.width),
    height: Math.ceil(bounds.height)
  })
}

async function run(kind) {
  if (busy.value) return
  busy.value = kind
  try {
    const response = kind === 'junfeng'
      ? (state.junfengRunning ? await electronApi.junfeng.stop() : await electronApi.junfeng.start())
      : kind === 'stash'
      ? (state.stashPickupAutomation?.status === 'running'
          ? await electronApi.stashPickup.stop()
          : await electronApi.stashPickup.start())
      : kind === 'refresh'
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

function toggleRecipeMenu(event) {
  if (event.button === 0 && state.canSelectRecipe && !busy.value) {
    recipeMenuOpen.value = !recipeMenuOpen.value
  }
}

async function selectControlRecipe(recipeId, event) {
  if (event.button !== 0 || busy.value) return
  recipeMenuOpen.value = false
  busy.value = 'recipe'
  try {
    const response = await electronApi.chaosRecipe.selectControlRecipe(recipeId)
    if (!response?.success) state.recipeSelectionReason = response?.error?.message || '切换配方失败'
    else applyState(response)
  } finally {
    busy.value = ''
    applyState(await electronApi.chaosRecipe.getControlState())
  }
}

onMounted(async () => {
  resizeObserver = new ResizeObserver(reportContentSize)
  if (controlShell.value) resizeObserver.observe(controlShell.value)
  disposeState = electronApi.chaosRecipe.onControlState(applyState)
  applyState(await electronApi.chaosRecipe.getControlState())
})
onUnmounted(() => {
  resizeObserver?.disconnect()
  disposeState?.()
})
</script>

<style scoped>
:global(html), :global(body), :global(#app) {
  width: max-content;
  height: max-content;
  margin: 0;
  overflow: hidden;
  background: transparent !important;
}
.control-shell {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 28px max-content;
  grid-template-rows: 38px 20px;
  column-gap: 7px;
  row-gap: 3px;
  width: max-content;
  height: max-content;
  padding: 7px;
  border: 1px solid rgba(119, 157, 219, .55);
  border-radius: 12px;
  background: rgba(18, 26, 42, .94);
  box-shadow: 0 8px 24px rgba(0, 0, 0, .45);
  font-family: "Microsoft YaHei", sans-serif;
  user-select: none;
}
.button-row {
  display: flex;
  gap: 7px;
}
.drag-handle {
  grid-row: 1 / 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: grab;
  touch-action: none;
}
.drag-handle:active { cursor: grabbing; }
.drag-handle span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(218, 230, 255, .75);
}
button {
  box-sizing: border-box;
  flex: 0 0 auto;
  height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(132, 178, 255, .5);
  border-radius: 8px;
  color: #edf4ff;
  background: linear-gradient(145deg, #3a659d, #294c78);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .12), 0 2px 6px rgba(0, 0, 0, .28);
  font: 700 14px/1 "Microsoft YaHei", sans-serif;
  white-space: nowrap;
  cursor: pointer;
  transition: filter .12s ease, transform .08s ease, box-shadow .12s ease;
}
.recipe-picker {
  display: block;
}
.recipe-menu {
  position: fixed;
  z-index: 10;
  top: 7px;
  right: 7px;
  left: 42px;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  height: 38px;
  background: rgba(18, 26, 42, .98);
}
.recipe-menu button {
  min-width: 0;
  height: 38px;
  padding: 0 4px;
  font-size: 11px;
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
  grid-column: 2;
  min-width: 0;
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
