# 检测退出证据持久化落盘

## Why

存取（bag）的共享界面检测进程在运行中确定性异常退出（每 1-2 分钟一次，events.json 中 `bag/script_runtime/process_exit` 跨会话持续出现），导致应用每次重启自动拉起检测后，首页存取模块都会显示"检测进程异常退出"。上一变更（detection-exit-evidence）已在脚本侧启用 faulthandler、在循环与 main 输出完整 traceback，但协调器侧的退出证据只写到 `console.error`——打包运行下主进程控制台不落盘，`startup.log` 只接收结构化记录，因此 faulthandler 原生崩溃栈、退出码与 stderr 尾部仍然全部丢失，根因依旧无法定位。

## What Changes

- 主进程构造 `InterfaceDetectionCoordinator` 时注入现有 `startupLog` 结构化日志器
- 协调器在检测进程意外退出（close）时，将退出码、terminalReason 与累积 stderr 尾部通过 `startupLog.record` 写入 `<userData>/logs/startup.log`
- 协调器收到 `detection-error` 事件时同样落盘一条（含 failureCode），便于区分循环异常与进程退出
- 日志沿用 startupLog 既有脱敏、长度上限（4096）与轮转机制，stderr 已截断 4000 字符可直接容纳 faulthandler 混合栈

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `shared-game-interface-detection`: 补充"检测进程退出证据留存"需求——退出证据 MUST 持久化到主进程启动日志（`<userData>/logs/startup.log`），而非仅输出到控制台

## Impact

- `electron/main.js`：构造协调器时传入 `startupLog`
- `electron/modules/interfaceDetection/coordinator.js`：构造函数接收 `logger`，close 与 detection-error 处理器落盘
- 测试：`test/bagAutoStash.test.js` 新增断言（注入 fake logger 验证 record 调用与字段）
- 明确不做：自动重启兜底（沿用此前用户决策，只做根因修复链路）；不新增独立日志文件（复用 startup.log 轮转与脱敏）
