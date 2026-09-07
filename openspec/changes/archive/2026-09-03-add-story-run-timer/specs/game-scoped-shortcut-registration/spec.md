## ADDED Requirements

### Requirement: Toggle the story timer by configured shortcut
系统 SHALL 支持默认留空的剧情计时启停快捷键，并将其纳入现有捕获、重复校验、持久化、模块过滤和前台门禁流程。

#### Scenario: Trigger the timer shortcut
- **WHEN** 已配置的剧情计时快捷键成功触发
- **THEN** 系统执行与页面单一启停按钮相同的开始、继续或停止动作

#### Scenario: Background policy conflicts with shortcut availability
- **WHEN** 后台停止已开启且快捷键在游戏后台被触发或分发
- **THEN** 后台停止规则优先，系统不得开始或继续计时
