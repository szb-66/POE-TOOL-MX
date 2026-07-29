# cn-chaos-recipe-auth Specification

## Purpose
TBD - created by archiving change integrate-cn-chaos-recipe. Update Purpose after archive.
## Requirements
### Requirement: 国服专用会话认证
系统 MUST 使用与主应用隔离的持久化 Electron Session 管理共享国服账号，混沌配方与查价 MUST 使用同一认证实例，并支持网页登录和手动 `POESESSID`。

#### Scenario: 网页登录成功
- **WHEN** 用户在受限登录窗口完成国服登录且 `/api/profile` 验证成功
- **THEN** 系统关闭登录窗口并向混沌配方和查价返回不含 Cookie 的已认证账号摘要

#### Scenario: 手动令牌登录
- **WHEN** 用户提交非空会话令牌且资料接口验证成功
- **THEN** 系统将令牌写入专用 Cookie Session 且不写入 localStorage、渲染进程状态或日志

### Requirement: 会话失效与注销
系统 SHALL 在用户注销或任一国服接口返回未认证时清除共享认证状态、仓库缓存和查价缓存。

#### Scenario: 主动注销
- **WHEN** 用户从混沌配方或查价入口选择注销
- **THEN** 系统清除国服 Session 的 Cookie、缓存、配方快照和查价缓存

#### Scenario: 会话过期
- **WHEN** 国服仓库或交易接口返回 401 或登录 HTML
- **THEN** 系统返回 `SESSION_EXPIRED`、同步两个功能的未认证状态并要求重新认证

### Requirement: 国服账号与赛季统一管理
系统 MUST 在设置页通过单一安全 Session 管理国服账号和全局赛季，并 SHALL 向商城配方与查价广播不含 Cookie 的状态。

#### Scenario: 恢复现有登录
- **WHEN** 应用启动且 `persist:poe-cn-auth` 中存在有效会话
- **THEN** 共享账号 Store 显示账号摘要并向两个功能提供同一账号和赛季

#### Scenario: 首次迁移赛季
- **WHEN** 共享赛季尚未建立而商城和查价存在旧赛季字段
- **THEN** 系统优先采用商城赛季、其次采用查价赛季，并在后续保存中移除旧字段

#### Scenario: 切换全局赛季
- **WHEN** 用户在设置页切换赛季
- **THEN** 系统关闭查价浮层与商城控制，清理旧查询、仓库选择和快照，再加载新赛季数据

#### Scenario: 会话失效
- **WHEN** 任一国服接口报告会话失效
- **THEN** 系统广播未登录状态并清除商城与查价缓存
