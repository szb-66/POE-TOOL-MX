<template>
  <div class="game-window-title-settings">
    <div class="title-list">
      <div
        v-for="(title, index) in drafts"
        :key="index"
        class="title-row"
        @dragover.prevent
        @drop="dropTitle(index)"
      >
        <span
          class="drag-handle"
          draggable="true"
          title="拖动调整窗口匹配优先级"
          @dragstart="startDrag(index)"
          @dragend="dragIndex = -1"
        >⋮⋮</span>
        <span class="priority">{{ index + 1 }}</span>
        <el-input
          v-model="drafts[index]"
          maxlength="120"
          :disabled="saving"
          @blur="commitEdit"
          @keyup.enter="$event.target.blur()"
        />
        <el-button
          link
          type="danger"
          :disabled="saving || drafts.length === 1"
          @click="removeTitle(index)"
        >删除</el-button>
      </div>
    </div>
    <div class="add-row">
      <el-input
        v-model="newTitle"
        maxlength="120"
        placeholder="输入新的窗口名称"
        :disabled="saving"
        @keyup.enter="addTitle"
      />
      <el-button :loading="saving" @click="addTitle">新增</el-button>
    </div>
    <span class="hint-text">按顺序优先匹配，不区分大小写；窗口标题包含配置名称即可识别。</span>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useSettingsStore } from './settingsStore'

const settingsStore = useSettingsStore()
const drafts = ref([...settingsStore.gameWindowTitles])
const newTitle = ref('')
const dragIndex = ref(-1)
const saving = ref(false)

watch(() => settingsStore.gameWindowTitles, value => {
  if (!saving.value) drafts.value = [...value]
}, { deep: true })

async function commit(titles) {
  if (saving.value) return false
  saving.value = true
  const previous = [...settingsStore.gameWindowTitles]
  try {
    const result = await settingsStore.updateGameWindowTitles(titles)
    if (!result.success) {
      drafts.value = previous
      ElMessage.error(result.error)
      return false
    }
    drafts.value = [...result.titles]
    return true
  } finally {
    saving.value = false
  }
}

function commitEdit() {
  if (drafts.value.every((title, index) => title === settingsStore.gameWindowTitles[index])) return
  void commit(drafts.value)
}

async function addTitle() {
  const title = newTitle.value
  if (await commit([...settingsStore.gameWindowTitles, title])) newTitle.value = ''
}

function removeTitle(index) {
  if (settingsStore.gameWindowTitles.length === 1) {
    ElMessage.warning('至少需要保留一个游戏窗口名称')
    return
  }
  void commit(settingsStore.gameWindowTitles.filter((_, itemIndex) => itemIndex !== index))
}

function startDrag(index) {
  dragIndex.value = index
}

function dropTitle(index) {
  if (dragIndex.value < 0 || dragIndex.value === index || saving.value) return
  const titles = [...settingsStore.gameWindowTitles]
  const [moved] = titles.splice(dragIndex.value, 1)
  titles.splice(index, 0, moved)
  dragIndex.value = -1
  void commit(titles)
}
</script>

<style scoped lang="less">
.game-window-title-settings { width: min(620px, 100%); }
.title-list { display: flex; flex-direction: column; gap: 8px; }
.title-row { display: grid; grid-template-columns: 24px 24px minmax(180px, 1fr) 42px; gap: 8px; align-items: center; }
.drag-handle { cursor: grab; color: var(--text-secondary); user-select: none; letter-spacing: -3px; }
.priority { color: var(--text-secondary); text-align: center; font-variant-numeric: tabular-nums; }
.add-row { display: flex; gap: 8px; margin-top: 10px; }
.hint-text { display: block; margin-top: 8px; }
</style>
