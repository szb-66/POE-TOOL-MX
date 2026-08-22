<template>
  <div class="combat-page primary-page primary-page__scroll primary-page__content">
    <el-card shadow="never" class="section-card combat-module" data-module="combat-settings">
      <template #header>
        <div class="module-header">
          <div class="module-title">
            <strong>战斗辅助配置</strong>
            <el-tooltip content="配置被动喝药启停与一键回城快捷键，以及药剂检测频率和触发保护。" placement="top">
              <el-icon class="module-help" tabindex="0" aria-label="查看战斗辅助配置说明"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </div>
      </template>

      <div class="subsection-title">快捷键</div>
      <el-row class="shortcut-grid app-grid" :gutter="16">
        <el-col v-for="item in shortcutFields" :key="item.key" :xs="24" :sm="12" :md="8">
          <div class="shortcut-field">
            <span>{{ item.label }}</span>
            <KeyCaptureInput :model-value="shortcuts[item.key]" @change="saveShortcut(item.key, $event)" />
          </div>
        </el-col>
      </el-row>

      <div class="subsection-title frequency-title">频率保护</div>
      <el-form inline class="frequency-form">
        <el-form-item label="检测间隔">
          <el-input-number v-model="config.potion.scanIntervalMs" :min="10" :step="10" /> 毫秒
        </el-form-item>
        <el-form-item label="每秒最多触发">
          <el-input-number v-model="config.potion.maxTriggersPerSecond" :min="1" :max="20" /> 次
        </el-form-item>
        <el-form-item label="保护冷却">
          <el-input-number v-model="config.potion.protectionCooldownMs" :min="1" :step="100" /> 毫秒
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="section-card combat-module" data-module="passive-potion">
      <template #header>
        <div class="module-header">
          <div class="module-title">
            <strong>被动喝药</strong>
            <el-tooltip content="通过生命与魔力球像素颜色自动触发药剂，仅在游戏窗口位于前台时检测并发送输入。" placement="top">
              <el-icon class="module-help" tabindex="0" aria-label="查看被动喝药说明"><QuestionFilled /></el-icon>
            </el-tooltip>
            <el-tag :type="combatStore.running ? 'success' : 'info'">
              {{ combatStore.running ? (combatStore.focused ? '已开始' : '已开始 · 等待游戏窗口') : '已停止' }}
            </el-tag>
          </div>
          <div class="module-action">
            <el-button v-if="combatStore.running" type="danger" @click="stopPotionAssist">停止</el-button>
            <el-button v-else type="primary" @click="startPotionAssist">开始</el-button>
          </div>
        </div>
      </template>

      <el-alert
        v-if="combatStore.lastError"
        type="error"
        :title="combatStore.lastError"
        show-icon
        :closable="false"
        class="module-error"
      />

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
                  <el-input-number v-model="config.potion[resource.key].point.x" :controls="false" />
                  <span>,</span>
                  <el-input-number v-model="config.potion[resource.key].point.y" :controls="false" />
                  <el-button
                    :icon="Aim"
                    circle
                    :loading="pickingTarget === resource.key"
                    :disabled="Boolean(pickingTarget) && pickingTarget !== resource.key"
                    @click="pickCoordinate(resource.key)"
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
            <el-tooltip content="开启后立即按下对应按键，并按各自间隔循环发送，仅在游戏窗口位于前台时发送。" placement="top">
              <el-icon class="module-help" tabindex="0" aria-label="查看主动喝药说明"><QuestionFilled /></el-icon>
            </el-tooltip>
            <el-tag :type="combatStore.loopRunning ? 'success' : 'info'">
              {{ combatStore.loopRunning ? (combatStore.loopFocused ? '已开始' : '已开始 · 等待游戏窗口') : '已停止' }}
            </el-tag>
          </div>
          <div class="module-action">
            <el-button v-if="combatStore.loopRunning" type="danger" @click="stopLoopAssist">停止</el-button>
            <el-button v-else type="primary" @click="startLoopAssist">开始</el-button>
          </div>
        </div>
      </template>

      <el-alert
        v-if="combatStore.loopLastError"
        type="error"
        :title="combatStore.loopLastError"
        show-icon
        :closable="false"
        class="module-error"
      />

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
            <el-button type="primary" @click="executePortalAssist">执行回城</el-button>
          </div>
        </div>
      </template>
      <el-form label-width="150px" label-position="left">
        <el-form-item label="游戏内开启传送门键">
          <KeyCaptureInput v-model="config.portal.openKey" mode="action" class="short-input" />
        </el-form-item>
        <el-form-item label="传送门点击位置">
          <div class="position-row">
            <el-input-number v-model="config.portal.clickPoint.x" :controls="false" />
            <span>,</span>
            <el-input-number v-model="config.portal.clickPoint.y" :controls="false" />
            <el-button
              :icon="Aim"
              circle
              :loading="pickingTarget === 'portal'"
              :disabled="Boolean(pickingTarget) && pickingTarget !== 'portal'"
              @click="pickCoordinate('portal')"
            />
          </div>
        </el-form-item>
        <el-form-item label="开启后等待">
          <el-input-number v-model="config.portal.waitMs" :min="0" :step="100" />
          <span class="unit">毫秒后点击传送门</span>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Aim, Delete, QuestionFilled } from '@element-plus/icons-vue'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import { useCombatStore } from '@/stores/combat'
