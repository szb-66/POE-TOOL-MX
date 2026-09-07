## Purpose

为确实需要控制管理员游戏的输入自动化提供按需高权限边界，使 Electron 界面和只读操作保持普通权限稳定运行，同时以一个薄 Python Host 保留现有业务与停止能力。

## ADDED Requirements

### Requirement: 主界面正常启动路径必须普通权限运行
Windows 正式版 MUST 使用 `asInvoker` 且不得自提权，开发版从普通权限终端启动时 MUST 继承普通权限；两者 MUST 保留 Chromium 默认沙箱。主界面 MUST NOT 因高权限 Host 尚未启动或不可用而阻塞加载。本变更不定义用户手动“以管理员身份运行”Electron 时的探测、阻止或提示行为。

#### Scenario: 正常打开应用
- **WHEN** 用户通过正常快捷方式启动应用且尚未请求输入自动化
- **THEN** 主界面以普通权限完成 renderer 挂载，不启动 Host 且不显示 UAC

### Requirement: 固定操作必须按输入能力分流
系统 MUST 由主进程固定注册表决定 Python 操作的权限路径。`game.dpi-probe`、`game.foreground-watch`、`game.interface-detect`、`combat.pixel-sample` 和 `stash-tabs.preview` 这 5 个只读操作 MUST 在普通权限运行；其余 17 个具有 focus、keyboard、pointer 或 clipboard 输入能力的固定操作 MUST 由高权限 Host 运行。renderer MUST NOT 覆盖该分类。

#### Scenario: 执行只读操作
- **WHEN** 用户或系统请求任一已注册的 5 个只读操作
- **THEN** 主进程使用普通权限本地实现或已选 Python 执行该操作，不启动 Host 且不显示 UAC

#### Scenario: 执行输入操作
- **WHEN** 用户请求任一已注册的 17 个输入操作
- **THEN** 主进程只在高权限 Host 建立连接后提交该操作

#### Scenario: 更新运行中的战斗配置
- **WHEN** 系统提交 `combat.auto-flask.update` 或 `combat.active-loop.update`
- **THEN** 系统将其作为已有受管操作的控制消息处理，不创建新 Python 进程且不单独触发 UAC

### Requirement: Host 必须在首次输入操作时按需提权
系统 MUST 在本次应用会话首次请求输入操作时，通过 Windows `RunAs` 启动当前应用随包提供的固定 Python Host。并发首请求 MUST 共用一次启动过程，连接成功后的 Host MUST 复用于本次会话，应用启动、非自动化功能和只读操作 MUST NOT 触发 UAC。

#### Scenario: 首次启动输入操作
- **WHEN** 本次应用会话尚无 Host 且用户启动任一输入操作
- **THEN** 系统显示一次 UAC，并仅在 Host 建立受验证连接后提交操作

#### Scenario: 同一会话继续使用输入操作
- **WHEN** 已连接 Host 仍可用且用户启动后续输入操作
- **THEN** 系统复用现有连接，不再次显示 UAC

#### Scenario: 用户取消 UAC
- **WHEN** 用户拒绝或取消本次提权
- **THEN** 本次输入操作返回明确失败、产生零输入且主界面继续运行

#### Scenario: 取消后再次尝试
- **WHEN** 前一次 UAC 取消或 Host 启动失败后用户再次启动输入操作
- **THEN** 系统重新发起一次按需提权且不自动重放前一次请求

### Requirement: 本地 Host 连接必须绑定本次 Electron 主进程
系统 MUST 为每次 Host 启动生成随机的单实例命名管道，并 MUST 通过当前登录用户 SID 的受保护 DACL 限制管道访问。Host MUST 在读取任何操作请求前，通过 Windows `GetNamedPipeClientProcessId` 校验唯一客户端 PID 等于启动描述中的 Electron 主进程 PID；主进程 MUST 校验首个 Host `hello` PID 等于本次 `RunAs` 返回的进程 PID。该边界 MUST NOT 依赖 renderer 自报身份、一次性令牌或 native addon。

#### Scenario: 正确的主进程建立连接
- **WHEN** 本次 Electron 主进程连接随机管道且 Host PID 与 `RunAs` 返回值一致
- **THEN** Host 完成单连接握手并开始接受固定协议消息

#### Scenario: 其他本地进程抢先连接
- **WHEN** 管道客户端 PID 与启动描述中的 Electron 主进程 PID 不一致
- **THEN** Host 在读取或执行任何操作请求前关闭连接并产生零输入

