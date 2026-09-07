<template>
  <div class="settings-page primary-page primary-page--column">
    <div class="primary-page__tabs settings-tab-bar">
      <!-- 操作按钮保持在 Tab 组件之外 -->
      <div v-show="activeTab !== 'feedback'" class="action-buttons">
        <el-button type="danger" @click="handleReset" :icon="Refresh">
          重置所有设置
        </el-button>
      </div>
      <el-tabs v-model="activeTab" class="settings-tabs" @tab-change="handleTabChange">
          <el-tab-pane label="通用" name="general" />
          <el-tab-pane label="自动操作" name="automation" />
          <el-tab-pane label="界面识别" name="detection" />
          <el-tab-pane label="覆盖层" name="overlay" />
          <el-tab-pane label="系统" name="system" />
          <el-tab-pane name="feedback">
            <template #label>
              <span class="feedback-tab-label">
                问题反馈
                <span
                  v-if="feedbackRepliesStore.unreadCount > 0"
                  class="feedback-unread-dot"
                  role="img"
                  aria-label="反馈有新回复"
                />
              </span>
            </template>
          </el-tab-pane>
          <el-tab-pane label="关于" name="about" />
      </el-tabs>
    </div>
    <el-scrollbar ref="settingsScrollbar" class="primary-page__scroll">
      <div class="settings-content primary-page__content">

        <div v-show="activeTab === 'general'" class="settings-tab-panel settings-panel settings-panel--general">
        <div class="section-header">
          <h3 class="section-title">国服账号</h3>
        </div>
        <el-card class="section-card">
          <AccountLeagueConfigurationField show-token />
        </el-card>

        </div>

        <div v-show="activeTab === 'detection'" class="settings-tab-panel settings-panel settings-panel--detection">
        <InterfaceDetectionSettings />
        <StashTabSelectionSettings />
        </div>

        <div v-show="activeTab === 'general'" class="settings-tab-panel settings-panel settings-panel--general">
        <!-- 快捷键设置 -->
        <div class="section-header">
          <h3 class="section-title">快捷键设置</h3>
        </div>
        <el-card class="section-card">
          <el-form :model="shortcuts" label-width="120px" label-position="left">
            <el-form-item label="生效范围">
              <div class="shortcut-scope-control">
                <el-switch
                  :model-value="shortcutScopeEnabled"
                  @change="handleShortcutScopeToggle"
                />
                <span class="scope-label">仅在游戏窗口前台时生效</span>
                <div class="hint-text">开启后，游戏未启动或切到其他窗口时快捷键自动暂停，避免拦截普通按键（如 B）；可随时关闭恢复全局生效。</div>
              </div>
            </el-form-item>
            <el-row class="independent-short-fields app-grid" :gutter="16">
              <el-col v-for="field in shortcutFields" :key="field.key" :xs="24" :sm="12" :md="8">
                <el-form-item :label="field.label">
                  <KeyCaptureInput
                    :model-value="shortcuts[field.key]"
                    :allow-empty="field.key !== 'end'"
                    @change="handleShortcutsChange(field.key, $event)"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>

        </div>

        <div v-show="activeTab === 'automation'" class="settings-tab-panel settings-panel settings-panel--automation">
        <!-- 背包设置 -->
        <div class="section-header">
          <h3 class="section-title">背包设置</h3>
        </div>
        <el-card class="section-card">
          <el-form :model="inventory" label-width="120px" label-position="left">
            <el-row class="app-grid" :gutter="16">
              <el-col :span="12">
                <el-form-item class="spaced-field">
                  <template #label>
                    <span class="label-with-help">
                      背包网格
                      <el-tooltip content="框选游戏中完整的 12×5 原生背包网格，自动换算首格中心与单格宽高" placement="top">
                        <el-icon class="help-icon" tabindex="0" aria-label="背包网格说明"><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </span>
                  </template>
                  <InventoryGridConfigurationField
                    :inventory="inventory"
                    :loading="bagGridPicking"
                    @pick="handlePickBagGrid"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row class="app-grid" :gutter="16">
              <el-col :span="12">
                <el-form-item class="spaced-field">
                  <template #label>
                    <span class="label-with-help">
                      连续空格判空
                      <el-tooltip content="扫描连续达到该数量的空格后，认为后续没有内容" placement="top">
                        <el-icon class="help-icon" tabindex="0" aria-label="连续空格判空说明"><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </span>
                  </template>
                  <el-input-number
                    v-model="inventory.emptySlotThreshold"
                    :min="EMPTY_SLOT_THRESHOLD.min"
                    :max="EMPTY_SLOT_THRESHOLD.max"
                    :step="1"
                    step-strictly
                    controls-position="right"
                    style="width: 180px"
                    @change="handleEmptySlotThresholdChange"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>

        <!-- 通货坐标 -->
        <div class="section-header">
          <h3 class="section-title">通货坐标</h3>
        </div>
        <el-card class="section-card">
          <el-form :model="positions" label-width="120px" label-position="left">
            <div class="currency-position-grid">
              <div v-for="(pos, key) in positions" :key="key" class="currency-position-item">
                <el-form-item :label="getCurrencyName(key)">
                  <CoordinateConfigurationField
                    :model-value="positions[key]"
                    :loading="coordinatePickingTarget === `currency:${key}`"
                    :disabled="Boolean(coordinatePickingTarget) && coordinatePickingTarget !== `currency:${key}`"
                    @update:model-value="updateCurrencyPositionDraft(key, $event)"
                    @pick="handlePickCurrencyCoordinate(key)"
                  />
                </el-form-item>
              </div>
            </div>
          </el-form>
        </el-card>

        </div>

        <div v-show="activeTab === 'system'" class="settings-tab-panel settings-panel settings-panel--system">
        <!-- 应用更新 -->
        <div class="section-header">
          <h3 class="section-title">应用更新</h3>
        </div>
        <el-card class="section-card">
          <el-form label-width="120px" label-position="left">
            <el-form-item label="下载源">
              <div class="update-settings">
                <el-radio-group v-model="updateSource" :disabled="updateBusy" @change="handleUpdateSourceChange">
                  <el-radio-button value="cnb">CNB（国内推荐）</el-radio-button>
                  <el-radio-button value="github">GitHub</el-radio-button>
                </el-radio-group>
                <span class="hint-text">当前来源：{{ updateSource === 'cnb' ? 'CNB 国内镜像' : 'GitHub Release' }}；失败后可手动切换并重试。</span>
              </div>
            </el-form-item>
            <el-form-item label="更新模式">
              <div class="update-settings">
                <el-radio-group v-model="updateMode" @change="handleUpdateModeChange">
                  <el-radio-button value="manual">手动更新</el-radio-button>
                  <el-radio-button value="automatic">自动检查与下载</el-radio-button>
                </el-radio-group>
                <span class="hint-text">每次启动都会立即后台检查；自动模式还会每 6 小时检查并自动下载。</span>
              </div>
            </el-form-item>
            <el-form-item label="版本状态">
              <div class="update-settings">
                <div class="update-version-row">
                  <el-tag>当前 v{{ updateState.currentVersion || '未知' }}</el-tag>
                  <el-tag v-if="updateState.availableVersion" type="success">可用 v{{ updateState.availableVersion }}</el-tag>
                  <span>{{ updateStatusText }}</span>
                </div>
                <span v-if="updateState.releaseDate" class="hint-text">发布时间：{{ formatUpdateDate(updateState.releaseDate) }}</span>
                <el-alert
                  v-if="!updateState.supported"
                  title="开发版不连接真实更新源，请使用模拟 updater 运行测试。"
                  type="info"
                  :closable="false"
                  show-icon
                />
                <el-alert
                  v-if="updateState.error"
                  :title="updateState.error"
                  type="error"
                  :closable="false"
                  show-icon
                />
                <el-progress
                  v-if="updateState.status === 'downloading' || updateState.status === 'downloaded'"
                  :percentage="Math.round(updateState.progress?.percent || 0)"
                  :status="updateState.status === 'downloaded' ? 'success' : undefined"
                />
                <span v-if="updateState.status === 'downloading'" class="hint-text">
                  {{ formatUpdateBytes(updateState.progress?.transferred) }} / {{ formatUpdateBytes(updateState.progress?.total) }}
                </span>
                <div class="update-actions">
                  <el-button
                    :loading="updateState.status === 'checking'"
                    :disabled="!updateState.supported || updateBusy"
                    @click="handleCheckUpdate"
                  >立即检查</el-button>
                  <el-button
                    v-if="updateState.status === 'available'"
                    type="primary"
                    @click="handleDownloadUpdate"
                  >下载更新</el-button>
                  <el-button
                    v-if="updateState.status === 'downloaded'"
                    type="success"
                    @click="handleInstallUpdate"
                  >立即安装</el-button>
                </div>
              </div>
            </el-form-item>
            <el-form-item v-if="updateState.releaseNotes" label="发布说明">
              <ReleaseNotesContent class="update-release-notes" :source="updateState.releaseNotes" />
            </el-form-item>
          </el-form>
        </el-card>

        <div class="section-header">
          <h3 class="section-title">Client.txt 事件中心</h3>
        </div>
        <el-card class="section-card">
          <el-form label-width="120px" label-position="left">
            <el-form-item label="启用读取">
              <el-switch :model-value="clientEvents.enabled" @change="handleClientEventsEnabled" />
              <span class="hint-text">默认关闭；开启后只读取新增日志并在内存中保留最近 50 条脱敏事件。</span>
            </el-form-item>
            <el-form-item label="日志文件">
              <div class="update-settings">
                <span class="hint-text" :title="clientEvents.logPath">{{ clientEvents.logPath || '尚未检测到 Client.txt' }}</span>
                <el-button @click="handleSelectClientLog">选择 Client.txt</el-button>
              </div>
            </el-form-item>
            <el-form-item label="连接状态">
              <el-tag :type="clientEvents.state === 'started' ? 'success' : clientEvents.state === 'error' ? 'danger' : 'info'">{{ clientEventStateText }}</el-tag>
              <el-tag>{{ clientGameStateText }}</el-tag>
              <span v-if="clientEvents.error" class="hint-text">{{ clientEvents.error }}</span>
            </el-form-item>
            <el-form-item label="最近事件">
              <el-table :data="clientEvents.events" max-height="240" empty-text="尚无新增事件" style="width:100%">
                <el-table-column prop="sequence" label="#" width="60" />
                <el-table-column prop="receivedAt" label="接收时间" width="190" />
                <el-table-column label="事件">
                  <template #default="scope">{{ formatClientEvent(scope.row) }}</template>
                </el-table-column>
              </el-table>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 系统设置 -->
        <div class="section-header">
          <h3 class="section-title">系统设置</h3>
        </div>
        <el-card class="section-card">
          <el-form label-width="120px" label-position="left">
            <el-form-item label="关闭主窗口时">
              <div class="update-settings">
                <el-radio-group :model-value="settingsStore.windowCloseBehavior" @change="handleWindowCloseBehaviorChange">
                  <el-radio-button value="exit">彻底退出</el-radio-button>
                  <el-radio-button value="tray">最小化到系统托盘</el-radio-button>
                </el-radio-group>
                <span class="hint-text">最小化到托盘后，后台快捷键、自动化和游戏浮窗会继续运行；单击托盘图标可恢复主窗口。</span>
              </div>
            </el-form-item>
            <el-form-item label="游戏窗口名称">
              <GameWindowTitleSettings />
            </el-form-item>
            <el-form-item label="屏幕DPI缩放">
              <div class="dpi-settings">
                <el-radio-group :model-value="settingsStore.dpiMode" @change="handleDpiModeChange">
                  <el-radio-button value="auto">自动识别</el-radio-button>
                  <el-radio-button value="manual">手动设置</el-radio-button>
                </el-radio-group>
                <div v-if="settingsStore.dpiMode === 'auto'" class="dpi-input">
                  <el-tag :type="settingsStore.dpiDetectionStatus === 'success' ? 'success' : 'info'">
                    {{ Math.round(settingsStore.dpiScale * 100) }}% · {{ getDpiSourceText() }}
                  </el-tag>
                  <el-button
                    :icon="Refresh"
                    :loading="settingsStore.dpiDetectionStatus === 'detecting'"
                    @click="handleRefreshDpi"
                  >重新识别</el-button>
                </div>
                <div v-else class="dpi-input">
                <el-input-number
                  v-model="manualDpiScale"
                  :min="1.0"
                  :max="3.0"
                  :step="0.25"
                  :precision="2"
                  controls-position="right"
                  style="width: 120px"
                  @change="handleDpiScaleChange"
                />
                  <span class="hint-text">例如 Windows 150% 缩放填写 1.5</span>
                </div>
                <span v-if="settingsStore.dpiMode === 'auto'" class="hint-text">
                  {{ getDpiStatusText() }}
                </span>
              </div>
            </el-form-item>
            <el-form-item label="调试模式">
              <div class="dpi-input">
                <el-switch
                  v-model="debugMode"
                  active-text="显示控制台"
                  inactive-text="关闭"
                  @change="handleDebugModeChange"
                />
                <span class="hint-text">显示应用的 Chromium DevTools Console 调试面板</span>
              </div>
            </el-form-item>
          </el-form>
        </el-card>

        <div class="section-header">
          <h3 class="section-title">配置迁移</h3>
        </div>
        <el-card class="section-card config-transfer-section-card">
          <ConfigTransferCard />
        </el-card>
        </div>

        <div v-show="activeTab === 'automation'" class="settings-tab-panel settings-panel settings-panel--automation">
        <!-- 操作延迟 -->
        <div class="section-header">
          <h3 class="section-title">操作延迟</h3>
        </div>
        <el-card class="section-card">
          <el-form label-width="180px" label-position="left">
            <el-form-item class="spaced-field">
              <template #label>
                <span class="label-with-help">
                  自动操作等待
                  <el-tooltip :content="TIMING_FIELD_HELP.operationDelayMs" placement="top" popper-class="timing-help-tooltip">
                    <el-icon class="help-icon timing-help-trigger" tabindex="0" aria-label="自动操作等待说明"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-input-number
                v-model="operationDelayMs"
                :step="10"
                controls-position="right"
                style="width: 240px"
                @change="handleOperationDelayChange"
              >
                <template #suffix>ms</template>
              </el-input-number>
              <div class="hint-text">所有游戏自动化移动鼠标后的真实悬停稳定时间</div>
            </el-form-item>
            <el-divider />
            <h4 class="section-title">物理输入时序</h4>
            <el-form-item
              v-for="field in PHYSICAL_TIMING_FIELDS"
              :key="field.key"
            >
              <template #label>
                <span class="label-with-help">
                  {{ field.label }}
                  <el-tooltip :content="field.help" placement="top" popper-class="timing-help-tooltip">
                    <el-icon class="help-icon timing-help-trigger" tabindex="0" :aria-label="`${field.label}说明`"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-input-number
                v-model="fixedTiming[field.key]"
                :step="10"
                controls-position="right"
                style="width: 240px"
                @change="handleFixedTimingChange(field.key, $event)"
              >
                <template #suffix>ms</template>
              </el-input-number>
            </el-form-item>
            <div class="hint-text">组合键、按键、鼠标按钮和释放时序始终生效</div>
            <el-divider />
            <h4 class="section-title">固定结果等待</h4>
            <el-form-item
              v-for="field in RESULT_TIMING_FIELDS"
              :key="field.key"
            >
              <template #label>
                <span class="label-with-help">
                  {{ field.label }}
                  <el-tooltip :content="field.help" placement="top" popper-class="timing-help-tooltip">
                    <el-icon class="help-icon timing-help-trigger" tabindex="0" :aria-label="`${field.label}说明`"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-input-number
                v-model="fixedTiming[field.key]"
                :step="10"
                controls-position="right"
                style="width: 240px"
                @change="handleFixedTimingChange(field.key, $event)"
              >
                <template #suffix>ms</template>
              </el-input-number>
            </el-form-item>
            <div class="hint-text">剪贴板、页签、存仓和画面验证始终使用这里的固定值</div>
          </el-form>
        </el-card>
        </div>

        <div v-show="activeTab === 'overlay'" class="settings-tab-panel settings-panel settings-panel--overlay">
        <!-- 覆盖层设置 -->
        <div class="section-header">
          <h3 class="section-title">覆盖层设置</h3>
        </div>
        <el-card class="section-card">
          <el-row class="app-grid" :gutter="16">
            <el-col :span="12">
              <el-form :model="overlaySettings" label-width="120px" label-position="left">
                <el-form-item label="背景模式">
                  <el-radio-group v-model="overlaySettings.backgroundMode" @change="handleBackgroundModeChange">
                    <el-radio-button value="default">默认背景</el-radio-button>
                    <el-radio-button value="none">无背景</el-radio-button>
                    <el-radio-button value="custom">自定义背景</el-radio-button>
                  </el-radio-group>
                </el-form-item>

                <el-form-item v-if="overlaySettings.backgroundMode === 'custom'" label="背景文件">
                  <div
                    class="background-drop-zone"
                    :class="{ 'is-dragging': isBackgroundDragging }"
                    role="button"
                    tabindex="0"
                    @click="handleSelectFile"
                    @keydown.enter.prevent="handleSelectFile"
                    @keydown.space.prevent="handleSelectFile"
                    @dragenter.prevent="isBackgroundDragging = true"
                    @dragover.prevent="isBackgroundDragging = true"
                    @dragleave.prevent="handleBackgroundDragLeave"
                    @drop.prevent="handleBackgroundDrop"
                  >
                    <el-icon class="drop-icon"><UploadFilled /></el-icon>
                    <strong>拖拽图片或视频到此处</strong>
                    <span>或点击选择文件</span>
                    <small v-if="overlaySettings.backgroundPath" :title="overlaySettings.backgroundPath">
                      {{ overlaySettings.backgroundPath }}
                    </small>
                  </div>
                </el-form-item>

                <el-form-item label="背景模糊">
                  <el-slider 
                    v-model="overlaySettings.blur" 
                    :min="0" 
                    :max="20" 
                    placement="top"
                    @change="handleOverlaySettingsChange" 
                  />
                </el-form-item>

                <el-form-item label="遮罩透明度">
                  <el-slider 
                    v-model="overlaySettings.maskOpacity" 
                    :min="0" 
                    :max="1" 
                    :step="0.1" 
                    placement="top"
                    @change="handleOverlaySettingsChange" 
                  />
                </el-form-item>
              </el-form>

              <!-- 历史记录 -->
              <div
                v-if="overlaySettings.backgroundMode === 'custom' && backgroundHistory.length > 0"
                class="history-section"
              >
                <h4 class="history-title">历史背景</h4>
                <div class="history-grid">
                  <div 
                    v-for="(item, index) in backgroundHistory" 
                    :key="index" 
                    class="history-item"
                    :class="{ active: overlaySettings.backgroundMode === 'custom' && item.path === overlaySettings.backgroundPath }"
                    @click="applyHistory(item)"
                  >
                    <!-- 根据文件扩展名来决定显示视频还是图片 -->
                    <video 
                      v-if="isVideo(item.path)" 
                      :src="formatFilePath(item.path)" 
                      class="history-thumb" 
                      muted 
                    ></video>
                    <img 
                      v-else 
                      :src="formatFilePath(item.path)" 
                      class="history-thumb" 
                      @error="handleImageError"
                    />
                    <div class="delete-btn" @click.stop="removeHistory(index)">
                      <el-icon><Close /></el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="12">
               <!-- 预览区域 -->
               <div class="preview-container">
                 <div class="preview-label">
                   效果预览 
                   <el-button link type="primary" size="small" @click="refreshPreview">刷新物品</el-button>
                 </div>
                 <div class="preview-box business-overlay-theme">
                    <OverlayContent 
                      :item-info="previewItem"
                      :settings="overlaySettings"
                      :is-completed="false"
                    />
                 </div>
               </div>
            </el-col>
          </el-row>
        </el-card>

        <el-card class="section-card price-check-preview-card">
          <template #header>
            <div class="price-check-preview-header">
              <div>
                <strong>查价弹窗预览</strong>
                <small>用于排查布局、主题和筛选交互；不展示真实挂单结果，修改不会保存或影响真实查价器。</small>
              </div>
              <el-button size="small" @click="resetPriceCheckPreview">重置预览</el-button>
            </div>
          </template>
          <div class="price-check-preview-shell business-overlay-theme">
            <PriceCheckOverlayView
              :key="priceCheckPreviewKey"
              preview-mode
              :preview-state="priceCheckPreview.state"
              :preview-options="priceCheckPreview.options"
            />
          </div>
        </el-card>
        </div>
        <div v-show="activeTab === 'feedback'" class="settings-tab-panel settings-panel settings-panel--feedback">
          <FeedbackSettings />
        </div>

        <div v-show="activeTab === 'about'" class="settings-tab-panel settings-panel settings-panel--about">
          <div class="section-header">
            <h3 class="section-title">关于流放助手</h3>
          </div>
          <div class="about-version-card">
            <div><small>当前版本</small><strong>V{{ packageConfig.version }}</strong></div>
            <a :href="PROJECT_URL" target="_blank" rel="noreferrer">查看 GitHub 项目<el-icon><TopRight /></el-icon></a>
          </div>
          <HelpTopicList :topics="aboutTopics" />
        </div>
      </div>
    </el-scrollbar>

    <PageHelpDrawer :topics="helpTopics" />
  </div>
