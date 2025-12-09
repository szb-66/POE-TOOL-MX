<template>
  <div class="help-page">
    <div class="help-content">
      <!-- 警告横幅 -->
      <div class="warning-banner">
        <el-icon class="warning-icon"><WarningFilled /></el-icon>
        <span>本工具完全免费，遇到任何付费情况请尽快联系相关人员进行退款</span>
      </div>

      <!-- 版本信息 -->
      <div class="info-section">
        <h3 class="section-title">版本信息</h3>
        <div class="info-item">
          <span class="info-label">版本号</span>
          <span class="info-value">V1.0.0</span>
        </div>
        <div class="info-item">
          <span class="info-label">更新时间</span>
          <span class="info-value">2024-09-27</span>
        </div>
        <div class="info-item">
          <span class="info-label">项目地址</span>
          <a href="#" class="info-value link">github 链接</a>
        </div>
      </div>

      <!-- 作者信息 -->
      <div class="info-section">
        <h3 class="section-title">作者信息</h3>
        <div class="info-item">
          <span class="info-label">bilibili：</span>
          <span class="info-value">这条鱼i</span>
        </div>
        <div class="info-item">
          <span class="info-label">QQ：</span>
          <span class="info-value">1123051973</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { WarningFilled } from '@element-plus/icons-vue'
</script>

<style scoped lang="less">
.help-page {
  height: 100%;
  background-color: var(--bg-primary);

  .help-content {
    max-width: 704px;
    padding: 20px;

    .warning-banner {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      background-color: var(--warning-bg);
      border-radius: var(--border-radius-sm);
      margin-bottom: var(--spacing-lg);
      color: var(--text-primary);
      font-size: var(--font-size-base);

      .warning-icon {
        color: var(--warning-color);
        font-size: 14px;
        flex-shrink: 0;
      }
    }

    .info-section {
      margin-bottom: var(--spacing-xl);
      padding: var(--spacing-md);
      background-color: var(--bg-primary);
      border-radius: var(--border-radius-md);

      .section-title {
        font-size: var(--font-size-base);
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--spacing-md);
        padding-left: var(--spacing-sm);
      }

      .info-item {
        display: flex;
        align-items: center;
        margin-bottom: var(--spacing-md);
        padding-left: var(--spacing-sm);

        .info-label {
          color: var(--text-regular);
          font-size: var(--font-size-base);
          min-width: 60px;
        }

        .info-value {
          color: var(--text-primary);
          font-size: var(--font-size-base);
          margin-left: var(--spacing-sm);

          &.link {
            color: var(--primary-color);
            cursor: pointer;
            text-decoration: none;

            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
    }
  }
}
</style>

