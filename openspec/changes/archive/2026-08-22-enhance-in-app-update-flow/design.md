## Context

现有 `ApplicationUpdateService` 已封装检查、下载、进度事件和严格清理后安装，但渲染进程的状态仅由设置页局部维护。主进程以手动/CNB 初始化，保存的模式和来源在主渲染运行时才同步，因此启动检查必须位于该同步之后。当前 NSIS 为允许选择安装目录的 assisted installer，更新可使用已锁定 `electron-updater` 的静默参数在原目录覆盖安装，但不能绕过 Windows UAC 或 SmartScreen。

## Goals / Non-Goals

**Goals:**

- 使启动检查、标题栏和设置页共享一个可测试的渲染进程更新状态。
- 在不放宽 IPC 权限和严格清理约束的情况下执行单次静默安装。
- 使发布说明从版本文件到更新元数据、安装前记录和升级后弹窗形成可验证链路。

**Non-Goals:**

- 不实现运行中热替换、无退出升级、强制安装或倒计时安装。
- 不升级 Electron、`electron-updater` 或 `electron-builder`，不改变更新源和签名策略。
- 未获得单独确认前不打包、不发布、不对远程更新资产做变更。

## Decisions

### 1. 用 Pinia 单例 store 统一渲染进程更新状态

新建应用更新 store，负责订阅 IPC 事件、读取快照、执行检查/下载/安装/已读操作以及计算 busy 状态。`TitleBar` 和 `SettingsView` 只消费该 store，不再各自建立事件订阅或局部快照。

替代方案是两个组件各自订阅主进程；这会重复初始化、增加竞态，并难以保证操作门禁一致，因此不采用。

### 2. 启动检查由主渲染运行时编排

`mainRuntime` 先从 settings store 取得已持久化的 mode/source，`await` 主进程 configure，再初始化更新 store 的事件订阅和快照，最后以不等待结果的方式调用一次 check。store 保存当次运行时的 startup-check promise/标记，避免路由重挂载或重复初始化导致第二次启动检查。

自动模式的 configure 仍创建六小时周期定时器，但首次延时定时器不再负责启动首查，以免与立即检查重复。主进程仍根据 mode 决定检查发现新版本后是否自动下载。

### 3. 标题栏入口是对共享状态的有限状态映射

入口放在应用标题后，设置 `no-drag` 以接收点击。仅 `available`、`downloading`、`downloaded` 可见；`available` 触发 download，`downloading` 只显示取整百分比，`downloaded` 触发 install。安装请求发出后立即映射为 `installing` 并禁用交互，不等待进程退出才防重。

### 4. 待展示更新记录位于主进程可控的用户数据目录

新建独立 repository，使用固定文件名保存 `{ targetVersion, releaseNotes }`。写入时先写同目录临时文件再 rename 替换，任一步失败都删除临时文件并在资源清理前返回 `update-record-failed`。数据不敏感，无需加密；读取时严格校验 semver 和字符串长度，并只向渲染进程返回纯文本。

应用启动时，服务仅在 targetVersion 与当前版本完全一致时将 `installedUpdate` 放入快照。共享 store 在主窗口可用后使用纯文本 Element Plus 弹窗展示，弹窗实际打开后调用新增 acknowledge IPC；主进程再次核对当前版本后删除记录。不匹配记录不弹窗、不自动删除，避免在升级未成功时丢失说明。

### 5. 静默安装保留现有严格清理边界

`restartAndInstall` 的顺序固定为：检查 downloaded/非 installing → 置 installing 并广播 → 原子保存升级记录 → 执行一次 strict cleanup → 标记 cleanup complete → 以当前锁定版 API 调用 `quitAndInstall(true, true)`。记录失败发生在清理前，因此可恢复 `downloaded` 状态并继续使用；清理开始后的任何失败继续执行现有受控退出规则。

不改为运行中覆盖文件，因为 Windows 文件锁、原生模块和已启动子进程会使其不可靠且无法保持现有清理安全性。

### 6. 在发布资产解析阶段注入并验证 releaseNotes

增加可单测的 Node 发布辅助脚本：读取 `package.json` 版本及 `docs/release-notes/v<version>.md`，拒绝文件缺失或 trim 后为空，将内容作为 YAML 多行纯文本字段写入已生成的 `dist-electron/latest.yml`。release workflow 在 NSIS 构建后、资产校验前调用该脚本，后续校验同时断言 releaseNotes 非空。GitHub 和 CNB 仍消费同一份生成元数据，不建立第二份更新说明资产。

## Risks / Trade-offs

- [静默 NSIS 仍可触发 UAC/SmartScreen] → 设置页保留明确警告，不宣称可绕过系统安全提示。
- [启动时网络检查可较慢或失败] → 检查在窗口加载后异步发起，失败只更新状态并脱敏，不弹出启动错误。
- [更新内容可过长] → 主进程规范化和限长，弹窗使用可滚动纯文本区，不解析 HTML/Markdown。
- [工作区已有标题栏主题改动] → 仅在当前文件状态上添加入口与样式，不回退或重写现有图标和主题变更。

## Migration Plan

1. 先通过模拟 updater、临时用户目录、Node 单测与 Vite 构建验证开发版行为。
2. 同步 OpenSpec 后，在下一个正式版本中随应用代码和发布流程一起上线；旧版本仍可读取增加字段后的 `latest.yml`。
3. 打包两个连续版本做真实 NSIS 升级验证前必须单独获得用户确认；本变更的默认验证不打包。
4. 若需回滚，回退标题栏/store/启动编排与静默参数；`latest.yml` 的 `releaseNotes` 是向后兼容字段，可保留。
