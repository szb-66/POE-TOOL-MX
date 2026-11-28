<template>
  <div class="combat-page primary-page primary-page__scroll primary-page__content">
    <el-alert v-if="!combatInputEnabled" title="当前服务器暂未开放战斗辅助，可先保存配置。" type="info" :closable="false" />
    <el-card shadow="never" class="section-card combat-module" data-module="combat-settings">
      <template #header>
        <div class="module-header">
          <div class="module-title">
            <strong>战斗辅助配置</strong>
            <el-tooltip content="统一启停已打开的被动喝药与主动喝药子项，并配置安全区自动暂停与频率保护。" placement="top">
              <el-icon class="module-help" tabindex="0" aria-label="查看战斗辅助配置说明"><QuestionFilled /></el-icon>
            </el-tooltip>
            <el-tag :type="combatStatusTagType">{{ combatStatusLabel }}</el-tag>
          </div>
          <div class="module-action">
            <el-button v-if="combatStore.active" type="danger" @click="stopCombatAssist">停止</el-button>
            <el-button v-else type="primary" :disabled="!combatInputEnabled" @click="startCombatAssist">开始</el-button>
          </div>
        </div>
      </template>

      <div v-if="combatErrorMessage" class="module-error configuration-correction-alert">
        <el-alert type="error" :title="combatErrorMessage" show-icon :closable="false" />
        <el-button v-if="activeCorrectionIssue" type="warning" plain @click="openCombatCorrection(activeCorrectionAction, activeCorrectionFailure)">
          重新配置
        </el-button>
      </div>

      <div v-if="combatStore.active && config.autoPauseInSafeZone && combatStore.areaGate.warning" class="module-error">
        <el-alert type="info" :title="combatStore.areaGate.warning" show-icon :closable="false" />
      </div>

      <div class="subsection-title">安全区保护</div>
      <div class="safe-zone-row">
        <el-switch v-model="config.autoPauseInSafeZone" />
        <span class="safe-zone-label">进入安全区自动暂停</span>
        <el-tooltip
          content="进入城镇、藏身处、无怪中转区（君锋镇/黄金港/矿坑营地/圣域大厅等）或过图读条、断线时自动暂停按键，进入战斗地图（含兽园）后立即恢复；依赖 Client.txt 日志监听，日志未就绪时保持运行。"
          placement="top"
        >
          <el-icon class="module-help" tabindex="0" aria-label="查看安全区自动暂停说明"><QuestionFilled /></el-icon>
        </el-tooltip>
        <el-tag v-if="config.autoPauseInSafeZone && areaGateBadgeText" size="small" :type="areaGateBadgeType">
          {{ areaGateBadgeText }}
        </el-tag>
      </div>

      <div class="subsection-title">频率保护</div>
      <el-form inline class="frequency-form">
        <el-form-item label="检测间隔">
          <el-input-number v-model="config.potion.scanIntervalMs" :min="10" :step="10" />
          <span class="unit">毫秒</span>
        </el-form-item>
        <el-form-item label="每秒最多触发">
          <el-input-number v-model="config.potion.maxTriggersPerSecond" :min="1" :max="20" />
          <span class="unit">次</span>
        </el-form-item>
        <el-form-item label="保护冷却">
          <el-input-number v-model="config.potion.protectionCooldownMs" :min="1" :step="100" />
          <span class="unit">毫秒</span>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="section-card combat-module" data-module="passive-potion">
      <template #header>
        <div class="module-header">
          <div class="module-title">
            <strong>被动喝药</strong>
            <el-tooltip content="通过生命与魔力球像素颜色自动触发药剂；开启对应药剂开关并启动上方战斗辅助后生效，仅在游戏窗口位于前台时检测，按住 Alt/Ctrl/Win 时自动暂缓发键以避免误触组合快捷键。" placement="top">
              <el-icon class="module-help" tabindex="0" aria-label="查看被动喝药说明"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </div>
      </template>

      <el-row class="resource-grid app-grid" :gutter="16">
        <el-col v-for="resource in resources" :key="resource.key" :xs="24" :md="12">
          <el-card class="resource-card" shadow="never">
            <template #header>
              <div class="card-title">
                <span>{{ resource.label }}</span>
                <el-switch v-model="config.potion[resource.key].enabled" />
              </div>
            </template>

            <el-form label-width="120px" label-position="left">
              <el-form-item label="检测坐标">
                <div class="position-row">
                  <CoordinateConfigurationField
                    class="combat-coordinate-field"
                    :model-value="config.potion[resource.key].point"
                    :loading="pickingTarget === resource.key"
                    :disabled="Boolean(pickingTarget) && pickingTarget !== resource.key"
                    @update:model-value="config.potion[resource.key].point = $event"
                    @pick="pickCoordinate(resource.key)"
                  />
                  <el-button :loading="samplingTarget === resource.key" @click="samplePixel(resource)">读取颜色</el-button>
                </div>
              </el-form-item>
              <el-form-item :label="`${resource.channelLabel}阈值`">
                <el-input-number v-model="config.potion[resource.key].threshold" :min="0" :max="255" />
                <span class="hint">检测分量低于该值时触发</span>
              </el-form-item>
              <el-form-item label="触发按键">
                <KeySequenceCapture v-model="config.potion[resource.key].keys" />
              </el-form-item>
              <el-form-item label="回复模式">
                <el-radio-group v-model="config.potion[resource.key].recoveryMode">
                  <el-radio-button label="duration">持续回复</el-radio-button>
                  <el-radio-button label="instant">立即回复</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item
                :label="config.potion[resource.key].recoveryMode === 'instant' ? '重复间隔' : '恢复冷却'"
              >
                <el-input-number
                  v-if="config.potion[resource.key].recoveryMode === 'instant'"
                  v-model="config.potion[resource.key].instantIntervalMs"
                  :min="10"
                  :step="50"
                />
                <el-input-number
                  v-else
                  v-model="config.potion[resource.key].recoveryCooldownMs"
                  :min="1"
                  :step="100"
                />
                <span class="unit">毫秒</span>
              </el-form-item>
              <el-form-item v-if="samples[resource.key]" label="采样结果">
                <el-tag :type="samples[resource.key].triggered ? 'danger' : 'success'">
                  RGB({{ samples[resource.key].color.r }}, {{ samples[resource.key].color.g }}, {{ samples[resource.key].color.b }}) ·
                  {{ resource.channelLabel }}={{ samples[resource.key].value }} ·
                  {{ samples[resource.key].triggered ? '会触发' : '不会触发' }}
                </el-tag>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never" class="section-card combat-module" data-module="active-potion">
      <template #header>
        <div class="module-header">
          <div class="module-title">
            <strong>主动喝药</strong>
            <el-tooltip content="开启对应按键开关并启动上方战斗辅助后，按各自间隔循环发送按键；仅在游戏窗口位于前台时发送，按住 Alt/Ctrl/Win 时自动暂缓发键以避免误触组合快捷键。" placement="top">
              <el-icon class="module-help" tabindex="0" aria-label="查看主动喝药说明"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </div>
      </template>

      <div class="loop-list">
        <div v-for="(item, index) in config.loop.items" :key="item.id" class="loop-row">
          <el-switch v-model="item.enabled" />
          <KeyCaptureInput v-model="item.key" mode="action" placeholder="选择按键" class="loop-key" />
          <span class="unit">间隔</span>
          <el-input-number v-model="item.intervalMs" :min="100" :step="100" />
          <span class="unit">毫秒</span>
          <el-button :icon="Delete" circle size="small" @click="removeLoopItem(index)" />
        </div>
        <div class="loop-add-row">
          <el-button @click="addLoopItem">添加按键</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="section-card combat-module" data-module="portal">
      <template #header>
        <div class="module-header">
          <div class="module-title">
            <strong>一键回城</strong>
            <el-tooltip content="发送开启传送门按键，等待指定时间后点击配置位置；仅在游戏窗口位于前台时执行。" placement="top">
              <el-icon class="module-help" tabindex="0" aria-label="查看一键回城说明"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="module-action">
            <el-button type="primary" :disabled="!combatInputEnabled" @click="executePortalAssist">执行回城</el-button>
          </div>
        </div>
      </template>
      <div v-if="combatStore.portalLastError" class="module-error configuration-correction-alert">
        <el-alert type="error" :title="combatStore.portalLastError" show-icon :closable="false" />
        <el-button v-if="portalCorrectionIssue" type="warning" plain @click="openCombatCorrection(CONFIGURATION_ACTIONS.portal, combatStore.portalLastFailure)">
          重新配置
        </el-button>
      </div>
      <el-form label-width="150px" label-position="left">
        <el-form-item label="全局触发快捷键">
          <KeyCaptureInput :model-value="shortcuts.portal" @change="saveShortcut('portal', $event)" />
        </el-form-item>
        <el-form-item label="游戏内开启传送门键">
          <KeyCaptureInput v-model="config.portal.openKey" mode="action" class="short-input" />
        </el-form-item>
        <el-form-item label="传送门点击位置">
          <div class="position-row">
            <CoordinateConfigurationField
              class="combat-coordinate-field"
              :model-value="config.portal.clickPoint"
              :loading="pickingTarget === 'portal'"
              :disabled="Boolean(pickingTarget) && pickingTarget !== 'portal'"
              @update:model-value="config.portal.clickPoint = $event"
              @pick="pickCoordinate('portal')"
            />
          </div>
        </el-form-item>
        <el-form-item label="开启后等待">
          <el-input-number v-model="config.portal.waitMs" :min="0" :step="100" />
          <span class="unit">毫秒后点击传送门</span>
        </el-form-item>
      </el-form>
    </el-card>

    <PageHelpDrawer :topics="helpTopics" />
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, QuestionFilled } from '@element-plus/icons-vue'
import PageHelpDrawer from '@/domains/help/PageHelpDrawer.vue'
import { moduleHelpTopicsById } from '@/domains/help/helpContent.js'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import { useCombatStore } from '@/stores/combat'
import { electronApi } from '@/api/electron'
import { canUseGameInput } from '@/utils/serverContext.js'
import { commitGlobalShortcut } from '@/utils/scriptService'
import {
  formatCombatAreaGateStatus,
  hasEnabledPotionResource,
  validatePotionAssist
} from '@/utils/combatConfig.js'
import KeyCaptureInput from '@/components/common/KeyCaptureInput.vue'
import KeySequenceCapture from '@/components/common/KeySequenceCapture.vue'
import CoordinateConfigurationField from '@/components/configuration/CoordinateConfigurationField.vue'
import { collectCombatConfigurationIssues, CONFIGURATION_ACTIONS, CONFIGURATION_MODULES } from '@/domains/configurationGuide/configurationIssues.js'
import { configurationIssueFromFailure } from '@/domains/configurationGuide/configurationFailures.js'
import { openConfigurationCorrectionGuide } from '@/domains/configurationGuide/configurationCorrection.js'
import {
  executePortalAssist,
  sampleCombatPixel,
  startCombatAssist,
  stopCombatAssist,
  syncRunningCombatAssist
} from '@/utils/combatService'

