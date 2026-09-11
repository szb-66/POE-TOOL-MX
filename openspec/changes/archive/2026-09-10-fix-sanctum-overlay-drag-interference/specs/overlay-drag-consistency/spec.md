## ADDED Requirements

### Requirement: Sanctum overlays preserve native main-window dragging
圣所浮窗 SHALL 在采集运行、停止及隐藏后保持主窗口原生拖动稳定；纯展示路线浮窗 MUST 保持鼠标穿透且不参与鼠标移动交互。

#### Scenario: Drag after stopping capture
- **WHEN** 用户开始圣所采集后停止并拖动普通主窗口
- **THEN** 主窗口 SHALL 跟随鼠标平滑移动，不受残留浮窗输入处理或重复显隐影响

#### Scenario: Repeated hidden updates
- **WHEN** 已隐藏的圣所浮窗收到重复状态更新
- **THEN** 浮窗 MUST 保持隐藏，且不得重复执行原生显隐操作

#### Scenario: Capture hiding and restart
- **WHEN** 截图嵌套临时隐藏浮窗后完成、失败或采集已停止
- **THEN** 浮窗 SHALL 在最后一个隐藏操作结束后按最新状态恢复，停止时不得恢复过期路线；再次采集仍可正常显示

#### Scenario: Destroy during capture hiding
- **WHEN** 临时隐藏操作尚未结束时浮窗管理器被销毁
- **THEN** 后续回调 MUST NOT 重建窗口或调用已销毁窗口
