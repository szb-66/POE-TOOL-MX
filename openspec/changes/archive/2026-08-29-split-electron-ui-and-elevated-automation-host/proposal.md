## Why

当前 Windows 正式版把完整 Electron 主程序声明为 `requireAdministrator`，在部分 Windows/AppLocker 环境中会在页面代码运行前触发 Chromium renderer `launch-failed / exitCode=18`。界面必须改为普通权限；只有确实向管理员游戏发送输入的自动化需要提权，因此采用一个按需启动的薄 Python Host，而不再维护完整高权限运行时平台。

## What Changes

- **BREAKING**：Windows 主程序改为 `asInvoker`，保留 renderer、GPU 与 Chromium 默认沙箱。
- 将 22 个固定自动化操作按输入能力分流：5 个只读操作继续由普通权限主进程执行，17 个会发送游戏输入的操作才提交给高权限 Host。
- 本次应用会话首次执行输入操作时通过 Windows `RunAs` 启动同包 Python Host；连接成功后复用，最多一次成功 UAC。
- 主进程与 Host 使用每次启动随机的单连接命名管道；管道只授权当前登录用户，Host 在读取命令前通过 Windows 内核校验客户端 PID 等于本次 Electron 主进程 PID，不引入一次性令牌或 native addon。
- Host 只负责固定 `operationId` 路由、受管子进程和停止控制；继续拒绝脚本文本、脚本路径、可执行文件、Shell 命令、工作目录和环境覆盖。
- 保持现有 renderer API、`RemoteChild` 兼容层、前台/进程/DPI/坐标/模板门禁、互斥锁、单项停止与 `stopAll` 行为。
- 删除 native addon、独立输入 sentinel、完整运行时文件摘要清单、Host 侧通用 schema 副本和专用 Host 健康体系。
- Host 或 UAC 不可用时只阻止输入操作；普通界面、非自动化功能和 5 个只读操作继续可用。
- 不增加用户手动“以管理员身份运行”Electron 的探测、阻止或提示逻辑。
- 保留直接安装包，使无法进入旧版应用内更新的用户能够覆盖升级。

## Capabilities

### New Capabilities

- `elevated-automation-host`: 定义普通权限 UI、按输入能力分流、按需 UAC 薄 Host、固定操作、会话复用和停止清理。

### Modified Capabilities

- `startup-crash-diagnostics`: 主程序改为普通权限，保留既有 GPU 恢复且不增加手动管理员启动的专用处理。
- `bundled-python-runtime`: 普通权限只读操作和高权限输入操作共用随包 Python；验证缩减为固定路径与实际所需依赖，不再维护完整 Host manifest。
- `application-shutdown`: 将按需 Host 和其受管输入操作纳入现有退出清理。
- `dashboard-home`: 普通权限显示为正常，首页不增加 Host 健康状态机且不触发 UAC。
- `crafting-script-startup`: 制作与地图功能通过固定输入操作运行，保留现有启动结果和门禁。
- `crafting-overlay-controls`: 重新开始继续读取最新配置并创建新的固定操作请求。
- `game-display-dpi`: DPI 探测作为只读操作保留在普通权限路径，启动首页不触发 UAC。
- `github-release-distribution`: 发布包验证实际 EXE 为 `asInvoker`，包含薄 Host 入口，并提供直接安装入口。

## Impact

- 保留现有业务 API 和固定 Python 脚本，将权限选择收口到主进程的单一操作注册表。
- 新增最小的本地连接与 `RunAs` Host 复用，删除只服务于重型 Host 平台的构建、传输、清单、schema、sentinel、健康和测试设施。
- 不改变设置、用户数据、自动化阈值、业务结果或可见启停流程；变化仅为每个应用会话首次输入自动化可能显示一次 UAC。
