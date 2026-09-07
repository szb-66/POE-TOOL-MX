## ADDED Requirements

### Requirement: Dynamic module geometry converges
系统 SHALL 在浮窗模块显隐或计时文本更新时，仅对真实变化的尺寸和布局进行同步，并 MUST 在布局稳定后停止产生后续几何更新。

#### Scenario: Toggle an overlay module
- **WHEN** 用户启用或关闭剧情、技能或计时模块
- **THEN** 浮窗完成一次必要的宽高与抓手位置调整后保持稳定

#### Scenario: Tick the timer
- **WHEN** 运行中的计时每秒更新显示且文本占用尺寸未变化
- **THEN** 系统不得重复应用相同的原生窗口边界或布局

