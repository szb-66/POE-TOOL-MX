# story-overlay-stability Specification

## Purpose

保证剧情浮窗在自适应内容高度、调整分栏和同步原生窗口时能够快速收敛，不会因重复几何状态产生持续事件循环或使应用失去响应。

## Requirements

### Requirement: Geometry synchronization converges
系统 SHALL 仅在剧情浮窗的测量高度、内容布局或原生窗口边界实际变化时应用对应更新，且同步链路 MUST 在状态稳定后停止产生后续更新。

#### Scenario: Open overlay with stable content
- **WHEN** 用户打开内容已经稳定的剧情浮窗
- **THEN** 系统完成必要的高度和布局同步后停止重复上报，主界面和浮窗保持响应

#### Scenario: Report unchanged geometry
- **WHEN** 渲染内容的高度和布局与上次成功上报的值相同
- **THEN** 系统 MUST NOT 重复发送尺寸或布局更新

#### Scenario: Apply a real geometry change
- **WHEN** 剧情内容、浮窗宽度或分栏导致测量几何实际变化
- **THEN** 系统 SHALL 应用新几何并在新状态稳定后停止同步

### Requirement: Divider synchronization is idempotent
系统 SHALL 在初始化和用户拖动分割抓手时向剧情浮窗发布分栏比例，但 MUST NOT 将渲染端的布局上报无条件回显为相同比例。

#### Scenario: Receive unchanged divider ratio
- **WHEN** 剧情浮窗收到与当前分栏比例相同的值
- **THEN** 系统 MUST NOT 启动新的几何上报

#### Scenario: Drag divider grip
- **WHEN** 用户拖动分割抓手并产生新的有效比例
- **THEN** 系统 SHALL 更新浮窗分栏并在布局稳定后停止同步

### Requirement: Native grip dragging remains stable
系统 SHALL 使用 Pointer Capture 和固定起点会话处理剧情位置抓手，主进程每次移动 MUST 从规范尺寸生成完整边界；程序对齐分栏抓手时 MUST NOT 反向改变分栏比例。

#### Scenario: Drag overlay position grip
- **WHEN** 用户持续拖动剧情浮窗的位置抓手
- **THEN** 浮窗 SHALL 从按下时的固定起点连续跟随指针，MUST NOT 在鼠标位置与屏幕边角之间闪动，宽高 MUST NOT 随拖动增长

#### Scenario: Preserve click-through outside position grip
- **WHEN** 指针不在位置抓手区域
- **THEN** 剧情浮窗内容 SHALL 保持鼠标穿透；主进程检测到指针进入抓手热区时 SHALL 仅让该窗口进入可拖动状态

#### Scenario: Programmatically align divider grip
- **WHEN** 系统因浮窗移动或布局同步而程序化设置分栏抓手边界
- **THEN** 当前分栏比例 MUST 保持不变
