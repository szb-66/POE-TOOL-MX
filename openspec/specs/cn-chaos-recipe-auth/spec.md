# cn-chaos-recipe-auth Specification

## Purpose
TBD - created by archiving change integrate-cn-chaos-recipe. Update Purpose after archive.
## Requirements
### Requirement: 国服专用会话认证
系统 MUST 使用与主应用隔离的持久化 Electron Session 管理国服账号，并支持网页登录和手动 `POESESSID`。

#### Scenario: 网页登录成功
- **WHEN** 用户在受限登录窗口完成国服登录且 `/api/profile` 验证成功
- **THEN** 系统关闭登录窗口并返回不含 Cookie 的已认证账号摘要

#### Scenario: 手动令牌登录
- **WHEN** 用户提交非空会话令牌且资料接口验证成功
- **THEN** 系统将令牌写入专用 Cookie Session 且不写入 localStorage 或日志

### Requirement: 会话失效与注销
系统 SHALL 在用户注销或接口返回未认证时清除认证状态及仓库缓存。

#### Scenario: 主动注销
- **WHEN** 用户选择注销
- **THEN** 系统清除国服 Session 的 Cookie、缓存和配方快照

#### Scenario: 会话过期
- **WHEN** 国服接口返回 401 或登录 HTML
- **THEN** 系统返回 `SESSION_EXPIRED` 并要求重新认证

