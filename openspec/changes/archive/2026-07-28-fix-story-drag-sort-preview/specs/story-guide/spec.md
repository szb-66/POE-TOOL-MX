## ADDED Requirements

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
