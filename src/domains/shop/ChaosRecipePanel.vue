<template>
  <div class="chaos-panel">
    <el-alert
      title="实验性国服接口：自动取件会连续向游戏发送输入，使用前请确认你理解账号风险。"
      type="warning"
      :closable="false"
      show-icon
    />

    <el-card class="block">
      <template #header><span>游戏内商店配方控制</span></template>
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
        <div class="muted">取件速度统一使用“设置 → 自动操作”中的全局时序。</div>
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
          <span>共享国服账号</span>
          <el-tag :type="store.auth.authenticated ? 'success' : 'info'">
            {{ store.auth.authenticated ? `已登录 · ${store.auth.accountName}` : '未登录' }}
          </el-tag>
        </div>
      </template>
      <div class="auth-actions">
        <el-button type="primary" plain @click="$router.push('/settings')">前往账号设置</el-button>
        <span class="muted">账号和赛季已收拢到设置页，商城正则本身不需要账号。</span>
      </div>
    </el-card>

    <template v-if="store.auth.authenticated">
      <div class="config-grid block">
        <el-card>
          <template #header><span>仓库数据</span></template>
          <el-form label-width="92px">
            <el-form-item label="赛季">
              <strong>{{ store.leagues.find(item => item.id === store.league)?.name || store.league || '未设置' }}</strong>
              <el-button class="inline-button" @click="$router.push('/settings')">修改全局赛季</el-button>
            </el-form-item>
            <el-form-item label="仓库页">
              <div class="tab-list">
                <div
                  v-for="tab in store.supportedTabs"
                  :key="tab.id"
                  class="tab-card"
                  :class="{ active: store.settings.selectedTabIds.includes(tab.id) }"
                  role="checkbox"
                  tabindex="0"
                  :aria-checked="store.settings.selectedTabIds.includes(tab.id)"
                  @click="toggleTabSelection(tab.id)"
                  @keydown.space.prevent="toggleTabSelection(tab.id)"
                  @keydown.enter.prevent="toggleTabSelection(tab.id)"
                >
                  <div class="tab-card-title">
                    <strong>{{ tab.name }}</strong>
                    <el-tag size="small">{{ tab.type === 'quad' ? '大型' : '普通' }}</el-tag>
                  </div>
                  <div class="tab-folder-control" @click.stop @keydown.stop>
                    <span>文件夹</span>
                    <el-switch
                      :model-value="tab.inFolder"
                      :aria-label="`${tab.name}位于文件夹内`"
                      @change="inFolder => store.updateTabFolderState(tab.id, inFolder)"
                    />
                  </div>
                </div>
              </div>
              <span v-if="store.league && !store.supportedTabs.length" class="muted">没有可用的普通或大型仓库页</span>
              <p class="muted folder-hint">
                旧接口无法判断仓库页是否在文件夹内，请按游戏中的实际位置设置“文件夹”开关；开启表示位于文件夹内，默认关闭。
              </p>
            </el-form-item>
            <el-form-item label="配方选项">
              <el-checkbox
                :model-value="store.settings.includeIdentified"
                @change="value => store.updateSetting('includeIdentified', value)"
              >
                允许已鉴定装备（完整套装可能只产出 1 个对应通货）
              </el-checkbox>
            </el-form-item>
            <el-button
              type="primary"
              :loading="store.busy"
              :disabled="!store.league || !store.settings.selectedTabIds.length"
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
            <el-tag :type="store.stashGridCalibration[entry.key] ? 'success' : 'info'">
              {{ store.stashGridCalibration[entry.key] ? '已校准' : '未校准' }}
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
            <span>商店配方状态</span>
            <span class="muted">更新于 {{ formatTime(store.snapshot.fetchedAt) }}</span>
          </div>
        </template>

        <p class="muted">各配方独立预览，数量不可直接相加；每次只取当前选中的一种配方。</p>
        <div class="recipe-grid">
          <button
            v-for="recipe in recipeCards"
            :key="recipe.id"
            type="button"
            class="recipe-card"
            :class="{ active: store.settings.activeRecipeId === recipe.id }"
            @click="store.setActiveRecipe(recipe.id)"
          >
            <strong>{{ recipe.label }}</strong>
            <span>{{ recipe.kind === 'set' ? `${recipe.fullSetCount} 套` : `${recipe.candidateCount} 件` }}</span>
            <small>预计 {{ recipe.rewardTotal }}</small>
          </button>
        </div>

        <div v-if="activeRecipe?.kind === 'set'" class="summary-grid block">
          <div class="summary-item primary"><strong>{{ activeRecipe.fullSetCount }}</strong><span>完整套装</span></div>
          <div class="summary-item"><strong>{{ activeRecipe.rewardTotal }}</strong><span>预计{{ activeRecipe.label }}</span></div>
          <div v-for="entry in countEntries" :key="entry.key" class="summary-item">
            <strong>{{ entry.count }}</strong><span>{{ entry.label }}</span>
          </div>
        </div>

        <div v-else-if="activeRecipe" class="single-section block">
          <div class="card-header">
            <span>候选物品（默认全选，可在取件前取消）</span>
            <el-tag type="info">已选 {{ store.activeSelectedItemIds.length }} / {{ activeRecipe.candidateCount }}</el-tag>
          </div>
          <el-checkbox-group
            :model-value="store.activeSelectedItemIds"
            class="single-list"
            @change="ids => store.setSelectedItemIds(store.settings.activeRecipeId, ids)"
          >
            <label v-for="item in activeRecipe.candidates" :key="item.id" class="single-row">
              <el-checkbox :value="item.id" />
              <span>{{ item.name || item.baseType || item.typeLine }}</span>
              <span class="muted">{{ item.tabName }} · ({{ item.x }}, {{ item.y }})</span>
              <code>{{ item.socketSignature }}</code>
              <el-tag size="small">+{{ item.reward }} {{ activeRecipe.label }}</el-tag>
            </label>
          </el-checkbox-group>
          <el-empty v-if="!activeRecipe.candidateCount" description="当前仓库没有匹配物品" :image-size="64" />
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
          v-if="store.settings.activeRecipeId === 'chaos' && activeRecipe?.needsLowLevel"
          class="block"
          title="部位已齐，但缺少物品等级 60–74 的装备；当前组合会成为富豪石配方。"
          type="warning"
          :closable="false"
          show-icon
        />

        <div v-if="activeRecipe?.kind === 'set'" class="missing-list block">
          <span>下一套缺件：</span>
          <el-tag v-for="entry in missingEntries" :key="entry.key" type="danger">
            {{ entry.label }} × {{ entry.count }}
          </el-tag>
          <el-tag v-if="!missingEntries.length" type="success">已满足</el-tag>
        </div>

        <div class="automation-controls block">
          <label v-if="activeRecipe?.kind === 'set'">
            取出套数
            <el-input-number
              :model-value="store.settings.targetSetCount"
              :min="1"
              :max="Math.max(1, activeRecipe?.fullSetCount || 0)"
              @change="value => store.updateSetting('targetSetCount', value)"
            />
          </label>
          <span v-else-if="activeRecipe" class="muted">
            将取出已勾选的 {{ store.activeSelectedItemIds.length }} 件{{ activeRecipe.label }}候选
          </span>
          <el-button v-if="store.automation.status === 'running'" @click="store.pauseAutomation">暂停</el-button>
          <el-button v-if="store.automation.status === 'paused'" type="primary" @click="store.resumeAutomation">
            {{ store.automation.code === 'INVENTORY_FULL'
              ? '清空背包后继续'
              : `已切换到“${store.automation.tabName}”，继续` }}
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
import { computed } from 'vue'
import { useChaosRecipeStore } from '../../stores/chaosRecipe.js'
import { VENDOR_RECIPE_CATALOG, VENDOR_RECIPE_IDS } from '../../../electron/modules/chaosRecipe/engine.js'

