## Why

关闭主窗口后，辅助窗口和自动化子进程可能继续存活，使 Electron 主进程与开发终端无法结束。退出流程还依赖无法等待异步监听器的 `before-quit` 回调，无法保证清理完成后再退出。

## What Changes

- 主窗口关闭时明确发起完整应用退出，而不是等待所有辅助窗口自然关闭。
- 在退出事件中先阻止退出，统一执行一次有超时保护的异步清理，随后恢复 Electron 退出。
- 清理所有受管服务、自动化子进程、全局资源和辅助窗口，即使个别清理步骤失败也继续完成退出。
- 增加退出生命周期回归测试，覆盖重复退出、清理等待、清理失败和超时场景。

## Capabilities

### New Capabilities

- `application-shutdown`: 定义主窗口关闭后应用、辅助窗口和受管子进程必须完整退出的行为。

### Modified Capabilities

无。

## Impact

- Electron 主进程生命周期：`electron/main.js`
- 新增可独立测试的退出控制器
- 窗口、Python/自动化进程、文件监听和快捷键清理
- Node 测试套件
