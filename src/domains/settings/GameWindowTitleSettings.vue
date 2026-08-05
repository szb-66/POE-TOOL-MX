<template>
  <div class="game-window-title-settings">
    <h4 class="section-subtitle">游戏窗口名称</h4>
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

    <h4 class="section-subtitle process-title">客户端进程名</h4>
    <div class="title-list">
      <div v-for="(processName, index) in processDrafts" :key="index" class="process-row">
        <span class="priority">{{ index + 1 }}</span>
        <el-input
          v-model="processDrafts[index]"
          maxlength="120"
          :disabled="saving"
          @blur="commitProcessEdit"
          @keyup.enter="$event.target.blur()"
        />
        <el-button
          link
          type="danger"
          :disabled="saving || processDrafts.length === 1"
          @click="removeProcessName(index)"
        >删除</el-button>
      </div>
    </div>
    <div class="add-row">
      <el-input
        v-model="newProcessName"
        maxlength="120"
        placeholder="输入新的进程文件名，如 PathOfExile.exe"
        :disabled="saving"
        @keyup.enter="addProcessName"
      />
      <el-button :loading="saving" @click="addProcessName">新增</el-button>
    </div>
    <span class="hint-text">窗口所属进程的文件名需匹配列表中的任意一项，不区分大小写；保存时会自动只保留文件名。</span>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useSettingsStore } from './settingsStore'

const settingsStore = useSettingsStore()
const drafts = ref([...settingsStore.gameWindowTitles])
const processDrafts = ref([...settingsStore.gameWindowProcessNames])
const newTitle = ref('')
const newProcessName = ref('')
const dragIndex = ref(-1)
const saving = ref(false)

watch(() => settingsStore.gameWindowTitles, value => {
  if (!saving.value) drafts.value = [...value]
}, { deep: true })

watch(() => settingsStore.gameWindowProcessNames, value => {
  if (!saving.value) processDrafts.value = [...value]
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

async function commitProcessNames(processNames) {
  if (saving.value) return false
  saving.value = true
  const previous = [...settingsStore.gameWindowProcessNames]
  try {
    const result = await settingsStore.updateGameWindowProcessNames(processNames)
    if (!result.success) {
      processDrafts.value = previous
      ElMessage.error(result.error)
      return false
    }
    processDrafts.value = [...result.processNames]
    return true
  } finally {
    saving.value = false
  }
}

function commitProcessEdit() {
  if (processDrafts.value.every((processName, index) => processName === settingsStore.gameWindowProcessNames[index])) return
  void commitProcessNames(processDrafts.value)
}

async function addProcessName() {
  const processName = newProcessName.value
  if (await commitProcessNames([...settingsStore.gameWindowProcessNames, processName])) newProcessName.value = ''
}

function removeProcessName(index) {
  if (settingsStore.gameWindowProcessNames.length === 1) {
    ElMessage.warning('至少需要保留一个游戏客户端进程名')
    return
  }
  void commitProcessNames(settingsStore.gameWindowProcessNames.filter((_, itemIndex) => itemIndex !== index))
}
</script>

<style scoped lang="less">
.game-window-title-settings { width: min(620px, 100%); }
.section-subtitle { margin: 0 0 10px; font-size: 14px; color: var(--text-secondary); }
.process-title { margin-top: 18px; }
.title-list { display: flex; flex-direction: column; gap: 8px; }
.title-row { display: grid; grid-template-columns: 24px 24px minmax(180px, 1fr) 42px; gap: 8px; align-items: center; }
.process-row { display: grid; grid-template-columns: 24px minmax(180px, 1fr) 42px; gap: 8px; align-items: center; }
.drag-handle { cursor: grab; color: var(--text-secondary); user-select: none; letter-spacing: -3px; }
.priority { color: var(--text-secondary); text-align: center; font-variant-numeric: tabular-nums; }
.add-row { display: flex; gap: 8px; margin-top: 10px; }
.hint-text { display: block; margin-top: 8px; }
</style>