const settingsStore = useSettingsStore()
const combatInputEnabled = canUseGameInput('combat')
const combatStore = useCombatStore()
const helpTopics = moduleHelpTopicsById('combat')
const config = reactive(JSON.parse(JSON.stringify(settingsStore.combatAssist)))
const shortcuts = computed(() => settingsStore.globalShortcuts)
const pickingTarget = ref('')
const samplingTarget = ref('')
const samples = reactive({})

const combatStatusLabel = computed(() => {
  if (!combatStore.active) return '已停止'
  const areaPauseText = formatCombatAreaGateStatus(combatStore.areaGate)
  if (areaPauseText) return `已开始 · ${areaPauseText}`
  if (combatStore.running && combatStore.protectedMode) return '已开始 · 频率保护'
  return combatStore.anyFocused ? '已开始' : '已开始 · 等待游戏窗口'
})

const combatStatusTagType = computed(() => {
  if (!combatStore.active) return 'info'
  if (combatStore.areaGate?.paused) return 'warning'
  if (combatStore.running && combatStore.protectedMode) return 'warning'
  return 'success'
})

const areaGateBadgeText = computed(() => {
  const gate = combatStore.areaGate || {}
  if (gate.reason === 'safe-zone') return gate.areaName ? `当前：安全区（${gate.areaName}）` : '当前：安全区'
  if (gate.reason === 'combat-area') return gate.areaName ? `当前：战斗区（${gate.areaName}）` : '当前：战斗区'
  if (gate.reason === 'loading') return '当前：过图加载中'
  if (gate.reason === 'disconnected') return '当前：游戏已断开'
  if (gate.reason === 'log-unavailable') return 'Client.txt 未就绪（保持运行）'
  if (gate.reason === 'area-unknown') return '等待识别区域（保持运行）'
  return ''
})

