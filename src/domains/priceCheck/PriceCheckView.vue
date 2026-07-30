<template>
  <div class="price-check-page">
    <div class="page-heading">
      <div>
        <h2>国服查价</h2>
        <p>配置 Ctrl+D 查价浮层；物品捕获只从游戏内快捷键进入。</p>
      </div>
      <el-switch
        :model-value="store.settings.enabled"
        :loading="store.loading"
        active-text="已启用"
        inactive-text="已关闭"
        @change="toggleEnabled"
      />
    </div>

    <el-alert
      title="显示的是腾讯官方公开挂单，不代表实际成交价；不会自动私聊、购买或上架。"
      type="warning"
      :closable="false"
      show-icon
    />

    <el-card>
      <template #header><strong>运行状态</strong></template>
      <div class="status-grid">
        <div><span>账号</span><strong>{{ authText }}</strong></div>
        <div><span>全局赛季</span><strong>{{ leagueText }}</strong></div>
        <div><span>快捷键</span><strong>{{ appSettings.globalShortcuts.priceCheck }}</strong></div>
        <div><span>交易目录</span><strong>{{ catalogText }}</strong></div>
      </div>
      <el-alert
        v-if="store.catalog?.warning"
        class="catalog-warning"
        :title="store.catalog.warning"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-button class="settings-link" type="primary" plain @click="$router.push('/settings')">
        前往账号与快捷键设置
      </el-button>
    </el-card>

    <el-card>
      <template #header><strong>查询设置</strong></template>
      <el-form label-width="140px">
        <el-form-item label="在线状态">
          <el-select :model-value="store.settings.status" @change="value => store.updateSetting('status', value)">
            <el-option label="在线可交易" value="available" />
            <el-option label="即时购买" value="instant" />
            <el-option label="包含离线" value="any" />
          </el-select>
        </el-form-item>
        <el-form-item label="挂单时间">
          <el-select :model-value="store.settings.listed" @change="value => store.updateSetting('listed', value)">
            <el-option label="所有时间" value="any" />
            <el-option label="1 天内" value="1day" />
            <el-option label="3 天内" value="3days" />
            <el-option label="1 周内" value="1week" />
            <el-option label="2 周内" value="2weeks" />
            <el-option label="1 月内" value="1month" />
            <el-option label="2 月内" value="2months" />
          </el-select>
        </el-form-item>
        <el-form-item label="通货">
          <el-select :model-value="store.settings.currency" @change="value => store.updateSetting('currency', value)">
            <el-option label="任意" value="any" />
            <el-option label="混沌石" value="chaos" />
            <el-option label="神圣石" value="divine" />
            <el-option label="混沌石或神圣石" value="chaos_divine" />
          </el-select>
        </el-form-item>
        <el-form-item label="数值范围">
          <el-select :model-value="store.settings.valueRange" @change="value => store.updateSetting('valueRange', value)">
            <el-option label="仅原数值" value="original" />
            <el-option label="下浮 10%" value="down10" />
            <el-option label="下浮 20%" value="down20" />
            <el-option label="不限制" value="unlimited" />
          </el-select>
        </el-form-item>
        <el-form-item label="词缀初始勾选">
          <el-select :model-value="store.settings.initialSelection" @change="value => store.updateSetting('initialSelection', value)">
            <el-option label="自动" value="auto" />
            <el-option label="全部" value="all" />
            <el-option label="无" value="none" />
          </el-select>
        </el-form-item>
        <el-form-item label="手动 DC 参考值">
          <el-input-number
            :model-value="store.settings.manualDcRate"
            :min="0"
            :max="1000000"
            :step="10"
            @change="value => store.updateSetting('manualDcRate', value)"
          />
          <span class="inline-hint">仅在第三方行情不可用时使用，0 表示不启用</span>
        </el-form-item>
        <el-form-item label="合并重复挂单">
          <el-switch
            :model-value="store.settings.collapseListings"
            @change="value => store.updateSetting('collapseListings', value)"
          />
        </el-form-item>
      </el-form>
      <p class="muted">物品属性和词缀筛选只作用于当前浮层，不会覆盖这里的默认值。</p>
    </el-card>

    <el-card>
      <template #header><strong>使用说明与诊断</strong></template>
      <ol class="instructions">
        <li>在设置页登录国服账号并选择全局赛季。</li>
        <li>开启查价器后，将鼠标悬停在游戏物品上，按 {{ appSettings.globalShortcuts.priceCheck }}。</li>
        <li>助手优先发送 Ctrl+Alt+C 读取高级物品文本，失败时自动回退 Ctrl+C。</li>
      </ol>
      <el-tag :type="catalogTagType">{{ catalogStateText }}</el-tag>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { usePriceCheckStore } from '@/stores/priceCheck'
import { usePoeCnAccountStore } from '@/stores/poeCnAccount'
import { useSettingsStore } from '@/domains/settings/settingsStore'

const store = usePriceCheckStore()
const account = usePoeCnAccountStore()
const appSettings = useSettingsStore()

const authText = computed(() => account.status.authenticated ? account.status.accountName : '未登录')
const leagueText = computed(() => account.leagues.find(item => item.id === account.settings.league)?.name || account.settings.league || '未设置')
const catalogText = computed(() => store.catalog ? `${store.catalog.gameVersion} · ${store.catalog.counts?.stats || 0} 词缀` : '不可用')
const catalogTagType = computed(() => store.catalog?.degraded || store.catalog?.stale ? 'warning' : 'success')
const catalogStateText = computed(() => store.catalog?.degraded
  ? '当前使用内置交易目录'
  : store.catalog?.stale ? '交易目录可能已过期' : '官方交易目录可用')

async function toggleEnabled(enabled) {
  try {
    await store.setEnabled(enabled)
    ElMessage.success(enabled ? '国服查价器已启用' : '国服查价器已关闭')
  } catch (error) {
    ElMessage.error(error.message)
  }
}

onMounted(() => store.refreshStatus().catch(() => {}))
</script>

<style scoped lang="less">
.price-check-page { display: grid; gap: 16px; padding: 20px; max-width: 980px; margin: 0 auto; }
.page-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.page-heading h2 { margin: 0 0 6px; }
.page-heading p, .muted { color: var(--el-text-color-secondary); }
.status-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.status-grid div { display: flex; flex-direction: column; gap: 5px; }
.status-grid span { color: var(--el-text-color-secondary); font-size: 13px; }
.catalog-warning, .settings-link { margin-top: 16px; }
.el-select { width: 280px; }
.inline-hint { margin-left: 10px; color: var(--el-text-color-secondary); font-size: 12px; }
.instructions { margin: 0 0 16px; padding-left: 22px; line-height: 1.9; }
@media (max-width: 850px) { .status-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
