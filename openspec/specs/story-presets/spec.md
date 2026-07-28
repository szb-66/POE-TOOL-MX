# story-presets Specification

## Purpose

Define independent story and skill presets, their lifecycle and migration, and chapter-to-chapter skill copying.

## Requirements

### Requirement: Manage independent story and skill presets
系统 SHALL 持久化可独立切换的剧情预设和技能预设；剧情预设 MUST 保存全部章节、步骤和当前进度，技能预设 MUST 按章节序号保存技能组。

#### Scenario: Combine presets independently
- **WHEN** 用户切换剧情预设或技能预设
- **THEN** 系统立即按当前剧情章节序号组合当前技能方案，且不修改另一类预设

#### Scenario: Preserve unused skill chapters
- **WHEN** 技能预设包含的章节槽位多于当前剧情预设
- **THEN** 系统保留额外槽位并在切换到足够长的剧情预设后重新显示

### Requirement: Manage preset lifecycle
系统 SHALL 为两类预设提供新建、重命名、删除和切换；新建时 MUST 让用户选择复制当前内容或创建空白内容。

#### Scenario: Copy current preset
- **WHEN** 用户选择复制当前内容新建预设
- **THEN** 系统深拷贝内容并为所有实体生成新 ID，后续编辑不会影响来源预设

#### Scenario: Create blank preset
- **WHEN** 用户选择创建空白剧情或技能预设
- **THEN** 系统创建不含章节或技能槽位的新预设并切换到它

#### Scenario: Protect default preset
- **WHEN** 用户尝试删除默认预设
- **THEN** 系统拒绝删除；删除其他当前预设后切换回默认预设

### Requirement: Migrate legacy story data
系统 MUST 将 v1 章节数据无损迁移为 v2 的默认剧情预设和默认技能预设。

#### Scenario: Load v1 data
- **WHEN** 已保存数据包含章节、步骤、进度及嵌入式技能组
- **THEN** 章节和步骤及进度进入默认剧情预设，技能组及目录元数据按章节顺序进入默认技能预设

### Requirement: Copy chapter skills forward
系统 SHALL 允许把当前章节的全部技能组复制到下一剧情章节，使用新 ID 完整覆盖目标技能槽。

#### Scenario: Replace populated next chapter
- **WHEN** 下一章已有技能且用户确认覆盖
- **THEN** 系统用当前章技能的独立副本替换下一章全部技能组

#### Scenario: Copy from the last chapter
- **WHEN** 当前章节是剧情预设的最后一章
- **THEN** 复制入口不可用且系统不自动创建章节
