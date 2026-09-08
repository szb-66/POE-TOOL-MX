## Why

恢复最大化状态时 Electron 的 maximize() 会显示隐藏窗口，绕过首帧主题等待，导致亮色启动闪现深色背景。

## What Changes

- 将最大化和全屏状态恢复延后至 ready-to-show，保持置顶设置与窗口状态持久化。
- 验证普通、最大化、全屏和提前销毁的启动路径。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `main-window-dark-theme`: 明确保存的窗口状态不能提前显示尚未就绪的主题首帧。

## Impact

修改 electron/modules/window/manager.js 和启动回归测试；不增加依赖。
