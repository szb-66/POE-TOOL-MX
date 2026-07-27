## ADDED Requirements

### Requirement: 额外背包负列坐标
系统 MUST 保持 `inventory.startPos` 为原生左上首格中心，并使用相对原生首列的负列编号推导额外背包格子中心。

#### Scenario: 计算紧邻原生的额外格
- **WHEN** 原生首格中心为 `(x, y)`、格宽为 `w` 且扫描额外列 `-1` 的首行
- **THEN** 目标中心为 `(x - w, y)`

#### Scenario: 计算最左额外格
- **WHEN** 开启 5 列额外背包并扫描列 `-5`、行 `r`
- **THEN** 目标中心为 `(startX - 5 × width, startY + r × height)`

#### Scenario: 原生坐标保持兼容
- **WHEN** 加载缺少布局字段的旧配置或关闭额外背包
- **THEN** 原生背包和地图制作继续使用现有首格中心及格子间距公式
