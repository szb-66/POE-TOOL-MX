## Why

墓场截图底部房间与状态图标粘连，首领图标切碎暗框，导致两间漏检及入口状态误报。图片模板无法通用覆盖首领外观。

## What Changes

- 用实际边框、可信尺寸和连续连线恢复房间，支持同列缺房及单房间末列。
- 移除首领图片模板检测，以完整地图拓扑确认出口，详情文字确认房间类型。
- 增加墓场真实样本与既有楼层回归。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `sanctum-recognition`: 通用边框恢复与独立几何出口证据。

## Impact

Python 单帧地图识别、出口证据及回归测试；公共接口和存档格式不变。
