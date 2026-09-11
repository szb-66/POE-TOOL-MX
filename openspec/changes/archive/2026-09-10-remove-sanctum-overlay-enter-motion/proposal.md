## Why

圣所游戏内遮罩和按钮出现时从中心放大并闪烁。逐帧复现确认动画来自 Chromium Aura；此前 thickFrame 与 DWM 方案均未解决实际现象，需要在显隐调用时关闭 Chromium 窗口动画。

## What Changes

- 圣所路线遮罩和采集控制浮窗直接出现，关闭原生窗口动画。
- 保持现有坐标换算、鼠标穿透、拖动和显隐条件。

## Capabilities

### New Capabilities

### Modified Capabilities

- `business-overlay-visual-system`: 圣所游戏内浮窗无入场动画。

## Impact

影响圣所两个窗口的显隐调用、主进程 commandLine 注入和窗口显隐辅助函数；删除失败方案引入的 Python/DWM 依赖，无新增依赖。
