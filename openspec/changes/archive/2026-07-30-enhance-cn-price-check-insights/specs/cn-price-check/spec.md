## MODIFIED Requirements

### Requirement: 查询设置和分页挂单
系统 SHALL 支持在线状态、挂单时间、通货、合并、数值范围与初选策略，并 SHALL 在页面与浮窗之间广播经过清理且带 revision 的完整设置快照。系统 SHALL 由主进程按每批 10 条管理挂单详情：列表最多展示 50 条，价格分布最多分析 100 条。

#### Scenario: 构建官方查询
- **WHEN** 用户按当前属性、状态与词缀搜索
- **THEN** 系统只使用白名单 ID 将条件写入 Awakened Trade 对应过滤组

#### Scenario: 适配国服查询协议
- **WHEN** 系统向腾讯国服交易搜索接口提交查询
- **THEN** “在线可交易”使用包含在线与立即购买挂单的 `available` 枚举，“立即购买”使用 `securable`，合并挂单写入 `trade_filters.filters.collapse.option`，且接口错误展示经过清理的官方原因

#### Scenario: 页面修改设置
- **WHEN** 用户在查价页面修改任一查询设置
- **THEN** 主进程清理、合并并向浮窗广播完整快照，浮窗显示相同值

#### Scenario: 浮窗修改设置
- **WHEN** 用户在浮窗修改任一查询设置
- **THEN** 主进程清理、合并并向主窗口广播完整快照，主窗口持久化相同值

#### Scenario: 加载列表更多项
- **WHEN** 当前查询仍有结果且列表展示数量少于 50
- **THEN** 系统从主进程保存的结果 ID 追加下一批 10 条并重新汇总

#### Scenario: 展示挂单
- **WHEN** Fetch 返回有效挂单
- **THEN** 系统展示价格、物品等级、交易状态、相对时间、卖家和可复制私聊文本

### Requirement: 官方拒绝底材时安全降级
系统 MUST 区分传奇名称与国服官方 `query.type` 底材，并根据物品是否存在合法名称选择安全降级方式。

#### Scenario: 有名称的传奇底材被官方拒绝
- **WHEN** 带合法传奇名称的查询返回 `Unknown item base type`
- **THEN** 系统仅移除被拒绝的底材重试一次，并保留传奇名称约束

#### Scenario: 无名称物品的底材被官方拒绝
- **WHEN** 没有可用于约束的物品名称且官方返回 `Unknown item base type`
- **THEN** 系统停止请求并显示包含原底材的可诊断中文错误

#### Scenario: 普通物品只有一行名称
- **WHEN** 普通物品头部只有“短弓”等底材名称，分隔线后出现“弓”等物品类别行
- **THEN** 系统以分隔线结束身份解析，使用“短弓”作为 `query.type`，不得把“弓”误作底材

## ADDED Requirements

### Requirement: 无效未鉴定名称不得请求官方接口
系统 MUST 在构造传奇查询前确认 `identity.name` 来自官方或内置目录候选。

#### Scenario: 剪贴板只提供未鉴定底材
- **WHEN** 解析结果为未鉴定传奇且名称与底材无法区分
- **THEN** 系统进入候选解析流程而不是提交会产生 `Unknown item name` 的请求