</template>

<script setup>
import { mapLabel } from '../../../shared/mapTrackerLabels.js'
import { classifyArea } from '../../../shared/mapTrackerAreaCatalog.js'
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { Refresh, Close, UploadFilled, QuestionFilled, TopRight } from '@element-plus/icons-vue'
import PageHelpDrawer from '@/domains/help/PageHelpDrawer.vue'
import HelpTopicList from '@/domains/help/HelpTopicList.vue'
import { FAQ_TOPICS, GENERAL_TOPICS, moduleHelpTopicsById } from '@/domains/help/helpContent.js'
import { useSettingsStore } from './settingsStore'
import { useBagStore } from '@/stores/bag'
import { CURRENCY_NAMES } from '../../utils/constants'
import { FIXED_TIMING } from '../../utils/operationDelay'
import { EMPTY_SLOT_THRESHOLD, deriveInventoryGridFromRegion } from '../../utils/inventorySettings'
import { DEFAULT_GLOBAL_SHORTCUTS } from '../../utils/shortcutConfig'
import { commitGlobalShortcut, updateShortcuts } from '../../utils/scriptService'
import { electronApi } from '@/api/electron'
import OverlayContent from '@/domains/overlay/components/OverlayContent.vue'
import PriceCheckOverlayView from '@/domains/priceCheck/PriceCheckOverlayView.vue'
import { createPriceCheckPreview } from '@/domains/priceCheck/priceCheckPreview.js'
import { generateRandomItem } from '@/utils/mockItem'
import KeyCaptureInput from '@/components/common/KeyCaptureInput.vue'
import ReleaseNotesContent from '@/components/common/ReleaseNotesContent.vue'
import CoordinateConfigurationField from '@/components/configuration/CoordinateConfigurationField.vue'
import InventoryGridConfigurationField from '@/components/configuration/InventoryGridConfigurationField.vue'
import AccountLeagueConfigurationField from '@/components/configuration/AccountLeagueConfigurationField.vue'
import InterfaceDetectionSettings from './InterfaceDetectionSettings.vue'
import StashTabSelectionSettings from './StashTabSelectionSettings.vue'
import GameWindowTitleSettings from './GameWindowTitleSettings.vue'
import ConfigTransferCard from './configTransfer/ConfigTransferCard.vue'
import FeedbackSettings from './FeedbackSettings.vue'
import { useFeedbackRepliesStore } from '@/stores/feedbackReplies'
import { useInterfaceDetectionStore } from '@/stores/interfaceDetection'
import { useChaosRecipeStore } from '@/stores/chaosRecipe'
import { usePriceCheckStore } from '@/stores/priceCheck'
import { useApplicationUpdateStore } from '@/stores/applicationUpdate'
import { updateBagRuntimeConfig } from '@/utils/bagService'
import { readPersistentTab, writePersistentTab } from '@/utils/tabPersistence'
import { SETTINGS_TABS, resolveSettingsTab } from '@/router/settingsNavigation'
import { OVERLAY_BACKGROUND_MODES, resolveOverlayBackgroundDrop } from '../../../shared/overlayBackground.js'
import { resetApplicationSettings } from './settingsReset.js'
import packageConfig from '../../../package.json'

