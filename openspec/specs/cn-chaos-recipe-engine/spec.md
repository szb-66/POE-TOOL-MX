# cn-chaos-recipe-engine Specification

## Purpose
TBD - created by archiving change integrate-cn-chaos-recipe. Update Purpose after archive.
## Requirements
### Requirement: 混沌配方候选过滤
系统 SHALL 仅将符合配置的稀有装备纳入混沌配方候选。

#### Scenario: 默认过滤
- **WHEN** 仓库包含未鉴定稀有装备、已鉴定装备、非稀有装备和低于 60 级装备
- **THEN** 默认只保留未鉴定且物品等级不低于 60 的稀有装备

#### Scenario: 允许已鉴定装备
- **WHEN** 用户启用已鉴定装备选项
- **THEN** 满足其他条件的已鉴定稀有装备也进入候选

### Requirement: 生成有效混沌配方套装
系统 MUST 为每套选择头盔、胸甲、手套、鞋、腰带、项链、两枚戒指和合法武器组合，并保证至少一件装备等级为 60–74。

#### Scenario: 双一手武器套装
- **WHEN** 候选包含两件一手武器或盾牌及其他全部部位
- **THEN** 系统生成一套完整混沌配方

#### Scenario: 双手武器套装
- **WHEN** 候选包含一件双手武器及其他全部部位
- **THEN** 系统生成一套完整混沌配方

#### Scenario: 全部装备等级不低于 75
- **WHEN** 完整部位候选全部为 75 级或更高
- **THEN** 系统不将其报告为混沌配方套装并提示缺少 60–74 级装备

### Requirement: 套装统计与取件计划
系统 SHALL 最大化完整套数，并输出缺件数量及稳定的分标签页取件计划。

#### Scenario: 多套候选
- **WHEN** 仓库可组成多套配方
- **THEN** 系统优先为每套分配一件 60–74 级装备，再用高等级装备补齐，并返回最大套数

#### Scenario: 生成取件计划
- **WHEN** 用户选择一套或多套完整配方
- **THEN** 计划按标签页和适合背包装载的部位顺序包含每件物品的身份摘要与格子坐标

