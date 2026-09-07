## MODIFIED Requirements

### Requirement: 混沌配方仓库网格校准
系统 SHALL 分别保存文件夹外和文件夹内仓库的物理屏幕矩形，并独立按仓库类型确定网格密度。

#### Scenario: 保存两类仓库区域
- **WHEN** 用户为文件夹外或文件夹内仓库完成有效矩形选取
- **THEN** 系统独立保存区域及显示器/DPI 元数据，普通和大型共用对应区域

#### Scenario: 普通与大型网格密度
- **WHEN** 目标仓库分别为普通或大型仓库
- **THEN** 系统在所选目录层级区域内分别按 12×12 或 24×24 换算

#### Scenario: 手动选择文件夹归属
- **WHEN** 用户将仓库页标记为文件夹内
- **THEN** 预览与取件使用文件夹内校准；用户标记为文件夹外或未设置时使用文件夹外校准

#### Scenario: 忽略接口文件夹关系
- **WHEN** 旧接口缺少或错误返回 `parent`、`folder` 等关系
- **THEN** 这些字段不得改变用户选择的校准区域

#### Scenario: 迁移旧校准
- **WHEN** 用户已有 `normal/quad/folderNormal/folderQuad` 四键校准
- **THEN** 系统将可用旧区域迁移为 `root/folder`，且不要求重复校准普通和大型仓库

#### Scenario: 缺少所需校准
- **WHEN** 取件计划包含尚未校准的仓库布局
- **THEN** 系统返回 `CALIBRATION_REQUIRED` 且不得开始自动取件
