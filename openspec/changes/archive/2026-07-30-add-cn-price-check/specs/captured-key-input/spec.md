## MODIFIED Requirements

### Requirement: Validate the complete global shortcut set
The system SHALL validate shortcuts after normalization across every feature, including price check, and SHALL reject duplicates, unsupported accelerators, F12, and Ctrl+Shift+I.

#### Scenario: Detect a cross-feature conflict
- **WHEN** a proposed price-check shortcut matches another configured shortcut regardless of case or display alias
- **THEN** the system rejects the proposal and preserves the previous value

#### Scenario: Accept supported navigation keys
- **WHEN** the user captures PageUp or PageDown
- **THEN** the system stores and registers the corresponding valid Electron accelerator

### Requirement: Register and dispatch shortcuts centrally
The system SHALL register the complete shortcut collection at application scope and SHALL dispatch each trigger by its feature identifier through one renderer listener.

#### Scenario: Register shortcuts on startup
- **WHEN** the application main renderer is ready
- **THEN** item, map, stop, combat, portal, story, chaos-recipe and price-check shortcuts are registered without requiring their pages to be opened

#### Scenario: Update one shortcut
- **WHEN** the user successfully changes one shortcut
- **THEN** all configured shortcuts remain registered and each trigger continues to invoke exactly one action

#### Scenario: Registration fails
- **WHEN** Electron cannot register any shortcut in a proposed collection
- **THEN** the system restores the previous successfully registered collection and reports the failing accelerator

### Requirement: 国服查价快捷键
系统 SHALL 为查价提供一个默认 `Ctrl+D` 且可配置的不冲突全局快捷键。

#### Scenario: 触发查价
- **WHEN** 用户在游戏中触发查价快捷键
- **THEN** 系统读取当前物品剪贴板并打开或更新查价覆盖层
