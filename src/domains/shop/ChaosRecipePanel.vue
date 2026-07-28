<template>
  <div class="chaos-panel">
    <el-alert
      title="实验性国服接口：自动取件会连续向游戏发送输入，使用前请确认你理解账号风险。"
      type="warning"
      :closable="false"
      show-icon
    />

    <el-card class="block">
      <template #header><span>游戏内混沌配方控制</span></template>
      <el-form label-width="130px">
        <el-form-item label="是否开启">
          <el-switch
            :model-value="store.settings.enabled"
            active-text="开启"
            inactive-text="关闭"
            @change="toggleEnabled"
          />
          <span class="muted inline-hint">开启后，仓库和道具背包同时打开时显示游戏内按钮组</span>
        </el-form-item>
        <el-form-item label="取件操作等待">
          <el-input-number
            :model-value="store.settings.operationDelayMs"
            :min="20"
            :max="500"
            :step="10"
            controls-position="right"
            @change="value => store.updateSetting('operationDelayMs', value)"
          />
          <span class="muted inline-hint">毫秒；仅影响混沌配方自动取件</span>
        </el-form-item>
      </el-form>
    </el-card>

    <el-alert
      v-if="store.error"
      class="block"
      :title="`${store.error.code}：${store.error.message}`"
      type="error"
      :closable="false"
      show-icon
    />

    <el-card class="block">
      <template #header>
        <div class="card-header">
          <span>国服账号</span>
          <el-tag :type="store.auth.authenticated ? 'success' : 'info'">
            {{ store.auth.authenticated ? `已登录 · ${store.auth.accountName}` : '未登录' }}
          </el-tag>
        </div>
      </template>

      <div v-if="!store.auth.authenticated" class="auth-actions">
        <el-button type="primary" :loading="store.busy" @click="openLogin">打开网页登录</el-button>
        <el-button :loading="store.busy" @click="completeLogin">我已完成网页登录</el-button>
        <el-input
          v-model="sessionToken"
          type="password"
          show-password
          autocomplete="off"
          placeholder="或手动输入国服 POESESSID"
          @keyup.enter="loginToken"
        />
        <el-button :disabled="!sessionToken.trim()" :loading="store.busy" @click="loginToken">验证令牌</el-button>
      </div>
      <div v-else class="auth-actions">
        <el-button @click="store.logout()">退出国服账号</el-button>
        <span class="muted">会话 Cookie 仅保存在独立 Electron Session 中，不写入预设和日志。</span>
      </div>
    </el-card>

    <template v-if="store.auth.authenticated">
      <div class="config-grid block">
        <el-card>
          <template #header><span>仓库数据</span></template>
          <el-form label-width="92px">
            <el-form-item label="赛季">
              <el-select
                :model-value="store.settings.league"
                filterable
                placeholder="选择国服赛季"
                @change="store.loadTabs"
              >
                <el-option v-for="league in store.leagues" :key="league.id" :label="league.name" :value="league.id" />
              </el-select>
              <el-button class="inline-button" :loading="store.busy" @click="store.loadLeagues()">刷新赛季</el-button>
            </el-form-item>
            <el-form-item label="仓库页">
              <el-checkbox-group
                :model-value="store.settings.selectedTabIds"
                class="tab-list"
                @change="value => store.updateSetting('selectedTabIds', value)"
              >
                <el-checkbox v-for="tab in store.supportedTabs" :key="tab.id" :value="tab.id">
                  {{ tab.name }}
                  <el-tag v-if="tab.inFolder" size="small" type="warning">
                    文件夹内
                  </el-tag>
                  <el-tag size="small">{{ tab.type === 'quad' ? '大型' : '普通' }}</el-tag>
                </el-checkbox>
              </el-checkbox-group>
              <span v-if="store.settings.league && !store.supportedTabs.length" class="muted">没有可用的普通或大型仓库页</span>
              <div v-for="tab in store.selectedTabs" :key="`override-${tab.id}`" class="tab-override-row">
                <span class="tab-override-title">{{ tab.name }}</span>
                <el-switch
                  :model-value="tab.inFolder"
                  active-text="位于文件夹内"
                  inactive-text="位于文件夹外"
                  @change="inFolder => store.updateTabFolderState(tab.id, inFolder)"
                />
              </div>
              <p class="muted folder-hint">
                旧接口无法判断仓库页是否在文件夹内，请按游戏中的实际位置手动选择；默认按文件夹外处理。
              </p>
            </el-form-item>
            <el-form-item label="配方选项">
              <el-checkbox
                :model-value="store.settings.includeIdentified"
                @change="value => store.updateSetting('includeIdentified', value)"
              >
                允许已鉴定装备（每套仅 1 个混沌石）
              </el-checkbox>
            </el-form-item>
            <el-button
              type="primary"
              :loading="store.busy"
              :disabled="!store.settings.league || !store.settings.selectedTabIds.length"
              @click="store.refresh"
            >
              刷新仓库并计算
            </el-button>
          </el-form>
        </el-card>

        <el-card>
          <template #header><span>仓库网格校准</span></template>
          <p class="muted">框选游戏中完整的物品格子区域，不包含标签页标题和仓库边框；普通与大型共用区域。</p>
          <div v-for="entry in calibrationOptions" :key="entry.key" class="calibration-row">
            <el-button @click="store.calibrate(entry.key)">框选{{ entry.label }} {{ entry.size }}</el-button>
            <el-tag :type="store.settings.calibration[entry.key] ? 'success' : 'info'">
              {{ store.settings.calibration[entry.key] ? '已校准' : '未校准' }}
            </el-tag>
          </div>
          <el-alert
            v-if="store.missingCalibrationLabels.length"
            class="calibration-warning"
            :title="`已选仓库还需要校准：${store.missingCalibrationLabels.join('、')}`"
            type="warning"
            :closable="false"
            show-icon
          />
        </el-card>
      </div>

      <el-card v-if="store.snapshot" class="block">
        <template #header>
          <div class="card-header">
            <span>混沌配方状态</span>
            <span class="muted">更新于 {{ formatTime(store.snapshot.fetchedAt) }}</span>
          </div>
        </template>

        <div class="summary-grid">
          <div class="summary-item primary"><strong>{{ store.snapshot.fullSetCount }}</strong><span>完整套装</span></div>
          <div class="summary-item"><strong>{{ store.snapshot.rewardTotal }}</strong><span>预计混沌石</span></div>
          <div v-for="entry in countEntries" :key="entry.key" class="summary-item">
            <strong>{{ entry.count }}</strong><span>{{ entry.label }}</span>
          </div>
        </div>

        <p v-if="store.snapshot.diagnostics" class="diagnostic-line">
          仓库数组 {{ store.snapshot.diagnostics.sourceArrayItemCount }} 件，
          已归一化 {{ store.snapshot.diagnostics.receivedItemCount }} 件，
          已识别装备类别 {{ store.snapshot.diagnostics.recognizedItemCount }} 件，
          稀有 {{ store.snapshot.diagnostics.rareItemCount }} 件，
          60级以上 {{ store.snapshot.diagnostics.level60ItemCount }} 件，
          最终候选 {{ store.snapshot.diagnostics.eligibleItemCount }} 件。
        </p>

        <el-alert
          v-if="diagnosticWarning"
          class="block"
          :title="diagnosticWarning"
          type="warning"
          :closable="false"
          show-icon
        />

        <el-alert
          v-if="store.automation.event === 'error'"
          class="block"
          :title="`自动取件已停止：${store.automation.reason || '未知错误'}`"
          type="error"
          :closable="false"
          show-icon
        />

        <el-alert
          v-if="store.snapshot.needsLowLevel"
          class="block"
          title="部位已齐，但缺少物品等级 60–74 的装备；当前组合会成为富豪石配方。"
          type="warning"
          :closable="false"
          show-icon
        />

        <div class="missing-list block">
          <span>下一套缺件：</span>
          <el-tag v-for="entry in missingEntries" :key="entry.key" type="danger">
            {{ entry.label }} × {{ entry.count }}
          </el-tag>
          <el-tag v-if="!missingEntries.length" type="success">已满足</el-tag>
        </div>

        <div class="automation-controls block">
          <label>
            取出套数
            <el-input-number
              :model-value="store.settings.targetSetCount"
              :min="1"
              :max="Math.max(1, store.snapshot.fullSetCount)"
              @change="value => store.updateSetting('targetSetCount', value)"
            />
          </label>
          <el-button v-if="store.automation.status === 'running'" @click="store.pauseAutomation">暂停</el-button>
          <el-button v-if="store.automation.status === 'paused'" type="primary" @click="store.resumeAutomation">
            已切换到“{{ store.automation.tabName }}”，继续
          </el-button>
          <el-button v-if="['running', 'paused'].includes(store.automation.status)" @click="store.stopAutomation">紧急停止</el-button>
        </div>

        <el-progress
          v-if="store.automation.totalItems"
          :percentage="automationProgress"
          :status="store.automation.status === 'completed' ? 'success' : undefined"
        />
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useChaosRecipeStore } from '../../stores/chaosRecipe.js'

