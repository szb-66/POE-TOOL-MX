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
          <el-tab-pane label="问题反馈" name="feedback" />
      </el-tabs>
    </div>
    <el-scrollbar ref="settingsScrollbar" class="primary-page__scroll">
      <div class="settings-content primary-page__content">

        <div v-show="activeTab === 'general'" class="settings-tab-panel settings-panel settings-panel--general">
        <div class="section-header">
          <h3 class="section-title">国服账号</h3>
        </div>
        <el-card class="section-card">
          <el-form label-width="120px" label-position="left">
            <el-form-item label="账号状态">
              <el-tag :type="account.status.authenticated ? 'success' : 'info'">
                {{ account.status.authenticated ? `已登录 · ${account.status.accountName}` : '未登录' }}
              </el-tag>
              <el-button v-if="account.status.authenticated" class="account-button" :loading="account.busy" @click="logoutAccount">
                退出账号
              </el-button>
            </el-form-item>
            <template v-if="!account.status.authenticated">
              <el-form-item label="网页登录">
                <el-button type="primary" :loading="account.busy" @click="openAccountLogin">打开网页登录</el-button>
                <el-button :loading="account.busy" @click="completeAccountLogin">我已完成登录</el-button>
              </el-form-item>
              <el-form-item label="会话令牌">
                <el-input
                  v-model="accountToken"
                  class="account-token"
                  type="password"
                  show-password
                  autocomplete="off"
                  placeholder="输入国服 POESESSID"
                  @keyup.enter="loginAccountToken"
                />
                <el-button class="account-button" :disabled="!accountToken.trim()" :loading="account.busy" @click="loginAccountToken">
                  验证令牌
                </el-button>
              </el-form-item>
            </template>
            <el-form-item label="全局赛季">
              <div class="account-league-row">
                <el-select
                  :model-value="account.settings.league"
                  filterable
                  :disabled="!account.status.authenticated"
                  placeholder="选择商城配方与查价共用赛季"
                  @change="changeAccountLeague"
                >
                  <el-option v-for="league in account.leagues" :key="league.id" :label="league.name" :value="league.id" />
                </el-select>
                <el-button :disabled="!account.status.authenticated" :loading="account.busy" @click="refreshAccountLeagues">
                  刷新赛季
                </el-button>
              </div>
            </el-form-item>
            <div class="hint-text">登录 Cookie 仅保存在独立 Electron Session 中；商城配方与国服查价共用这里的账号和赛季。</div>
          </el-form>
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
              <el-col :xs="24" :sm="12" :md="8">
                <el-form-item label="制作开始">
                  <KeyCaptureInput :model-value="shortcuts.itemStart" @change="handleShortcutsChange('itemStart', $event)" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8">
                <el-form-item label="地图开始">
                  <KeyCaptureInput :model-value="shortcuts.mapStart" @change="handleShortcutsChange('mapStart', $event)" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8">
                <el-form-item label="全局紧急停止">
                  <KeyCaptureInput :model-value="shortcuts.end" @change="handleShortcutsChange('end', $event)" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row class="independent-short-fields app-grid" :gutter="16">
              <el-col :xs="24" :sm="12" :md="8">
                <el-form-item label="配方开始">
                  <KeyCaptureInput :model-value="shortcuts.chaosRecipeStart" @change="handleShortcutsChange('chaosRecipeStart', $event)" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8">
                <el-form-item label="配方暂停/继续">
                  <KeyCaptureInput :model-value="shortcuts.chaosRecipePause" @change="handleShortcutsChange('chaosRecipePause', $event)" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8">
                <el-form-item label="配方紧急停止">
                  <KeyCaptureInput :model-value="shortcuts.chaosRecipeStop" @change="handleShortcutsChange('chaosRecipeStop', $event)" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row class="independent-short-fields app-grid" :gutter="16">
              <el-col :xs="24" :sm="12" :md="8">
                <el-form-item label="国服查价">
                  <KeyCaptureInput :model-value="shortcuts.priceCheck" @change="handleShortcutsChange('priceCheck', $event)" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8">
                <el-form-item label="海图分析">
                  <KeyCaptureInput :model-value="shortcuts.puzzleAnalyze" @change="handleShortcutsChange('puzzleAnalyze', $event)" />
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
                <el-form-item label="首格位置">
                  <div class="position-input">
                    <el-input-number
                      v-model="inventory.startPos.x"
                      placeholder="X"
                      :controls="false"
                      style="width: 80px"
                      @change="handleInventoryChange"
                    />
                    <span class="separator">,</span>
                    <el-input-number
                      v-model="inventory.startPos.y"
                      placeholder="Y"
                      :controls="false"
                      style="width: 80px"
                      @change="handleInventoryChange"
                    />
                    <el-button
                      class="pick-position-button"
                      :icon="Aim"
                      circle
                      title="点击选取坐标"
                      :loading="coordinatePickingTarget === 'inventory'"
                      :disabled="Boolean(coordinatePickingTarget) && coordinatePickingTarget !== 'inventory'"
                      @click="handlePickCoordinate('inventory')"
                    />
                  </div>
                  <div class="hint-text">背包第一个格子（左上角）的中心坐标</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="单格宽高">
                  <div class="position-input">
                    <el-input-number
                      v-model="inventory.slotSize.w"
                      placeholder="W"
                      :min="0"
                      :controls="false"
                      style="width: 80px"
                      @change="handleInventoryChange"
                    />
                    <span class="separator">x</span>
                    <el-input-number
                      v-model="inventory.slotSize.h"
                      placeholder="H"
                      :min="0"
                      :controls="false"
                      style="width: 80px"
                      @change="handleInventoryChange"
                    />
                  </div>
                  <div class="hint-text">单个背包格子的宽度和高度</div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row class="app-grid" :gutter="16">
              <el-col :span="12">
                <el-form-item label="连续空格停止数量">
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
                  <div class="hint-text">扫描连续达到该数量的空格后，认为后续没有内容</div>
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
                  <div class="position-input">
                    <el-input-number
                      class="coordinate-number-input"
                      v-model="positions[key].x"
                      placeholder="X"
                      :controls="false"
                      @change="handlePositionChange(key)"
                    />
                    <span class="separator">,</span>
                    <el-input-number
                      class="coordinate-number-input"
                      v-model="positions[key].y"
                      placeholder="Y"
                      :controls="false"
                      @change="handlePositionChange(key)"
                    />
                    <el-button
                      class="pick-position-button"
                      :icon="Aim"
                      circle
                      title="点击选取坐标"
                      :loading="coordinatePickingTarget === `currency:${key}`"
                      :disabled="Boolean(coordinatePickingTarget) && coordinatePickingTarget !== `currency:${key}`"
                      @click="handlePickCoordinate('currency', key)"
                    />
                  </div>
                </el-form-item>
              </div>
            </div>
          </el-form>
        </el-card>

        <!-- 物品位置 -->
        <div class="section-header">
          <h3 class="section-title">物品位置</h3>
        </div>
        <el-card class="section-card">
          <el-form :model="itemPosition" label-width="120px" label-position="left">
            <el-row class="app-grid" :gutter="16">
              <el-col :span="8">
                <el-form-item label="物品位置">
                  <div class="position-input">
                    <el-input-number
                      v-model="itemPosition.x"
                      placeholder="X"
                      :controls="false"
                      style="width: 80px"
                      @change="handleItemPositionChange"
                    />
                    <span class="separator">,</span>
                    <el-input-number
                      v-model="itemPosition.y"
                      placeholder="Y"
                      :controls="false"
                      style="width: 80px"
                      @change="handleItemPositionChange"
                    />
                    <el-button
                      class="pick-position-button"
                      :icon="Aim"
                      circle
                      title="点击选取坐标"
                      :loading="coordinatePickingTarget === 'item'"
                      :disabled="Boolean(coordinatePickingTarget) && coordinatePickingTarget !== 'item'"
                      @click="handlePickCoordinate('item')"
                    />
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>
        </div>

        <div v-show="activeTab === 'system'" class="settings-tab-panel settings-panel settings-panel--system">
        <!-- 系统设置 -->
        <div class="section-header">
          <h3 class="section-title">系统设置</h3>
        </div>
        <el-card class="section-card">
          <el-form label-width="120px" label-position="left">
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
              <pre class="update-release-notes">{{ updateState.releaseNotes }}</pre>
            </el-form-item>
          </el-form>
          <el-alert
            title="当前 Windows 安装包未签名，重启安装时可能出现 UAC 或 SmartScreen 提示。"
            type="warning"
            :closable="false"
            show-icon
          />
        </el-card>
        </div>

        <div v-show="activeTab === 'automation'" class="settings-tab-panel settings-panel settings-panel--automation">
        <!-- 操作延迟 -->
        <div class="section-header">
          <h3 class="section-title">操作延迟</h3>
        </div>
        <el-card class="section-card">
          <el-form label-width="180px" label-position="left">
            <el-form-item label="自动操作等待">
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
              :label="field.label"
            >
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
            <div class="hint-text">组合键、按键、鼠标按钮和释放时序始终生效，包括自适应模式</div>
            <el-divider />
            <el-form-item label="自适应等待">
              <el-switch
                v-model="adaptiveTiming"
                active-text="开启"
                inactive-text="关闭"
                @change="handleAdaptiveTimingChange"
              />
              <div class="hint-text">开启后剪贴板、画面验证等改为轮询检测，有结果立即继续，不再固定等待</div>
            </el-form-item>
            <el-form-item v-if="adaptiveTiming" label="自适应等待上限">
              <el-input-number
                v-model="adaptiveTimeoutMs"
                :step="100"
                controls-position="right"
                style="width: 240px"
                @change="handleAdaptiveTimeoutChange"
              >
                <template #suffix>ms</template>
              </el-input-number>
              <div class="hint-text">剪贴板、画面、页签和存仓验证未得到结果时的统一最大等待时间</div>
            </el-form-item>
            <template v-if="!adaptiveTiming">
              <el-divider />
              <h4 class="section-title">固定结果等待</h4>
              <el-form-item
                v-for="field in RESULT_TIMING_FIELDS"
                :key="field.key"
                :label="field.label"
              >
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
              <div class="hint-text">关闭自适应后，剪贴板、页签、存仓和画面验证使用这里的固定值</div>
            </template>
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
              <div v-if="backgroundHistory.length > 0" class="history-section">
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
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { Refresh, Close, Aim, UploadFilled } from '@element-plus/icons-vue'
import { useSettingsStore } from './settingsStore'
import { useBagStore } from '@/stores/bag'
import { CURRENCY_NAMES } from '../../utils/constants'
import { FIXED_TIMING } from '../../utils/operationDelay'
import { EMPTY_SLOT_THRESHOLD } from '../../utils/inventorySettings'
import { commitGlobalShortcut } from '../../utils/scriptService'
import { electronApi } from '@/api/electron'
import OverlayContent from '@/domains/overlay/components/OverlayContent.vue'
import PriceCheckOverlayView from '@/domains/priceCheck/PriceCheckOverlayView.vue'
import { createPriceCheckPreview } from '@/domains/priceCheck/priceCheckPreview.js'
import { generateRandomItem } from '@/utils/mockItem'
import KeyCaptureInput from '@/components/common/KeyCaptureInput.vue'
import InterfaceDetectionSettings from './InterfaceDetectionSettings.vue'
import StashTabSelectionSettings from './StashTabSelectionSettings.vue'
import GameWindowTitleSettings from './GameWindowTitleSettings.vue'
import FeedbackSettings from './FeedbackSettings.vue'
import { useInterfaceDetectionStore } from '@/stores/interfaceDetection'
import { usePoeCnAccountStore } from '@/stores/poeCnAccount'
import { useApplicationUpdateStore } from '@/stores/applicationUpdate'
import { updateBagRuntimeConfig } from '@/utils/bagService'
import { readPersistentTab, writePersistentTab } from '@/utils/tabPersistence'
import { OVERLAY_BACKGROUND_MODES, resolveOverlayBackgroundDrop } from '../../../shared/overlayBackground.js'

