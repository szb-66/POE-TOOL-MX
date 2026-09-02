<template>
  <aside class="sidebar-shell" aria-label="主导航">
    <el-menu :default-active="activeMenu" class="sidebar-menu sidebar-menu--top" router>
      <el-menu-item index="/" @pointerenter="warmRoute('/')" @focusin="warmRoute('/')">
        <el-icon><House /></el-icon><span>首页</span>
      </el-menu-item>
    </el-menu>
    <el-menu :default-active="activeMenu" class="sidebar-menu sidebar-menu--features" router>
      <el-menu-item v-for="feature in featureStore.enabledFeatures" :key="feature.id" :index="feature.route" :class="{ 'nav-group-start': ['items', 'tools'].includes(feature.id) }" @pointerenter="warmRoute(feature.route)" @focusin="warmRoute(feature.route)">
        <el-icon><component :is="featureIcons[feature.icon]" /></el-icon><span>{{ feature.label }}</span>
      </el-menu-item>
    </el-menu>
    <el-menu :default-active="activeMenu" class="sidebar-menu sidebar-menu--footer">
      <el-menu-item index="more-features" class="more-features-entry" @click="moreDialogVisible = true">
        <el-icon><Grid /></el-icon><span>更多</span>
      </el-menu-item>
      <el-menu-item index="/settings" @click="router.push('/settings')" @pointerenter="warmRoute('/settings')" @focusin="warmRoute('/settings')">
        <el-icon><Setting /></el-icon><span>设置</span>
        <span v-if="feedbackRepliesStore.unreadCount > 0" class="feedback-reply-dot" role="img" aria-label="反馈有新回复" />
      </el-menu-item>
    </el-menu>
    <MoreFeaturesDialog v-model="moreDialogVisible" />
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Box, Coin, Connection, DataAnalysis, FirstAidKit, Grid, Guide, House, MapLocation, Notebook, Operation, PriceTag, SetUp, ShoppingBag, Setting, SuitcaseLine } from '@element-plus/icons-vue'
import { preloadPage } from '@/router/pageLoaders'
import { useFeedbackRepliesStore } from '@/stores/feedbackReplies'
import { useFeatureModulesStore } from '@/stores/featureModules'
import MoreFeaturesDialog from './MoreFeaturesDialog.vue'

const route = useRoute()
const router = useRouter()
const feedbackRepliesStore = useFeedbackRepliesStore()
const featureStore = useFeatureModulesStore()
const moreDialogVisible = ref(false)
const activeMenu = computed(() => route.path)
const featureIcons = { Box, Coin, Connection, DataAnalysis, FirstAidKit, Guide, MapLocation, Notebook, Operation, PriceTag, SetUp, ShoppingBag, SuitcaseLine }
function warmRoute(path) { void preloadPage(path) }
</script>

<style scoped lang="less">
.sidebar-shell { display: flex; height: 100%; min-height: 0; flex-direction: column; }
.sidebar-menu {
  border-right: none;
  padding: var(--spacing-xs);
  background-color: var(--nav-bg, transparent);
  &:not(.sidebar-menu--features) { flex: 0 0 auto; }
  &--features { flex: 1 1 auto; min-height: 0; overflow-x: hidden; overflow-y: auto; padding-top: 0; padding-bottom: 0; }
  &--footer { border-top: 1px solid var(--border-base); }
  :deep(.el-menu-item) {
    display: flex; height: auto; min-height: 48px; padding: var(--spacing-sm) 0 !important; margin-bottom: 4px;
    flex-direction: column; align-items: center; justify-content: center; gap: 4px; border-radius: var(--border-radius-sm);
    color: var(--text-secondary); transition: color .15s ease, background-color .15s ease;
    &.nav-group-start { margin-top: 12px; }
    &.nav-group-start::before { content: ''; position: absolute; top: -7px; left: 8px; right: 8px; height: 1px; background: var(--border-base); }
    &:hover { background: var(--surface-hover); color: var(--text-primary); }
    &:focus-visible { outline: 2px solid var(--brand-color); outline-offset: -2px; }
    > span:not(.feedback-reply-dot) { margin-top: 2px; font-size: var(--font-size-xs); line-height: 1.2; }
    .el-icon { margin-right: 0; margin-bottom: 0; font-size: 20px; }
    &.is-active:not(.more-features-entry) {
      color: var(--text-primary); background: color-mix(in srgb, var(--brand-color) 13%, var(--nav-bg));
      &::after { content: ''; position: absolute; left: 0; top: 10px; bottom: 10px; width: 2px; border-radius: 0 2px 2px 0; background: var(--brand-color); }
      .el-icon { color: var(--brand-color); }
    }
    .feedback-reply-dot {
      position: absolute;
      top: 6px;
      right: calc(50% - 16px);
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--el-color-danger);
    }
  }
}
.sidebar-menu--top :deep(.el-menu-item), .sidebar-menu--footer :deep(.el-menu-item:last-child) { margin-bottom: 0; }
</style>
