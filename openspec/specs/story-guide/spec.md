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

### Requirement: Combine chapter navigation and details
系统 SHALL 将章节目录与所浏览章节的详情放在同一个管理模块内，并将技能方案放在独立模块内；在可用高度受限时，章节目录、章节详情和技能内容 MUST 各自在固定标题下独立滚动。

#### Scenario: Browse long story content
- **WHEN** 章节目录、当前章节步骤或技能内容超过各自可用高度
- **THEN** 用户可分别滚动对应内容，模块标题和操作区保持可见且其他区域不随之滚动

#### Scenario: Use a narrow management window
- **WHEN** 管理页宽度不足以并排显示章节模块和技能模块
- **THEN** 两个模块纵向排列且页面允许滚动，不裁切编辑内容

### Requirement: Separate browsed chapter from active progress
系统 SHALL 独立持久化正在浏览的章节和当前剧情进度；选择章节、编辑步骤或新增章节与步骤 MUST NOT 改变当前进度，只有步骤单选器或连续导航操作可以切换当前进度。

#### Scenario: Browse another chapter
- **WHEN** 用户点击非进度章节的目录项
- **THEN** 管理页展示该章节的步骤和技能，但当前步骤与浮窗内容保持不变

#### Scenario: Select progress explicitly
- **WHEN** 用户点击某一步骤的单选器
- **THEN** 系统将该步骤及其章节设为当前进度并立即更新浮窗

#### Scenario: Follow shortcut navigation
- **WHEN** 上一步或下一步操作跨越章节边界
- **THEN** 系统更新当前进度并让浏览区域跟随新的进度章节

#### Scenario: Restore legacy browsing state
- **WHEN** 已保存剧情预设没有独立的浏览章节标识
- **THEN** 系统以当前进度章节作为浏览章节并保留原有进度

### Requirement: Preview precise story editor sorting
系统 SHALL 让用户通过拖拽抓手精确重排章节、当前章节内的步骤和当前章节位置的技能组。拖动过程中 MUST 根据指针位于目标卡片上半区或下半区实时展示最终顺序，成功放置时仅持久化一次，取消拖动时 MUST 保持原顺序。

#### Scenario: Move an item to an exact position
- **WHEN** 用户把章节、步骤或技能组拖到目标卡片的上半区或下半区
- **THEN** 系统分别把拖动项预览在目标卡片之前或之后，并在放置后保持该准确位置

#### Scenario: Preview without persisting
- **WHEN** 用户拖动项目跨越列表中的多张卡片
- **THEN** 卡片实时让位展示当前预期顺序，但系统在放置前不修改或保存 store 数据

#### Scenario: Cancel a drag
- **WHEN** 用户在列表外松手或以其他方式结束拖动而未成功放置
- **THEN** 系统清除预览并恢复拖动开始前的顺序

#### Scenario: Preserve editor interaction pointers
- **WHEN** 用户将指针悬浮在章节、步骤或技能组卡片及其内部控件上
- **THEN** 卡片显示 `pointer`，拖拽抓手显示 `grab` 或 `grabbing`，输入和按钮保留适合自身操作的指针

### Requirement: Navigate a continuous story flow
The system SHALL treat ordered steps from all chapters as one continuous navigation flow, skipping chapters without steps and stopping at the first and last available steps. Chapter browsing SHALL remain independent from active progress except that previous and next navigation SHALL make the browsed chapter follow the resulting progress chapter.

#### Scenario: Advance across a chapter boundary
- **WHEN** the current step is the last step of a chapter and the user invokes next step
- **THEN** the system selects the first step of the next non-empty chapter and browses that chapter

#### Scenario: Move backward across a chapter boundary
- **WHEN** the current step is the first step of a chapter and the user invokes previous step
- **THEN** the system selects the last step of the previous non-empty chapter and browses that chapter

#### Scenario: Navigate at a global boundary
- **WHEN** the user invokes previous at the first step or next at the last step
- **THEN** the current step remains unchanged and navigation does not wrap

#### Scenario: Select progress from the panel
- **WHEN** the user activates a step's progress selector
- **THEN** the system sets that step and its containing chapter as current progress

#### Scenario: Browse without selecting progress
- **WHEN** the user selects a chapter, clicks a step card, or focuses a step editor
- **THEN** the active progress remains unchanged

