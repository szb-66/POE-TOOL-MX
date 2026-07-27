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

### Requirement: 额外背包负列坐标
系统 MUST 保持 `inventory.startPos` 为原生左上首格中心，并使用相对原生首列的负列编号推导额外背包格子中心。

#### Scenario: 计算紧邻原生的额外格
- **WHEN** 原生首格中心为 `(x, y)`、格宽为 `w` 且扫描额外列 `-1` 的首行
- **THEN** 目标中心为 `(x - w, y)`

#### Scenario: 计算最左额外格
- **WHEN** 开启 6 列额外背包并扫描列 `-6`、行 `r`
- **THEN** 目标中心为 `(startX - 6 × width, startY + r × height)`

#### Scenario: 原生坐标保持兼容
- **WHEN** 加载缺少布局字段的旧配置或关闭额外背包
- **THEN** 原生背包和地图制作继续使用现有首格中心及格子间距公式
