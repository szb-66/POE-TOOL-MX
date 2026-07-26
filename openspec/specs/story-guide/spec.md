# story-guide Specification

## Purpose

Define chapter guide authoring, continuous story navigation, chapter-local skills, persistence, and the independent in-game story overlay.

## Requirements

### Requirement: Manage chapter guides
The system SHALL provide a story management page where users can add, rename, select, and delete chapters and add, edit, select, and delete ordered steps within each chapter. The selected chapter SHALL be visually prominent relative to unselected chapters, and the add-step control SHALL appear at the end of the step list rather than in a fixed header position.

#### Scenario: Create and edit a chapter
- **WHEN** the user adds a chapter and enters its name and steps
- **THEN** the system persists the chapter and preserves the entered step order

#### Scenario: Reorder chapters
- **WHEN** the user drags a chapter to another position
- **THEN** the system persists the new chapter order and preserves the active progress identifiers

#### Scenario: Reorder steps
- **WHEN** the user drags a step to another position within its chapter
- **THEN** the system persists the new step order and immediately updates continuous navigation and the visible overlay

#### Scenario: Delete the active step
- **WHEN** the user deletes the currently selected step
- **THEN** the system selects the following navigable step, or the preceding step when no following step exists

#### Scenario: Delete a chapter
- **WHEN** the user confirms deletion of a chapter
- **THEN** the system removes its steps and skills and repairs the active progress to a neighboring navigable step

#### Scenario: Highlight the selected chapter
- **WHEN** a chapter is the current chapter and the chapter list renders more than one chapter
- **THEN** the system renders that chapter with a visually prominent selected treatment (a left accent bar, a deeper background, and bolder name text) that is distinct from the treatment of unselected chapters

#### Scenario: Place the add-step control at the end of the step list
- **WHEN** the steps panel renders for the current chapter, whether the chapter has steps or is empty
- **THEN** the system renders the add-step control as the last element of the step list area, below the last step or below the empty-state hint, and does not render an add-step control in the steps panel header

### Requirement: Navigate a continuous story flow
The system SHALL treat ordered steps from all chapters as one continuous navigation flow, skipping chapters without steps and stopping at the first and last available steps.

#### Scenario: Advance across a chapter boundary
- **WHEN** the current step is the last step of a chapter and the user invokes next step
- **THEN** the system selects the first step of the next non-empty chapter

#### Scenario: Move backward across a chapter boundary
- **WHEN** the current step is the first step of a chapter and the user invokes previous step
- **THEN** the system selects the last step of the previous non-empty chapter

#### Scenario: Navigate at a global boundary
- **WHEN** the user invokes previous at the first step or next at the last step
- **THEN** the current step remains unchanged and navigation does not wrap

#### Scenario: Select progress from the panel
- **WHEN** the user selects a step, or selects a chapter containing steps
- **THEN** the system sets the selected step, or that chapter's first step, as current progress

### Requirement: Persist story configuration and progress
The system SHALL persist normalized chapter data and the current chapter and step identifiers, while treating story overlay visibility as session-only state.

#### Scenario: Restore saved progress
- **WHEN** the application restarts with valid saved story data
- **THEN** the system restores the current chapter and step but leaves the story overlay hidden

#### Scenario: Load invalid saved references
- **WHEN** saved progress references a removed chapter or step
- **THEN** the system selects the first available step or an empty progress state without failing

### Requirement: Configure chapter-local skill groups
The system SHALL allow each chapter to independently contain an ordered collection of named skill groups, with addable and removable skills whose names are free text and whose colors are limited to red, green, or blue.

#### Scenario: Edit chapter skills
- **WHEN** the user adds, renames, recolors, or deletes skills in the selected chapter
- **THEN** the system persists the updated groups only on that chapter

#### Scenario: Reject invalid saved skill colors
- **WHEN** persisted data contains a skill color outside red, green, and blue
- **THEN** the system normalizes that skill to a supported default color

### Requirement: Display an independent story overlay
The system SHALL provide a story overlay independent of the existing crafting overlay and SHALL display the previous, current, and next steps with the current step at higher visual priority.

#### Scenario: Show the overlay
- **WHEN** the user enables the story overlay from the story page
- **THEN** an always-on-top overlay opens with the current chapter, three-step context, and chapter skills

#### Scenario: Update the overlay
- **WHEN** story content or current progress changes while the overlay is visible
- **THEN** the overlay updates immediately without closing or changing the crafting overlay

#### Scenario: Show chapter skills
- **WHEN** the current step belongs to a chapter with named skills
- **THEN** the overlay displays group names and red, green, or blue skill labels for that chapter

#### Scenario: Show empty story state
- **WHEN** no navigable step exists
- **THEN** the overlay displays a clear empty-state message rather than stale content

### Requirement: 浮窗步骤和技能左右排列
系统 SHALL 在游戏剧情浮窗宽度允许时将步骤上下文和当前章节技能左右排列，以减少浮窗高度。

#### Scenario: 标准浮窗宽度
- **WHEN** 当前章节同时有步骤和技能且浮窗宽度足够
- **THEN** 步骤位于左栏、技能位于右栏

#### Scenario: 内容或宽度受限
- **WHEN** 可用宽度不足以保证内容可读
- **THEN** 布局可回退为上下排列且内容不溢出

### Requirement: 浮窗宽度可配置
系统 SHALL 允许用户输入剧情浮窗宽度并持久化，在浮窗已显示时立即应用，在下次打开时继续使用。

#### Scenario: 输入浮窗宽度
- **WHEN** 用户输入有效宽度
- **THEN** 游戏剧情浮窗立即调整为该宽度且重启应用后仍保留

### Requirement: 同组技能水平排列
系统 MUST 将同一个技能组内的技能按从左到右排列，不得把同组技能改为上下列表。

#### Scenario: 一个技能组包含多个技能
- **WHEN** 浮窗展示包含多个技能的技能组
- **THEN** 这些技能在同一水平行中从左到右排列

### Requirement: Position the story overlay
The system SHALL initially place the story overlay at the top center, provide a separate always-visible native three-dot grip that can reliably receive mouse input while the content window remains click-through, move the content window as the grip is dragged, persist its last position, and keep the restored bounds within an available display.

#### Scenario: Drag through the native grip
- **WHEN** the user presses and drags the three-dot grip
- **THEN** the grip and story content move together while the remaining content area continues passing mouse input through to the game

#### Scenario: Preserve overlay size while dragging
- **WHEN** the user moves the story overlay repeatedly through the native grip
- **THEN** the content window keeps its configured width and measured height without cumulative resizing

#### Scenario: Restore a valid saved position
- **WHEN** the overlay is reopened and its saved bounds remain on an active display
- **THEN** the overlay and its grip open at the saved position

#### Scenario: Recover from display changes
- **WHEN** saved bounds are outside all active displays
- **THEN** the overlay and its grip return to a visible top-center position on the primary display

#### Scenario: Close the overlay
- **WHEN** the user hides or closes the story overlay
- **THEN** both the content window and the native grip window are closed without leaving an interactive invisible region
