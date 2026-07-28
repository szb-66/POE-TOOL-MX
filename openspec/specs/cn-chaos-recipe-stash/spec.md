# cn-chaos-recipe-stash Specification

## Purpose
TBD - created by archiving change integrate-cn-chaos-recipe. Update Purpose after archive.
## Requirements
### Requirement: 国服仓库 Provider
系统 SHALL 优先使用国服新版仓库接口，并在契约不受支持时回退旧版仓库接口。

#### Scenario: 新版接口可用
- **WHEN** `/api/stash/{league}` 返回受支持的仓库结构
- **THEN** 系统缓存新版 Provider 并用仓库 ID 获取选中标签页

#### Scenario: 新版详情为空或明显异常
- **WHEN** 新版详情返回空物品数组，或仅返回少量且没有任何可识别装备类别的条目
- **THEN** 系统使用同一标签页索引受控请求一次旧版详情，选择物品数更多的有效响应并记录所用 Provider

#### Scenario: 回退旧版接口
- **WHEN** 新版接口不可用且旧版 `get-stash-items` 返回有效数据
- **THEN** 系统使用账号名、赛季和标签页索引读取仓库

#### Scenario: 接口均不兼容
- **WHEN** 两种 Provider 都无法产生有效仓库模型
- **THEN** 系统返回 `API_INCOMPATIBLE` 且不启动屏幕扫描替代

### Requirement: 仓库模型与限流
系统 MUST 将支持的响应归一化，并服从服务端限流。

#### Scenario: 归一化普通与大型仓库
- **WHEN** 响应包含普通或大型仓库页
- **THEN** 输出稳定的标签页、布局、物品位置、尺寸、等级、稀有度、鉴定状态和类别字段

#### Scenario: 排除特殊仓库
- **WHEN** 标签页不是普通 12×12 或大型 24×24 布局
- **THEN** 标签页不可被选择用于配方

#### Scenario: 服务端限流
- **WHEN** 接口返回 429 和 `Retry-After`
- **THEN** 系统返回 `RATE_LIMITED` 并在指定时间前拒绝重复刷新

#### Scenario: 手动刷新绕过缓存
- **WHEN** 用户刷新选中仓库页
- **THEN** 仓库网络请求禁用 Chromium HTTP 缓存，不复用先前的空页或旧物品快照

