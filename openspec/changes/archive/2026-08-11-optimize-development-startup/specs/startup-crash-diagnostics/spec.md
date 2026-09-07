## ADDED Requirements

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

