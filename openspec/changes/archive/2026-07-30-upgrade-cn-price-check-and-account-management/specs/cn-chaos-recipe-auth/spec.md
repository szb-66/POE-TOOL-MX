## ADDED Requirements

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
