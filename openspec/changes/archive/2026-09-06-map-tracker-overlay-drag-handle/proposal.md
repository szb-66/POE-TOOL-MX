# 地图跟踪器浮窗拖动抓手与开关反馈

## Why

游戏内浮窗的显示策略要求"游戏前台 + 跟踪器启用 + 未暂停 + 浮窗开关开 + 存在活动地图"五个条件同时满足，而浮窗开关本身默认就是开启的：用户打开开关后若其余条件不满足，浮窗静默不显示，无任何原因反馈，被感知为 bug。另外浮窗主体鼠标穿透，移动浮窗必须先切"交互"模式让整个浮窗接收鼠标，拖完再切回，操作繁琐。

## What Changes

- 打开浮窗开关后，系统立即基于当前快照检测缺失的显示条件，并以警告消息逐项告知（跟踪器未启用、跟踪已暂停、未在受支持地图、游戏不在前台）；条件齐备时报告成功。关闭开关的行为不变。
- 浮窗显示期间在顶部居中提供克制的拖动抓手：浮窗主体保持鼠标穿透，仅抓手区域接收鼠标并支持原生拖动，拖动结束后持久化新位置；抓手在浮窗隐藏或进入交互模式时失效。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `map-tracker`：游戏内浮窗新增穿透拖动抓手与开关缺失条件反馈；既有显示策略、交互模式、位置持久化行为不变。

## Impact

- 前端：`src/domains/mapTracker/MapTrackerDrawer.vue`（开关反馈）、`src/domains/mapTracker/MapTrackerOverlayView.vue`（抓手 UI）、`src/api/electron.js`（moveOverlay 桥接）。
- 主进程：`electron/modules/mapTracker/overlay.js`（拖拽会话 + 穿透控制器）、`electron/modules/ipc/mapTracker.js`（overlay-move 通道）、`electron/preload.cjs`（moveMapTrackerOverlay）。
- 测试：`test/mapTrackerOverlay.test.js` 补充抓手接线与拖拽持久化断言。
- 复用：`electron/modules/window/overlayDrag.js`（OverlayDragSession/OverlayDragPassthroughController/命中判定/边界钳制）与 `src/utils/useOverlayDrag.js`（与 bag-auto-stash 穿透浮窗拖动抓手同一套实现）。
