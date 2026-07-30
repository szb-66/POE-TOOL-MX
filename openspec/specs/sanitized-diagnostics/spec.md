# sanitized-diagnostics Specification

## Purpose

为公开发布后的远程排错提供稳定、可保存的环境信息，同时在诊断生成阶段排除登录凭据、账号内容和可识别用户身份的本地路径。

## Requirements

### Requirement: 生成稳定诊断快照
系统 SHALL 生成包含应用版本、操作系统、CPU 架构、管理员状态、显示器布局、DPI、游戏窗口、运行时和模块状态的版本化 JSON 快照。

#### Scenario: 生成成功
- **WHEN** 用户请求生成诊断信息
- **THEN** 系统返回带有 schema 版本与生成时间的结构化快照

#### Scenario: 部分探测失败
- **WHEN** 某项系统或游戏探测不可用
- **THEN** 快照保留其他项目，并为失败项目记录可读状态而不是整体失败

### Requirement: 诊断数据脱敏
系统 MUST 在主进程生成诊断内容时排除 Cookie、POESESSID、账号标识、仓库内容、预设内容、剪贴板文本和完整用户目录。

#### Scenario: 本地路径包含用户名
- **WHEN** 运行时或用户数据路径位于用户主目录
- **THEN** 诊断仅保留来源、状态或文件名，不包含完整绝对路径

#### Scenario: 账号已登录
- **WHEN** 用户已经登录国服账号并生成诊断
- **THEN** 诊断中不存在 Cookie、会话值、账号 ID 或仓库数据

### Requirement: 用户主动导出
系统 SHALL 只在用户主动操作时显示保存位置并写出格式化 JSON，不得自动上传诊断。

#### Scenario: 保存诊断
- **WHEN** 用户选择导出并确认目标文件
- **THEN** 系统将当前脱敏快照保存到该文件并反馈成功

#### Scenario: 取消保存
- **WHEN** 用户取消保存对话框
- **THEN** 系统不创建文件且返回已取消状态
