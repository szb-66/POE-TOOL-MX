# captured-key-input Specification

## Purpose

Define consistent keyboard-capture, validation, registration, and dispatch behavior for global shortcuts and game action keys.
## Requirements
### Requirement: Capture global shortcuts from keyboard input
The system SHALL configure every global shortcut through a focused keyboard-capture control instead of editable text, SHALL provide an explicit clear action for optional shortcuts, and MUST NOT expose or accept clearing for the global emergency-stop shortcut.

#### Scenario: Capture a keyboard combination
- **WHEN** the focused control receives supported modifiers followed by a supported non-modifier key
- **THEN** it displays and submits one normalized Electron accelerator

#### Scenario: Capture an already registered combination
- **WHEN** the user starts capture and presses a combination such as Alt+1 that is currently registered globally
- **THEN** the system temporarily suspends global shortcut interception and captures the complete combination before restoring registrations

#### Scenario: Press only a modifier
- **WHEN** the focused control receives only Ctrl, Alt, Shift, or Meta
- **THEN** it remains in capture mode without submitting a value

#### Scenario: Cancel or clear capture
- **WHEN** the user presses Escape, presses Backspace/Delete while capturing, or activates the clear button on an optional shortcut
- **THEN** Escape cancels without changing the value and either clear operation submits an empty value

#### Scenario: Attempt to clear emergency stop
- **WHEN** the global emergency-stop shortcut is being configured
- **THEN** the control does not expose a clear button and Backspace/Delete does not submit an empty value

#### Scenario: Prevent captured input propagation
- **WHEN** the control is in capture mode
- **THEN** captured keyboard events do not trigger page actions or other shortcut handlers

### Requirement: Validate the complete global shortcut set
The system SHALL validate shortcuts after normalization across every feature, including price check, and SHALL reject duplicates, unsupported accelerators, F12, and Ctrl+Shift+I.

#### Scenario: Detect a cross-feature conflict
- **WHEN** a proposed price-check shortcut matches another configured shortcut regardless of case or display alias
- **THEN** the system rejects the proposal and preserves the previous value

#### Scenario: Accept supported navigation keys
- **WHEN** the user captures PageUp or PageDown
- **THEN** the system stores and registers the corresponding valid Electron accelerator

### Requirement: Register and dispatch shortcuts centrally
The system SHALL register every non-empty shortcut in the application shortcut collection and SHALL dispatch each trigger by its feature identifier through one renderer listener. Empty optional shortcuts SHALL remain stored but MUST NOT be registered or dispatched.

#### Scenario: Register shortcuts on startup
- **WHEN** the application main renderer is ready
- **THEN** every non-empty item, map, stop, combat, portal, story, chaos-recipe and price-check shortcut permitted by its module state is registered without requiring its page to be opened

#### Scenario: Start with empty optional shortcuts
- **WHEN** stored optional shortcuts are empty at application startup
- **THEN** the system keeps them empty and omits them from Electron registration without restoring their defaults

#### Scenario: Update one shortcut
- **WHEN** the user successfully changes or clears one optional shortcut
- **THEN** the previous accelerator is unregistered, all remaining configured shortcuts stay registered, and the new value is persisted only after registration succeeds

#### Scenario: Registration fails
- **WHEN** Electron cannot register any non-empty shortcut in a proposed collection
- **THEN** the system restores the previous successfully registered collection and reports the failing accelerator

### Requirement: Capture game action keys
The system SHALL use capture controls for single game action keys and an ordered tag editor for multi-key potion sequences.

#### Scenario: Capture a single action key
- **WHEN** the user captures the portal action key
- **THEN** the system stores one supported non-modifier key for the existing game-input workflow

#### Scenario: Build a potion key sequence
- **WHEN** the user captures multiple potion keys one at a time
- **THEN** the system appends each key as a removable tag and sends the sequence in displayed order

#### Scenario: Reorder a potion key sequence
- **WHEN** the user drags a potion key tag to a new position
- **THEN** the persisted sequence and runtime send order match the new tag order

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

### Requirement: 国服查价快捷键
系统 SHALL 为查价提供一个默认 `Ctrl+D` 且可配置的不冲突全局快捷键。

#### Scenario: 触发查价
- **WHEN** 用户在游戏中触发查价快捷键
- **THEN** 系统读取当前物品剪贴板并打开或更新查价覆盖层

