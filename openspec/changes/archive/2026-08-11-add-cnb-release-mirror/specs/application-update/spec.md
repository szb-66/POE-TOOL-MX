## ADDED Requirements

### Requirement: 用户可选正式更新源
正式 Windows 客户端 SHALL 默认使用 CNB 仓库 `Auto-Tool-MX/POE-TOOL-MX` 的 Latest Release，并 SHALL 允许用户手动切换到同版本 GitHub Release；所选来源 MUST 持久化并统一用于更新元数据、安装包和差分块映射。

#### Scenario: 首次使用默认来源
- **WHEN** 用户没有保存过更新来源设置
- **THEN** 客户端选择 CNB 作为更新来源并在设置中标记为国内推荐

#### Scenario: 手动切换来源
- **WHEN** 当前没有进行检查或下载且用户选择 CNB 或 GitHub
- **THEN** 客户端持久化所选来源，并让之后的检查和下载使用对应 Latest Release

#### Scenario: 更新操作进行中
- **WHEN** 客户端正在检查或下载更新
- **THEN** 设置界面禁止切换来源，避免同一次更新跨来源混用资产

#### Scenario: 检查并下载稳定更新
- **WHEN** 已安装客户端从所选来源的 `latest.yml` 检查到高于当前版本的稳定版本并开始下载
- **THEN** 客户端从同一来源获取安装包及 `.blockmap`，并继续执行现有摘要校验、进度展示和确认安装流程

#### Scenario: 所选更新源不可用
- **WHEN** 所选来源的元数据或更新资产请求失败、超时或返回无效内容
- **THEN** 客户端按既有更新失败隔离规则继续运行，显示当前来源并允许用户手动切换后重试，不自动改用另一来源且不影响离线功能