const areaGateBadgeType = computed(() => {
  const reason = combatStore.areaGate?.reason
  if (reason === 'safe-zone' || reason === 'loading' || reason === 'disconnected') return 'warning'
  if (reason === 'combat-area') return 'success'
  return 'info'
})

const combatErrorMessage = computed(() => combatStore.lastError || combatStore.loopLastError)

const potionCorrectionIssue = computed(() => configurationIssueFromFailure({
  moduleId: CONFIGURATION_MODULES.combat,
  actionId: CONFIGURATION_ACTIONS.potion,
  ...combatStore.lastFailure,
  message: combatStore.lastError
}))
const loopCorrectionIssue = computed(() => configurationIssueFromFailure({
  moduleId: CONFIGURATION_MODULES.combat,
  actionId: CONFIGURATION_ACTIONS.loop,
  ...combatStore.loopLastFailure,
  message: combatStore.loopLastError
}))
const activeCorrectionIssue = computed(() => (combatStore.lastError ? potionCorrectionIssue.value : loopCorrectionIssue.value))
const activeCorrectionAction = computed(() => (combatStore.lastError ? CONFIGURATION_ACTIONS.potion : CONFIGURATION_ACTIONS.loop))
const activeCorrectionFailure = computed(() => (combatStore.lastError ? combatStore.lastFailure : combatStore.loopLastFailure))

