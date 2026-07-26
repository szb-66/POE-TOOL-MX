# inventory-grid-coordinate Specification

## Purpose
TBD - created by archiving change unify-inventory-center-coordinate. Update Purpose after archive.
## Requirements
### Requirement: 统一背包网格中心坐标
系统 MUST 将 `inventory.startPos` 解释为背包左上角第一格中心的 Windows 虚拟桌面物理像素坐标，并让地图制作和背包自动入库使用相同网格公式。

#### Scenario: 处理第一格
- **WHEN** 首格中心为 `(2604, 1155)` 且格子间距为 `100 × 100`
- **THEN** 地图制作和背包自动入库都在 `(2604, 1155)` 处理第一格

#### Scenario: 处理后续格子
- **WHEN** 自动化处理第 `column` 列、第 `row` 行
- **THEN** 目标坐标为 `(startX + column × width, startY + row × height)`，且 MUST NOT 增加半格偏移

### Requirement: 旧坐标保持可执行
系统 MUST NOT 因现有背包坐标缺少额外语义或版本字段而阻止地图制作或背包自动入库。

#### Scenario: 使用现有坐标配置
- **WHEN** 用户升级后保留原有 `startPos` 和 `slotSize`
- **THEN** 系统继续允许自动化按原坐标执行，用户可以通过既有设置入口自行调整