const PROJECT_URL = 'https://github.com/szb-66/POE-TOOL-MX'
const aboutTopics = GENERAL_TOPICS.filter(topic => topic.category === 'about')
const helpTopics = [...moduleHelpTopicsById('settings'), ...FAQ_TOPICS]

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()
const bagStore = useBagStore()
const interfaceDetectionStore = useInterfaceDetectionStore()
const chaosRecipeStore = useChaosRecipeStore()
const priceCheckStore = usePriceCheckStore()
const feedbackRepliesStore = useFeedbackRepliesStore()
const applicationUpdate = useApplicationUpdateStore()
const { state: updateState, busy: updateBusy } = storeToRefs(applicationUpdate)
const SETTINGS_TAB_STORAGE_KEY = 'settings.activeTab'
const activeTab = ref(readPersistentTab(SETTINGS_TAB_STORAGE_KEY, SETTINGS_TABS, 'general'))
const settingsScrollbar = ref(null)
const clientEvents = ref({ enabled: false, logPath: '', state: 'stopped', error: '', events: [] })
let disposeClientEvents = null
const clientEventStateText = computed(() => ({ started: '监听中', waiting: '等待文件', resyncing: '正在重新同步', stopped: '已停止', error: '读取错误' })[clientEvents.value.state] || '未知')
const clientGameStateText = computed(() => ({ 'in-game': '游戏已进入区域', loading: '游戏加载中', disconnected: '游戏已断开', unknown: '游戏状态未知' })[clientEvents.value.gameState] || '游戏状态未知')