const portalCorrectionIssue = computed(() => configurationIssueFromFailure({
  moduleId: CONFIGURATION_MODULES.combat,
  actionId: CONFIGURATION_ACTIONS.portal,
  ...combatStore.portalLastFailure,
  message: combatStore.portalLastError
}))

function openCombatCorrection(actionId, failure) {
  openConfigurationCorrectionGuide({
    moduleId: CONFIGURATION_MODULES.combat,
    actionId,
    title: '重新配置战斗辅助',
    failure,
    collect: () => collectCombatConfigurationIssues({ actionId, config: settingsStore.combatAssist })
  })
}

const resources = [
  { key: 'health', label: '生命药剂', channelLabel: '红色分量', component: 'r' },
  { key: 'mana', label: '魔力药剂', channelLabel: '蓝色分量', component: 'b' }
]

let saveTimer = null
let suppressConfigWatch = false

function replaceLocalConfig(source) {
  suppressConfigWatch = true
  Object.assign(config, JSON.parse(JSON.stringify(source)))
  suppressConfigWatch = false
}

watch(() => settingsStore.combatAssist, (next) => {
  if (suppressConfigWatch) return
  // 保留本地尚未填按键的临时循环行，同时同步来自仪表盘或配置向导的变更
  const emptyRows = (config.loop?.items || []).filter(item => !String(item?.key || '').trim())
  const merged = JSON.parse(JSON.stringify(next))
  if (emptyRows.length) {
    merged.loop.items = [...(merged.loop.items || []), ...emptyRows.map(row => ({ ...row }))]
  }
  if (JSON.stringify(merged) !== JSON.stringify(config)) {
    replaceLocalConfig(merged)
  }
}, { deep: true })

watch(config, () => {
  if (suppressConfigWatch) return
  clearTimeout(saveTimer)
  saveTimer = setTimeout(saveCombatConfig, 150)
}, { deep: true, flush: 'sync' })

function validateHotToggleCandidate(candidate) {
  if (hasEnabledPotionResource(candidate)) {
    const potionCheck = validatePotionAssist(candidate)
    if (!potionCheck.isValid) return potionCheck.errors[0]
  }
  const hasEnabledBlankLoop = (candidate.loop?.items || []).some(item => item.enabled && !String(item.key || '').trim())
  if (hasEnabledBlankLoop) return '请先选择循环按键'
  return ''
}

