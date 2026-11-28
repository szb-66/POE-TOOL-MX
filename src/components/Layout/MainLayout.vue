<template>
  <el-container class="main-layout">
    <el-aside :width="sidebarWidth" class="sidebar-container">
      <Sidebar />
    </el-aside>
    <el-container direction="vertical" class="main-stage">
      <ServerMismatchBanner />
      <el-main class="main-content">
        <slot />
        <RouteLoadingOverlay />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import Sidebar from './Sidebar.vue'
import RouteLoadingOverlay from '../common/RouteLoadingOverlay.vue'
import ServerMismatchBanner from '../common/ServerMismatchBanner.vue'

const sidebarWidth = computed(() => '76px')
</script>

<style scoped lang="less">
.main-layout {
  height: 100%;

  .sidebar-container {
    background-color: var(--nav-bg, var(--bg-primary));
    border-right: 1px solid var(--border-base);
  }

  .main-stage {
    min-width: 0;
    min-height: 0;
  }

  .main-content {
    position: relative;
    padding: 0;
    overflow: hidden;
    background-color: var(--bg-secondary);
  }
}
</style>
