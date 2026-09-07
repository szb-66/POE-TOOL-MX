## MODIFIED Requirements

### Requirement: Build an offline skill gem catalog
系统 SHALL 从中文主动技能宝石和辅助宝石页面的版本化原始快照生成离线目录，并 MUST 为每项保存稳定标识、名称、一级需求等级、红绿蓝白颜色、宝石类型和来源路径。没有 RGB 类但具有有效技能链接、图片和等级的记录 MUST 归类为白色；同一来源重复时 MUST 保留最低需求等级。

#### Scenario: Generate a valid catalog
- **WHEN** 两个来源快照包含有效的彩色及白色技能宝石表格
- **THEN** 系统生成包含主动和辅助宝石、完整元数据及来源时间的规范化目录

#### Scenario: Include Convocation
- **WHEN** 主动技能快照包含需求等级 24 和 31 的白色“号召”记录
- **THEN** 目录只包含一个稳定来源的“号召”，颜色为白色且需求等级为 24

#### Scenario: Reject an invalid snapshot
- **WHEN** 来源缺少有效记录、字段无效或关键哨兵技能
- **THEN** 生成流程失败且不以不完整结果替换正式目录
