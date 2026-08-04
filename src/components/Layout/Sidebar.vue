<template>
  <el-menu
    :default-active="activeMenu"
    class="sidebar-menu"
    router
    :collapse="false"
    mode="vertical"
  >
    <el-menu-item index="/">
      <el-icon><House /></el-icon>
      <span>首页</span>
    </el-menu-item>
    <el-menu-item index="/items">
      <el-icon><Box /></el-icon>
      <span>物品</span>
    </el-menu-item>
    <el-menu-item index="/bag">
      <el-icon><SuitcaseLine /></el-icon>
      <span>背包</span>
    </el-menu-item>
    <el-menu-item index="/map">
      <el-icon><MapLocation /></el-icon>
      <span>地图</span>
    </el-menu-item>
    <el-menu-item index="/combat">
      <el-icon><FirstAidKit /></el-icon>
      <span>战斗</span>
    </el-menu-item>
    <el-menu-item index="/story">
      <el-icon><Notebook /></el-icon>
      <span>剧情</span>
    </el-menu-item>
    <el-menu-item index="/shop">
      <el-icon><ShoppingBag /></el-icon>
      <span>商城</span>
    </el-menu-item>
    <el-menu-item index="/craft-planner">
      <el-icon><SetUp /></el-icon>
      <span>做装</span>
    </el-menu-item>
    <el-menu-item index="/price-check">
      <el-icon><Coin /></el-icon>
      <span>查价</span>
    </el-menu-item>
    <el-menu-item index="/puzzle">
      <el-icon><Guide /></el-icon>
      <span>海图</span>
    </el-menu-item>
    <el-menu-item index="/settings">
      <el-icon><Setting /></el-icon>
      <span>设置</span>
    </el-menu-item>
    <el-menu-item index="/help">
      <el-icon><Help /></el-icon>
      <span>帮助</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Box, Coin, Guide, Help, House, MapLocation, ShoppingBag, Setting, SetUp, SuitcaseLine, FirstAidKit, Notebook } from '@element-plus/icons-vue'

const route = useRoute()

const activeMenu = computed(() => route.path)
</script>

<style scoped lang="less">
.sidebar-menu {
  border-right: none;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  padding: var(--spacing-xs);
  background-color: transparent;

  :deep(.el-menu-item) {
    height: auto;
    min-height: 48px;
    padding: var(--spacing-sm) 0 !important;
    margin-bottom: var(--spacing-xs);
    border-radius: var(--border-radius-sm);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;

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
      background-color: var(--primary-color);
      color: #fff;

      .el-icon {
        color: #fff;
      }
    }
  }
}
</style>
