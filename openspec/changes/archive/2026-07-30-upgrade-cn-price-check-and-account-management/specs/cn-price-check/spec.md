## ADDED Requirements

### Requirement: 查价模块可安全启停
系统 SHALL 持久化默认关闭的查价开关，并 MUST 在禁用时注销快捷键、拒绝请求、取消查询和关闭浮层。

#### Scenario: 启用成功
- **WHEN** 用户从首页或查价配置页开启模块且快捷键注册成功
- **THEN** 主进程运行态与持久化状态同时启用并允许 `Ctrl+D` 查价

#### Scenario: 启用失败
- **WHEN** `Ctrl+D` 注册失败
- **THEN** 系统回滚主进程运行态和持久化状态为关闭

### Requirement: 创建增强查价模型
系统 SHALL 从高级物品文本创建包含属性、状态、词缀 T 级、标签、数值上下限和未识别项的白名单模型。

#### Scenario: 自动选择词缀
- **WHEN** 初始策略为自动且词缀可唯一映射并具有 T1 或 T2
- **THEN** 系统启用天然或破裂词缀，并保持工艺、未知 T 级和歧义数值词缀关闭

#### Scenario: 解析物品属性
- **WHEN** 文本包含武器、防具、通用或地图属性
- **THEN** 系统计算适用的 DPS、防御、等级、品质、连接或地图属性并提供可编辑范围

### Requirement: 查询设置和分页挂单
系统 SHALL 支持在线状态、挂单时间、通货、合并、数值范围与初选策略，并 SHALL 由主进程按每页 10 条、最多 50 条管理挂单分页。

#### Scenario: 构建官方查询
- **WHEN** 用户按当前属性、状态与词缀搜索
- **THEN** 系统只使用白名单 ID 将条件写入 Awakened Trade 对应过滤组

#### Scenario: 适配国服查询协议
- **WHEN** 系统向腾讯国服交易搜索接口提交查询
- **THEN** “在线可交易”使用包含在线与立即购买挂单的 `available` 枚举，“立即购买”使用 `securable`，合并挂单写入 `trade_filters.filters.collapse.option`，且接口错误展示经过清理的官方原因

#### Scenario: 加载更多
- **WHEN** 当前查询仍有结果且展示数量少于 50
- **THEN** 系统从主进程保存的结果 ID 追加下一批 10 条并重新汇总

#### Scenario: 展示挂单
- **WHEN** Fetch 返回有效挂单
- **THEN** 系统展示价格、物品等级、交易状态、相对时间、卖家和可复制私聊文本

## REMOVED Requirements

### Requirement: 主页面手动文本查价
**Reason**: 产品入口收敛为游戏内 `Ctrl+D`，避免重复且不常用的原始文本和剪贴板操作。
**Migration**: 查价页面改为配置与诊断页；游戏内悬停物品后按 `Ctrl+D`。