const shortcutFields = Object.freeze([
  { key: 'itemStart', label: '制作开始' },
  { key: 'mapStart', label: '地图开始' },
  { key: 'end', label: '全局紧急停止' },
  { key: 'portal', label: '一键回城' },
  { key: 'storyPrevious', label: '剧情上一步' },
  { key: 'storyNext', label: '剧情下一步' },
  { key: 'priceCheck', label: '国服查价' },
])
const shortcuts = ref({ ...settingsStore.globalShortcuts })
const shortcutScopeEnabled = ref(settingsStore.shortcutScopeEnabled)
const positions = ref({ ...settingsStore.currencyPositions })
const inventory = ref({ ...settingsStore.inventory })
const operationDelayMs = ref(settingsStore.operationDelayMs)
const fixedTiming = ref({ ...settingsStore.fixedTiming })
const manualDpiScale = ref(settingsStore.manualDpiScale || 1.0)
const debugMode = ref(settingsStore.debugMode)
const overlaySettings = ref({ ...settingsStore.overlaySettings })
const backgroundHistory = ref([...settingsStore.backgroundHistory])
const bagAutoStashEnabled = ref(bagStore.moduleEnabled)
const coordinatePickingTarget = ref('')
const bagGridPicking = ref(false)
const isBackgroundDragging = ref(false)
const priceCheckPreview = ref(createPriceCheckPreview())
const priceCheckPreviewKey = ref(0)
const updateMode = ref(settingsStore.updateMode)
const updateSource = ref(settingsStore.updateSource)
const updateStatusText = computed(() => ({
  idle: '等待检查',
  checking: '正在检查更新…',
  available: '发现新版本',
  'not-available': '当前已是最新版本',
  downloading: '正在下载更新…',
  downloaded: '更新已就绪，等待安装',
  installing: '正在准备静默安装…',
  error: '更新操作失败'
})[updateState.value.status] || '等待检查')
function handleTabChange(tab) {
  const nextTab = writePersistentTab(SETTINGS_TAB_STORAGE_KEY, tab, SETTINGS_TABS, 'general')
  activeTab.value = nextTab
  if (resolveSettingsTab(route.query.tab) !== nextTab) {
    void router.replace({ path: route.path, query: { ...route.query, tab: nextTab }, hash: route.hash })
  }
  settingsScrollbar.value?.setScrollTop(0)
}

