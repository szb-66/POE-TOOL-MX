# Tasks

## 1. 开关反馈

- [x] 1.1 `MapTrackerDrawer.vue` `setOverlayEnabled`：启用后按快照评估缺失条件并警告提示，齐备报成功

## 2. 拖动抓手

- [x] 2.1 `MapTrackerOverlayView.vue`：顶部居中拖动抓手 + `createOverlayDrag` 指针处理
- [x] 2.2 `src/api/electron.js` + `electron/preload.cjs`：`moveOverlay`/`moveMapTrackerOverlay` 桥接
- [x] 2.3 `overlay.js`：`OverlayDragSession` + `OverlayDragPassthroughController` 接线；交互模式互斥；拖拽中跳过 `moved` 持久化；结束时一次性保存位置
- [x] 2.4 `ipc/mapTracker.js`：`map-tracker:overlay-move` 通道（sender 校验、增量移动、工作区钳制）

## 3. 验证

- [x] 3.1 `test/mapTrackerOverlay.test.js` 补断言并通过 `npm test`
