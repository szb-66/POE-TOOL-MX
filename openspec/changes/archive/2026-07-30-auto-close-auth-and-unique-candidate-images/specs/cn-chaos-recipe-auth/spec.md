## MODIFIED Requirements

### Requirement: 国服专用会话认证
系统 MUST 使用与主应用隔离的持久化 Electron Session 管理共享国服账号，混沌配方与查价 MUST 使用同一认证实例，并支持自动完成的网页登录和手动 `POESESSID`。

#### Scenario: 网页登录自动成功
- **WHEN** 受限登录窗口产生国服 `POESESSID` 且 `/api/profile` 验证成功
- **THEN** 系统广播不含 Cookie 的已认证账号摘要、加载共享赛季并自动关闭应用内登录窗口

#### Scenario: 网页凭证尚未有效
- **WHEN** 登录窗口产生中间态 Cookie 但资料接口验证失败
- **THEN** 系统保留登录窗口和监听以等待后续变化，且不得将 Cookie 暴露给渲染进程

#### Scenario: 手动完成网页登录
- **WHEN** 自动监听未完成且用户选择“我已完成登录”
- **THEN** 系统使用同一验证流程完成认证并关闭登录窗口

#### Scenario: 手动令牌登录
- **WHEN** 用户提交非空会话令牌且资料接口验证成功
- **THEN** 系统将令牌写入专用 Cookie Session 且不写入 localStorage、渲染进程状态或日志