import { electronApi } from '@/api/electron'
import { commitGlobalShortcut } from '@/utils/scriptService'
import KeyCaptureInput from '@/components/common/KeyCaptureInput.vue'
import KeySequenceCapture from '@/components/common/KeySequenceCapture.vue'
import {
  executePortalAssist,
  sampleCombatPixel,
  startLoopAssist,
  startPotionAssist,
  stopLoopAssist,
  stopPotionAssist
} from '@/utils/combatService'

const settingsStore = useSettingsStore()
const combatStore = useCombatStore()
const config = reactive(JSON.parse(JSON.stringify(settingsStore.combatAssist)))
const shortcuts = computed(() => settingsStore.globalShortcuts)
const pickingTarget = ref('')
const samplingTarget = ref('')
const samples = reactive({})

const resources = [
  { key: 'health', label: '生命药剂', channelLabel: '红色分量', component: 'r' },
  { key: 'mana', label: '魔力药剂', channelLabel: '蓝色分量', component: 'b' }
]

const shortcutFields = [
  { key: 'potionStart', label: '自动喝药开始' },
  { key: 'potionStop', label: '自动喝药停止' },
  { key: 'portal', label: '一键回城宏' }
]

let saveTimer = null
let suppressConfigWatch = false
watch(config, () => {
  if (suppressConfigWatch) return
  clearTimeout(saveTimer)
  saveTimer = setTimeout(saveCombatConfig, 150)
}, { deep: true, flush: 'sync' })

async function saveCombatConfig() {
  const candidate = JSON.parse(JSON.stringify(config))
  const result = await settingsStore.updateCombatAssist(candidate)
  if (result.success) return true
  suppressConfigWatch = true
  Object.assign(config, JSON.parse(JSON.stringify(settingsStore.combatAssist)))
  suppressConfigWatch = false
  ElMessage.error(result.error)
  return false
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
    enabled: true
  })
}

function removeLoopItem(index) {
  config.loop.items.splice(index, 1)
}

async function saveShortcut(key, value) {
  try {
    await commitGlobalShortcut(key, value)
    ElMessage.success('战斗辅助快捷键已更新')
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

.module-header, .module-title, .card-title, .module-action, .position-row, .shortcut-field {
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

.module-help {
  color: var(--text-secondary);
  cursor: help;
  outline: none;
}

.module-help:hover, .module-help:focus-visible { color: var(--brand-color); }
.position-row { gap: 8px; flex-wrap: wrap; }
.card-title { justify-content: space-between; width: 100%; }
.shortcut-grid, .resource-grid { margin: 0; }
.shortcut-grid > .el-col, .resource-grid > .el-col { display: flex; }
.resource-grid .el-card { width: 100%; }
.shortcut-field { justify-content: space-between; gap: 12px; width: 100%; span { white-space: nowrap; } }
.section-card { margin-bottom: 18px; }
.subsection-title { margin-bottom: 12px; font-weight: 600; }
.frequency-title { margin-top: 18px; }
.frequency-form :deep(.el-form-item) { margin-bottom: 0; }
.loop-list { display: grid; gap: 10px; }
.loop-row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
.loop-add-row { display: flex; justify-content: flex-start; }
.loop-key { min-width: 110px; }
.loop-row :deep(.el-input-number) { width: 130px; }
.module-error { margin-bottom: 12px; }
.position-row :deep(.el-input-number) { width: 110px; }
.short-input { max-width: 240px; }
.hint, .unit { margin-left: 8px; color: var(--text-secondary); font-size: 12px; }

@media (max-width: 900px) {
  .module-header { align-items: flex-start; flex-wrap: wrap; }
}

@media (max-width: 640px) {
  .module-header { flex-direction: column; }
  .module-action { align-self: flex-end; }
  .frequency-form :deep(.el-form-item) { margin-bottom: 12px; }
}
</style>
