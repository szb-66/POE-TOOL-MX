## Why

单件或阶段制作输出的“[完成]”被浮窗误判为整个流程结束，开启外部点击关闭，导致批量制作仍运行时浮窗消失。

## What Changes

- 物品制作改用结构化流程完成事件，单件完成仅更新进度。
- 停止时按终止原因判定结果，不根据当前单件匹配结果推断整批成功。
- 保留完成后的外部点击关闭与地图完成规则，补充生命周期回归测试。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `crafting-overlay-controls`: 物品流程完成及外部点击关闭仅由流程级结果驱动。
- `batch-inventory-crafting`: 单件完成期间保持批次运行与浮窗显示。

## Impact

影响制作浮窗事件处理及测试；复用既有 IPC 和脚本事件，不更改通货操作或预检。
