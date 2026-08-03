# skill-gem-catalog Specification

## Purpose

Define the offline skill gem catalog and its explicit snapshot maintenance workflow.

## Requirements

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

#### Scenario: Include S30 gems
- **WHEN** 生成 POE1 3.29 当前技能目录
- **THEN** 目录包含 Mana-Infused Staff 与四个 Pact 宝石的稳定 POEDB 来源路径

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

### Requirement: S30 技能宝石快照完整
系统 SHALL 从 3.29 中文主动与辅助宝石原始快照生成目录，并 MUST 同时验证长期稳定哨兵和 S30 新增宝石，目录元数据 SHALL 报告补丁 3.29。

#### Scenario: S30 新宝石存在
- **WHEN** 3.29 来源包含 S30 新增的有效技能宝石记录
- **THEN** 离线目录包含其稳定 ID、中文名称、等级、颜色、类型和来源
