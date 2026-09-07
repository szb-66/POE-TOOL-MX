# 共享界面检测 — 检测进程退出证据持久化

## MODIFIED Requirements

### Requirement: 检测进程退出证据留存

公共界面检测协调器 MUST 在检测进程意外退出（非停止、重启或注销消费者路径）时，将退出码、原因与累积的 stderr 尾部持久化写入主进程结构化启动日志（`<userData>/logs/startup.log`），而非仅输出到进程控制台，并在发布的失败状态中包含结构化 `exitCode` 字段；`detection-error` 事件同样 MUST 落盘结构化日志记录（含 failureCode）。检测脚本 MUST 启用 faulthandler，使原生层崩溃在 stderr 留下调用栈；检测循环捕获的异常 MUST 向 stderr 输出完整 traceback。

#### Scenario: 检测进程意外退出留下日志证据

- **WHEN** 启动成功的检测进程自发退出且仍有消费者注册
- **THEN** 系统在 `<userData>/logs/startup.log` 结构化启动日志中记录退出码、原因与 stderr 尾部，发布的失败状态包含结构化 `exitCode` 并沿用原有失败原因文案

#### Scenario: 原生崩溃留下调用栈

- **WHEN** 检测进程内发生 Python 无法捕获的原生层崩溃
- **THEN** faulthandler 向 stderr 输出崩溃时的调用栈，并随退出证据一并持久化到启动日志

#### Scenario: 循环异常留下完整 traceback

- **WHEN** 检测循环捕获到 Python 异常
- **THEN** 完整 traceback 输出到 stderr，同时保持现有 `detection-error` 事件行为不变并落盘含 failureCode 的日志记录

#### Scenario: 退出码持久化到诊断事件

- **WHEN** 检测进程意外退出且失败状态携带 `exitCode`
- **THEN** 前端上报的诊断失败事件在 `metadata.exitCode` 中记录该退出码；不携带退出码的停止事件不产生该字段

#### Scenario: 退出日志沿用启动日志治理机制

- **WHEN** 协调器写入退出证据
- **THEN** 日志沿用结构化启动日志的脱敏、长度上限与轮转机制，用户可直接提供该文件用于根因分析
