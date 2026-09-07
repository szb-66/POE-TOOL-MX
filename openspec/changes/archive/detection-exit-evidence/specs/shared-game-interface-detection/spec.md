## ADDED Requirements

### Requirement: 检测进程退出证据留存
公共界面检测协调器 MUST 在检测进程意外退出（非停止、重启或注销消费者路径）时，将退出码与累积的 stderr 尾部写入主进程日志，并在发布的失败状态中包含结构化 `exitCode` 字段。检测脚本 MUST 启用 faulthandler，使原生层崩溃在 stderr 留下调用栈；检测循环捕获的异常 MUST 向 stderr 输出完整 traceback。

#### Scenario: 检测进程意外退出留下日志证据
- **WHEN** 启动成功的检测进程自发退出且仍有消费者注册
- **THEN** 系统在主进程日志中记录退出码与 stderr 尾部，发布的失败状态包含结构化 `exitCode` 并沿用原有失败原因文案

#### Scenario: 原生崩溃留下调用栈
- **WHEN** 检测进程内发生 Python 无法捕获的原生层崩溃
- **THEN** faulthandler 向 stderr 输出崩溃时的调用栈，供主进程日志记录

#### Scenario: 循环异常留下完整 traceback
- **WHEN** 检测循环捕获到 Python 异常
- **THEN** 完整 traceback 输出到 stderr，同时保持现有 `detection-error` 事件行为不变

#### Scenario: 退出码持久化到诊断事件
- **WHEN** 检测进程意外退出且失败状态携带 `exitCode`
- **THEN** 前端上报的诊断失败事件在 `metadata.exitCode` 中记录该退出码；不携带退出码的停止事件不产生该字段
