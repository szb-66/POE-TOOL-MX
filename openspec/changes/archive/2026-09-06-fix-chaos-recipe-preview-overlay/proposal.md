# 修复商城配方预览高亮遮罩不显示

## Why

用户反馈：点击游戏内控制组的"预览高亮"后，仓库高亮遮罩浮窗不显示（或按钮显示"取消高亮"但屏幕上没有遮罩）。根因与此前"制作浮窗关闭后不再显示"同类：浮窗记录状态与窗口真实生命周期脱节。`ChaosRecipeOverlayManager` 的 `closed` 事件只清窗口引用不清快照，高亮窗口被销毁或从未显示成功后，`getState()` 仍返回 `status:'preview'` 的幽灵快照，导致预览开关逻辑把用户的点击当作"关闭已有高亮"，表现为点击无效果。

## What Changes

- 高亮浮窗的内部状态 MUST 跟随窗口真实生命周期：窗口被销毁（非 `close()` 路径，如外部销毁）时同步清除快照，消除幽灵 `preview` 状态。
- 复用既有高亮窗口前检查渲染进程是否崩溃，崩溃时销毁重建，避免窗口永久透明空白。
- 预览高亮创建失败（校准区域非法导致 `create` 返回 false）时不再静默，向控制组返回明确错误原因。
- 自动取件启动（`start`）同步失败时关闭高亮浮窗，与 `fail()` 语义一致，避免残留过期 "running" 高亮。
- 在高亮浮窗创建、关闭、渲染进程崩溃等生命周期节点输出结构化诊断日志，便于用户复现时回传证据。
- 新增测试覆盖：幽灵状态清除、预览重建、启动失败关窗、创建失败报错。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `cn-chaos-recipe-overlay`: 新增"高亮浮窗状态跟随窗口生命周期"与"预览创建失败可见"要求，并约束取件启动失败时关闭高亮浮窗。

## Impact

- `electron/modules/chaosRecipe/overlay.js`（状态生命周期 + 崩溃重建 + 诊断日志）
- `electron/modules/ipc/chaosRecipe.js`（预览 handler 错误透出）
- `electron/modules/chaosRecipe/automation.js`（启动失败关闭高亮）
- `test/chaosRecipeOverlay.test.js`（新增）
- 不改变预览/取件的对外交互协议与自动化安全门禁。
