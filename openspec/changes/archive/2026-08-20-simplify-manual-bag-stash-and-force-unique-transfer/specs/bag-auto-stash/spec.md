## MODIFIED Requirements

### Requirement: 持久配置和浮层补扫
系统 SHALL 持久化黑名单与默认关闭的传奇强制入库配置，并使用全局自动操作等待执行手动入库；系统 MUST 忽略且后续保存不再输出旧的立即执行与浮层显示策略字段，浮层 SHALL 是唯一面向用户的入库启动入口。

#### Scenario: 迁移模块独立延迟
- **WHEN** 新全局配置不存在且旧 `bagSettings` 包含 transferDelayMs
- **THEN** 系统将该值迁移为全局 operationDelayMs，并且后续保存不再输出 transferDelayMs

#### Scenario: 迁移旧设置
- **WHEN** 系统加载包含 `immediateStash`、`showStashButtonOnlyWhenReady` 或不包含 `forceUniqueStash` 的旧 `bagSettings`
- **THEN** 系统忽略两个旧开关、补齐空黑名单和默认关闭的传奇强制入库，并保留其他有效背包设置

#### Scenario: 应用恢复检测
- **WHEN** 应用启动时模块已持久化为启用且配置有效
- **THEN** 应用级服务自动恢复双界面检测，并仅在入库条件满足时显示背包浮层

#### Scenario: 浮层补扫
- **WHEN** 当前处于可入库状态、没有入库进程且用户点击浮层按钮
- **THEN** 系统使用最新已同步的全局自动操作等待启动一轮入库，检测条件满足本身不得自动启动

#### Scenario: 不安全的浮层请求
- **WHEN** 用户请求时界面未就绪、游戏不在前台或已有入库进程
- **THEN** 系统拒绝请求并返回可显示的原因
