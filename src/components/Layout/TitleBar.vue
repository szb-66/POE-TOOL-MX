<template>
  <div class="title-bar">
    <div class="title-content">
      <img :src="appLogo" alt="" class="app-logo" />
      <span class="app-title">流放助手</span>
      <button
        v-if="updateEntryVisible"
        class="update-entry"
        type="button"
        :disabled="updateEntryDisabled"
        :title="updateEntryText"
        @click="handleUpdateEntry"
      >{{ updateEntryText }}</button>
    </div>
    <div class="window-controls">
      <div 
        class="control-btn" 
        :class="{ active: isAlwaysOnTop }"
        @click="toggleAlwaysOnTop" 
        :title="isAlwaysOnTop ? '取消置顶' : '置顶'"
      >
        <svg
          class="pin-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M8 3h8l-1 2v5l3 3v2H6v-2l3-3V5L8 3Z" />
          <path d="M12 15v6" />
        </svg>
      </div>
      <div class="control-btn" @click="minimizeWindow" title="最小化">
        <el-icon><Minus /></el-icon>
      </div>
      <div class="control-btn" @click="maximizeWindow" title="最大化">
        <el-icon><FullScreen /></el-icon>
      </div>
      <div class="control-btn close-btn" @click="closeWindow" title="关闭">
        <el-icon><Close /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, h, ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Minus, FullScreen, Close } from '@element-plus/icons-vue'
import { electronApi } from '@/api/electron'
import { useApplicationUpdateStore } from '@/stores/applicationUpdate'
import { createApplicationUpdateEntryActionRunner } from '@/utils/applicationUpdateAction'
import ReleaseNotesContent from '@/components/common/ReleaseNotesContent.vue'
import appLogo from '@/assets/images/LOGO-dark.png'

const isAlwaysOnTop = ref(false)
const updateEntryActionPending = ref(false)
const applicationUpdate = useApplicationUpdateStore()
const { state: updateState } = storeToRefs(applicationUpdate)
const runUpdateEntryAction = createApplicationUpdateEntryActionRunner((pending) => {
  updateEntryActionPending.value = pending
})

const updateEntryVisible = computed(() => ['available', 'downloading', 'downloaded', 'installing'].includes(updateState.value.status))
const updateEntryDisabled = computed(() => (
  updateEntryActionPending.value || ['downloading', 'installing'].includes(updateState.value.status)
))
const updateEntryText = computed(() => ({
  available: `发现新版本 v${updateState.value.availableVersion}`,
  downloading: `下载中 ${Math.round(updateState.value.progress?.percent || 0)}%`,
  downloaded: '更新已就绪，点击安装',
  installing: '正在准备安装…'
})[updateState.value.status] || '')

async function handleUpdateEntry() {
  try {
    const result = await runUpdateEntryAction({
      state: updateState.value,
      update: applicationUpdate,
      confirm: confirmApplicationUpdate
    })
    if (result?.cancelled) return
    if (result?.stale) {
      ElMessage.info('可用更新已发生变化，请重新查看更新内容')
      return
    }
    if (result && !result.success && !result.busy) {
      ElMessage.error(result.state?.error || '更新操作失败')
    }
  } catch (error) {
    ElMessage.error(error?.message || '更新操作失败')
  }
}

function formatUpdateDate(value) {
  if (!value) return '未知'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('zh-CN')
}

