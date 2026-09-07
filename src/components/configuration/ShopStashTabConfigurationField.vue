<template>
  <div class="shop-stash-tab-field">
    <div class="shop-stash-tab-field__list">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="shop-stash-tab-field__card"
        :class="{ active: selectedIds.has(String(tab.id)) }"
        role="checkbox"
        tabindex="0"
        :aria-checked="selectedIds.has(String(tab.id))"
        @click="toggleTab(tab.id)"
        @keydown.space.prevent="toggleTab(tab.id)"
        @keydown.enter.prevent="toggleTab(tab.id)"
      >
        <div class="shop-stash-tab-field__title">
          <span class="shop-stash-tab-field__selection" @click.stop @keydown.stop>
            <el-checkbox
              :model-value="selectedIds.has(String(tab.id))"
              :aria-label="`启用仓库页 ${tab.name}`"
              @change="toggleTab(tab.id)"
            />
          </span>
          <strong>{{ tab.name }}</strong>
          <el-tag size="small">{{ tab.type === 'quad' ? '大型' : '普通' }}</el-tag>
        </div>
        <div class="shop-stash-tab-field__folder" @click.stop @keydown.stop>
          <span>文件夹内</span>
          <el-switch
            :model-value="Boolean(tab.inFolder)"
            :aria-label="`${tab.name}位于文件夹内`"
            @change="inFolder => emit('update-folder', { tabId: String(tab.id), inFolder: Boolean(inFolder) })"
          />
        </div>
      </div>
    </div>

    <span v-if="league && !tabs.length" class="shop-stash-tab-field__muted">没有可用的普通或大型仓库页</span>
    <p class="shop-stash-tab-field__muted shop-stash-tab-field__hint">
      勾选仓库名称前的复选框以启用该仓库页。旧接口无法判断仓库页是否在文件夹内，请按游戏中的实际位置设置“文件夹内”开关，默认关闭。
    </p>
    <el-button :loading="loading" @click="emit('refresh')">刷新仓库页列表</el-button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tabs: { type: Array, default: () => [] },
  selectedTabIds: { type: Array, default: () => [] },
  league: { type: String, default: '' },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['update:selectedTabIds', 'update-folder', 'refresh'])
const selectedIds = computed(() => new Set(props.selectedTabIds.map(String)))

function toggleTab(tabId) {
  const id = String(tabId)
  const next = selectedIds.value.has(id)
    ? props.selectedTabIds.map(String).filter(value => value !== id)
    : [...props.selectedTabIds.map(String), id]
  emit('update:selectedTabIds', next)
}
</script>

<style scoped>
.shop-stash-tab-field { display: grid; width: 100%; gap: 10px; }
.shop-stash-tab-field__list { display: grid; grid-template-columns: repeat(2, minmax(180px, 1fr)); gap: 10px 12px; }
.shop-stash-tab-field__card {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border-base);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: border-color .15s ease, background-color .15s ease, box-shadow .15s ease;
}
.shop-stash-tab-field__card:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--el-color-primary-light-7); }
.shop-stash-tab-field__card.active { border-color: var(--el-color-primary); }
.shop-stash-tab-field__card:hover { border-color: var(--el-color-primary-light-5); background: var(--el-color-primary-light-9); }
.shop-stash-tab-field__card.active:hover { border-color: var(--el-color-primary); }
.shop-stash-tab-field__title { display: flex; min-width: 0; align-items: center; gap: 8px; }
.shop-stash-tab-field__selection { display: flex; flex-shrink: 0; align-items: center; }
.shop-stash-tab-field__selection :deep(.el-checkbox) { height: auto; margin-right: 0; }
.shop-stash-tab-field__title strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.shop-stash-tab-field__folder { display: flex; flex-shrink: 0; align-items: center; gap: 7px; color: var(--text-secondary); font-size: 13px; white-space: nowrap; cursor: default; }
.shop-stash-tab-field__muted { color: var(--text-secondary); font-size: 13px; }
.shop-stash-tab-field__hint { margin: 0; }
.shop-stash-tab-field > .el-button { justify-self: start; }
@media (max-width: 680px) {
  .shop-stash-tab-field__list { grid-template-columns: 1fr; }
}
</style>
