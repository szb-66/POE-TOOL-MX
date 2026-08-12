<template>
  <el-container class="main-layout">
    <el-aside :width="sidebarWidth" class="sidebar-container">
      <Sidebar />
    </el-aside>
    <el-container>
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

const sidebarWidth = computed(() => '68px')
</script>

<style scoped lang="less">
.main-layout {
  height: 100%;

  .sidebar-container {
    background-color: var(--bg-primary);
    border-right: 1px solid var(--border-base);
  }

  .main-content {
    position: relative;
    padding: 0;
    overflow: hidden;
    background-color: var(--bg-secondary);
  }
}
</style>
