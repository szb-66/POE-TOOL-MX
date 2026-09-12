## Why

圣所地图关闭时独立状态栏会自动显示，额外要求独立状态栏锚点造成重复校准和不必要的采集失败。

## What Changes

- 移除独立状态栏锚点校准与运行时匹配依赖，保留地图内锚点。
- 在有效采集上下文中根据地图关闭选择独立布局，保留扫描覆盖证据与输入保护。
- 旧独立锚点配置可保留但不参与识别，其他区域无需重配。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `sanctum-recognition`: 调整独立状态栏布局判定、校准和扫描前置条件。

## Impact

影响圣所校准 Vue 页面、Electron 采集驱动、Python 原生布局判断及相关测试；不增加依赖或改变公开接口结构。
