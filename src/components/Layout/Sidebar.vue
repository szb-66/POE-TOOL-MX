<template>
  <el-menu
    :default-active="activeMenu"
    class="sidebar-menu"
    router
    :collapse="false"
    mode="vertical"
  >
    <el-menu-item index="/" @pointerenter="warmRoute('/')" @focusin="warmRoute('/')">
      <el-icon><House /></el-icon>
      <span>首页</span>
    </el-menu-item>
    <el-menu-item class="nav-group-start" index="/items" @pointerenter="warmRoute('/items')" @focusin="warmRoute('/items')">
      <el-icon><Box /></el-icon>
      <span>制作</span>
    </el-menu-item>
    <el-menu-item index="/bag" @pointerenter="warmRoute('/bag')" @focusin="warmRoute('/bag')">
      <el-icon><SuitcaseLine /></el-icon>
      <span>存取</span>
    </el-menu-item>
    <el-menu-item v-if="isModelTrainingEnabled" index="/highlight-model-training" @pointerenter="warmRoute('/highlight-model-training')" @focusin="warmRoute('/highlight-model-training')">
      <el-icon><DataAnalysis /></el-icon>
      <span>模型训练</span>
    </el-menu-item>
    <el-menu-item index="/map" @pointerenter="warmRoute('/map')" @focusin="warmRoute('/map')">
      <el-icon><MapLocation /></el-icon>
      <span>地图</span>
    </el-menu-item>
    <el-menu-item index="/combat" @pointerenter="warmRoute('/combat')" @focusin="warmRoute('/combat')">
      <el-icon><FirstAidKit /></el-icon>
      <span>战斗</span>
    </el-menu-item>
    <el-menu-item index="/story" @pointerenter="warmRoute('/story')" @focusin="warmRoute('/story')">
      <el-icon><Notebook /></el-icon>
      <span>剧情</span>
    </el-menu-item>
    <el-menu-item index="/shop" @pointerenter="warmRoute('/shop')" @focusin="warmRoute('/shop')">
      <el-icon><ShoppingBag /></el-icon>
      <span>商城</span>
    </el-menu-item>
    <el-menu-item index="/craft-planner" @pointerenter="warmRoute('/craft-planner')" @focusin="warmRoute('/craft-planner')">
      <el-icon><SetUp /></el-icon>
      <span>模拟</span>
    </el-menu-item>
    <el-menu-item index="/price-check" @pointerenter="warmRoute('/price-check')" @focusin="warmRoute('/price-check')">
      <el-icon><Coin /></el-icon>
      <span>查价</span>
    </el-menu-item>
    <el-menu-item index="/puzzle" @pointerenter="warmRoute('/puzzle')" @focusin="warmRoute('/puzzle')">
      <el-icon><Guide /></el-icon>
      <span>海图</span>
    </el-menu-item>
    <el-menu-item class="nav-group-start" index="/tools" @pointerenter="warmRoute('/tools')" @focusin="warmRoute('/tools')">
      <el-icon><Connection /></el-icon>
      <span>工具站</span>
    </el-menu-item>
    <el-menu-item class="nav-group-start" index="/settings" @pointerenter="warmRoute('/settings')" @focusin="warmRoute('/settings')">
      <el-icon><Setting /></el-icon>
      <span>设置</span>
    </el-menu-item>
    <el-menu-item index="/help" @pointerenter="warmRoute('/help')" @focusin="warmRoute('/help')">
      <el-icon><Help /></el-icon>
      <span>帮助</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Box, Coin, Connection, DataAnalysis, Guide, Help, House, MapLocation, ShoppingBag, Setting, SetUp, SuitcaseLine, FirstAidKit, Notebook } from '@element-plus/icons-vue'
import { preloadPage } from '@/router/pageLoaders'

const route = useRoute()
const isModelTrainingEnabled = import.meta.env.DEV

const activeMenu = computed(() => route.path)

function warmRoute(path) {
  void preloadPage(path)
}
</script>

<style scoped lang="less">
.sidebar-menu {
  border-right: none;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  padding: var(--spacing-xs);
  background-color: var(--nav-bg, transparent);

  :deep(.el-menu-item) {
    height: auto;
    min-height: 48px;
    padding: var(--spacing-sm) 0 !important;
    margin-bottom: 4px;
    border-radius: var(--border-radius-sm);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: var(--text-secondary);
    transition: color .15s ease, background-color .15s ease;

    &.nav-group-start { margin-top: 12px; }
    &.nav-group-start::before {
      content: '';
      position: absolute;
      top: -7px;
      left: 8px;
      right: 8px;
      height: 1px;
      background: var(--border-base);
    }

    &:hover { background: var(--surface-hover); color: var(--text-primary); }
    &:focus-visible { outline: 2px solid var(--brand-color); outline-offset: -2px; }

    span {
      font-size: var(--font-size-xs);
      line-height: 1.2;
      margin-top: 2px;
    }

    .el-icon {
      margin-right: 0;
      font-size: 20px;
      margin-bottom: 0;
    }

    &.is-active {
      background: color-mix(in srgb, var(--brand-color) 13%, var(--nav-bg));
      color: var(--text-primary);

      &::after {
        content: '';
        position: absolute;
        left: 0;
        top: 10px;
        bottom: 10px;
        width: 2px;
        border-radius: 0 2px 2px 0;
        background: var(--brand-color);
      }

      .el-icon {
        color: var(--brand-color);
      }
    }
  }
}
</style>