const settingsStore = useSettingsStore()
const bagStore = useBagStore()
const interfaceDetectionStore = useInterfaceDetectionStore()
const account = usePoeCnAccountStore()
const applicationUpdate = useApplicationUpdateStore()
const { state: updateState, busy: updateBusy } = storeToRefs(applicationUpdate)
const accountToken = ref('')
const SETTINGS_TAB_STORAGE_KEY = 'settings.activeTab'
const SETTINGS_TABS = ['general', 'automation', 'detection', 'overlay', 'system', 'feedback']
const activeTab = ref(readPersistentTab(SETTINGS_TAB_STORAGE_KEY, SETTINGS_TABS, 'general'))
const settingsScrollbar = ref(null)

const shortcuts = ref({ ...settingsStore.globalShortcuts })
const shortcutScopeEnabled = ref(settingsStore.shortcutScopeEnabled)
const positions = ref({ ...settingsStore.currencyPositions })
const inventory = ref({ ...settingsStore.inventory })
const operationDelayMs = ref(settingsStore.operationDelayMs)
const adaptiveTiming = ref(settingsStore.adaptiveTiming)
const adaptiveTimeoutMs = ref(settingsStore.adaptiveTimeoutMs)
const fixedTiming = ref({ ...settingsStore.fixedTiming })
const itemPosition = ref({ ...settingsStore.itemPosition })
const manualDpiScale = ref(settingsStore.manualDpiScale || 1.0)
const debugMode = ref(settingsStore.debugMode)
const overlaySettings = ref({ ...settingsStore.overlaySettings })
const backgroundHistory = ref([...settingsStore.backgroundHistory])
const bagAutoStashEnabled = ref(bagStore.moduleEnabled)
const coordinatePickingTarget = ref('')
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
  activeTab.value = writePersistentTab(SETTINGS_TAB_STORAGE_KEY, tab, SETTINGS_TABS, 'general')
  settingsScrollbar.value?.setScrollTop(0)
}

