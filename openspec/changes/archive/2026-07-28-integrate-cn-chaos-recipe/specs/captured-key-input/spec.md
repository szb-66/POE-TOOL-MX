## MODIFIED Requirements

### Requirement: Register and dispatch shortcuts centrally
The system SHALL register the complete shortcut collection at application scope and SHALL dispatch each trigger by its feature identifier through one renderer listener.

#### Scenario: Register shortcuts on startup
- **WHEN** the application main renderer is ready
- **THEN** item, map, stop, bag, combat, portal, story, and chaos-recipe start/pause/stop shortcuts are registered without requiring their pages to be opened

#### Scenario: Update one shortcut
- **WHEN** the user successfully changes one shortcut
- **THEN** all configured shortcuts remain registered and each trigger continues to invoke exactly one action

#### Scenario: Registration fails
- **WHEN** Electron cannot register any shortcut in a proposed collection
- **THEN** the system restores the previous successfully registered collection and reports the failing accelerator

## ADDED Requirements

### Requirement: 混沌配方取件快捷键
系统 SHALL 为自动取件提供开始、暂停/继续和紧急停止三个不冲突的全局快捷键。

#### Scenario: 触发开始
- **WHEN** 用户触发开始快捷键且存在有效计划和校准
- **THEN** 系统开始当前选中套装的取件流程

#### Scenario: 暂停与继续
- **WHEN** 用户在运行中触发暂停/继续快捷键
- **THEN** 系统在下一件物品前暂停或从当前计划位置继续

#### Scenario: 紧急停止
- **WHEN** 用户触发混沌配方停止快捷键
- **THEN** 系统终止取件子进程并释放输入状态
