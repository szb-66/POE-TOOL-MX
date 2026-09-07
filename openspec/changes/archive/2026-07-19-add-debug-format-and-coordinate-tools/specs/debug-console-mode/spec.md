## ADDED Requirements

### Requirement: 调试模式设置
系统 SHALL 在设置页提供默认关闭的调试模式开关，并持久化用户选择。

#### Scenario: 开启调试模式
- **WHEN** 用户开启调试模式
- **THEN** 系统打开主窗口的 Chromium DevTools 并提供 Console 调试面板
- **AND** 系统保存开启状态

#### Scenario: 关闭调试模式
- **WHEN** 用户关闭调试模式
- **THEN** 系统关闭主窗口的 DevTools
- **AND** 系统保存关闭状态

#### Scenario: 启动时恢复调试模式
- **WHEN** 应用启动且保存的调试模式为开启
- **THEN** 系统在主窗口就绪后自动打开 DevTools

#### Scenario: 重置设置
- **WHEN** 用户确认重置全部设置
- **THEN** 系统将调试模式恢复为关闭并关闭 DevTools

### Requirement: 调试状态同步
系统 MUST 以主窗口 DevTools 的实际可见状态同步设置开关，且不改变现有调试快捷键能力。

#### Scenario: 快捷键打开开发者工具
- **WHEN** 用户通过 F12 或 Ctrl+Shift+I 打开 DevTools
- **THEN** 设置中的调试模式状态同步为开启并持久化

#### Scenario: 手工关闭开发者工具
- **WHEN** 用户从 DevTools 界面手工关闭该面板
- **THEN** 设置中的调试模式状态同步为关闭并持久化

#### Scenario: Console 定位失败
- **WHEN** DevTools 已打开但系统无法自动切换至 Console
- **THEN** 系统保持 DevTools 打开且不影响应用其他功能
