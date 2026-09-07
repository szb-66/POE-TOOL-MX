## Why

一键入库等自动化脚本的 Ctrl+点击依赖写死的 10–20ms 组合键间隔，与用户配置的操作延迟无关；游戏按帧采样输入时，左键可能落在 Ctrl 未生效的帧，被当作普通点击拾起物品并在后续格子间一路换位。需要把“鼠标悬停稳定”作为唯一用户可调等待，并统一各脚本的内部输入时序。

## What Changes

- `operationDelayMs` 语义改为“鼠标移入后的悬停稳定等待”（严格等于设置值，不设隐藏下限），不再作为点击后等待或剪贴板响应窗口。
- 新增固定内部时序常量（非用户配置）：修饰键稳定 50ms、按键保持 20ms、鼠标按钮保持 20ms、释放后稳定 20ms、剪贴板响应窗口下限 250ms。
- 背包、仓库取件、混沌配方取件、地图洗练、制作五个脚本统一 Ctrl+点击与 Ctrl+C 序列：Ctrl 先按下并保持到点击/按键结束，最后释放 Ctrl。
- 制作与地图的 `click_mouse` 改为显式 press→hold→release 加固定释放等待，不再消耗用户延迟。
- 无配置字段或 API 破坏：`operationDelayMs` 字段名与 20–500ms 范围保持不变。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `automation-operation-delay`: `operationDelayMs` 语义从通用操作等待改为悬停稳定等待，并明确内部固定时序常量边界。
- `bag-auto-stash`: 全局自动操作等待语义更新，Ctrl+点击必须满足固定内部时序。
- `cn-chaos-recipe-overlay`: 独立取件等待语义更新为悬停稳定等待。

## Impact

- 涉及五个 Python 模板脚本、相关 Node 测试、设置页提示文案，以及 OpenSpec 三个 delta 规格。
- 不改变配置迁移、IPC、打包清单或共享运行时。
