<template>
  <div class="items-page">
    <!-- 模块一：快捷键和预设 -->
    <div class="module-section">
      <ModuleOne />
    </div>

    <!-- 模块二：词缀匹配 -->
    <div class="module-section">
      <ModuleTwo />
    </div>

    <!-- 模块三：插槽制作 -->
    <div class="module-section">
      <ModuleThree />
    </div>
  </div>
</template>

<script setup>
import ModuleOne from './components/ModuleOne.vue'
import ModuleTwo from './components/ModuleTwo.vue'
import ModuleThree from './components/ModuleThree.vue'
</script>

<style scoped lang="less">
.items-page {
  height: 100%;
  overflow-y: auto;
  padding: 20px;

  .module-section {
    margin-bottom: var(--spacing-md);
    background-color: var(--bg-primary);
    border-radius: 8px;
    padding: var(--spacing-lg);
    border: 1px solid var(--border-base);
    box-shadow: none;

    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
