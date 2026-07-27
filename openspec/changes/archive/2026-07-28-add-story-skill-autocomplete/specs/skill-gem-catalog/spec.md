## ADDED Requirements

### Requirement: Build an offline skill gem catalog
系统 SHALL 从中文主动技能宝石和辅助宝石页面的版本化原始快照生成离线目录，并 MUST 为每项保存稳定标识、名称、一级需求等级、红绿蓝颜色、宝石类型和来源路径。

#### Scenario: Generate a valid catalog
- **WHEN** 两个来源快照包含有效的技能宝石表格
- **THEN** 系统生成包含主动和辅助宝石、完整元数据及来源时间的规范化目录

#### Scenario: Reject an invalid snapshot
- **WHEN** 来源缺少有效记录、字段无效或关键哨兵技能
- **THEN** 生成流程失败且不以不完整结果替换正式目录

### Requirement: Maintain skill gem snapshots explicitly
系统 SHALL 支持完全离线重建、仅抓取缺失来源和显式刷新来源三种维护方式，应用运行时 MUST NOT 请求技能数据来源。

#### Scenario: Rebuild offline
- **WHEN** 维护者使用默认生成命令且当前赛季原始快照完整
- **THEN** 系统仅使用本地快照重建规范化目录

#### Scenario: Fetch missing sources
- **WHEN** 维护者显式使用补抓命令
- **THEN** 系统仅获取缺失或不兼容的来源后生成目录

#### Scenario: Refresh all sources
- **WHEN** 维护者显式使用刷新命令
- **THEN** 系统重新获取两个来源并生成带新抓取时间的目录