async function saveCombatConfig() {
  const candidate = JSON.parse(JSON.stringify(config))
  if (combatStore.active) {
    const hotError = validateHotToggleCandidate(candidate)
    if (hotError) {
      replaceLocalConfig(settingsStore.combatAssist)
      ElMessage.warning(`${hotError}，请先完成配置后再开启`)
      return false
    }
  }
  const result = await settingsStore.updateCombatAssist(candidate)
  if (!result.success) {
    replaceLocalConfig(settingsStore.combatAssist)
    ElMessage.error(result.error)
    return false
  }
  if (combatStore.active) {
    await syncRunningCombatAssist()
  }
  return true
}

async function pickCoordinate(target) {
  if (pickingTarget.value) return
  pickingTarget.value = target
  try {
    const result = await electronApi.window.pickScreenCoordinate()
    if (!result || result.canceled) return
    if (result.success === false) throw new Error(result.error?.message || '坐标选取失败')
    if (target === 'portal') config.portal.clickPoint = { x: result.x, y: result.y }
    else config.potion[target].point = { x: result.x, y: result.y }
  } catch (error) {
    ElMessage.error(`选取坐标失败：${error.message}`)
  } finally {
    pickingTarget.value = ''
  }
}

async function samplePixel(resource) {
  samplingTarget.value = resource.key
  try {
    const result = await sampleCombatPixel(config.potion[resource.key].point)
    if (!result?.success) throw new Error(result?.error || '读取失败')
    const value = result.color[resource.component]
    samples[resource.key] = {
      color: result.color,
      value,
      triggered: value < config.potion[resource.key].threshold
    }
  } catch (error) {
    ElMessage.error(`读取颜色失败：${error.message}`)
  } finally {
    samplingTarget.value = ''
  }
}

function addLoopItem() {
  config.loop.items.push({
    id: `loop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    key: '',
    intervalMs: 3000,
    enabled: !combatStore.active
  })
}

function removeLoopItem(index) {
  config.loop.items.splice(index, 1)
}

async function saveShortcut(key, value) {
  try {
    await commitGlobalShortcut(key, value)
    ElMessage.success('一键回城快捷键已更新')
  } catch (error) {
    ElMessage.error(error.message)
  }
}
</script>

<style scoped lang="less">
.combat-page {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  background: var(--bg-secondary);
}

.module-header, .module-title, .card-title, .module-action, .position-row, .safe-zone-row {
  display: flex;
  align-items: center;
}

.module-header {
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.module-title {
  min-width: 0;
  flex-wrap: wrap;
  gap: 8px;
}

.module-action {
  flex: 0 0 auto;
  margin-left: auto;
}

.safe-zone-row {
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.safe-zone-label {
  font-size: 14px;
  color: var(--text-primary);
}

.module-help {
  color: var(--text-secondary);
  cursor: help;
  outline: none;
}

.module-help:hover, .module-help:focus-visible { color: var(--brand-color); }
.position-row { gap: 8px; flex-wrap: wrap; }
.combat-coordinate-field { width: auto; }
.card-title { justify-content: space-between; width: 100%; }
.resource-grid { margin: 0; }
.resource-grid > .el-col { display: flex; }
.resource-grid .el-card { width: 100%; }
.section-card { margin-bottom: 18px; }
.subsection-title { margin-bottom: 12px; font-weight: 600; }
.frequency-form :deep(.el-form-item) { margin-bottom: 12px; }
.loop-list { display: grid; gap: 10px; }
.loop-row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
.loop-add-row { display: flex; justify-content: flex-start; }
.loop-key { min-width: 110px; }
.loop-row :deep(.el-input-number) { width: 130px; }
.module-error { margin-bottom: 12px; }
.configuration-correction-alert { display: flex; align-items: center; gap: 10px; }
.configuration-correction-alert :deep(.el-alert) { min-width: 0; flex: 1; }
.short-input { max-width: 240px; }
.hint, .unit { margin-left: 8px; color: var(--text-secondary); font-size: 12px; }

@media (max-width: 900px) {
  .module-header { align-items: flex-start; flex-wrap: wrap; }
}

@media (max-width: 640px) {
  .module-header { flex-direction: column; }
  .module-action { align-self: flex-end; }
}
</style>
