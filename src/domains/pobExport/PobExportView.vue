<template>
  <div class="pob-page primary-page primary-page__scroll primary-page__content">
    <header class="page-heading"><h1>POB</h1><p>将国服角色导出到 PoeCharm 中文版，复制导入码后在「导入／导出 BD」中粘贴。</p></header>
    <PobLauncherPanel />
    <PobExportPanel source="self" :authenticated="account.status.authenticated" :account-name="account.status.accountName" :preferred-league="account.settings.league" />
    <PobExportPanel source="other" :authenticated="account.status.authenticated" :account-name="account.status.accountName" />
    <p class="note">角色数据以官网为准。刚更换装备时，可切换区域后重新导出。导入后请核对数据，并自行设置战斗配置。</p>
  </div>
</template>

<script setup>
import { usePoeCnAccountStore } from '@/stores/poeCnAccount'
import PobExportPanel from './PobExportPanel.vue'
import PobLauncherPanel from './PobLauncherPanel.vue'
const account = usePoeCnAccountStore()
</script>

<style scoped lang="less">
.pob-page { color: var(--text-primary); background: var(--bg-secondary); }
.page-heading { margin-bottom: 24px; }
h1 { margin: 0 0 8px; font-size: 25px; }
p { margin: 0; color: var(--text-secondary); font-size: 13px; line-height: 1.7; }
.export-panel + .export-panel { margin-top: 20px; }
.note { margin-top: 20px; }
</style>
