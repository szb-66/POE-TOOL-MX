## ADDED Requirements

### Requirement: Electron 到 Tauri 使用完整安装器切换
Electron 正式版到首个 Tauri 正式版 MUST 使用经过发布校验的完整 Windows 安装器，MUST NOT 将 Electron 差分块映射或增量更新状态复用于 Tauri 安装。

#### Scenario: 现有 Electron 用户切换到 Tauri
- **WHEN** 用户明确启动首个 Tauri 完整安装器
- **THEN** 安装器替换应用运行文件、保留 `%APPDATA%/流放助手`，并让 Tauri 首启执行直接数据迁移

## MODIFIED Requirements

### Requirement: 安全的确认安装
系统 MUST 只在用户点击已就绪的安装入口后安装已下载更新，该点击 SHALL 被视为明确安装授权且不再弹出应用内二次确认。系统 MUST 在启动经过签名验证的 Tauri 安装器前完成受管资源清理，并 SHALL 让 Windows 安装流程处理退出和重新运行。

#### Scenario: 清理成功
- **WHEN** 用户点击安装、更新签名验证成功且受管资源全部清理成功
- **THEN** 系统启动所选来源的 Tauri 安装流程、退出当前实例并在安装完成后重新运行应用

#### Scenario: 清理失败或超时
- **WHEN** 用户点击安装但资源清理失败或超时
- **THEN** 系统不得启动更新安装，并通过共享退出流程受控结束当前实例

#### Scenario: 更新签名无效
- **WHEN** 已下载更新缺少有效签名或签名与发布公钥不匹配
- **THEN** 系统拒绝安装、清除不可用下载状态并显示脱敏错误

### Requirement: 发布元数据包含更新内容
每个可供应用内更新的 Tauri 正式版本 MUST 在两个正式更新源中提供版本匹配、非空纯文本发布说明、完整安装器 URL 和有效签名的 Tauri 更新元数据。

#### Scenario: 发布元数据完整
- **WHEN** 正式版本进入发布资产校验
- **THEN** 校验同时确认元数据版本、目标平台、安装器、摘要、签名和非空发布说明一致

#### Scenario: 发布说明缺失
- **WHEN** 对应版本的发布说明、安装器签名或必要平台字段缺失
- **THEN** 发布流程失败且不发布不完整的更新元数据

### Requirement: 用户可选正式更新源
正式 Windows Tauri 客户端 SHALL 默认使用 CNB 仓库 `Auto-Tool-MX/POE-TOOL-MX` 的 Latest Release，并 SHALL 允许用户手动切换到同版本 GitHub Release；所选来源 MUST 持久化并统一用于更新元数据、完整安装器和签名。

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
- **WHEN** 已安装客户端从所选来源检查到高于当前版本的稳定版本并开始下载
- **THEN** 客户端从同一来源获取完整安装器和签名，并继续执行摘要校验、进度展示和确认安装流程

#### Scenario: 所选更新源不可用
- **WHEN** 所选来源的元数据或更新资产请求失败、超时或返回无效内容
- **THEN** 客户端按既有更新失败隔离规则继续运行，显示当前来源并允许用户手动切换后重试，不自动改用另一来源且不影响离线功能