const store = useChaosRecipeStore()
const sessionToken = ref('')
const calibrationOptions = [
  { key: 'root', label: '文件夹外仓库', size: '普通/大型共用' },
  { key: 'folder', label: '文件夹内仓库', size: '普通/大型共用' }
]
const labels = {
  bodyArmour: '胸甲',
  helmet: '头盔',
  gloves: '手套',
  boots: '鞋子',
  belt: '腰带',
  amulet: '项链',
  ring: '戒指',
  oneHandWeapon: '一手/盾',
  twoHandWeapon: '双手',
  weapon: '武器组合',
  lowLevel: '60–74级装备'
}

const countEntries = computed(() => Object.entries(store.snapshot?.counts || {}).map(([key, count]) => ({
  key, count, label: labels[key] || key
})))
const missingEntries = computed(() => Object.entries(store.snapshot?.missing || {})
  .filter(([, count]) => count > 0)
  .map(([key, count]) => ({ key, count, label: labels[key] || key })))
const automationProgress = computed(() => Math.min(100, Math.round(
  Number(store.automation.completedItems || 0) * 100 / Math.max(1, Number(store.automation.totalItems || 0))
)))
const diagnosticWarning = computed(() => {
  const diagnostic = store.snapshot?.diagnostics
  if (!diagnostic) return ''
  if (!diagnostic.sourceArrayItemCount) {
    return '国服旧接口返回了 0 件物品；请确认赛季、仓库页和账号正确，并在游戏中切换一次区域后重试。'
  }
  if (!diagnostic.receivedItemCount) return '接口返回了物品数组，但当前国服响应结构无法归一化。'
  if (!diagnostic.recognizedItemCount) return '仓库物品已读取，但装备类别全部无法识别。'
  if (!diagnostic.eligibleItemCount && diagnostic.identifiedExcludedCount) {
    return `已读取装备，但有 ${diagnostic.identifiedExcludedCount} 件因“已鉴定”被排除；如需计入，请开启“允许已鉴定装备”。`
  }
  if (diagnostic.unrecognizedRareLevel60Count) {
    return `另有 ${diagnostic.unrecognizedRareLevel60Count} 件 60 级以上稀有物品无法识别装备类别，已安全忽略。`
  }
  return ''
})

