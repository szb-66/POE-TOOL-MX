## ADDED Requirements

### Requirement: 查价快捷键受模块开关控制
系统 MUST 只在查价模块启用时注册其快捷键，并 SHALL 保持全局快捷键更新的事务回滚语义。

#### Scenario: 关闭查价
- **WHEN** 用户关闭查价模块
- **THEN** 系统重新注册除查价外的快捷键并保证 `Ctrl+D` 不触发任何查价动作

#### Scenario: 修改查价快捷键
- **WHEN** 查价模块关闭且用户修改查价快捷键
- **THEN** 系统保存新组合但不注册，直到模块再次开启