watch(() => route.query.tab, (tab) => {
  const requestedTab = resolveSettingsTab(tab)
  if (!requestedTab || requestedTab === activeTab.value) return
  activeTab.value = writePersistentTab(
    SETTINGS_TAB_STORAGE_KEY,
    requestedTab,
    SETTINGS_TABS,
    'general'
  )
  settingsScrollbar.value?.setScrollTop(0)
}, { immediate: true })

onMounted(async () => {
  window.addEventListener('dragover', preventBackgroundFileNavigation)
  window.addEventListener('drop', preventBackgroundFileNavigation)
  disposeClientEvents = electronApi.clientEvents.onSnapshot((snapshot) => { clientEvents.value = snapshot })
  const response = await electronApi.clientEvents.getStatus()
  if (response?.success) clientEvents.value = response.data
})

onBeforeUnmount(() => {
  window.removeEventListener('dragover', preventBackgroundFileNavigation)
  window.removeEventListener('drop', preventBackgroundFileNavigation)
  disposeClientEvents?.()
})

async function handleClientEventsEnabled(enabled) {
  const result = await electronApi.clientEvents.updateSettings({ enabled })
  if (result?.success) clientEvents.value = result.data
  else ElMessage.error(result?.error?.message || '事件中心设置失败')
}

async function handleSelectClientLog() {
  const result = await electronApi.clientEvents.selectLogFile()
  if (result?.success) clientEvents.value = result.data
  else ElMessage.error(result?.error?.message || '选择 Client.txt 失败')
}

function formatClientEvent(event) {
  if (event.type === 'game-state') return ({ 'in-game': '游戏已进入区域', loading: '游戏加载中', disconnected: '游戏已断开', unknown: '游戏状态未知' })[event.state] || '游戏状态未知'
  if (event.type === 'area-entered') return `进入 ${mapLabel(event.areaId)} · 区域等级 ${event.areaLevel}${event.mapTier && classifyArea(event.areaId).type === 'map' ? ` · 地图 T${event.mapTier}` : ''}`
  if (event.type === 'character-level') return `角色升至 ${event.level} 级`
  return `客户端：${({ started: '监听中', waiting: '等待', resyncing: '重新同步', stopped: '停止', error: '错误' })[event.state] || event.state}`
}

// 监听store变化，同步到本地ref（使用 immediate: false 避免初始化时触发）
watch(() => settingsStore.globalShortcuts, (val) => {
  shortcuts.value = { ...val }
}, { deep: true })
watch(() => settingsStore.shortcutScopeEnabled, (val) => {
  shortcutScopeEnabled.value = val
})
watch(() => settingsStore.currencyPositions, (val) => {
  positions.value = { ...val }
}, { deep: true })
watch(() => settingsStore.inventory, (val) => {
  inventory.value = { ...val }
}, { deep: true })
watch(() => settingsStore.operationDelayMs, (val) => {
  operationDelayMs.value = val
})
watch(() => settingsStore.fixedTiming, (val) => {
  fixedTiming.value = { ...val }
}, { deep: true })
watch(() => settingsStore.manualDpiScale, (val) => {
  manualDpiScale.value = val
})
watch(() => settingsStore.debugMode, (val) => {
  debugMode.value = val
})
watch(() => settingsStore.updateMode, (val) => {
  updateMode.value = val
})
watch(() => settingsStore.updateSource, (val) => {
  updateSource.value = val
})
watch(() => settingsStore.overlaySettings, (val) => {
  overlaySettings.value = { ...val }
}, { deep: true })
watch(() => settingsStore.backgroundHistory, (val) => {
  backgroundHistory.value = [...val]
}, { deep: true })
watch(() => bagStore.moduleEnabled, (val) => {
  bagAutoStashEnabled.value = val
})

function getCurrencyName(key) {
  return CURRENCY_NAMES[key] || key
}

function handleBagAutoStashToggle(enabled) {
  bagStore.setModuleEnabled(enabled)
  if (enabled) {
    ElMessage.success('一键入库功能已启用，请前往“存取”页面进行配置')
  } else {
    ElMessage.info('一键入库功能已关闭')
  }
}

async function handleShortcutsChange(key, value) {
  try {
    const saved = await commitGlobalShortcut(key, value)
    ElMessage.success(saved ? '快捷键已保存并注册' : '快捷键已清空')
  } catch (error) {
    shortcuts.value = { ...settingsStore.globalShortcuts }
    ElMessage.error(error.message)
  }
}

async function handleShortcutScopeToggle(enabled) {
  const result = await settingsStore.setShortcutScopeEnabled(enabled)
  if (result?.success === false) {
    ElMessage.error(result.error || '更新快捷键生效范围失败')
    shortcutScopeEnabled.value = settingsStore.shortcutScopeEnabled
    return
  }
  ElMessage.success(enabled ? '快捷键已限制为游戏窗口前台生效' : '快捷键已改为全局生效')
}

function handlePositionChange(currency) {
  settingsStore.updateCurrencyPosition(currency, {
    x: positions.value[currency].x,
    y: positions.value[currency].y
  })
}

function updateCurrencyPositionDraft(currency, point) {
  positions.value[currency] = point
  handlePositionChange(currency)
}

async function handleInventoryChange() {
  const candidate = {
    ...settingsStore.inventory,
    startPos: { ...inventory.value.startPos },
    slotSize: { ...inventory.value.slotSize }
  }
  const result = await updateBagRuntimeConfig({ inventory: candidate })
  if (!result.success) {
    inventory.value = JSON.parse(JSON.stringify(settingsStore.inventory))
    ElMessage.error(result.error)
  }
}

async function handleEmptySlotThresholdChange(value) {
  const result = await updateBagRuntimeConfig({ inventory: { ...settingsStore.inventory, emptySlotThreshold: value } })
  inventory.value.emptySlotThreshold = settingsStore.inventory.emptySlotThreshold
  if (!result.success) ElMessage.error(result.error)
}