const formatTime = (value) => value ? new Date(value).toLocaleTimeString() : ''

async function openLogin() {
  try {
    await store.openWebLogin()
    ElMessage.info('请在新窗口完成 QQ/国服登录，然后点击“我已完成网页登录”')
  } catch (error) {
    ElMessage.error(error.message)
  }
}

async function completeLogin() {
  try {
    await store.completeWebLogin()
    ElMessage.success('国服网页登录成功')
  } catch (error) {
    ElMessage.error(error.message)
  }
}

async function loginToken() {
  try {
    await store.loginWithToken(sessionToken.value)
    sessionToken.value = ''
    ElMessage.success('国服会话验证成功')
  } catch (error) {
    sessionToken.value = ''
    ElMessage.error(error.message)
  }
}

async function toggleEnabled(enabled) {
  try {
    await store.setEnabled(enabled)
    ElMessage.success(enabled ? '混沌配方游戏内控制已开启' : '混沌配方游戏内控制已关闭')
  } catch (error) {
    ElMessage.error(error.message)
  }
}

onMounted(() => {
  void store.restoreAuth().catch(() => {})
})
</script>

<style scoped lang="less">
.chaos-panel { padding-top: 4px; }
.block { margin-top: 16px; }
.card-header, .auth-actions, .calibration-row, .automation-controls, .missing-list {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.card-header { justify-content: space-between; }
.auth-actions :deep(.el-input) { width: min(420px, 100%); }
.muted { color: var(--text-secondary); font-size: 13px; }
.diagnostic-line { margin: 12px 0 0; color: var(--text-secondary); font-size: 13px; }
.config-grid { display: grid; grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr); gap: 16px; }
.inline-button { margin-left: 10px; }
.tab-list { display: grid; grid-template-columns: repeat(2, minmax(180px, 1fr)); gap: 8px 12px; width: 100%; }
.tab-override-row {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  margin-top: 8px;
}
.tab-override-title { color: var(--text-secondary); font-size: 13px; }
.folder-hint { margin: 8px 0 0; }
.calibration-row + .calibration-row { margin-top: 12px; }
.calibration-warning { margin-top: 12px; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 12px; }
.summary-item { padding: 14px; border: 1px solid var(--border-light); border-radius: 8px; text-align: center; }
.summary-item strong, .summary-item span { display: block; }
.summary-item strong { font-size: 24px; }
.summary-item span { margin-top: 4px; color: var(--text-secondary); font-size: 12px; }
.summary-item.primary { border-color: var(--el-color-primary); color: var(--el-color-primary); }
.automation-controls label { display: flex; align-items: center; gap: 8px; }
.inline-hint { margin-left: 12px; }
@media (max-width: 900px) {
  .config-grid { grid-template-columns: 1fr; }
  .tab-list { grid-template-columns: 1fr; }
}
</style>