onMounted(async () => {
  void account.run(() => account.restore()).catch(() => {})
  window.addEventListener('dragover', preventBackgroundFileNavigation)
  window.addEventListener('drop', preventBackgroundFileNavigation)
})

onBeforeUnmount(() => {
  window.removeEventListener('dragover', preventBackgroundFileNavigation)
  window.removeEventListener('drop', preventBackgroundFileNavigation)
})

async function runAccountAction(action, successMessage = '') {
  try {
    await account.run(action)
    if (successMessage) ElMessage.success(successMessage)
  } catch (error) {
    ElMessage.error(error.message)
  }
}

function openAccountLogin() {
  return runAccountAction(
    () => account.openWebLogin(),
    '请在新窗口完成 QQ/国服登录；验证成功后窗口会自动关闭，也可手动确认'
  )
}

function completeAccountLogin() {
  return runAccountAction(() => account.completeWebLogin(), '国服网页登录成功')
}

async function loginAccountToken() {
  const token = accountToken.value
  accountToken.value = ''
  return runAccountAction(() => account.setSessionToken(token), '国服会话验证成功')
}

function logoutAccount() {
  return runAccountAction(() => account.logout(), '已退出国服账号')
}

function refreshAccountLeagues() {
  return runAccountAction(() => account.loadLeagues())
}

