## ADDED Requirements

### Requirement: 交易目录保留 matcher 数值方向
系统 MUST 为上游声明为负向的词缀 matcher 保存可校验的数值变换元数据，并 MUST 在固定目录生成、简繁转换、官方目录刷新、内置降级和运行时匹配期间保持该元数据。负向 matcher MUST 属于同一 stat 的 matcher 集合，且不带负向标记的 matcher SHALL 使用原始捕获值。

#### Scenario: 固定英文数据包含负向 matcher
- **WHEN** 固定 Awakened PoE Trade 定义为同一 stat 提供正向 matcher 和带 `negate` 的负向 matcher
- **THEN** 生成目录同时保存两个 matcher，并只为负向 matcher记录数值乘以 `-1` 的变换

#### Scenario: 简繁中文负向 matcher
- **WHEN** 固定中文游戏描述中的 matcher 带有负向标记并转换为简体中文
- **THEN** 转换后的 matcher 继续携带相同负向数值变换并映射到原官方 stat ID

#### Scenario: 官方刷新合并 matcher
- **WHEN** 在线官方目录刷新并合并内置 matcher
- **THEN** 系统保留已有负向变换且不会因去重、别名扩展或原子替换而丢失

#### Scenario: 拒绝损坏的负向元数据
- **WHEN** 目录中的负向 matcher 不属于对应 stat、重复冲突或使用不受支持的数值变换
- **THEN** 目录校验失败且运行时继续使用最近可信目录
