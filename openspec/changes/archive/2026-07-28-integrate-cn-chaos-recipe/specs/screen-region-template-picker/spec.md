## ADDED Requirements

### Requirement: 混沌配方仓库网格校准
系统 SHALL 允许混沌配方模块分别保存普通与大型仓库的物理屏幕矩形。

#### Scenario: 保存普通仓库区域
- **WHEN** 用户为普通仓库完成有效矩形选取
- **THEN** 系统保存该区域及显示器/DPI 元数据并用于 12×12 坐标换算

#### Scenario: 保存大型仓库区域
- **WHEN** 用户为大型仓库完成有效矩形选取
- **THEN** 系统独立保存该区域并用于 24×24 坐标换算

#### Scenario: 缺少所需校准
- **WHEN** 取件计划包含尚未校准的仓库布局
- **THEN** 系统返回 `CALIBRATION_REQUIRED` 且不得开始自动取件
