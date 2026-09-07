## ADDED Requirements

### Requirement: S30 技能宝石快照完整
系统 SHALL 从 3.29 中文主动与辅助宝石原始快照生成目录，并 MUST 同时验证长期稳定哨兵和 S30 新增宝石，目录元数据 SHALL 报告补丁 3.29。

#### Scenario: S30 新宝石存在
- **WHEN** 3.29 来源包含 S30 新增的有效技能宝石记录
- **THEN** 离线目录包含其稳定 ID、中文名称、等级、颜色、类型和来源

