# cn-chaos-recipe-stash Specification

## Purpose
TBD - created by archiving change integrate-cn-chaos-recipe. Update Purpose after archive.
## Requirements
### Requirement: 国服旧版仓库接口
系统 SHALL 仅使用国服旧版 `get-stash-items` 接口读取仓库列表和详情，不请求需要开发者 OAuth 的新版仓库接口。

#### Scenario: 加载仓库页
- **WHEN** 用户选择已登录账号的国服赛季
- **THEN** 系统使用账号名、赛季、`tabs=1` 和标签索引读取普通/大型仓库列表

#### Scenario: 加载仓库内容
- **WHEN** 用户刷新一个或多个已选仓库页
- **THEN** 系统先重新加载列表，再用最新标签索引和 `tabs=0` 逐页读取详情

#### Scenario: 不请求新版接口
- **WHEN** 用户加载列表或刷新详情
- **THEN** 系统不得请求 `/api/stash/{league}`，也不得维护新版/旧版 Provider 选择

### Requirement: 仓库模型与限流
系统 MUST 将旧接口响应归一化、按用户设置应用文件夹归属，并服从服务端限流。

#### Scenario: 普通与大型仓库
- **WHEN** 响应包含普通或大型仓库页
- **THEN** 系统保留仓库名称和类型，并输出物品位置、尺寸、等级、稀有度、鉴定状态和类别

#### Scenario: 手动文件夹归属
- **WHEN** 用户将仓库页标记为文件夹内或文件夹外
- **THEN** 系统按赛季和仓库 ID 保存选择，并在仓库标签、快照、预览和取件计划中统一使用

#### Scenario: 默认文件夹外
- **WHEN** 仓库页没有已保存的手动选择
- **THEN** 系统将其视为文件夹外，即使接口响应包含 `parent` 或 `folder`

#### Scenario: 仓库类型标签
- **WHEN** 仓库页可用于混沌配方
- **THEN** 系统显示普通或大型类型；手动标记为文件夹内时另行显示“文件夹内”

#### Scenario: 服务端限流
- **WHEN** 接口返回 429 和 `Retry-After`
- **THEN** 系统返回 `RATE_LIMITED` 并在指定时间前拒绝重复刷新

#### Scenario: 手动刷新绕过缓存
- **WHEN** 用户刷新选中仓库页
- **THEN** 仓库请求禁用 Chromium HTTP 缓存，不复用先前空页或旧物品快照

#### Scenario: 账号变化
- **WHEN** 当前账号与缓存所属账号不同
- **THEN** 系统清空仓库列表缓存，不得复用旧账号数据
