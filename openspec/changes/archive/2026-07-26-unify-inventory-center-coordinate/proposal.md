## Why

背包首格坐标在设置页和地图制作中表示第一格中心，但自动入库又额外增加半格偏移，导致同一配置指向不同位置。该冲突会让地图制作停在格子边界、复制不到地图信息，并使用户无法用一次取点同时可靠配置两项自动化。

## What Changes

- 将 `inventory.startPos` 的唯一语义定义为背包左上角第一格中心的 Windows 物理像素坐标。
- 修改背包自动入库的网格计算，移除半格宽高偏移，与地图制作使用同一公式。

## Capabilities

### New Capabilities

- `inventory-grid-coordinate`: 定义地图制作和自动入库一致的背包网格中心坐标行为。

### Modified Capabilities

- `bag-auto-stash`: 自动入库改为直接使用首格中心坐标。

## Impact

影响 Python 自动入库脚本及其坐标回归测试。不改变设置格式、旧数据、启动校验或外部接口。
