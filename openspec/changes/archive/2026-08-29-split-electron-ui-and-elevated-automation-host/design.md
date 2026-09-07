## Context

See [proposal.md](./proposal.md). Electron 43 在管理员完整性级别下可能因 Chromium 沙箱无法创建 renderer，日志表现为 `launch-failed / exitCode=18`。现有业务共有 22 个固定自动化操作，其中只有 17 个会向游戏发送输入；最低成本方案是让 Electron 和 5 个只读操作保持普通权限，仅用一个按需启动的薄 Python Host 承载 17 个输入操作。

## Goals / Non-Goals

**Goals:**

- Electron UI 的正常启动路径使用 `asInvoker` 普通权限，并保留 Chromium 默认沙箱。
- 仅输入操作在本次应用会话首次使用时显示 UAC，成功后复用同一 Host。
- 保持 renderer API、`RemoteChild`、业务结果、安全门禁、互斥和停止行为。
- 将 Host 缩到固定操作路由和进程生命周期，删除本次修复不需要的平台化设施。

**Non-Goals:**

- 日常自动化完全无 UAC，或用计划任务、服务规避 UAC。
- 探测、阻止或提示用户手动“以管理员身份运行”Electron，以及支持跨账户输入管理员凭据。
- native addon、独立 sentinel、完整文件摘要清单、两套通用配置 schema 或 Host 健康中心。
- 关闭 renderer/GPU 沙箱，或用 `--no-sandbox` 作为生产回退。
- 重写现有业务脚本、改变阈值/坐标/设置/用户数据，或引入新的安装事务。

## Decisions

### 1. 主程序使用 `asInvoker`

Windows 构建清单改为 `asInvoker`，主界面正常启动不触发 UAC。本变更不增加对用户手动“以管理员身份运行”的额外探测或提示逻辑。

本变更不增加手动管理员启动的专用诊断分支；既有 GPU 崩溃恢复保持不变，也不禁用任何 Chromium 沙箱。

### 2. 权限只按是否发送输入划分

主进程的固定操作分类表保存普通权限只读 ID 和高权限输入 ID/映射。路由规则不读取 renderer 自报权限，而由该固定分类决定：

| 普通权限只读操作（5） | 按需高权限输入操作（17） |
| --- | --- |
| `game.dpi-probe` | `price.copy-item` |
| `game.foreground-watch` | `combat.return-town` |
| `game.interface-detect` | `combat.auto-flask` |
| `combat.pixel-sample` | `combat.active-loop` |
| `stash-tabs.preview` | `crafting.items`, `crafting.maps` |
|  | `bag.auto-stash` |
|  | `stash-tabs.select` |
|  | `stash-pickup.preview`, `stash-pickup.run` |
|  | `junfeng.preview`, `junfeng.calibrate`, `junfeng.pickup` |
|  | `chaos-recipe.pickup` |
|  | `puzzle.analyze`, `puzzle.chart-mods`, `puzzle.auto-place` |

`combat.auto-flask.update` 与 `combat.active-loop.update` 是对既有受管操作的控制消息，不创建新的 Python 进程，也不单独触发 UAC。

选择该边界而不是“所有 Python 都提权”，是因为只读 DPI、前台、界面检测、像素采样和预览不需要跨越 Windows 输入完整性边界；它们留在本地可以减少 UAC、Host 依赖和故障面。

### 3. 正式版与开发版共用薄 Python Host

主进程构造服务时不启动 Host。首个输入操作才通过固定系统 PowerShell `Start-Process -Verb RunAs` 启动随当前应用提供的 Python Host。并发首请求共用一个启动 Promise，连接成功后复用到本次应用会话结束；取消或启动失败后不缓存失败 Promise，下一次输入操作可以重新尝试。

Host 只包含四项职责：完成一次本地握手、按固定映射启动输入脚本、转发受限事件、执行单项停止/`stopAll`/关闭。它不负责安装、修复、更新、健康汇总或业务配置生成。

本地连接只使用 Node、Python 与 Windows 标准能力。每次启动生成随机命名管道端点；Host 使用当前登录用户 SID 的受保护 DACL 创建单实例管道，并在读取任何命令前调用 Windows 内核的 `GetNamedPipeClientProcessId`，要求客户端 PID 与启动描述中的 Electron 主进程 PID 完全一致。主进程同时要求首个 Host `hello` 中的 PID 等于本次 `RunAs` 返回的 Host PID。该边界不依赖 renderer 自报身份，也不引入一次性令牌或 native addon。中文路径继续通过 UTF-8 JSON 的 Base64 启动描述传递。

### 4. 只保留一套通用请求校验

主进程是 `operationId + validatedConfig` 通用边界的唯一 schema 实现：先按注册表选择操作，再拒绝未知字段、越界值和 `script`/`path`/`command`/`cwd`/`env` 等执行内容。Host 只接受已列入其固定输入操作映射的 ID，并再次拒绝请求信封未知字段；固定 Python 入口继续执行各自已有的业务配置校验。

