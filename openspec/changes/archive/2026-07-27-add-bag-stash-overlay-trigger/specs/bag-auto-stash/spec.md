## MODIFIED Requirements

### Requirement: 单会话自动入库
系统 SHALL 在模块启用且“立即执行自动入库”开启时，为每次连续打开仓库和背包的会话自动执行至多一轮入库；该设置关闭时只进入可入库状态。

#### Scenario: 立即执行开启时首次进入可入库状态
- **WHEN** 当前会话尚未执行、立即执行已开启且检测进入可入库状态
- **THEN** 系统自动启动一轮入库并锁定当前会话

#### Scenario: 立即执行关闭时首次进入可入库状态
- **WHEN** 立即执行已关闭且检测进入可入库状态
- **THEN** 系统 MUST NOT 自动启动或锁定入库轮次，并等待用户点击浮层按钮

#### Scenario: 匹配状态持续存在
- **WHEN** 自动入库完成后仓库和背包仍保持打开
- **THEN** 系统 MUST NOT 自动启动第二轮入库，但允许用户通过浮层再次补扫

#### Scenario: 关闭后重新打开
- **WHEN** 系统稳定检测到界面关闭后又重新进入可入库状态
- **THEN** 系统将其视为新会话，并在立即执行开启时允许再次自动入库

### Requirement: 持久配置和浮层补扫
系统 SHALL 持久化黑名单、立即执行和浮层显示策略配置，并使用全局自动操作等待执行自动入库和浮层补扫；浮层 SHALL 是唯一面向用户的手动补扫入口。

#### Scenario: 迁移模块独立延迟
- **WHEN** 新全局配置不存在且旧 `bagSettings` 包含 transferDelayMs
- **THEN** 系统将该值迁移为全局 operationDelayMs，并且后续保存不再输出 transferDelayMs

#### Scenario: 迁移旧设置
- **WHEN** 系统加载不包含 blacklist、immediateStash 或 showStashButtonOnlyWhenReady 的旧 `bagSettings`
- **THEN** 系统补齐空黑名单，将两个新开关补为 true，并保留其他有效背包设置

#### Scenario: 应用恢复检测
- **WHEN** 应用启动时模块已持久化为启用且配置有效
- **THEN** 应用级服务自动恢复双界面检测和背包浮层

#### Scenario: 浮层补扫
- **WHEN** 当前处于可入库状态、没有入库进程且用户点击浮层按钮
- **THEN** 系统使用最新已同步的全局自动操作等待启动一轮入库，即使当前会话已经自动执行过

#### Scenario: 不安全的浮层请求
- **WHEN** 用户请求时界面未就绪、游戏不在前台或已有入库进程
- **THEN** 系统拒绝请求并返回可显示的原因

## REMOVED Requirements

### Requirement: 背包手动补扫快捷键
**Reason**: 游戏内浮层已统一承担手动补扫入口，不再需要 `Alt+4` 或自定义背包补扫快捷键。

**Migration**: 历史 `stashStart` 配置在全局快捷键归一化时忽略，用户改用浮层按钮。
