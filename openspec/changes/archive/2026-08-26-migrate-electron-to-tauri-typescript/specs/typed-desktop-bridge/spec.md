## Purpose

定义 Vue/TypeScript 产品代码与管理员 Rust 系统层之间唯一、可验证且按窗口最小授权的桌面命令和事件契约。

## ADDED Requirements

### Requirement: 类型化桌面入口
产品前端 SHALL 仅通过类型化 `desktopApi` 调用桌面能力，业务组件 MUST NOT 直接调用原始 Tauri invoke、event、shell、文件或窗口插件接口。

#### Scenario: 调用桌面命令
- **WHEN** Vue 业务代码需要窗口、系统、账号或自动化能力
- **THEN** 调用在编译期定义输入、成功结果、结构化错误和可取消事件订阅的 `desktopApi` 方法

#### Scenario: 契约不一致
- **WHEN** TypeScript 与 Rust 对同一命令或事件的字段、可选性或错误形式不一致
- **THEN** 契约测试或类型检查失败，变更不得进入功能对等验收

### Requirement: 可序列化边界
跨桌面边界的全部请求、结果和事件 MUST 是明确声明的可序列化普通数据，MUST NOT 传递 Vue/Pinia Proxy、函数、原生对象句柄或其他运行时对象。

#### Scenario: 响应式配置发起请求
- **WHEN** 前端使用响应式状态构造桌面请求
- **THEN** `desktopApi` 在跨边界前产生满足契约的普通数据，Rust 收到的载荷可完整反序列化

### Requirement: 按窗口最小授权
每个原生窗口 MUST 只获得完成其职责所需的命令和事件权限；来自未授权窗口或未知标签的敏感调用 MUST 被拒绝并记录不含载荷秘密的原因。

#### Scenario: 浮窗调用主窗口专用命令
- **WHEN** 业务浮窗尝试调用账号、任意文件或自动化配置等未授权能力
- **THEN** Rust 拒绝调用，不执行副作用并返回稳定的权限错误

### Requirement: 敏感能力留在原生层
Cookie、Authorization、账号会话、任意文件访问、进程启动和更新签名验证 MUST 只在 Rust 系统层处理，MUST NOT 将秘密原值或通用高权限原语暴露给 WebView。

#### Scenario: 前端查询账号状态
- **WHEN** 前端请求当前国服账号状态
- **THEN** 系统只返回认证状态、允许展示的账号信息和业务错误，不返回 Cookie 或令牌

#### Scenario: 前端启动自动化
- **WHEN** 前端提交自动化请求
- **THEN** Rust 只接受固定语义操作及经过验证的配置，不接受任意命令、脚本正文或不受限路径

### Requirement: 事件订阅可清理
每个桌面事件订阅 SHALL 返回可重复调用的取消函数，并 MUST 在组件卸载、窗口关闭和应用退出时释放底层监听。

#### Scenario: 重复进入业务页面
- **WHEN** 用户多次进入和离开订阅桌面事件的页面
- **THEN** 每个事件只由当前有效订阅处理一次，不累积重复监听

