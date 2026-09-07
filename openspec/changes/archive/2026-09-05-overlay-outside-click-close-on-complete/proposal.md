# 提案：制作浮窗完成后点击外部自动关闭

## Why

制作脚本结束后，浮窗停留在"已完成"状态，用户必须精确点击浮窗上的"确认完成"按钮才能关闭。用户完成制作后注意力已回到游戏，点击浮窗外部任意位置应直接关闭浮窗，减少一次精确点击操作。

## What Changes

- 制作浮窗进入完成状态（物品或地图制作达成目标）时，主进程启动 Python 全局左键监听：用户点击浮窗外部任意位置（如游戏窗口，无需浮窗获得焦点）时自动关闭浮窗；首轮失焦方案因 Windows 前台锁定导致抢焦点失败已废弃
- 用户点击浮窗自身（包括"确认完成""重新开始"按钮、拖拽把手）不触发自动关闭，既有操作保留
- 点击"重新开始"时终止监听进程，防止脚本重启运行期间点击误关浮窗；重启失败回到完成态时重新布防
- 脚本重新开始运行（收到开始信号）或浮窗因任何原因关闭时，解除布防并终止监听进程
- 失败/停止面板不布防，保持现有手动关闭与重试入口，避免误点丢失重试上下文

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `crafting-overlay-controls`: 新增完成状态下点击浮窗外部自动关闭浮窗的要求，并约束布防仅限完成状态、重启与重新运行时的布防解除行为

## Impact

- `electron/modules/window/manager.js`：新增布防/解除布防函数，关闭浮窗时清理状态
- 新增 `electron/modules/window/overlayOutsideClickClose.js`：可注入 fake window 的布防状态机小模块
- `electron/modules/ipc/window.js`：注册两个 IPC handler
- `electron/preload.cjs`：暴露两个 API
- `src/domains/overlay/OverlayView.vue`：完成状态 watch 与重启路径接线
- `test/`：新增布防状态机测试；无新依赖