async function handlePickCurrencyCoordinate(currency) {
  if (coordinatePickingTarget.value) return

  coordinatePickingTarget.value = `currency:${currency}`
  try {
    const result = await electronApi.window.pickScreenCoordinate()
    if (!result || result.canceled) return
    if (result.success === false) throw new Error(result.error?.message || '坐标选取失败')

    const point = { x: result.x, y: result.y }
    positions.value[currency] = point
    handlePositionChange(currency)
    ElMessage.success(`已选取坐标 (${point.x}, ${point.y})`)
  } catch (error) {
    ElMessage.error('选取坐标失败')
  } finally {
    coordinatePickingTarget.value = ''
  }
}

async function handlePickBagGrid() {
  if (bagGridPicking.value) return
  bagGridPicking.value = true
  try {
    const result = await electronApi.window.pickScreenRegion({
      purpose: 'bag-inventory',
      minimumSize: { width: 240, height: 100 }
    })
    if (!result || result.canceled) return
    if (result.success === false) throw new Error(result.error?.message || '框选背包网格失败')
    const grid = deriveInventoryGridFromRegion(result.selectedRegion)
    if (!grid) {
      ElMessage.error('选区无法换算背包网格，请重新框选')
      return
    }
    inventory.value = { ...inventory.value, startPos: grid.startPos, slotSize: grid.slotSize }
    await handleInventoryChange()
    ElMessage.success(`已框选背包网格：首格 (${grid.startPos.x}, ${grid.startPos.y})，单格 ${grid.slotSize.w}×${grid.slotSize.h}`)
  } catch (error) {
    ElMessage.error(error.message || '框选背包网格失败')
  } finally {
    bagGridPicking.value = false
  }
}

function handleDpiScaleChange() {
  settingsStore.updateManualDpiScale(manualDpiScale.value)
}

async function handleDpiModeChange(mode) {
  settingsStore.updateDpiMode(mode)
  if (mode === 'auto') await handleRefreshDpi()
}

function getDpiSourceText() {
  return {
    game: '游戏窗口',
    history: '上次识别值',
    primary: '主屏倍率',
    manual: '手动设置'
  }[settingsStore.dpiSource] || '等待识别'
}

function getDpiStatusText() {
  if (settingsStore.dpiDetectionStatus === 'detecting') return '正在识别《流放之路》窗口所在显示器…'
  if (settingsStore.dpiDetectionStatus === 'success') {
    return settingsStore.dpiWindowTitle ? `已从“${settingsStore.dpiWindowTitle}”识别` : '已识别游戏窗口 DPI'
  }
  if (settingsStore.dpiDetectionStatus === 'error') {
    return `${settingsStore.dpiDetectionError}，当前使用${getDpiSourceText()}`
  }
  return `当前使用${getDpiSourceText()}，应用启动后会自动识别`
}

async function handleRefreshDpi() {
  const result = await settingsStore.refreshDpiScale()
  if (result.success) ElMessage.success(`已识别游戏 DPI：${Math.round(result.scaleFactor * 100)}%`)
  else ElMessage.warning(`${result.error}，继续使用${getDpiSourceText()} ${result.scaleFactor}`)
}

async function handleDebugModeChange(enabled) {
  settingsStore.updateDebugMode(enabled)
  try {
    const result = await electronApi.window.setDevToolsVisible(enabled)
    if (result && typeof result.visible === 'boolean') {
      settingsStore.updateDebugMode(result.visible)
    }
  } catch (error) {
    debugMode.value = settingsStore.debugMode
    ElMessage.error('切换调试模式失败')
  }
}

async function handleUpdateModeChange(mode) {
  const result = await settingsStore.updateApplicationUpdateMode(mode)
  updateMode.value = settingsStore.updateMode
  if (!result.success) ElMessage.error(result.error)
  else applicationUpdate.applyState({ ...(result.state || {}), mode: settingsStore.updateMode })
}

async function handleUpdateSourceChange(source) {
  const result = await settingsStore.updateApplicationUpdateSource(source)
  updateSource.value = settingsStore.updateSource
  if (!result.success) ElMessage.error(result.error)
  else applicationUpdate.applyState({ ...(result.state || {}), source: settingsStore.updateSource })
}

async function handleCheckUpdate() {
  const result = await applicationUpdate.check()
  if (result?.busy) ElMessage.info('更新操作正在进行')
}

async function handleDownloadUpdate() {
  const result = await applicationUpdate.download()
  if (result?.busy) ElMessage.info('更新操作正在进行')
}

async function handleInstallUpdate() {
  try {
    const result = await applicationUpdate.install()
    if (!result?.success) {
      const fallback = {
        'install-in-progress': '更新安装正在进行',
        'update-not-downloaded': '更新尚未下载完成',
        'update-record-failed': '更新内容保存失败，未开始安装',
        'cleanup-timeout': '安装前清理超时，应用将安全退出',
        'cleanup-failed': '安装前清理失败，应用将安全退出'
      }[result?.reason] || '更新安装失败'
      ElMessage.error(result?.reason ? fallback : (result?.state?.error || fallback))
    }
  } catch (error) {
    ElMessage.error(error?.message || '更新安装失败')
  }
}

function formatUpdateDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value || '') : date.toLocaleString('zh-CN')
}

