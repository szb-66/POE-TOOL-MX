# Tasks

## 1. 浮窗置顶级别修复

- [x] 1.1 `electron/modules/window/manager.js`：制作浮窗（`overlayWindow` 创建后）、剧情浮窗、调试浮窗三处补 `setAlwaysOnTop(true, 'screen-saver')`
- [x] 1.2 `electron/modules/chaosRecipe/overlay.js`：配方高亮预览浮窗补 `setAlwaysOnTop(true, 'screen-saver')`
- [x] 1.3 `electron/modules/priceCheck/overlay.js`：查价浮窗补 `setAlwaysOnTop(true, 'screen-saver')`
- [x] 1.4 `electron/modules/itemInspection/overlay.js`、`markerOverlay.js`、`equipmentControlOverlay.js` 与 `electron/modules/itemContext/menu.js` 四处补 `setAlwaysOnTop(true, 'screen-saver')`

## 2. 游戏显示模式检测（探针与分类）

- [x] 2.1 `electron/modules/system/gameDpi.js` 的 `WINDOWS_DPI_PROBE`：每候选增加 `style`（GetWindowLongW/GWL_STYLE）、`windowRect`、`monitorRect`（MonitorFromWindow + GetMonitorInfoW）与 `notificationState`（SHQueryUserNotificationState，SHCore→shell32 降级，失败 -1），全部 try/except 降级
- [x] 2.2 新增导出纯函数 `classifyGameDisplayMode(candidate)`：WS_CAPTION→窗口模式；无标题栏+铺满≥95%+前台+QUNS=3→独占全屏（不支持）；铺满→全屏（无边框）；其余→无边框窗口；最小化→无法判断；无候选→null，附 `// ponytail:` 上限注释
- [x] 2.3 `detectGameDpi` 成功路径附加返回 `displayMode` 与 `displayModeSupported`，现有字段与 DPI 行为不变

## 3. 健康项接入

- [x] 3.1 `electron/modules/system/health.js`：新增 `evaluateGameDisplayMode(gameDpi)`（id `gameDisplayMode`，label `游戏显示模式`），受支持→ready 展示模式名；独占全屏→attention 提示切换无边框全屏或窗口；最小化→attention 提示还原窗口；未检测到→attention；追加进 `createStartupHealth`
- [x] 3.2 `electron/modules/ipc/system.js`：`HEALTH_OPERATIONS` 加 `gameDisplayMode: 'game_display_mode_check'`，`healthReasonCode` 加 `unsupported_display_mode` 分支
- [x] 3.3 `electron/modules/system/diagnostics.js`：`HEALTH_IDS` 加 `'gameDisplayMode'`

## 4. 验证

- [x] 4.1 `test/gameDpi.test.js` 追加 `classifyGameDisplayMode` 用例：窗口模式、无边框全屏、前台独占全屏、未铺满无边框、最小化、后台铺满不误报、无候选
- [x] 4.2 运行 `node --test test/gameDpi.test.js`，再全量 `npm test`
- [ ] 4.3 `npm run electron:dev` 手动回归：开启主窗口常驻置顶后制作浮窗仍在其上；游戏无边框全屏下浮窗可见；首页"游戏显示模式"项在游戏窗口模式/无边框下为绿色，独占全屏为黄色
- [x] 4.4 运行 OpenSpec 严格校验通过

## 5. 游戏显示模式自动更新修复

- [x] 5.1 新增 `shared/gameDisplayMode.js`（模式标签与状态文案），`health.js` 与首页健康项共用
- [x] 5.2 `settingsStore.refreshDpiScale` 保存检测结果中的 `displayMode`/`displayModeSupported`（成功设置、失败清空、重置清空并导出）
- [x] 5.3 `useDashboard.js` 健康项改为与 DPI 同源：auto 模式随 focus 触发的检测自动更新，detecting 显示 pending，manual 模式保留启动健康检查结果
- [x] 5.4 更新 dashboard-home delta 规格（新增自动更新场景）并补 source 断言测试，运行测试与严格校验

## 6. 手动 DPI 模式下显示模式不自动更新修复

- [x] 6.1 `settingsStore.refreshDpiScale`：显示模式探测与 DPI 模式解耦（manual 模式也运行探测并应用显示模式，仅跳过 DPI 数值应用）
- [x] 6.2 `mainRuntime.js` 焦点刷新移除 auto 模式门槛；`useDashboard.js` 移除 manual 特例，健康项两种模式下均随焦点检测自动更新
- [x] 6.3 同步规格场景与 source 断言测试，运行测试与严格校验

## 7. 显示模式改走游戏窗口状态推送

- [x] 7.1 回滚 DPI 逻辑至原状：`refreshDpiScale` 恢复 manual 早退且不含显示模式代码，`mainRuntime.js` 焦点监听恢复 auto 门槛
- [x] 7.2 `settingsStore` 新增独立 `refreshGameDisplayMode()`（仅探测并应用显示模式）
- [x] 7.3 接入实时通道：`scriptService.js` 的 `onScopeChanged` 订阅追加显示模式刷新（前台/bounds 变化推送），启动初始同步后探测一次，`runDashboardRefresh` 兜底刷新
- [x] 7.4 同步规格场景与 source 断言测试，运行测试与严格校验
