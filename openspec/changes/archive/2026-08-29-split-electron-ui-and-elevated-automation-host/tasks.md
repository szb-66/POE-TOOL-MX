## 1. 收缩现有实现

- [x] 1.1 盘点并记录本轮大范围 AutomationHost 改动，确认用户既有 `remove-environment-specific-defaults` 等无关工作不被覆盖。
- [x] 1.2 删除 Task Scheduler、安装维护模式、独立 Program Files Host、原子 NSIS、修复入口和发布收据等外围实现及专用测试。
- [x] 1.3 删除 Windows pipe native addon 的源码、构建脚本、依赖和测试，让本地连接只使用 Node/Python 标准能力。
- [x] 1.4 删除独立 `automation_sentinel.py`、跨进程输入账本/守护协议及专用测试，将正常停止和输入释放收回薄 Host 与固定脚本；允许薄 Host 直接用 Windows Job 约束自身子进程。
- [x] 1.5 删除 AutomationHost 的完整文件闭包/摘要 manifest 职责、UI allowlist/binding、Host 侧 `operation-config-schemas.json` 与重复通用 schema 解析，并清理无调用代码；只保留最小打包资源清单检查。
- [x] 1.6 删除 AutomationHost 专用健康状态机、版本/摘要/修复原因码和首页入口，保留现有 Python、快捷键与 DPI 静态健康。

## 2. 5/17 权限分流

- [x] 2.1 先添加 22 个固定自动化操作的分类测试，锁定 5 个只读操作普通权限、17 个输入操作高权限，控制类 update 消息不创建进程。
- [x] 2.2 让 `game.dpi-probe`、`game.foreground-watch`、`game.interface-detect`、`combat.pixel-sample` 和 `stash-tabs.preview` 复用普通权限本地 Python 启动器且不触发 UAC。
- [x] 2.3 让其余 17 个输入操作统一经过薄 Host；路由只读取主进程固定操作映射，renderer 不得覆盖权限分类。
- [x] 2.4 保持本地与远程操作的 `RemoteChild` 兼容表面和 renderer API/结果形状，清理业务模块中的运行位置分支。

## 3. 最小按需 Host

- [x] 3.1 添加首个输入操作 `RunAs`、并发启动合并、会话复用、UAC 取消、连接失败和再次尝试测试，再实现正式版与开发版共用的薄 Python Host 启动。
- [x] 3.2 用随机单实例命名管道、当前用户受保护 DACL 和协议版本完成标准库握手；Host 必须通过 `GetNamedPipeClientProcessId` 校验客户端为启动描述中的 Electron PID，主进程必须校验 `hello` Host PID 为本次 `RunAs` 返回值，UTF-8 Base64 启动描述必须支持中文路径。
- [x] 3.3 将 Host 职责限制为 17 个固定输入 `operationId` 路由、受限事件、受管子进程、单项停止、`stopAll` 和关闭；移除安装、修复、健康和 manifest 职责。
- [x] 3.4 保留主进程唯一通用 `validatedConfig` schema 和固定脚本自身业务校验，证明请求不能携带脚本文本、脚本路径、可执行文件、命令、工作目录或环境覆盖。
- [x] 3.5 正式版固定使用随包 Python/Host/脚本，开发版使用已选择解释器；仅检查本次操作入口与模块，不从 `PATH` 重选且不加载完整文件闭包/摘要 manifest。

## 4. 生命周期与故障边界

- [x] 4.1 验证原有前台、游戏进程、DPI、坐标、模板、互斥和输入释放门禁覆盖全部 17 个输入操作，失败时零后续输入。
- [x] 4.2 验证 End、单项停止、应用退出、更新退出和连接断开均调用 Host `stopAll`、清理 `RemoteChild` 状态并保持重复停止幂等。
- [x] 4.3 验证 Host/UAC 失败只影响 17 个输入操作；主界面、非自动化功能和 5 个只读操作继续可用，且不得普通权限回退执行输入脚本。
- [x] 4.4 保留 `asInvoker` 和既有 GPU 安全模式，禁止生产关闭 Chromium 沙箱；不增加手动管理员启动的专用处理。

## 5. 最小打包与升级路径

- [x] 5.1 使用标准 Electron Builder/NSIS，只打入随包 Python、薄 Host 与固定脚本，不 patch NSIS、不编译 native addon、不安装独立于应用包的 Host 组件。
- [x] 5.2 添加最终 EXE `asInvoker`、薄 Host 入口、注册操作引用的固定脚本集合和必要模块检查，不假定操作数等于 Python 文件数，并更新旧版用户手动覆盖安装说明。

## 6. 验证

- [x] 6.1 运行操作分类、本地启动、按需提权、请求白名单、`RemoteChild`、停止、启动诊断和打包配置的定向测试。
- [ ] 6.2 在开发版验证普通 Electron/Vite 启动、5 个只读操作无 UAC、中文路径、首次输入操作 UAC、连接复用、取消后重试和无残留；不向用户正在操作的真实游戏注入测试输入。
- [x] 6.3 运行完整 `npm test`、Vite build、最小 Host 资源检查、`openspec validate split-electron-ui-and-elevated-automation-host --strict` 和 `git diff --check`，删除失败方案遗留代码。
- [ ] 6.4 使用已授权的正式打包验证实际 EXE 为 `asInvoker`、普通 UI 正常渲染、只读操作不启动 Host、首次输入操作只出现一次 UAC且会话复用；真实管理员游戏输入和原 Windows 10 故障机仍由用户验收。