function formatUpdateBytes(value) {
  const bytes = Number(value) || 0
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

async function handleOperationDelayChange(value) {
  const result = await settingsStore.updateOperationDelay(value)
  operationDelayMs.value = settingsStore.operationDelayMs
  if (!result.success) ElMessage.error(result.error)
}

async function handleWindowCloseBehaviorChange(behavior) {
  const result = await settingsStore.updateWindowCloseBehavior(behavior)
  if (!result.success) ElMessage.error(result.error)
}

async function handleFixedTimingChange(key, value) {
  const result = await settingsStore.updateFixedTiming({ [key]: value })
  fixedTiming.value = { ...settingsStore.fixedTiming }
  if (!result?.success) ElMessage.error(result?.error)
}

const TIMING_FIELD_LABELS = {
  modifierSettleMs: '组合键稳定',
  keyHoldMs: '按键保持',
  buttonHoldMs: '鼠标点击保持',
  releaseSettleMs: '释放后稳定',
  clipboardConfirmMs: '剪贴板/空格确认',
  stashTabSettleMs: '选仓后生效等待',
  stashSettleMs: '存仓后生效等待',
  patchVerifyMs: '画面变化验证等待'
}
const TIMING_FIELD_HELP = {
  operationDelayMs: '所有游戏自动化把鼠标移动到目标后，到复制、点击或滚动等依赖悬停动作开始前的稳定等待。',
  modifierSettleMs: 'Ctrl、Shift、Alt 等组合键按下后，到配合的普通键或鼠标动作开始前的等待，用于复制、批量存取等组合输入。',
  keyHoldMs: '普通键按下到释放之间的保持时间，用于复制、旋转及其他键盘输入。',
  buttonHoldMs: '鼠标按钮按下到释放之间的保持时间，用于制作、存取、旋转和放置等左右键点击。',
  releaseSettleMs: '键盘键或鼠标按钮释放后，到下一次输入或结果处理前的稳定等待，用于全部连续输入链路。',
  clipboardConfirmMs: '发送复制或触发目标格状态变化后，到读取剪贴板或确认空格状态前的等待，用于物品读取、来源复核和格位确认。',
  stashTabSettleMs: '选择或切换仓库页签后，到读取页签内容或继续点击前的等待，用于仓库取件、商城配方和页签选择。',
  stashSettleMs: '点击存仓后，到确认物品已转移或处理下一格前的等待，用于背包入库及相关存仓流程。',
  patchVerifyMs: '执行会改变画面的动作后，到截图、OCR、验证变化或继续下一步前的等待，用于制作、地图、海图和自动放置验证。'
}
const PHYSICAL_TIMING_KEYS = new Set(['modifierSettleMs', 'keyHoldMs', 'buttonHoldMs', 'releaseSettleMs'])
const TIMING_FIELDS = Object.keys(FIXED_TIMING.fields).map((key) => ({
  key,
  label: TIMING_FIELD_LABELS[key],
  help: TIMING_FIELD_HELP[key]
}))
const PHYSICAL_TIMING_FIELDS = TIMING_FIELDS.filter(field => PHYSICAL_TIMING_KEYS.has(field.key))
const RESULT_TIMING_FIELDS = TIMING_FIELDS.filter(field => !PHYSICAL_TIMING_KEYS.has(field.key))

function isVideo(path) {
  if (!path) return false
  const ext = path.split('.').pop().toLowerCase()
  return ['mp4', 'webm', 'ogg', 'mov'].includes(ext)
}

// 格式化文件路径用于显示（转换为 file:// URL）
function formatFilePath(filePath) {
  if (!filePath) return ''
  // 如果已经是 URL，直接返回
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('file://')) {
    return filePath
  }
  // 处理 Windows 路径
  const normalizedPath = filePath.replace(/\\/g, '/')
  // 如果是绝对路径，添加 file:// 协议
  if (/^[A-Za-z]:/.test(normalizedPath)) {
    // Windows 绝对路径
    return `file:///${normalizedPath}`
  } else if (normalizedPath.startsWith('/')) {
    // Unix 绝对路径
    return `file://${normalizedPath}`
  }
  return filePath
}

function handleOverlaySettingsChange() {
  if (settingsStore.updateOverlaySettings) {
    settingsStore.updateOverlaySettings(overlaySettings.value)
    overlaySettings.value = { ...settingsStore.overlaySettings }
  }
}

function preventBackgroundFileNavigation(event) {
  if (Array.from(event.dataTransfer?.types || []).includes('Files')) event.preventDefault()
}

function handleBackgroundModeChange(mode) {
  if (mode === OVERLAY_BACKGROUND_MODES.custom) {
    if (overlaySettings.value.backgroundPath) handleOverlaySettingsChange()
    return
  }
  overlaySettings.value.backgroundPath = ''
  handleOverlaySettingsChange()
}

function applyImportedBackground(result) {
  if (!result?.success || !result.filePath) {
    if (!result?.canceled) ElMessage.error(result?.error?.message || '导入背景失败')
    return false
  }
  overlaySettings.value.backgroundMode = OVERLAY_BACKGROUND_MODES.custom
  overlaySettings.value.backgroundPath = result.filePath
  handleOverlaySettingsChange()
  return true
}

async function handleSelectFile() {
  try {
    applyImportedBackground(await electronApi.overlay.selectBackground())
  } catch (error) {
    ElMessage.error('选择文件失败: ' + error.message)
  }
}

function handleBackgroundDragLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) isBackgroundDragging.value = false
}

async function handleBackgroundDrop(event) {
  isBackgroundDragging.value = false
  const drop = resolveOverlayBackgroundDrop(
    event.dataTransfer?.files,
    file => electronApi.overlay.getPathForFile(file)
  )
  if (!drop.success) {
    ElMessage.error(drop.error.message)
    return
  }

  try {
    applyImportedBackground(await electronApi.overlay.importBackground(drop.sourcePath))
  } catch (error) {
    ElMessage.error('拖拽导入失败: ' + error.message)
  }
}

// 历史记录操作
function applyHistory(item) {
  overlaySettings.value.backgroundMode = OVERLAY_BACKGROUND_MODES.custom
  overlaySettings.value.backgroundPath = item.path
  handleOverlaySettingsChange()
}

function removeHistory(index) {
  settingsStore.removeHistoryItem(index)
}

// 处理图片加载错误
function handleImageError(event) {
  // 可以设置一个默认占位图
  event.target.style.display = 'none'
}

// 预览相关
const previewItem = ref(generateRandomItem())
function refreshPreview() {
  previewItem.value = generateRandomItem()
}

function resetPriceCheckPreview() {
  priceCheckPreview.value = createPriceCheckPreview()
  priceCheckPreviewKey.value += 1
}

async function handleReset() {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有设置吗？设备相关坐标、区域和普通快捷键将清空，此操作不可恢复。',
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const resetResult = await resetApplicationSettings({
      stopAutomations: () => electronApi.emergencyStopAll(),
      syncShortcuts: () => updateShortcuts(DEFAULT_GLOBAL_SHORTCUTS),
      resetStoredSettings: () => settingsStore.resetSettings(),
      resetInterfaceDetection: () => interfaceDetectionStore.reset(),
      resetControlOverlayOffset: () => chaosRecipeStore.resetControlOverlayOffset(),
      syncPriceCheckShortcut: () => priceCheckStore.syncRuntime({ shortcut: DEFAULT_GLOBAL_SHORTCUTS.priceCheck })
    })

    // 同步本地 ref
    shortcuts.value = { ...settingsStore.globalShortcuts }
    positions.value = { ...settingsStore.currencyPositions }
    inventory.value = structuredClone(settingsStore.inventory)
    operationDelayMs.value = settingsStore.operationDelayMs
    manualDpiScale.value = settingsStore.manualDpiScale
    debugMode.value = settingsStore.debugMode
    updateMode.value = settingsStore.updateMode
    updateSource.value = settingsStore.updateSource
    overlaySettings.value = { ...settingsStore.overlaySettings }
    backgroundHistory.value = []

    if (resetResult.warnings.length) {
      const warningText = resetResult.warnings.map(item => item.message).filter(Boolean).join('；')
      ElMessage.warning(`设置已重置；${warningText || '部分后台能力恢复失败，可重启应用后重试'}`)
    } else {
      ElMessage.success('设置已重置，设备相关项已清空，紧急停止快捷键已重新注册')
    }
  } catch (error) {
    // 用户取消操作
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '重置设置失败')
    }
  }
}
</script>

