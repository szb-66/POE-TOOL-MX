# game-window-title-configuration Specification

## Purpose

允许用户统一配置桌面助手用于识别游戏窗口的一个或多个标题片段，并保证所有窗口检测和自动化模块采用相同的优先级与运行时配置。

## Requirements

### Requirement: 可编辑的窗口名称列表
系统 SHALL 在设置页提供按顺序排列的游戏窗口名称列表，并允许用户新增、编辑、删除和拖拽排序；系统 MUST 持久化每次有效修改。

#### Scenario: 新增与编辑名称
- **WHEN** 用户新增或编辑一个非空且不与现有名称重复的窗口名称
- **THEN** 系统去除名称首尾空白并保存更新后的完整列表

#### Scenario: 拖拽调整顺序
- **WHEN** 用户拖动一个窗口名称到新的位置
- **THEN** 系统保存新顺序并将靠前名称视为更高优先级

#### Scenario: 无效名称
- **WHEN** 用户提交空名称、纯空白名称或忽略大小写后与现有项重复的名称
- **THEN** 系统拒绝修改、保留上一份有效列表并显示可理解的错误

#### Scenario: 删除最后一项
- **WHEN** 用户尝试删除列表中唯一的窗口名称
- **THEN** 系统拒绝删除并保留该名称

### Requirement: 可编辑的客户端进程名列表
系统 SHALL 在设置页提供游戏客户端进程名列表，默认包含独立版、Steam 与 Epic 客户端进程名（`PathOfExile.exe`、`PathOfExile_x64.exe`、`PathOfExileSteam.exe`、`PathOfExile_x64Steam.exe`、`PathOfExileEGS.exe`、`PathOfExile_x64EGS.exe`），并允许用户新增、编辑和删除；系统 MUST 持久化每次有效修改，并在保存时只保留进程文件名部分。

#### Scenario: 新增与编辑进程名
- **WHEN** 用户新增或编辑一个非空且不与现有项重复的进程名
- **THEN** 系统去除首尾空白与路径前缀后保存更新后的完整列表

#### Scenario: 路径形式的进程名
- **WHEN** 用户输入完整路径（如 `C:\Games\Path of Exile\PathOfExile.exe`）
- **THEN** 系统自动归一化为文件名 `PathOfExile.exe` 后保存

#### Scenario: 删除最后一项
- **WHEN** 用户尝试删除列表中唯一的进程名
- **THEN** 系统拒绝删除并保留该名称

### Requirement: 按配置顺序匹配窗口
系统 MUST 使用不区分大小写的包含匹配识别窗口标题，并 MUST 同时校验窗口所属进程的文件名匹配游戏客户端进程名列表（不区分大小写，默认包含“PathOfExile.exe”“PathOfExile_x64.exe”“PathOfExileSteam.exe”“PathOfExile_x64Steam.exe”“PathOfExileEGS.exe”“PathOfExile_x64EGS.exe”）；只有标题与进程名同时匹配的窗口才视为游戏窗口。当多个游戏窗口同时存在时，系统 MUST 优先选择列表中更靠前名称对应的窗口；进程名无法读取或不在列表中的窗口 MUST NOT 作为游戏窗口。

#### Scenario: 多个名称同时存在
- **WHEN** 可用窗口分别匹配列表中的不同名称
- **THEN** 系统选择匹配最靠前配置名称的候选窗口

#### Scenario: 同一窗口匹配多个名称
- **WHEN** 一个窗口标题同时包含多个配置名称
- **THEN** 系统以最靠前的命中名称计算该窗口的优先级

#### Scenario: 浏览器标题误判
- **WHEN** 前台窗口标题包含配置名称但所属进程不是游戏客户端（例如浏览器标签页“Path of Exile 编年史”）
- **THEN** 系统不将该窗口识别为游戏窗口

#### Scenario: 同一名称的多个候选
- **WHEN** 多个候选窗口匹配同一个配置名称
- **THEN** 系统在该名称优先级内沿用对应功能既有的前台、可见、最小化和面积选择规则

### Requirement: 全局热更新与兼容回退
系统 MUST 将有效窗口名称列表和游戏客户端进程名列表同步给主进程和所有游戏窗口识别脚本；运行中的长期任务 SHALL 在后续窗口校验时使用新配置，且配置缺失、损坏或暂时不可读时 MUST 使用默认标题列表“流放之路”“Path of Exile”和默认进程名列表。

#### Scenario: 运行中修改配置
- **WHEN** 用户在自动喝药或公共界面检测运行期间保存新的名称、顺序或进程名列表
- **THEN** 运行进程无需重启，并在下一次窗口识别时使用更新后的列表

#### Scenario: 旧版本设置
- **WHEN** 已保存设置不包含窗口名称列表或进程名列表
- **THEN** 系统加载默认列表并继续正常初始化

#### Scenario: 运行时配置不可读
- **WHEN** 窗口名称共享配置缺失、损坏或读取失败
- **THEN** 窗口识别继续使用默认标题与进程名列表，且不向非游戏窗口发送输入
