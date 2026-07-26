## ADDED Requirements

### Requirement: 自动入库使用首格中心坐标
系统 MUST 直接使用配置的首格中心坐标扫描背包。

#### Scenario: 扫描首格
- **WHEN** 自动入库开始扫描已校准的背包网格
- **THEN** 第一格目标坐标等于配置的 `startPos`，不增加半格宽高
