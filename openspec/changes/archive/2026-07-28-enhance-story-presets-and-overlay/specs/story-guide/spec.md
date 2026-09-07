## MODIFIED Requirements

### Requirement: Configure chapter-local skill groups
The system SHALL allow each chapter position in the active skill preset to independently contain an ordered collection of named skill groups, with addable and removable skills. Skills SHALL support either free-text names or selection from the offline skill gem catalog; catalog selection SHALL populate the canonical name, first-level requirement, gem type, and red, green, blue, or white color, while free-text skills SHALL remain valid.

#### Scenario: Edit chapter skills
- **WHEN** the user adds, renames, recolors, reorders, or deletes skills or groups at the selected chapter position
- **THEN** the system persists the updated groups only in that chapter slot of the active skill preset

#### Scenario: Select a catalog skill
- **WHEN** the user searches for and selects a skill gem suggestion
- **THEN** the system stores its catalog identifier, canonical name, first-level requirement, type, and color

#### Scenario: Enter a custom skill
- **WHEN** the user enters a name that is not the selected catalog record
- **THEN** the system preserves the free-text name and color while removing stale catalog metadata

#### Scenario: Reject invalid saved skill colors
- **WHEN** persisted data contains a skill color outside red, green, blue, and white
- **THEN** the system normalizes that skill to a supported default color

#### Scenario: Restore legacy skills
- **WHEN** persisted version 1 data contains only a skill name and color
- **THEN** the system restores it without inventing catalog metadata

### Requirement: Configure selected skill level display
系统 SHALL 提供默认开启且持久化的“显示最低购买等级”设置，该设置 MUST 同时控制剧情编辑页和剧情浮层中已选目录技能的等级后缀。

#### Scenario: Display a selected skill level
- **WHEN** 等级显示开启且已选技能具有目录需求等级
- **THEN** 剧情编辑页和浮层均将其显示为 `名称(需求等级)`

#### Scenario: Hide a selected skill level
- **WHEN** 用户关闭等级显示
- **THEN** 剧情编辑页和浮层仅显示技能名称且目录元数据保持不变

### Requirement: 同组技能水平排列
系统 MUST 将同一个技能组内的技能按从左到右排列，并在空间不足时换到下一行，不得产生技能区域横向滚动条。

#### Scenario: 一个技能组包含多个技能
- **WHEN** 浮窗展示包含多个技能的技能组且当前行宽度不足
- **THEN** 完整技能标签按顺序换到下一行，超长名称不会撑破浮层

## ADDED Requirements

### Requirement: Configure story overlay opacity
系统 SHALL 提供 0–100 的整数输入并全局持久化剧情浮层整体透明度，实时应用于内容窗口和所有原生抓手。

#### Scenario: Change opacity while visible
- **WHEN** 用户修改透明度且浮层已显示
- **THEN** 内容、文字、标签和抓手立即使用新透明度

#### Scenario: Set zero opacity
- **WHEN** 透明度为 0
- **THEN** 系统隐藏交互抓手且不留下不可见的鼠标拦截区域，用户可从主页面恢复数值

### Requirement: Resize story overlay columns
系统 SHALL 在双栏布局中提供独立原生分割线抓手，允许用户拖动调整步骤栏与技能栏比例，同时保持内容窗口其余区域鼠标穿透。

#### Scenario: Drag the divider
- **WHEN** 用户拖动分割线抓手
- **THEN** 系统在安全范围内更新并持久化栏宽比例，不移动浮层或累计改变其尺寸

#### Scenario: Synchronize divider geometry
- **WHEN** 浮层移动、调整宽高、内容高度变化或系统使用非整数 DPI
- **THEN** 分割线抓手从规范窗口尺寸和最新布局指标重新定位

#### Scenario: Use stacked layout
- **WHEN** 浮层宽度不足而采用上下布局
- **THEN** 系统隐藏分割线抓手，并在恢复双栏布局后重新显示
