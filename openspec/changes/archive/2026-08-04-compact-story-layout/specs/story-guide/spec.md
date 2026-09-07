## ADDED Requirements

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

## MODIFIED Requirements

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

### Requirement: 浮窗宽度可配置
系统 SHALL 允许用户输入 320–1200px 的剧情浮窗宽度并持久化，在浮窗已显示时立即应用，在下次打开时继续使用；新配置的默认宽度 SHALL 为 460px。

#### Scenario: 输入浮窗宽度
- **WHEN** 用户输入有效宽度
- **THEN** 游戏剧情浮窗立即调整为该宽度且重启应用后仍保留

#### Scenario: 限制宽度边界
- **WHEN** 保存值或输入值超出 320–1200px
- **THEN** 系统将其限制到最近的有效边界
