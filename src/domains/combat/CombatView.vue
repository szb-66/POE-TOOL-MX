<template>
  <div class="combat-page">
    <div class="combat-header">
      <div>
        <h2>战斗辅助</h2>
        <p>通过生命与魔力球像素颜色自动触发药剂，仅在游戏窗口位于前台时发送输入。</p>
      </div>
      <div class="runtime-actions">
        <el-tag :type="combatStore.running ? 'success' : 'info'">
          {{ combatStore.running ? (combatStore.focused ? '运行中' : '运行中 · 等待游戏窗口') : '已停止' }}
        </el-tag>
        <el-button type="primary" :disabled="combatStore.running" @click="startPotionAssist">开始</el-button>
        <el-button type="danger" :disabled="!combatStore.running" @click="stopPotionAssist">停止</el-button>
      </div>
    </div>

    <el-alert
      v-if="combatStore.lastError"
      type="error"
      :title="combatStore.lastError"
      show-icon
      :closable="false"
    />

    <div class="shortcut-grid">
      <el-card v-for="item in shortcutFields" :key="item.key" shadow="never">
        <div class="shortcut-field">
          <span>{{ item.label }}</span>
          <KeyCaptureInput :model-value="shortcuts[item.key]" @change="saveShortcut(item.key, $event)" />
        </div>
      </el-card>
    </div>

    <div class="resource-grid">
      <el-card v-for="resource in resources" :key="resource.key" class="resource-card" shadow="never">
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
    </div>

    <el-card shadow="never" class="section-card">
      <template #header><strong>频率保护</strong></template>
      <el-form inline>
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

    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="card-title">
          <div class="loop-title">
            <strong>主动喝药循环</strong>
            <span class="hint">开启后立即按下对应按键，并按各自间隔循环发送，仅游戏前台时发送</span>
          </div>
          <div class="runtime-actions">
            <el-tag :type="combatStore.loopRunning ? 'success' : 'info'">
              {{ combatStore.loopRunning ? (combatStore.loopFocused ? '运行中' : '运行中 · 等待游戏窗口') : '已停止' }}
            </el-tag>
            <el-button type="primary" :disabled="combatStore.loopRunning" @click="startLoopAssist">开始</el-button>
            <el-button type="danger" :disabled="!combatStore.loopRunning" @click="stopLoopAssist">停止</el-button>
            <el-button type="default" @click="addLoopItem">添加按键</el-button>
          </div>
        </div>
      </template>

      <el-alert
        v-if="combatStore.loopLastError"
        type="error"
        :title="combatStore.loopLastError"
        show-icon
        :closable="false"
        class="loop-error"
      />

      <div v-if="!config.loop.items.length" class="loop-empty">
        尚未添加循环按键，点击右上角"添加按键"。
      </div>
      <div v-else class="loop-list">
        <div v-for="(item, index) in config.loop.items" :key="item.id" class="loop-row">
          <el-switch v-model="item.enabled" />
          <KeyCaptureInput v-model="item.key" mode="action" placeholder="选择按键" class="loop-key" />
          <span class="unit">间隔</span>
          <el-input-number v-model="item.intervalMs" :min="100" :step="100" />
          <span class="unit">毫秒</span>
          <el-button :icon="Delete" circle size="small" @click="removeLoopItem(index)" />
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="card-title">
          <strong>一键回城</strong>
          <el-button type="primary" @click="executePortalAssist">执行回城</el-button>
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
import { Aim, Delete } from '@element-plus/icons-vue'
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

.combat-header, .card-title, .runtime-actions, .position-row, .shortcut-field {
  display: flex;
  align-items: center;
}

.combat-header {
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
  h2 { margin: 0 0 6px; }
  p { margin: 0; color: var(--text-secondary); }
}

.runtime-actions, .position-row { gap: 8px; }
.card-title { justify-content: space-between; width: 100%; }
.shortcut-grid, .resource-grid { display: grid; gap: 16px; margin: 18px 0; }
.shortcut-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.resource-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.shortcut-field { gap: 12px; span { white-space: nowrap; } }
.section-card { margin-bottom: 18px; }
.loop-title { display: flex; align-items: baseline; gap: 12px; }
.loop-list { display: grid; gap: 10px; }
.loop-row { display: flex; align-items: center; gap: 10px; }
.loop-key { min-width: 110px; }
.loop-row :deep(.el-input-number) { width: 130px; }
.loop-empty { padding: 18px 0; color: var(--text-secondary); font-size: 13px; text-align: center; }
.loop-error { margin-bottom: 12px; }
.position-row :deep(.el-input-number) { width: 110px; }
.short-input { max-width: 240px; }
.hint, .unit { margin-left: 8px; color: var(--text-secondary); font-size: 12px; }

@media (max-width: 900px) {
  .shortcut-grid, .resource-grid { grid-template-columns: 1fr; }
  .combat-header { align-items: flex-start; flex-direction: column; }
}
</style>
