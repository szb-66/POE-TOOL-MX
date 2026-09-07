# 检测进程退出证据留存

## Why

首页存取的界面检测进程在运行中确定性异常退出（诊断事件显示单个会话内每 1-2 分钟退出一次），但当前退出码只在 close 回调内存中存在、原生崩溃不打印任何栈（未启用 faulthandler）、循环异常只上报 `str(exc)` 丢弃 traceback、stderr 仅输出到开发终端——崩溃现场证据被完全丢弃，导致无法定位退出原因。已实测排除 GDI 句柄泄漏、内存泄漏与 Electron 侧误杀，必须先留存证据才能实施针对性根因修复。

## What Changes

- 检测脚本启用 `faulthandler`：原生层崩溃（如访问违规）时向 stderr 输出完整的 C/Python 混合调用栈
- 检测循环捕获异常时向 stderr 输出完整 traceback（当前仅上报 `str(exc)`）；`main()` 兜底异常同样输出 traceback
- 协调器在检测进程意外退出时将退出码与累积 stderr 尾部写入主进程日志；并在发布的失败状态中附带结构化 `exitCode` 字段（当前仅嵌在提示文案里）
- `bag-detection-stopped` 事件透传 `exitCode`，前端在诊断失败事件中以 `metadata.exitCode` 持久化（诊断系统已支持该字段，只是链路未传值），使退出事件在 `events.json` 中可与入库中止噪声区分开

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `shared-game-interface-detection`: 新增"检测进程退出证据留存"需求——检测进程意外退出时系统 SHALL 记录退出码与 stderr 尾部日志，并使失败状态与诊断事件包含结构化退出码

## Impact

- `src/assets/scripts/bag_auto_stash_template.py`：faulthandler 启用、两处 traceback 输出
- `electron/modules/interfaceDetection/coordinator.js`：close 处理器日志与 `exitCode` 状态字段
- `electron/modules/ipc/bag.js`：`bag-detection-stopped` 事件透传 `exitCode`
- `src/stores/bag.js`：`setStopReason` 将退出码作为 `metadata.exitCode` 上报诊断事件
- 测试：`test/bagAutoStash.test.js` 新增断言
- 明确不做：自动重启兜底（用户决策：只做根因修复）；不改 mss 实例化方式（避免改变崩溃面混淆二期取证）
