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
