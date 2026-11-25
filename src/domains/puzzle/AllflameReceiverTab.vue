<template>
  <div class="allflame-receiver-tab">
    <el-alert
      type="info"
      :closable="false"
      show-icon
      class="legacy-season-note"
      title="S30“永火之咒”赛季玩法归档"
      description="本功能统一收纳于“过期赛季”中，默认关闭，开启后持续检测永火接收舱与背包，并共用游戏内自动入库按钮；背包格子布局、物品黑名单与传奇强入规则继续复用“存取 → 入库”中的配置。"
    />

    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header-row">
          <div class="card-title-group">
            <strong>永火接收舱一键入库</strong>
            <el-tag size="small" type="info">S30 过期赛季</el-tag>
          </div>
          <el-button v-if="bagModuleEnabled" size="small" plain @click="goToBagRules">
            前往存取配置入库规则
          </el-button>
        </div>
      </template>

      <el-form label-width="120px" label-position="left">
        <el-form-item>
          <template #label>
            <span class="label-with-help">
              启用功能
              <el-tooltip content="持续检测永火接收舱与背包，并共用游戏内自动入库按钮" placement="top">
                <el-icon class="help-icon" tabindex="0" aria-label="永火接收舱入库启用说明"><QuestionFilled /></el-icon>
              </el-tooltip>
            </span>
          </template>
          <el-switch
            :model-value="bagStore.allflameReceiverEnabled"
            :disabled="!receiverAvailable"
            @change="handleToggle"
          />
        </el-form-item>

        <el-form-item label="检测状态">
          <el-tag :type="detectionStatus.type">{{ detectionStatus.text }}</el-tag>
        </el-form-item>

        <el-form-item v-if="bagStore.isStashing" label="扫描进度">
          <el-progress :percentage="bagStore.stashProgress" :text-inside="true" :stroke-width="20" style="width: 100%; max-width: 420px" />
        </el-form-item>

        <el-form-item v-if="bagStore.isStashing">
          <el-button type="danger" :icon="VideoPause" @click="handleStopStash">停止入库</el-button>
        </el-form-item>

        <el-form-item v-if="showReceiverStopAlert" label="停止原因">
          <div class="configuration-correction-alert">
            <el-alert :closable="false" type="warning" :title="formatBagStopReason(bagStore.lastStopReason)" />
            <el-button v-if="receiverCorrectionIssue" type="warning" plain @click="openCorrection">
              重新配置
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <div class="template-field-wrapper">
        <TemplateCaptureConfigurationField
          type="allflameReceiverTitle"
          region-key="allflameReceiverRegion"
          label="永火接收舱标题模板"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { QuestionFilled, VideoPause } from '@element-plus/icons-vue'
import TemplateCaptureConfigurationField from '@/components/configuration/TemplateCaptureConfigurationField.vue'
import { useBagStore } from '@/stores/bag'
import { useFeatureModulesStore } from '@/stores/featureModules'
import { formatBagStopReason, stopBagStash } from '@/utils/bagService'
import {
  collectAllflameConfiguration,
  isAllflameReceiverAvailable,
  setAllflameReceiverEnabled
} from './allflameReceiverService.js'
import { CONFIGURATION_ACTIONS, CONFIGURATION_MODULES } from '@/domains/configurationGuide/configurationIssues.js'
import { configurationIssueFromFailure } from '@/domains/configurationGuide/configurationFailures.js'
import { openConfigurationCorrectionGuide } from '@/domains/configurationGuide/configurationCorrection.js'

const router = useRouter()
const bagStore = useBagStore()
const featureStore = useFeatureModulesStore()

const receiverAvailable = computed(() => isAllflameReceiverAvailable())
const bagModuleEnabled = computed(() => featureStore.isEnabled('bag'))

const detectionStatus = computed(() => {
  if (!bagStore.allflameReceiverEnabled) return { type: 'info', text: '模块未启用' }
  if (bagStore.isAllflameReceiverMatched) return { type: 'success', text: '接收舱与背包已就绪' }
  return bagStore.isDetecting ? { type: 'warning', text: '等待接收舱与背包同时打开' } : { type: 'danger', text: '检测已停止' }
})

const showReceiverStopAlert = computed(() => Boolean(
  bagStore.lastStopReason && (
    bagStore.lastFailure.configurationIssueId === 'template.allflame-receiver-title' ||
    (bagStore.allflameReceiverEnabled && !bagStore.moduleEnabled)
  )
))

const receiverCorrectionIssue = computed(() => configurationIssueFromFailure({
  moduleId: CONFIGURATION_MODULES.puzzle,
  actionId: CONFIGURATION_ACTIONS.start,
  failureCode: bagStore.lastFailure.failureCode,
  configurationIssueId: bagStore.lastFailure.configurationIssueId,
  message: bagStore.lastStopReason
}))

async function handleToggle(enabled) {
  try {
    await setAllflameReceiverEnabled(enabled)
  } catch (error) {
    ElMessage.error(`操作失败：${error.message}`)
  }
}

async function handleStopStash() {
  try {
    await stopBagStash()
  } catch (error) {
    ElMessage.error(`停止失败：${error.message}`)
  }
}

function openCorrection() {
  openConfigurationCorrectionGuide({
    moduleId: CONFIGURATION_MODULES.puzzle,
    actionId: CONFIGURATION_ACTIONS.start,
    title: '重新配置永火接收舱一键入库',
    failure: {
      failureCode: bagStore.lastFailure.failureCode,
      configurationIssueId: bagStore.lastFailure.configurationIssueId,
      message: bagStore.lastStopReason
    },
    collect: () => collectAllflameConfiguration(CONFIGURATION_ACTIONS.start)
  })
}

function goToBagRules() {
  void router.push('/bag')
}
</script>

<style scoped lang="less">
.allflame-receiver-tab {
  display: grid;
  gap: 16px;
}
.section-card {
  border: 1px solid var(--border-base);
}
.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.card-title-group {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.label-with-help {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.help-icon {
  color: var(--el-text-color-secondary);
  cursor: help;
}
.template-field-wrapper {
  margin-top: 8px;
}
.configuration-correction-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  :deep(.el-alert) {
    flex: 1;
    min-width: 0;
  }
}
</style>
