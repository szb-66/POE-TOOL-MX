## Why

用户点击框选/取点后，截图遮罩层需要 1.5~3 秒才出现：主进程以固定 `wait(500)` 等待最小化、串行执行 Python 激活游戏前台、串行执行全分辨率屏幕截图，之后才开始创建框选窗口并加载整个前端应用，全部串行导致等待时间叠加。

## What Changes

- 删除固定 500ms 等待，改为监听主窗口 `minimize` 事件（300ms 兜底上限）确认最小化
- 框选窗口的创建与页面加载提前到「激活游戏、捕获截图」之前并行执行（窗口保持隐藏），准备与截图完成后才显示框选层
- `pickScreenCoordinate` 与 `pickScreenRegion` 合并为共享的 `runScreenPicker` 内部流程，消除两份重复的会话编排代码
- dev 模式在 Vite `server.warmup` 中预热 `CoordinatePickerView.vue`
- 不改变任何规格化行为：最小化→激活游戏→捕获截图→显示框选层的顺序、互斥会话、取消/失败路径、坐标与 DPI 换算均保持不变

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

（无 —— 纯性能重构，无规格级行为变更，`.openspec.yaml` 已设 `skip_specs: true`）

## Impact

- `electron/modules/window/manager.js`：框选会话编排（`preparePickerSession`、`openScreenPickerWindows`、`runScreenPicker` 及两个导出函数）
- `vite.config.js`：`server.warmup.clientFiles` 增加 picker 视图（仅影响开发模式）
- 受益调用方：仓库标题模板框选、背包框选、碎片仓库/海图区九宫格框选、君锋奖励标题框选、坐标取点等全部使用 `pickScreenRegion`/`pickScreenCoordinate` 的入口
- 预期效果：遮罩层出现时间从约 1.5~3 秒缩短到约 0.5~1 秒
- 风险控制：框选层显示仍严格晚于截图完成；游戏激活失败时窗口从未显示即销毁，符合「不捕获截图也不显示框选层」
