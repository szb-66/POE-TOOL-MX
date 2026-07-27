## MODIFIED Requirements

### Requirement: Configure chapter-local skill groups
The system SHALL allow each chapter to independently contain an ordered collection of named skill groups, with addable and removable skills. Skills SHALL support either free-text names or selection from the offline skill gem catalog; catalog selection SHALL populate the canonical name, first-level requirement, gem type, and red, green, or blue color, while free-text skills SHALL remain valid.

#### Scenario: Edit chapter skills
- **WHEN** the user adds, renames, recolors, or deletes skills in the selected chapter
- **THEN** the system persists the updated groups only on that chapter

#### Scenario: Select a catalog skill
- **WHEN** the user searches for and selects a skill gem suggestion
- **THEN** the system stores its catalog identifier, canonical name, first-level requirement, type, and color

#### Scenario: Enter a custom skill
- **WHEN** the user enters a name that is not the selected catalog record
- **THEN** the system preserves the free-text name and color while removing stale catalog metadata

#### Scenario: Reject invalid saved skill colors
- **WHEN** persisted data contains a skill color outside red, green, and blue
- **THEN** the system normalizes that skill to a supported default color

#### Scenario: Restore legacy skills
- **WHEN** persisted version 1 data contains only a skill name and color
- **THEN** the system restores it without inventing catalog metadata or changing the storage version

## ADDED Requirements

### Requirement: Search the offline skill gem catalog
系统 SHALL 在剧情技能名称输入中按中文子串和不区分大小写的英文子串提供主动及辅助宝石候选，候选 MUST 始终显示 `名称(需求等级)`、类型和颜色。

#### Scenario: Complete a partial Chinese name
- **WHEN** 用户输入“劈”
- **THEN** 候选包含“劈砍(1)”，选择后技能信息被完整补齐

#### Scenario: Keep candidate levels visible
- **WHEN** 用户关闭已选技能的等级显示
- **THEN** 联想候选仍然显示各自需求等级

### Requirement: Configure selected skill level display
系统 SHALL 提供默认开启且持久化的“显示最低购买等级”设置，该设置 MUST 只控制剧情编辑页中已选目录技能的等级后缀。

#### Scenario: Display a selected skill level
- **WHEN** 等级显示开启且已选技能具有目录需求等级
- **THEN** 剧情编辑页将其显示为 `名称(需求等级)`

#### Scenario: Hide a selected skill level
- **WHEN** 用户关闭等级显示
- **THEN** 剧情编辑页仅显示技能名称且目录元数据保持不变

#### Scenario: Keep overlay names unchanged
- **WHEN** 任意等级显示设置下剧情浮窗展示章节技能
- **THEN** 浮窗始终只显示技能名称和原有颜色
