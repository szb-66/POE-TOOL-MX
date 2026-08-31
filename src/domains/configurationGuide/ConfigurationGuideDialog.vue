<template>
  <el-dialog
    :model-value="store.visible"
    :title="store.request?.title || '完成自动化配置'"
    width="min(1040px, 92vw)"
    top="5vh"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    :close-on-press-escape="!store.busy"
    :before-close="closeGuide"
    class="configuration-guide-dialog"
  >
    <div class="configuration-guide">
      <div class="configuration-guide__summary">
        <div>
          <strong>还需完成 {{ store.remainingCount }} 项配置</strong>
          <span>已完成 {{ store.completedCount }}/{{ store.totalCount }}</span>
        </div>
        <el-progress
          :percentage="progress"
          :status="store.remainingCount === 0 ? 'success' : undefined"
        />
      </div>

      <div class="configuration-guide__body">
        <nav class="configuration-guide__issues" aria-label="配置项列表">
          <button
            v-for="(issue, index) in store.displayIssues"
            :key="issue.id"
            type="button"
            class="configuration-guide__issue"
            :class="{
              'is-active': issue.id === activeIssue?.id,
              'is-completed': issue.completed
            }"
            :disabled="issue.completed"
            @click="store.focusIssue(issue.id)"
          >
            <span class="configuration-guide__index">
              <el-icon v-if="issue.completed"><Check /></el-icon>
              <template v-else>{{ index + 1 }}</template>
            </span>
            <span>
              <strong>{{ issue.title }}</strong>
              <small>{{ issue.completed ? '已完成' : issue.state === 'suspect' ? '需要重新确认' : '待配置' }}</small>
            </span>
          </button>
        </nav>

        <section class="configuration-guide__editor">
          <template v-if="activeIssue">
            <header>
              <el-tag :type="activeIssue.state === 'suspect' ? 'warning' : 'danger'" effect="plain">
                {{ activeIssue.state === 'suspect' ? '疑似定位错误' : '阻塞配置' }}
              </el-tag>
              <h3>{{ activeIssue.title }}</h3>
              <p>{{ activeIssue.message }}</p>
            </header>
            <el-scrollbar class="configuration-guide__scroll" max-height="56vh">
              <ConfigurationIssueEditor
                :key="activeIssue.id"
                :issue="activeIssue"
                @configured="store.markIssueConfigured"
              />
            </el-scrollbar>
          </template>
          <el-result
            v-else
            icon="success"
            title="当前操作需要的配置已完成"
            sub-title="点击下方按钮重新校验并继续。"
          />
        </section>
      </div>

      <el-alert v-if="store.error" :title="store.error" type="error" :closable="false" show-icon />
    </div>

    <template #footer>
      <el-button :disabled="store.busy" @click="closeGuide">取消</el-button>
      <el-button
        type="primary"
        :loading="store.busy"
        :disabled="!store.canContinue"
        @click="store.continueAction"
      >{{ store.continueLabel }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { Check } from '@element-plus/icons-vue'
import { useConfigurationGuideStore } from './configurationGuideStore.js'
import ConfigurationIssueEditor from './ConfigurationIssueEditor.vue'
import { electronApi } from '@/api/electron'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import { usePresetStore } from '@/stores/preset'
import { getActiveMapRollingConfig } from '@/utils/mapPresetMigration'
import {
  collectCraftingConfigurationIssues,
  collectMapConfigurationIssues,
  suspectedCurrencyIssue,
  CONFIGURATION_ACTIONS,
  CONFIGURATION_MODULES
} from './configurationIssues.js'

const store = useConfigurationGuideStore()
const settings = useSettingsStore()
const presets = usePresetStore()
let removeGuideRequestListener = null
const activeIssue = computed(() => (
  store.issues.find(issue => issue.id === store.focusedIssueId) || store.issues[0] || null
))
const progress = computed(() => store.totalCount
  ? Math.round((store.completedCount / store.totalCount) * 100)
  : 100)

function closeGuide(done) {
  if (store.busy) return
  void store.cancel()
  if (typeof done === 'function') done()
}

function collectOverlayConfiguration(moduleId) {
  if (moduleId === CONFIGURATION_MODULES.items) {
    return collectCraftingConfigurationIssues({
      itemPosition: settings.itemPosition,
      currencyPositions: settings.currencyPositions,
      stashTabSelection: settings.stashTabSelection,
      preset: presets.currentItemPreset
    })
  }
  const kind = presets.mapRollingKind
  const preset = kind === 'chart' ? presets.currentChartPreset : presets.currentMapPreset
  const stored = kind === 'chart' ? preset?.chart : preset?.map
  const mapConfig = stored
    ? getActiveMapRollingConfig(kind === 'chart' ? {} : stored, kind === 'chart' ? stored : null, kind)
    : null
  return collectMapConfigurationIssues({
    inventory: settings.inventory,
    currencyPositions: settings.currencyPositions,
    stashTabSelection: settings.stashTabSelection,
    mapConfig
  })
}

function openOverlayCorrectionGuide(request = {}) {
  if (![CONFIGURATION_MODULES.items, CONFIGURATION_MODULES.map].includes(request.moduleId) ||
      request.actionId !== CONFIGURATION_ACTIONS.start ||
      !String(request.focusIssueId || '').startsWith('currency.')) return
  if (store.visible || store.busy) {
    void electronApi.configurationGuide.returnToOverlay()
    return
  }
  const currency = request.focusIssueId.slice('currency.'.length)
  store.open({
    moduleId: request.moduleId,
    actionId: request.actionId,
    title: '重新定位制作通货',
    actionLabel: '返回浮窗',
    returnToSource: true,
    source: 'crafting-overlay',
    focusIssueId: request.focusIssueId,
    forcedIssues: [suspectedCurrencyIssue(request.moduleId, request.actionId, currency)],
    collect: () => collectOverlayConfiguration(request.moduleId),
    execute: () => electronApi.configurationGuide.returnToOverlay(),
    onCancel: () => electronApi.configurationGuide.returnToOverlay()
  })
}

onMounted(() => {
  removeGuideRequestListener = electronApi.configurationGuide.onRequested(openOverlayCorrectionGuide)
})

onUnmounted(() => {
  removeGuideRequestListener?.()
  removeGuideRequestListener = null
})
</script>

<style scoped>
.configuration-guide { display: grid; gap: 14px; }
.configuration-guide__summary { display: grid; grid-template-columns: minmax(180px, auto) minmax(240px, 1fr); align-items: center; gap: 20px; }
.configuration-guide__summary > div { display: grid; gap: 3px; }
.configuration-guide__summary span { color: var(--text-secondary); font-size: 13px; }
.configuration-guide__body { display: grid; height: clamp(360px, 56vh, 560px); min-height: 0; grid-template-columns: 260px minmax(0, 1fr); gap: 16px; }
.configuration-guide__issues { display: flex; min-height: 0; flex-direction: column; gap: 8px; overflow-y: auto; }
.configuration-guide__issue {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-base);
  border-radius: 8px;
  background: var(--surface-1, var(--bg-primary));
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
}
.configuration-guide__issue.is-active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.configuration-guide__issue.is-completed { opacity: .62; cursor: default; }
.configuration-guide__issue > span:last-child { display: grid; min-width: 0; gap: 2px; }
.configuration-guide__issue strong,
.configuration-guide__issue small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.configuration-guide__issue small { color: var(--text-secondary); }
.configuration-guide__index { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--bg-tertiary); color: var(--text-secondary); }
.configuration-guide__editor { display: flex; min-width: 0; min-height: 0; flex-direction: column; overflow: hidden; padding: 16px; border: 1px solid var(--border-base); border-radius: 8px; background: var(--surface-1, var(--bg-primary)); }
.configuration-guide__editor header { flex: 0 0 auto; margin-bottom: 14px; }
.configuration-guide__scroll { min-height: 0; flex: 1 1 auto; }
.configuration-guide__editor h3 { margin: 8px 0 4px; }
.configuration-guide__editor p { margin: 0; color: var(--text-secondary); }
@media (max-width: 800px) {
  .configuration-guide__summary, .configuration-guide__body { grid-template-columns: 1fr; }
  .configuration-guide__body { height: auto; max-height: 70vh; overflow-y: auto; }
  .configuration-guide__issues { max-height: 180px; overflow-y: auto; }
  .configuration-guide__editor { min-height: 320px; }
}
</style>