### Requirement: 高权限请求必须是固定操作
Host MUST 只接受版本内已注册的输入 `operationId`、唯一 `requestId` 和经过主进程严格校验的结构化配置。正式调用链 MUST NOT 接受脚本文本、脚本路径、可执行文件、Python 路径、Shell 命令、工作目录或环境覆盖；固定 Python 入口 MUST 继续执行自身业务配置校验。

#### Scenario: 执行已注册输入操作
- **WHEN** 主进程提交受支持的输入操作标识和合法配置
- **THEN** Host 使用随包固定入口执行操作并发布启动、进度及单一终态

#### Scenario: 请求任意代码或非法配置
- **WHEN** 请求包含未知操作、未知字段、可执行内容或越界配置
- **THEN** 系统在创建高权限子进程或产生游戏输入前拒绝整个请求

#### Scenario: 伪装只读操作请求 Host
- **WHEN** 请求尝试让 Host 执行 5 个普通权限只读操作之一
- **THEN** Host 拒绝该请求，调用方只能使用主进程固定的普通权限路径

### Requirement: 权限迁移必须保留业务安全门禁
所有输入操作 MUST 保留游戏进程身份、前台状态、DPI、坐标、模板、运行时资源、互斥锁和输入释放检查。权限迁移 MUST NOT 改变现有阈值、业务结果或用户可见错误语义。

#### Scenario: 任一门禁失败
- **WHEN** 游戏、前台、显示环境、坐标、模板、运行时或自动化锁校验失败
- **THEN** 操作返回对应失败语义并产生零后续输入

#### Scenario: 互斥操作竞争
- **WHEN** 一个独占操作运行期间收到另一项冲突自动化请求
- **THEN** 系统拒绝新请求并保留当前操作

### Requirement: 本地与高权限操作必须保持 RemoteChild 兼容
普通权限本地 Python 与高权限 Host 子进程 MUST 向现有业务模块提供一致的 `RemoteChild` 兼容结果，包括真实进程标识、启动或错误事件、单一退出终态和幂等停止。renderer 侧现有功能 API 与结果形状 MUST 保持兼容。

#### Scenario: 本地只读操作完成
- **WHEN** 普通权限只读子进程正常完成或失败
- **THEN** 业务模块通过同一兼容接口收到进程标识、终态和可用错误

#### Scenario: 高权限输入操作完成
- **WHEN** Host 子进程正常完成、失败或被停止
- **THEN** 业务模块收到与迁移前一致形状的终态且不需要识别运行位置

### Requirement: Host 生命周期必须与应用会话绑定
系统 MUST 支持单项停止、`stopAll` 和关闭 Host，并 MUST 在 End、应用退出、更新退出或主连接断开时停止全部受管输入操作并释放可释放的输入和互斥锁。Host 与固定脚本 MUST 在正常停止和可捕获异常路径执行清理，重复停止 MUST 幂等。

#### Scenario: 用户触发全局停止
- **WHEN** 用户触发全局 End 停止
- **THEN** 系统通过 `stopAll` 停止全部 Host 输入操作并清理对应状态

#### Scenario: 主应用或连接消失
- **WHEN** Host 检测到所属主连接断开或收到应用关闭请求
- **THEN** Host 停止受管子进程、执行输入释放并退出

#### Scenario: 重复停止
- **WHEN** 同一操作或全局停止被重复请求
- **THEN** 系统返回稳定结果且不重复发布退出终态

### Requirement: Host 故障不得阻塞普通路径
Host 启动失败、连接失败或 UAC 取消 MUST 只阻止 17 个输入操作。系统 MUST NOT 回退为普通权限直接执行输入操作，也 MUST NOT 降低 Chromium 沙箱；普通界面、非自动化功能和 5 个只读操作 MUST 继续可用。

#### Scenario: Host 不可用时打开应用
- **WHEN** Host 本次启动或握手失败
- **THEN** 配置、网络、反馈、更新检查、价格数据、纯计算和只读 Python 操作继续可用

#### Scenario: 输入操作不得降权回退
- **WHEN** 高权限 Host 不可用且用户请求输入操作
- **THEN** 系统返回本次启动失败，不在普通权限直接创建该脚本

### Requirement: 中文路径启动描述必须稳定
按需提权启动描述 MUST 使用明确的 UTF-8 编码封装，并只携带启动薄 Host 所需的有界字段。Host MUST 使用普通权限主进程已经选定的解释器和固定资源根，不得重新从用户请求或 `PATH` 选择可执行内容。

#### Scenario: 项目或用户路径包含中文
- **WHEN** Host 入口或运行时路径包含中文且用户允许 UAC
- **THEN** 提权进程正确恢复启动描述并建立连接