const store = useChaosRecipeStore()
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
  lowLevel: '60–74级装备',
  levelBand: '目标物等装备'
}

const activeRecipe = computed(() => store.activeRecipe)
const recipeCards = computed(() => VENDOR_RECIPE_IDS.map((id) => ({
  ...VENDOR_RECIPE_CATALOG[id],
  ...(store.snapshot?.recipes?.[id] || { fullSetCount: 0, candidateCount: 0, rewardTotal: 0 })
})))
const countEntries = computed(() => Object.entries(activeRecipe.value?.counts || {}).map(([key, count]) => ({
  key, count, label: labels[key] || key
})))
const missingEntries = computed(() => Object.entries(activeRecipe.value?.missing || {})
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

function toggleTabSelection(tabId) {
  const selectedTabIds = store.settings.selectedTabIds.includes(tabId)
    ? store.settings.selectedTabIds.filter(id => id !== tabId)
    : [...store.settings.selectedTabIds, tabId]
  store.updateSetting('selectedTabIds', selectedTabIds)
}

async function toggleEnabled(enabled) {
  try {
    await store.setEnabled(enabled)
    ElMessage.success(enabled ? '商店配方游戏内控制已开启' : '商店配方游戏内控制已关闭')
  } catch (error) {
    ElMessage.error(error.message)
  }
}

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
.tab-list { display: grid; grid-template-columns: repeat(2, minmax(180px, 1fr)); gap: 10px 12px; width: 100%; }
.tab-card {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  min-width: 0;
  padding: 12px 14px;
  border: 2px solid var(--border-lighter);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: border-color .15s ease, background-color .15s ease, box-shadow .15s ease;
}
.tab-card:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--el-color-primary-light-7); }
.tab-card.active { border-color: var(--el-color-primary); }
.tab-card:hover { border-color: var(--el-color-primary-light-5); background: var(--el-color-primary-light-9); }
.tab-card.active:hover { border-color: var(--el-color-primary); }
.tab-card-title { display: flex; align-items: center; gap: 8px; min-width: 0; }
.tab-card-title strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tab-folder-control { display: flex; align-items: center; gap: 7px; color: var(--text-secondary); font-size: 13px; cursor: default; }
.folder-hint { margin: 8px 0 0; }
.calibration-row + .calibration-row { margin-top: 12px; }
.calibration-warning { margin-top: 12px; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 12px; }
.recipe-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 12px; }
.recipe-card {
  display: grid;
  gap: 5px;
  padding: 12px;
  color: var(--text-primary);
  text-align: left;
  border: 1px solid var(--border-lighter);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}
.recipe-card.active { color: var(--el-color-primary); border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.recipe-card span, .recipe-card small { color: var(--text-secondary); }
.single-list { display: grid; gap: 8px; margin-top: 12px; }
.single-row {
  display: grid;
  grid-template-columns: auto minmax(140px, 1fr) minmax(140px, auto) minmax(90px, auto) auto;
  gap: 10px;
  align-items: center;
  padding: 9px 10px;
  border: 1px solid var(--border-lighter);
  border-radius: 6px;
}
.single-row code { color: var(--el-color-primary); }
.summary-item { padding: 14px; border: 1px solid var(--border-lighter); border-radius: 8px; text-align: center; }
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