### Requirement: Persist story configuration and progress
The system SHALL persist normalized chapter data and the current chapter and step identifiers, while treating story overlay visibility as session-only state.

#### Scenario: Restore saved progress
- **WHEN** the application restarts with valid saved story data
- **THEN** the system restores the current chapter and step but leaves the story overlay hidden

#### Scenario: Load invalid saved references
- **WHEN** saved progress references a removed chapter or step
- **THEN** the system selects the first available step or an empty progress state without failing

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

### Requirement: Search the offline skill gem catalog
系统 SHALL 在剧情技能名称输入中按中文子串和不区分大小写的英文子串提供主动及辅助宝石候选，候选 MUST 始终显示 `名称(需求等级)`、类型和颜色。

#### Scenario: Complete a partial Chinese name
- **WHEN** 用户输入“劈”
- **THEN** 候选包含“劈砍(1)”，选择后技能信息被完整补齐

#### Scenario: Keep candidate levels visible
- **WHEN** 用户关闭已选技能的等级显示
- **THEN** 联想候选仍然显示各自需求等级

### Requirement: Configure selected skill level display
系统 SHALL 提供默认开启且持久化的“显示最低购买等级”设置，该设置 MUST 同时控制剧情编辑页和剧情浮层中已选目录技能的等级后缀。

#### Scenario: Display a selected skill level
- **WHEN** 等级显示开启且已选技能具有目录需求等级
- **THEN** 剧情编辑页和浮层均将其显示为 `名称(需求等级)`

#### Scenario: Hide a selected skill level
- **WHEN** 用户关闭等级显示
- **THEN** 剧情编辑页和浮层仅显示技能名称且目录元数据保持不变

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

### Requirement: Display a compact story overlay
系统 SHALL 使用紧凑的间距和辅助字号展示剧情浮窗，并以 14px 字体显示当前步骤正文；浮窗 MUST 继续自动适应内容高度且不得超过所在显示器工作区高度的 70%。

#### Scenario: Show standard compact overlay
- **WHEN** 用户以默认配置打开剧情浮窗
- **THEN** 浮窗以 460px 宽度显示双栏内容，当前步骤正文为 14px，并按实际内容收缩高度

#### Scenario: Stack at constrained width
- **WHEN** 浮窗宽度不足以保持双栏内容可读
- **THEN** 步骤与技能回退为上下排列且内容不溢出

#### Scenario: Migrate the former default width
- **WHEN** 用户首次升级且保存宽度为旧默认值 560px
- **THEN** 系统一次性迁移为 460px；其他自定义宽度保持不变，迁移完成后用户可再次选择 560px

### Requirement: 浮窗步骤和技能左右排列
系统 SHALL 在游戏剧情浮窗宽度允许时将步骤上下文和当前章节技能左右排列，以减少浮窗高度。

#### Scenario: 标准浮窗宽度
- **WHEN** 当前章节同时有步骤和技能且浮窗宽度足够
- **THEN** 步骤位于左栏、技能位于右栏

#### Scenario: 内容或宽度受限
- **WHEN** 可用宽度不足以保证内容可读
- **THEN** 布局可回退为上下排列且内容不溢出

### Requirement: 浮窗宽度可配置
系统 SHALL 允许用户输入 320–1200px 的剧情浮窗宽度并持久化，在浮窗已显示时立即应用，在下次打开时继续使用；新配置的默认宽度 SHALL 为 460px。

#### Scenario: 输入浮窗宽度
- **WHEN** 用户输入有效宽度
- **THEN** 游戏剧情浮窗立即调整为该宽度且重启应用后仍保留

#### Scenario: 限制宽度边界
- **WHEN** 保存值或输入值超出 320–1200px
- **THEN** 系统将其限制到最近的有效边界

### Requirement: 同组技能水平排列
系统 MUST 将同一个技能组内的技能按从左到右排列，并在空间不足时换到下一行，不得产生技能区域横向滚动条。

#### Scenario: 一个技能组包含多个技能
- **WHEN** 浮窗展示包含多个技能的技能组且当前行宽度不足
- **THEN** 完整技能标签按顺序换到下一行，超长名称不会撑破浮层

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