因此不再生成、打包或由 Host 解释第二份 `operation-config-schemas.json`。这不是取消纵深校验，而是删除 JS 通用 schema 的 Python 复制品，保留“主进程通用校验 + 固定脚本业务校验”两层现有边界。

### 5. 用固定资源根取代完整文件闭包/摘要 manifest

正式版解释器固定在 `process.resourcesPath/python-runtime`，薄 Host、固定脚本及其资源固定在 `process.resourcesPath/automation-host`；开发版使用项目准备或显式选择的解释器，并以 `src/assets` 为自动化资源根。普通权限主进程在启动操作前只解析该固定布局中的已注册相对路径，并检查本次操作需要的入口和模块。

构建验证只确认解释器、Host 入口、注册操作引用的固定脚本集合和必要依赖可以实际加载，不假定操作数等于 Python 文件数。不再维护全文件闭包、每文件摘要、UI build allowlist、manifest rebinding 或 JS/Python 双重 manifest 解析。替代方案是保留现有完整清单，但它主要防御安装目录被篡改，成本远高于本次解决 Electron 提权启动失败的目标。

### 6. 复用 `RemoteChild`，Host 自己管理停止

本地普通权限进程与远程高权限进程都适配为现有 `RemoteChild`/child-process 兼容表面，业务模块继续读取 pid、退出事件、错误与停止结果，不需要知道运行位置。

高权限 Host 保存自身启动的子进程集合。单项停止终止对应进程并释放该操作记录的键鼠状态；`stopAll` 用于 End、应用退出、更新退出和连接断开。Host 退出前执行同一清理。删除独立 sentinel 和跨进程输入账本/守护协议；薄 Host 可直接用 Windows Job 约束其子进程，固定脚本继续通过 `try/finally` 与统一输入适配器释放输入。

### 7. 不建立 Host 健康体系

首页只保留既有 Python、快捷键和 DPI 静态状态，并把主界面普通权限视为正常。首页加载或刷新不探测、不启动 Host、不显示 UAC，也不增加任务版本、摘要、安装状态或“修复组件”入口。

Host 是否可用在首次输入操作时以真实启动/握手结果判断。失败通过现有业务错误通道显示；普通功能和 5 个本地只读操作不被禁用。

### 8. 使用标准安装包

Electron Builder 只需把随包 Python 放入 `resources/python-runtime`，把薄 Host、固定脚本及资源放入 `resources/automation-host`，生成 `asInvoker` EXE，并使用标准的按机器安装、固定 Program Files 目录和项目原有更新/卸载流程。不 patch NSIS 模板、不写 Program Files sibling transaction、不注册任务，也不安装或维护独立于应用包的 Host 组件。

发布检查只保留实际 EXE manifest、Host 入口和固定操作资源的最小验证。无法启动旧版的用户手动下载并覆盖安装一次；用户数据仍沿用现有位置。

## Risks / Trade-offs

- [每次应用会话首次输入自动化会显示 UAC] → 启动成功后复用 Host，不对每个操作重复提示。
- [用户取消 UAC] → 本次输入操作返回稳定失败、零输入；下一次输入操作可再次请求。
- [取消完整文件摘要清单] → 依赖标准安装包完整性、固定资源根和构建/启动检查；不宣称防御本机安装目录主动篡改。
- [删除独立 sentinel 后 Host 硬崩溃无法执行用户态清理] → 所有正常停止、断连和可捕获异常均走 `stopAll`，固定脚本保持 `try/finally`；该极端风险作为最低成本方案的明确取舍。
- [本地握手不使用 native peer token 或共享密钥] → 使用随机单实例管道、当前用户受保护 DACL、Host 端内核客户端 PID 校验和主进程 Host PID 校验；PID 不匹配时在读取操作前断开。
- [Host 不可用] → 仅 17 个输入操作失败；界面、非自动化功能和 5 个只读操作继续工作。

## Migration Plan

1. 先以测试锁定 5/17 操作分类、固定请求边界、UAC 会话复用、`RemoteChild` 和 `stopAll`。
2. 将 5 个只读操作恢复为普通权限本地 Python，将 17 个输入操作接到薄 Host。
3. 删除 native pipe addon、sentinel、完整文件闭包/摘要 manifest 职责、Host schema artifact 和专用健康状态生产/测试代码，只保留最小打包资源清单检查。
4. 保留固定操作注册表、业务脚本自身校验、安全门禁和现有 renderer API，清理无调用兼容层。
5. 运行定向测试、完整 `npm test`、Vite build、最小 Host 资源检查、严格 OpenSpec 和 `git diff --check`。
6. 使用已授权的正式打包验证实际 EXE 为 `asInvoker`、普通 UI 可启动、只读操作无 UAC、首次输入操作出现一次 UAC且会话复用；不向真实游戏注入测试输入。

若最小方案回滚，恢复上一正式版本即可；不得恢复 `requireAdministrator` 或生产 `--no-sandbox`。
