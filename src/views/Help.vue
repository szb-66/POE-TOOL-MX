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

      <div class="info-section">
        <h3 class="section-title">POE1 做装规划说明</h3>
        <div class="crafting-help">
          <p>底材、词缀、工艺台和花园工艺来自 POEDB 简体中文页面，可在“做装”页手动更新；更新只有在全部下载与校验成功后才会生效。</p>
          <p>耗材价格来自 poecurrency.top 公开 POE1 API 的卖方均价。该数据由 OCR 生成，异常、非正数或超过 24 小时的价格会被拒用，也可在本机覆盖。</p>
          <p>当前只比较普通通货、工艺台/元工艺和显式词缀相关花园工艺。结果表示“在当前支持的工艺与候选策略中最优”，不是所有游戏机制的全局最优；底材成本不计入。</p>
          <p>本功能仅供个人、非商业参考，与 Grinding Gear Games、POEDB、poecurrency.top 无官方关联。</p>
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

      .crafting-help {
        padding: 0 var(--spacing-sm);
        color: var(--text-regular);
        line-height: 1.7;
        p { margin: 0 0 var(--spacing-sm); }
      }
    }
  }
}
</style>

