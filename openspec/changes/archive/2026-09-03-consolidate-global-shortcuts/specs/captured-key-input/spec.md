## MODIFIED Requirements

### Requirement: Register and dispatch shortcuts centrally
The system SHALL register every non-empty shortcut in the supported application shortcut collection and SHALL dispatch each trigger by its feature identifier through one renderer listener. Empty optional shortcuts SHALL remain stored but MUST NOT be registered or dispatched. The supported collection SHALL include item start, map start, global emergency stop, portal, story previous/next, and price check; it MUST NOT include automatic-potion start/stop, chart analysis, or chaos-recipe start/pause/stop.

#### Scenario: Register shortcuts on startup
- **WHEN** the application main renderer is ready
- **THEN** every non-empty supported shortcut permitted by its module state is registered without requiring its page to be opened

#### Scenario: Start with empty optional shortcuts
- **WHEN** stored optional shortcuts are empty at application startup
- **THEN** the system keeps them empty and omits them from Electron registration without restoring their defaults

#### Scenario: Update one shortcut
- **WHEN** the user successfully changes or clears one optional shortcut
- **THEN** the previous accelerator is unregistered, all remaining configured shortcuts stay registered, and the new value is persisted only after registration succeeds

#### Scenario: Registration fails
- **WHEN** Electron cannot register any non-empty shortcut in a proposed collection
- **THEN** the system restores the previous successfully registered collection and reports the failing accelerator

## ADDED Requirements

### Requirement: 集中展示所有受支持全局快捷键
系统 SHALL 在设置通用页展示全部受支持的用户全局动作快捷键，并 SHALL 让一键回城模块与设置页编辑同一个回城快捷键值。游戏动作按键和开发调试快捷键 MUST NOT 混入该集合。

#### Scenario: 查看通用快捷键设置
- **WHEN** 用户进入设置通用页
- **THEN** 页面展示制作、地图、全局紧急停止、一键回城、剧情上一步与下一步以及国服查价快捷键

#### Scenario: 从两个入口修改回城快捷键
- **WHEN** 用户在设置页或一键回城模块成功修改回城快捷键
- **THEN** 另一入口立即显示同一值且系统只注册该组合一次

### Requirement: 清理废弃快捷键
系统 MUST 在加载旧设置时删除自动喝药开始、自动喝药停止、海图分析以及配方开始、暂停/继续、紧急停止快捷键，MUST 不再注册或分发这些字段，并 SHALL 保留其他受支持的用户自定义快捷键。

#### Scenario: 升级旧设置
- **WHEN** 已保存的全局快捷键包含任意废弃字段
- **THEN** 系统剥离废弃字段、持久化清理后的集合并保证对应旧组合不再触发动作

#### Scenario: 保留其他自定义快捷键
- **WHEN** 旧设置同时包含废弃字段和受支持的自定义快捷键
- **THEN** 系统仅删除废弃字段并原样保留规范化后的受支持值

## REMOVED Requirements

### Requirement: 九宫格分析快捷键
**Reason**: 海图分析改为仅从页面按钮启动，避免旧默认 `Alt+7` 和隐形持久化绑定继续触发自动输入。

**Migration**: 加载设置时无条件删除 `puzzleAnalyze`，用户改用海图页面的「自动识别两页」按钮。

### Requirement: 混沌配方取件快捷键
**Reason**: 配方开始、暂停/继续和停止改为页面控制与统一全局紧急停止，避免为同一自动化保留独立的全局快捷键组。

**Migration**: 加载设置时无条件删除 `chaosRecipeStart`、`chaosRecipePause` 与 `chaosRecipeStop`；用户通过配方页面开始或暂停/继续，并通过全局紧急停止终止取件流程。
