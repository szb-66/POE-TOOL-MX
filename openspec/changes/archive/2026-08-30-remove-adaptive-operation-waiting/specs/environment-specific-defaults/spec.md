## MODIFIED Requirements

### Requirement: 保留与设备无关的默认行为
系统 MUST 保留操作延迟、固定物理输入时序、固定结果等待、战斗扫描与冷却、回城等待等时间默认值，并 SHALL 保留阈值、窗口识别规则、功能模式和默认预设容器；系统 MUST NOT 恢复已删除的自适应等待或自适应上限默认值。

#### Scenario: 空白初始化保留时间配置
- **WHEN** 系统创建空白设置或执行重置
- **THEN** 自动操作等待使用 40ms，组合键稳定使用 20ms，按键保持与鼠标点击保持均使用 15ms，释放后稳定使用 10ms，四项固定结果等待均使用 10ms
- **AND** 物品、地图、海图和商城的默认预设仍可选择和编辑
- **AND** 空白设置不包含 `adaptiveTiming` 或 `adaptiveTimeoutMs`