function changeAccountLeague(league) {
  return runAccountAction(() => account.setLeague(league), '全局赛季已更新')
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
watch(() => settingsStore.adaptiveTiming, (val) => {
  adaptiveTiming.value = val
})
watch(() => settingsStore.adaptiveTimeoutMs, (val) => {
  adaptiveTimeoutMs.value = val
})
watch(() => settingsStore.fixedTiming, (val) => {
  fixedTiming.value = { ...val }
}, { deep: true })
watch(() => settingsStore.itemPosition, (val) => {
  itemPosition.value = { ...val }
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
    await commitGlobalShortcut(key, value)
    ElMessage.success('快捷键已保存并注册')
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

function handleItemPositionChange() {
  settingsStore.updateItemPosition({
    x: itemPosition.value.x,
    y: itemPosition.value.y
  })
}

async function handlePickCoordinate(type, currency = '') {
  if (coordinatePickingTarget.value) return

  coordinatePickingTarget.value = type === 'currency' ? `currency:${currency}` : type
  try {
    const result = await electronApi.window.pickScreenCoordinate()
    if (!result || result.canceled) return
    if (result.success === false) throw new Error(result.error?.message || '坐标选取失败')

    const point = { x: result.x, y: result.y }
    if (type === 'inventory') {
      inventory.value.startPos = point
      handleInventoryChange()
    } else if (type === 'currency') {
      positions.value[currency] = point
      handlePositionChange(currency)
    } else if (type === 'item') {
      itemPosition.value = point
      handleItemPositionChange()
    }
    ElMessage.success(`已选取坐标 (${point.x}, ${point.y})`)
  } catch (error) {
    ElMessage.error('选取坐标失败')
  } finally {
    coordinatePickingTarget.value = ''
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

async function handleAdaptiveTimingChange(value) {
  const result = await settingsStore.updateAdaptiveTiming(value)
  adaptiveTiming.value = settingsStore.adaptiveTiming
  if (!result.success) ElMessage.error(result.error)
}

async function handleAdaptiveTimeoutChange(value) {
  const result = await settingsStore.updateAdaptiveTimeoutMs(value)
  adaptiveTimeoutMs.value = settingsStore.adaptiveTimeoutMs
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
const PHYSICAL_TIMING_KEYS = new Set(['modifierSettleMs', 'keyHoldMs', 'buttonHoldMs', 'releaseSettleMs'])
const TIMING_FIELDS = Object.keys(FIXED_TIMING.fields).map((key) => ({
  key,
  label: TIMING_FIELD_LABELS[key]
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
      '确定要重置所有设置为默认值吗？此操作不可恢复。',
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 重置设置
    settingsStore.resetSettings()
    interfaceDetectionStore.reset()

    // 同步本地 ref
    shortcuts.value = { ...settingsStore.globalShortcuts }
    positions.value = { ...settingsStore.currencyPositions }
    operationDelayMs.value = settingsStore.operationDelayMs
    itemPosition.value = { ...settingsStore.itemPosition }
    manualDpiScale.value = settingsStore.manualDpiScale
    debugMode.value = settingsStore.debugMode
    updateMode.value = settingsStore.updateMode
    updateSource.value = settingsStore.updateSource
    overlaySettings.value = { ...settingsStore.overlaySettings }
    backgroundHistory.value = []

    // 重新注册快捷键
    if (window.electronAPI) {
      try {
        await updateShortcuts()
        ElMessage.success('设置已重置为默认值，快捷键已重新注册')
      } catch (error) {
        ElMessage.success('设置已重置为默认值')
      }
    } else {
      ElMessage.success('设置已重置为默认值')
    }
  } catch (error) {
    // 用户取消操作
    if (error !== 'cancel') {
      ElMessage.error('重置设置失败')
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

    .independent-short-fields { margin-bottom: 0; }

    .account-token {
      max-width: 420px;
    }

    .account-button {
      margin-left: 12px;
    }

    .account-league-row {
      display: flex;
      width: 100%;
      min-width: 0;
      align-items: center;
      gap: 12px;

      :deep(.el-select) {
        min-width: 0;
        flex: 1;
      }

      .el-button {
        flex: 0 0 auto;
      }
    }

    .position-input {
      display: flex;
      align-items: center;

      .separator {
        margin: 0 8px;
        color: var(--text-secondary);
      }

      .pick-position-button {
        margin-left: 8px;
        flex: none;
      }
    }

    .currency-position-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0 28px;
    }

    .currency-position-item { min-width: 0; }
    .coordinate-number-input { width: 68px; }
    
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
      white-space: pre-wrap;
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