### Requirement: 查价快捷键受模块开关控制
系统 MUST 只在查价模块启用且查价快捷键非空时注册该快捷键，并 SHALL 保持全局快捷键更新的事务回滚语义。清空查价快捷键 MUST NOT 改变查价模块的启用状态。

#### Scenario: 关闭查价
- **WHEN** 用户关闭查价模块
- **THEN** 系统重新注册除查价外的非空快捷键并保证原查价组合不触发任何查价动作

#### Scenario: 修改查价快捷键
- **WHEN** 查价模块关闭且用户修改查价快捷键
- **THEN** 系统保存新组合但不注册，直到模块再次开启

#### Scenario: 启用状态下清空查价快捷键
- **WHEN** 查价模块已经启用且用户清空查价快捷键
- **THEN** 系统注销原查价组合、保持模块启用，并在用户重新设置非空组合后恢复注册

#### Scenario: 空快捷键下启用查价
- **WHEN** 查价快捷键为空且用户启用查价模块
- **THEN** 系统保持模块启用但不注册快捷键，等待用户之后设置非空组合

### Requirement: 九宫格分析快捷键
系统 SHALL 为九宫格识别提供默认 `Alt+7` 且可配置、不冲突的全局快捷键。

#### Scenario: 启动九宫格分析
- **WHEN** 用户在游戏前台触发九宫格快捷键
- **THEN** 系统通过统一快捷键分发器启动一次九宫格仓库分析

#### Scenario: 修改九宫格快捷键
- **WHEN** 用户通过快捷键捕获控件修改九宫格快捷键
- **THEN** 系统随完整快捷键集合一起校验、保存并事务式重新注册该组合

### Requirement: 全局紧急停止全部游戏自动化
系统 SHALL 将非空的全局结束快捷键作为统一紧急停止入口，一次触发停止所有当前正在产生或可能继续产生游戏键鼠输入的自动化任务，包括制作/地图、自动入库、仓库取件、君锋镇取件、浮士德市集改价、混沌配方取件、自动喝药、主动循环、一键回城、海图识别、海图词缀探测和海图自动放入。系统 MUST 拒绝将该快捷键保存为空，并 MUST 将历史损坏的空值恢复为默认 `Alt+3`。

#### Scenario: 同时停止独立自动化
- **WHEN** 自动喝药与制作或其他自动化同时运行，且用户触发全局结束快捷键
- **THEN** 系统停止自动喝药的完整监控周期和其他全部运行中自动化，而不是只跳过当前一次动作

#### Scenario: 停止浮士德市集改价
- **WHEN** 浮士德市集改价正在运行且用户触发全局结束快捷键
- **THEN** 系统终止浮士德的后续输入、释放输入和自动化锁，并将该任务计入紧急停止结果

#### Scenario: 单项停止失败
- **WHEN** 多项自动化正在运行且其中一项停止失败
- **THEN** 系统仍尝试停止其余全部自动化，并汇总实际停止项和失败项

#### Scenario: 重复触发紧急停止
- **WHEN** 用户在停止流程进行中连续触发全局结束快捷键
- **THEN** 系统复用同一个停止流程，不重复启动并发终止操作

#### Scenario: 保留模块配置
- **WHEN** 全局紧急停止成功终止当前任务
- **THEN** 系统保留各模块启用状态、检测器和控制浮窗，用户可再次手动启动任务

#### Scenario: 空闲时触发
- **WHEN** 当前没有运行中的游戏自动化且用户触发全局结束快捷键
- **THEN** 系统安全返回无运行任务，不改变任何模块配置

#### Scenario: 遵守快捷键前台作用域
- **WHEN** 用户启用了“仅在游戏窗口前台时生效”且游戏不在前台
- **THEN** 全局结束快捷键与其他全局快捷键一样暂停，不绕过现有作用域设置

#### Scenario: 拒绝清空紧急停止
- **WHEN** 用户或内部调用尝试把全局紧急停止快捷键保存为空或仅包含空白
- **THEN** 系统拒绝更新并保留原快捷键及原注册集合

#### Scenario: 迁移历史空紧急停止
- **WHEN** 应用加载到全局紧急停止为空或仅包含空白的历史设置
- **THEN** 系统恢复并持久化默认 `Alt+3`，确保界面、Electron 注册和自动化脚本使用同一个有效值
