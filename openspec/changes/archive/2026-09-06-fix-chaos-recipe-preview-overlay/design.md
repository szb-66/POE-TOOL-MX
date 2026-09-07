## Context

商城配方高亮遮罩由 `ChaosRecipeOverlayManager`（electron/modules/chaosRecipe/overlay.js）单实例管理，被预览 IPC（electron/modules/ipc/chaosRecipe.js 的 `chaos-recipe-control-preview`）与自动取件（automation.js）共用。当前问题链：

1. `overlay.js` 的 `window.on('closed')` 只置 `this.window = null`，`this.snapshot` 保留旧快照（如 `status:'preview'`）。
2. `chaos-recipe-control-preview` 以 `getState()?.status === 'preview'` 判断开关：幽灵快照使第一次点击执行 `close()`（对已销毁窗口是空操作），用户看到"点了没反应"；`ChaosRecipeControlOverlay.computeState` 的 `previewActive` 读同一状态，按钮可能显示"取消高亮"。
3. `overlay.create` 在区域非法时静默返回 `false`，两个 IPC 调用方均不检查返回值。
4. `automation.start` 的 catch 只置 `stopped` 并释放锁，不关闭高亮窗口，残留 `running` 内容。

与已修复的"制作浮窗关闭后不再显示"（windowManager 销毁引用复用）同类根因：窗口生命周期与记录状态脱节。

## Goals / Non-Goals

**Goals:**

- 状态以窗口真实生命周期为准：窗口消失 → 状态视为关闭。
- 预览创建失败可见；启动失败不留运行态高亮。
- 高亮浮窗生命周期可诊断（结构化日志，不含敏感信息）。
- 最小 diff，不改变预览/取件对外协议与自动化安全门禁。

**Non-Goals:**

- 不重构 `ChaosRecipeOverlayManager` 为事件驱动或引入新抽象。
- 不处理校准区域跨显示器/DPI 过期的重新校准引导（已有"需要校准"路径）。
- 不修改控制浮窗或主窗口配方页的 UI。

## Decisions

1. **在 `closed` 回调中同步清空快照**（而非让 `getState()` 推导窗口状态）：`close()` 之外只有窗口销毁一条路径会产生幽灵状态，回调清一次即可同时修复 IPC 开关判断与 `previewActive` 两个消费方；`getState()` 保持纯快照语义，改动面最小。
2. **复用窗口前检查 `webContents.isCrashed()`，崩溃则走新建路径**：崩溃窗口 `isDestroyed()` 为 false，现有复用逻辑会永远显示空白透明窗；复用前销毁重建是唯一能自愈的位置。
3. **预览 IPC 检查 `create()` 返回值并抛 `ChaosRecipeError(INVALID_REQUEST, '无法定位仓库区域，请重新校准')`**：复用现有错误序列化通道，控制浮窗已有的失败原因展示逻辑（`pendingActionFailure` → 状态区域）自动生效，无需新增 UI。
4. **`automation.start` catch 中补 `this.overlay.close()`**：与 `fail()`/`stop()` 语义一致；不放在 `spawnCurrentTab` 内部，避免 advanceTab 正常链路被误关。
5. **诊断日志用 `console.log('[商城配方高亮]', ...)` 单行 JSON 风格**：与 automation.js 现有 `[混沌配方取件]` 前缀一致，进入既有诊断采集链路；不引入新日志模块。
6. **测试采用现有 VM 加载 + 假窗口/overlay 模式**（同 test/chaosRecipeAutomation.test.js）：overlay.js 依赖 electron，VM 注入假 `BrowserWindow`/`screen` 可覆盖 `closed` 清快照、崩溃重建、create 返回 false 等场景，无需启动 Electron。

## Risks / Trade-offs

- [窗口 `closed` 后清快照，理论上自动化持有旧 items 引用] → 自动化重绘走 `overlayCurrent()` 重新 `create`，不依赖旧快照，无行为变化。
- [崩溃重建丢弃旧窗口内未消费的 pending 状态] → `create` 复用路径本就重新 publish 全量快照，无数据丢失。
- [幽灵状态的真实触发场景（外部销毁/崩溃/加载失败）无法在本地百分百复现] → 生命周期诊断日志可在用户复现时回传证据；修复本身对三种场景均收敛为"状态视为关闭、可重新创建"。
