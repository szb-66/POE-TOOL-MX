# Overlay Topmost And Display Mode Check

## Why

部分用户反馈制作浮窗被游戏窗口遮挡，关闭游戏后浮窗才可见，且层级甚至低于主窗口；用户怀疑配方高亮预览也是同一问题。根因是这批浮窗只使用 Electron 默认 `floating` 级置顶：压不过游戏窗口，且当用户开启主窗口"常驻置顶"后，两个同级窗口按焦点排序，浮窗可能被压到主窗口之下。同时缺少环境检测项帮助用户排查"浮窗被游戏覆盖"类问题（如游戏处于独占全屏模式）。

## What Changes

- 为 8 个仍使用默认置顶级别的浮窗统一补 `setAlwaysOnTop(true, 'screen-saver')`（Electron 最高置顶级别），与现有正常工作的浮窗（背包、配方控制、地图追踪等）保持一致：制作浮窗、剧情浮窗、调试浮窗、配方高亮预览、查价浮窗、物品检视×3、右键物品菜单
- 扩展游戏窗口 Python 探针：每个候选窗口增加窗口样式（`WS_CAPTION`）、窗口矩形、所在显示器矩形、系统全屏通知状态（`SHQueryUserNotificationState`）
- 新增 `classifyGameDisplayMode` 纯函数：将游戏窗口分类为窗口模式 / 全屏（无边框）/ 无边框窗口（均支持）与独占全屏（不支持，浮窗可能被遮挡）
- 系统环境面板新增"游戏显示模式"健康项：仅支持的显示模式显示绿色，独占全屏、窗口最小化或未检测到游戏窗口时黄色并给出切换建议

## Capabilities

### New Capabilities

- `overlay-window-topmost`: 业务与工具浮窗的置顶层级要求——必须使用最高置顶级别，保证在游戏窗口和开启常驻置顶的主窗口之上

### Modified Capabilities

- `game-display-dpi`: 游戏窗口探针增加显示模式识别字段（样式、窗口/显示器矩形、全屏通知状态），检测结果附带显示模式分类与是否支持
- `dashboard-home`: 系统环境健康项新增"游戏显示模式"，仅支持的显示模式为绿色正常状态

## Impact

- 主进程：`electron/modules/window/manager.js`、`electron/modules/chaosRecipe/overlay.js`、`electron/modules/priceCheck/overlay.js`、`electron/modules/itemInspection/*`、`electron/modules/itemContext/menu.js`、`electron/modules/system/gameDpi.js`、`electron/modules/system/health.js`、`electron/modules/ipc/system.js`、`electron/modules/system/diagnostics.js`
- 测试：`test/gameDpi.test.js` 追加 `classifyGameDisplayMode` 用例；全量 `npm test`
- 前端零改动（健康项为泛化渲染，`ready` 即绿色）；无破坏性变更；不涉及自动化键鼠路径
