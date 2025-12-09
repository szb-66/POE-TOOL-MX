<template>
  <div class="shop-page">
    <el-card>
      <template #header>
        <span>商城功能</span>
      </template>
      <div class="placeholder-content">
        <el-empty description="商城功能开发中，敬请期待">
          <el-icon :size="100" color="#909399">
            <ShoppingBag />
          </el-icon>
        </el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ShoppingBag } from '@element-plus/icons-vue'
</script>

<style scoped lang="less">
.shop-page {
  height: 100%;
  padding: 20px;

  ::deep(.el-card) {
    box-shadow: none !important;
    border-radius: 8px !important;
    border: 1px solid var(--border-base) !important;
  }

  .placeholder-content {
    padding: 60px 0;
    text-align: center;
  }
}
</style>