<style scoped lang="less">
.settings-page {
  .settings-tab-bar {
    .action-buttons {
      order: 2;
      margin-left: auto;
    }

    .settings-tabs {
      order: 1;
    }

    .feedback-tab-label {
      display: inline-flex;
      align-items: center;
    }

    .feedback-unread-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      margin-left: 6px;
      border-radius: 50%;
      background: var(--el-color-danger);
    }
  }

  .settings-content {
    box-sizing: border-box;
    width: 100%;
    padding: 20px;

    .section-header {
      margin-bottom: var(--spacing-sm);
      padding-left: var(--spacing-xs);

      .section-title {
        font-size: var(--font-size-md);
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }
    }

    .section-card {
      margin-bottom: var(--spacing-lg);
    }

    .settings-panel { min-width: 0; }

    .label-with-help {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .help-icon {
      color: var(--text-secondary);
      cursor: help;
      outline: none;

      &:hover,
      &:focus-visible { color: var(--primary-color); }
    }

    :global(.timing-help-tooltip) {
      max-width: 420px;
      line-height: 1.6;
      white-space: normal;
    }

    .independent-short-fields { margin-bottom: 0; }

    .shortcut-scope-control {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px 10px;
      width: 100%;

      .hint-text { flex-basis: 100%; }
    }

    .spaced-field :deep(.el-form-item__content) { column-gap: 10px; }

    .timing-setting-row :deep(.el-form-item__content) {
      column-gap: 12px;
    }

    .position-input {
      display: flex;
      align-items: center;

      .pick-position-button {
        margin-left: 8px;
        flex: none;
      }
    }

    .bag-grid-picker {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .bag-grid-summary {
      color: var(--text-secondary);
      font-size: 13px;

      &.bag-grid-summary--empty {
        color: var(--text-placeholder, var(--text-secondary));
      }
    }

    .coordinate-picker {
      overflow: hidden;
      width: fit-content;
      border: 1px solid var(--border-base);
      border-radius: 6px;
      background: var(--bg-tertiary);
      transition: border-color .2s, box-shadow .2s;

      &:hover {
        border-color: var(--control-hover-border, var(--text-secondary));
      }

      &:focus-within {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 1px var(--primary-color);
      }

      :deep(.el-input__wrapper) {
        border-radius: 0;
        background: transparent;
        box-shadow: none !important;
      }

      .coordinate-number-input,
      .pick-position-button {
        margin: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
      }

      .coordinate-number-input + .coordinate-number-input,
      .pick-position-button {
        border-left: 1px solid var(--border-base);
      }

      .pick-position-button {
        width: 36px;
        height: 32px;
        padding: 0;

        &:hover,
        &:focus-visible {
          color: var(--primary-color);
          background: var(--surface-hover, var(--bg-secondary));
        }
      }
    }

    .currency-position-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 24px 28px;
    }

    .currency-position-item { min-width: 0; }
    .currency-position-item :deep(.el-form-item) { margin-bottom: 0; }
    .currency-position-item .coordinate-configuration-field {
      --coordinate-number-input-width: 68px;
    }
    
    .background-drop-zone {
      width: 100%;
      min-height: 116px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 14px;
      border: 2px dashed var(--border-base);
      border-radius: 8px;
      color: var(--text-secondary);
      cursor: pointer;
      text-align: center;
      transition: border-color .2s, background-color .2s;

      &:hover,
      &:focus-visible,
      &.is-dragging {
        outline: none;
        border-color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
      }

      .drop-icon {
        font-size: 28px;
        color: var(--el-color-primary);
      }

      strong {
        color: var(--text-primary);
      }

      small {
        width: 100%;
        margin-top: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    
    .history-section {
      margin-top: 20px;
      border-top: 1px solid var(--border-base);
      padding-top: 15px;
      
      .history-title {
        font-size: 14px;
        margin-bottom: 10px;
        color: var(--text-primary);
      }
      
      .history-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        
        .history-item {
          position: relative;
          width: 100%;
          padding-bottom: 100%; // 1:1 Aspect Ratio
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
          background-color: var(--bg-tertiary);
          
          &.active {
            border-color: var(--el-color-primary);
          }
          
          &:hover {
            .delete-btn {
              opacity: 1;
            }
          }
          
          .history-thumb {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .delete-btn {
            position: absolute;
            top: 2px;
            right: 2px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.2s;
            
            &:hover {
              background: rgba(255, 0, 0, 0.8);
            }
          }
        }
      }
    }
    
    .preview-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
      
      .preview-label {
        font-weight: bold;
        display: flex;
        gap: 10px;
        align-items: center;
      }
      
      .preview-box {
        width: 300px;
        height: 400px;
        border-radius: 8px;
        overflow: hidden;
      }
    }

    .price-check-preview-card { width: 100%; }

    .price-check-preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;

      > div {
        display: flex;
        min-width: 0;
        flex-direction: column;
        gap: 4px;
      }

      small {
        color: var(--text-secondary);
        font-weight: 400;
      }
    }

    .price-check-preview-shell {
      width: 100%;
      overflow: hidden;
      border-radius: var(--overlay-radius-md);
    }

    .hint-text {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .dpi-settings {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }

    .dpi-input {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .update-settings {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }

    .update-version-row,
    .update-actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    .update-release-notes {
      width: 100%;
      max-height: 240px;
      box-sizing: border-box;
      margin: 0;
      padding: 12px;
      overflow: auto;
      overflow-wrap: anywhere;
      border: 1px solid var(--border-base);
      border-radius: 6px;
      background: var(--bg-tertiary);
      color: var(--text-primary);
      font: inherit;
    }
  }

  :deep(.section-card) {
    box-shadow: none !important;
    border-radius: 8px !important;
    border: 1px solid var(--border-base) !important;
    background: var(--surface-1, var(--bg-primary));
    box-shadow: inset 0 1px rgba(255, 255, 255, .025) !important;
  }

  :deep(.el-form-item) {
    margin-bottom: 24px;
  }

  :deep(.el-card__body) {
    padding: 24px;
  }

  .settings-panel--automation :deep(.section-card .el-form > .el-form-item:last-child),
  .settings-panel--system :deep(.section-card .el-form > .el-form-item:last-child),
  .settings-panel--automation :deep(.section-card .el-form > .app-grid:last-child .el-form-item) {
    margin-bottom: 0;
  }
}

.settings-panel--about {
  .about-version-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 14px;
    padding: 17px 19px;
    border: 1px solid var(--border-base);
    border-radius: 11px;
    background: var(--surface-1, var(--bg-primary));

    div { display: grid; gap: 3px; }
    small { color: var(--text-secondary); }
    strong { font-size: 20px; }
    a { display: flex; align-items: center; gap: 5px; color: var(--el-color-primary); text-decoration: none; }
  }
}

@media (max-width: 1100px) {
  .settings-page .currency-position-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 760px) {
  .settings-page {
    .settings-content { padding: 15px; }
    .currency-position-grid { grid-template-columns: 1fr; }
    .settings-tab-bar { padding: 0 12px; gap: 8px; }
    :deep(.el-card__body) { padding: 18px; }
  }
}
</style>
