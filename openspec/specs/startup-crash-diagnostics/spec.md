# startup-crash-diagnostics Specification

## Purpose

为应用启动期提供无需依赖 Windows 事件查看器的本地诊断证据，并在确认属于早期渲染器或 GPU 崩溃时进行一次受控的兼容模式恢复。

## Requirements

### Requirement: 启动过程必须留下本地诊断记录
应用 MUST 在启动早期记录版本、运行环境、安全模式状态和关键启动阶段，并在页面加载、preload、渲染器挂载或进程退出失败时记录明确原因。

#### Scenario: 正常启动完成
- **WHEN** 主窗口页面成功加载且 Vue 应用完成挂载
- **THEN** 启动日志包含从主进程启动到 `renderer-mounted` 的成功阶段

#### Scenario: 启动阶段失败
- **WHEN** 主进程初始化、页面加载、preload 或渲染端挂载发生错误
- **THEN** 启动日志包含失败阶段、稳定原因码和脱敏错误摘要

### Requirement: 启动诊断必须保护用户隐私并限制磁盘占用
应用 MUST 将文本日志和崩溃转储保存在用户数据目录内，不得自动上传，并 MUST 对文本中的用户路径和认证信息进行脱敏以及限制日志文件大小。

#### Scenario: 日志包含敏感数据
- **WHEN** 待记录消息包含用户目录、安装目录、Cookie、Authorization 或常见令牌字段
- **THEN** 落盘文本以占位符替代敏感值且不包含原值

#### Scenario: 日志超过大小限制
- **WHEN** 当前启动日志达到配置的最大大小
- **THEN** 应用轮转日志且只保留当前日志和一个上一份日志

### Requirement: 可恢复的早期崩溃只能自动恢复一次
应用 SHALL 仅在启动 30 秒内发生 GPU 子进程崩溃或渲染器 `crashed`、`abnormal-exit` 时，以禁用 GPU 的安全模式重新启动一次。

#### Scenario: 首次可恢复崩溃
- **WHEN** 普通启动在恢复窗口内发生符合条件的崩溃
- **THEN** 应用记录原因并使用 `--disable-gpu --startup-safe-mode` 重新启动

#### Scenario: 安全模式再次失败
- **WHEN** 带有 `--startup-safe-mode` 的启动再次发生崩溃
- **THEN** 应用不得再次自动重启，并提示用户取得日志和转储的位置

#### Scenario: 不可恢复退出原因
- **WHEN** 退出原因为 `oom`、`launch-failed`、`integrity-failure`、`killed` 或页面加载失败
- **THEN** 应用只记录并提示诊断位置，不得将其作为 GPU 问题自动重启

### Requirement: 渲染端启动上报必须受限
应用 MUST 只接受固定类型的启动事件和长度受限的文本字段，未知事件或超限载荷不得写入启动日志。

#### Scenario: 合法挂载事件
- **WHEN** 渲染端上报允许的 `renderer-mounted` 事件
- **THEN** 主进程记录渲染器启动成功

#### Scenario: 非法启动事件
- **WHEN** 渲染端上报未知事件类型或超限字段
- **THEN** 主进程拒绝该事件且不写入不受信任内容

### Requirement: 开发环境必须能够稳定触发诊断路径
应用 SHALL 提供仅开发环境生效的故障注入方式，以验证主进程失败、页面加载失败和真实渲染器崩溃路径。

#### Scenario: 正式环境携带测试参数
- **WHEN** 打包应用收到开发故障注入参数
- **THEN** 应用忽略该参数并正常启动

### Requirement: 页面加载失败按启动阶段分流
系统 MUST 记录主框架页面加载失败，但只有渲染器尚未完成首次挂载时的真实加载失败才能触发启动失败退出。取消导航和首次挂载后的运行期加载失败不得被当作启动失败。

#### Scenario: 首次主页面真实加载失败
- **WHEN** 渲染器首次挂载前主框架因非取消类错误加载失败
- **THEN** 系统记录失败原因、提示诊断位置并结束应用

#### Scenario: 取消导航
- **WHEN** 主框架收到取消导航类加载失败
- **THEN** 系统记录该事件但不得弹出启动失败或退出应用

#### Scenario: 启动完成后的刷新失败
- **WHEN** 渲染器已经完成首次挂载后主框架刷新或导航加载失败
- **THEN** 系统记录运行期失败且允许用户重试，不得退出应用

### Requirement: 启动诊断区分外壳、首页和运行时就绪
应用 SHALL 接受受限的 `dashboard-ready` 与 `renderer-runtime-ready` 里程碑及对应失败事件；只有现有 `renderer-mounted` 事件 MUST 标记首次渲染器挂载并改变页面加载失败的致命边界。

#### Scenario: 外壳完成首次挂载
- **WHEN** 渲染器上报合法 `renderer-mounted`
- **THEN** 系统记录成功并将 CrashGuard 标记为启动完成

#### Scenario: 后续性能里程碑
- **WHEN** 渲染器上报合法首页或运行时就绪事件
- **THEN** 系统记录对应阶段但不再次改变 CrashGuard 状态

#### Scenario: 开发版等待首页就绪后退出
- **WHEN** 根路由开发启动携带首页就绪诊断退出参数
- **THEN** 系统在记录 `dashboard-ready` 后受控退出并关闭开发服务器
