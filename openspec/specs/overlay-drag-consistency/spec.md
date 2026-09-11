# overlay-drag-consistency Specification

## Purpose

统一项目内浮窗拖动的交互反馈、会话计算和尺寸约束，避免 Windows 高 DPI 环境中的坐标跳变、尺寸漂移和穿透失效。

## Requirements

### Requirement: Pointer-managed overlays share one drag protocol
固定尺寸或需要鼠标穿透的可拖动浮窗 SHALL 使用 Pointer Capture、主进程固定起点会话和规范尺寸边界，不得从上一帧原生尺寸累积计算下一帧。

#### Scenario: Drag a fixed-size overlay
- **WHEN** 用户按住浮窗抓手并持续移动指针
- **THEN** 浮窗 SHALL 从按下时的位置计算目标坐标，保持规范宽高，并在指针离开抓手后继续拖动直到释放

#### Scenario: Reject unrelated drag messages
- **WHEN** 非当前浮窗渲染进程或错误指针会话发送移动消息
- **THEN** 主进程 MUST 忽略该消息且不得移动窗口

### Requirement: Drag affordance is consistent
位置抓手 SHALL 在可拖动时显示 `grab` 光标，在按下拖动时显示 `grabbing`；按钮和输入等非拖动区域 MUST 标记为 `no-drag`。

#### Scenario: Hover and press a position grip
- **WHEN** 指针进入位置抓手并按下
- **THEN** 光标 SHALL 从 `grab` 变为 `grabbing`

### Requirement: Native drag is limited to interactive resizable windows
完整交互且允许调整大小的独立浮窗 MAY 使用同窗口原生标题栏拖动，但 MUST NOT 在原生移动事件中逐帧回写自身边界；一维分割抓手 MAY 使用对应轴向调整光标。

#### Scenario: Drag an interactive resizable overlay
- **WHEN** 用户拖动价格检查浮窗的原生标题栏
- **THEN** 系统 SHALL 由原生窗口直接移动，且脚本 MUST NOT 在移动回调中重写窗口位置或尺寸

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

### Requirement: 共享检测浮窗周期同步无重复显隐
背包及混沌控制浮窗 MUST 按实际可见状态执行显隐切换；周期更新 SHALL 保留状态推送、拖动结束与截图后恢复行为。

#### Scenario: 重复状态
- **WHEN** 浮窗连续收到相同显隐状态
- **THEN** 系统不得重复调用原生显示或隐藏操作

#### Scenario: 实际状态被临时改变
- **WHEN** 截图操作临时隐藏浮窗后恢复业务状态
- **THEN** 系统按窗口实际状态恢复显示，正常关闭时结束拖动