async function confirmApplicationUpdate(update) {
  const releaseNotes = update.releaseNotes || '本版本暂无更新说明'
  const message = h('div', { style: { textAlign: 'left' } }, [
    h('p', { style: { margin: '0 0 6px' } }, `目标版本：v${update.availableVersion || '未知'}`),
    h('p', { style: { margin: '0 0 12px', color: 'var(--text-secondary, #909399)' } }, `发布时间：${formatUpdateDate(update.releaseDate)}`),
    h('div', { style: { marginBottom: '6px', fontWeight: '600' } }, '更新内容'),
    h(ReleaseNotesContent, {
      source: releaseNotes,
      style: {
        margin: '0',
        maxHeight: '280px',
        overflow: 'auto',
        overflowWrap: 'anywhere'
      }
    })
  ])
  try {
    await ElMessageBox.confirm(message, '发现新版本', {
      confirmButtonText: update.status === 'downloaded' ? '重启并安装' : '下载更新',
      cancelButtonText: '暂不更新',
      closeOnClickModal: false,
      distinguishCancelAndClose: true,
      dangerouslyUseHTMLString: false
    })
    return true
  } catch (action) {
    if (action === 'cancel' || action === 'close') return false
    throw action
  }
}

async function toggleAlwaysOnTop() {
  isAlwaysOnTop.value = await electronApi.window.toggleAlwaysOnTop()
}

function minimizeWindow() {
  electronApi.window.minimize()
}

function maximizeWindow() {
  electronApi.window.maximize()
}

function closeWindow() {
  electronApi.window.close()
}

onMounted(async () => {
  // 检查初始状态
  isAlwaysOnTop.value = await electronApi.window.isAlwaysOnTop()
})
</script>

<style scoped lang="less">
.title-bar {
  height: 32px;
  flex: 0 0 32px;
  background-color: var(--nav-bg, #111419);
  display: flex;
  justify-content: space-between;
  align-items: center;
  -webkit-app-region: drag; /* Allow dragging */
  user-select: none;
  border-bottom: 1px solid var(--border-base, #3c3f41);
  color: var(--text-regular, #AEB4BD);
  box-shadow: inset 0 1px rgba(255, 255, 255, .025);
  
  /* Prevent dragging on interactive elements */
  .control-btn {
    -webkit-app-region: no-drag;
  }

  .update-entry {
    -webkit-app-region: no-drag;
  }
}

.title-content {
  display: flex;
  align-items: center;
  padding-left: 10px;
  gap: 8px;
  
  .app-logo {
    width: 18px;
    height: 18px;
    display: block;
    object-fit: contain;
  }
  
  .app-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary, #F2EFE8);
  }

  .update-entry {
    margin-left: 4px;
    padding: 2px 8px;
    border: 1px solid color-mix(in srgb, var(--brand-color, #C5A46D) 45%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--brand-color, #C5A46D) 12%, transparent);
    color: var(--brand-color, #C5A46D);
    font: inherit;
    font-size: 11px;
    line-height: 16px;
    cursor: pointer;
    transition: color .15s ease, background-color .15s ease, border-color .15s ease;

    &:hover:not(:disabled) {
      color: var(--text-primary, #fff);
      background: color-mix(in srgb, var(--brand-color, #C5A46D) 22%, transparent);
      border-color: var(--brand-color, #C5A46D);
    }

    &:focus-visible { outline: 2px solid var(--brand-color, #C5A46D); outline-offset: 1px; }
    &:disabled { cursor: default; opacity: .8; }
  }
}

.window-controls {
  display: flex;
  height: 100%;
  
  .control-btn {
    width: 46px;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: color .15s ease, background-color .15s ease, transform .15s ease;
    font-size: 14px;
    
    &:hover {
      background-color: var(--surface-hover, rgba(255, 255, 255, .08));
      color: var(--text-primary, #fff);
    }

    &:active { transform: translateY(1px); background: var(--surface-2, rgba(255, 255, 255, .05)); }
    &:focus-visible { outline: 2px solid var(--brand-color); outline-offset: -2px; }
    
    &.active {
      color: var(--brand-color, #C5A46D);
      background-color: color-mix(in srgb, var(--brand-color, #C5A46D) 13%, transparent);
      
      .pin-icon {
        transform: rotate(0);
      }
    }
    
    &.close-btn:hover {
      background-color: var(--danger-color, #D56C68);
      color: white;
    }

    .pin-icon {
      width: 15px;
      height: 15px;
      transform: rotate(-35deg);
      transition: transform .15s ease;
    }
  }
}
</style>
