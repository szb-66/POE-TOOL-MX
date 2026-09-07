## Context

当前 Electron 应用通过主进程寻找本机 Python，并运行六类动态或资源脚本。electron-builder 已能生成 NSIS 包，但只包含脚本、不包含解释器和依赖。首页已有部分 Python、脚本和模块状态，DPI 与多显示器坐标也已有专项实现；本次应扩展这些入口，而不是建立第二套健康检查。

应用尚未配置 GitHub Actions，README 包含大量过期内部草稿。工作区存在其他未提交功能修改，实施必须保留并围绕当前代码增量修改。

## Goals / Non-Goals

**Goals:**

- 让正式安装包在没有系统 Python 的 Windows 10/11 x64 环境运行。
- 让构建资源可锁定、可校验、可在 CI 复现。
- 通过现有首页状态体系暴露运行时健康，并提供主动、脱敏的诊断导出。
- 让 GitHub README 与 Release 成为普通用户的安装和排错入口。

**Non-Goals:**

- 不支持 ARM64、32 位 Windows、macOS、Linux 或独占全屏。
- 不实现代码签名、应用内更新、自动上传诊断或崩溃遥测。
- 不重写现有 Python 自动化脚本协议，也不把脚本分别编译为可执行文件。

## Decisions

### 使用 CPython 3.13 x64 嵌入式运行时

构建阶段下载官方嵌入式包，校验固定 SHA-256，展开到生成目录，并把锁定的 wheel 依赖安装到独立 `site-packages`。正式包通过 `extraResources` 携带整个运行时。

选择嵌入式运行时而不是 PyInstaller，是因为现有脚本部分由前端动态生成，统一解释器可以维持脚本和事件协议。选择 `opencv-python-headless` 代替 GUI 版本以减少无用桌面依赖。

运行时生成目录加入 `.gitignore`，仓库只提交版本/URL/哈希/依赖锁与准备、验证脚本，避免提交大型二进制。

### 统一运行时描述与解析

Python 模块提供 `resolvePythonRuntime` 和健康探测，返回 `ready/source/path/version/modules/error`。生产模式只解析 `process.resourcesPath/python-runtime/python.exe`；开发模式依次使用显式环境变量、已准备的本地运行时、本机候选。

保留现有 `detectPythonPath` 兼容包装，让脚本启动调用点逐步复用统一解析，避免一次性重写所有 IPC。

### 诊断在主进程组装和脱敏

新增系统诊断模块，在主进程读取 Electron 版本、OS/架构、提权状态、`screen.getAllDisplays()`、DPI 探测与运行时健康。路径字段转换为来源与文件名，模块不读取账号存储、Cookie 或剪贴板。

preload 只暴露“获取诊断”和“导出诊断”两个具名接口；导出由主进程打开保存对话框并写入 JSON。首页复用现有状态卡区域添加导出按钮。

### 构建与发布分层

普通 CI 在 `windows-latest` 执行 `npm ci`、运行时准备/验证、测试、Vite 构建和 unpacked 包冒烟检查。`v*` 标签额外校验标签与 `package.json` 版本，构建 x64 NSIS，生成 `SHA256SUMS.txt`，上传 Release 并创建来源证明。

Actions 使用最小权限并固定提交 SHA。安装包继续 `requireAdministrator`，通过环境变量明确关闭自动签名发现。

### README 只承载项目首页信息

README 保留功能概览、下载、兼容、首次运行、排错、开发、隐私和许可证；详细玩法留在应用内帮助。真实截图放在 `docs/images`，不得包含用户数据。

## Risks / Trade-offs

- [Electron 28 跨多个主版本升级可能出现 API 变化] → 先完成依赖升级并运行全部单元测试、开发启动和 packaged smoke，再继续发布配置。
- [Python 与 OpenCV/NumPy 显著增加安装包体积] → 使用 headless OpenCV，只打包 x64 和必要 Electron locale，记录最终体积。
- [官方嵌入式 Python 不包含常规 pip 环境] → 准备脚本使用独立构建 Python 下载 wheel 并安装到目标目录，验证脚本直接运行内置解释器导入模块。
- [未签名且要求管理员权限会触发 SmartScreen 和安全软件警告] → README 显著提示，Release 提供 SHA-256 与来源证明。
- [GitHub 托管构建下载资源受网络波动影响] → 使用固定 URL/哈希、npm 缓存和可重跑步骤，校验失败立即终止。
- [现有脏工作区造成误覆盖] → 修改前检查 diff，避免还原用户文件，完成后单独列出本次改动。

## Migration Plan

1. 建立运行时准备/验证脚本和锁文件，并验证本地生成目录。
2. 升级 Electron 与打包器，接入内置运行时解析，保持开发回退。
3. 接入诊断模块、preload 和首页操作，补齐测试。
4. 更新打包资源、README 和 CI/Release 工作流。
5. 在无系统 Python 的 Windows x64 环境执行 unpacked 与 NSIS 冒烟测试，再创建首个公开标签。

若 Electron 43 升级阻断正式包启动，回滚依赖与锁文件但保留运行时、诊断和文档改动，在受支持的最低可行 Electron 版本重新验证后再发布。
