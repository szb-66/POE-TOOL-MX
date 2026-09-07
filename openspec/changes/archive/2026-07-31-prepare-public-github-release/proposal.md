## Why

当前应用能够在开发机上构建，但正式安装包仍依赖用户自行准备 Python，且 Electron 运行时已经停止维护、README 与真实功能严重脱节，也没有可复现的 GitHub 发布流程。这会让不同 Windows 电脑上的安装、运行、排错和版本分发不可控，不适合公开发布。

## What Changes

- 提供仅面向 Windows 10/11 x64 的自包含 NSIS 安装包，内置经过校验并锁定依赖的 Python 3.13 x64 运行时。
- **BREAKING** 将 Electron 28 升级到仍受支持的 Electron 43.x，并将 electron-builder 固定到兼容的稳定版本。
- 正式版固定使用内置 Python；开发版保留显式覆盖和本机 Python 回退。
- 统一运行时健康信息，并增加不包含账号、Cookie 或完整用户路径的诊断导出。
- 重写面向普通用户的 GitHub README，明确兼容范围、安装、校准、排错、隐私、许可证和免责声明。
- 增加 Windows CI 与 `v*` 标签发布流程，自动产出安装包、SHA-256 校验文件、第三方声明和构建来源证明。
- 首版继续要求管理员权限，不配置代码签名、应用内自动更新、ARM64 或其他操作系统构建。

## Capabilities

### New Capabilities

- `bundled-python-runtime`: 正式安装包内置、验证并优先使用固定 Python 运行时和脚本依赖。
- `sanitized-diagnostics`: 应用生成稳定、可导出且经过脱敏的系统与运行状态诊断。
- `github-release-distribution`: GitHub CI、标签发布、安装包命名、校验文件和用户下载文档的公开分发契约。

### Modified Capabilities

- `game-display-dpi`: 明确公开版本在多显示器、负坐标和常见 Windows DPI 缩放下的支持与验证要求。

## Impact

- 依赖与构建：`package.json`、锁文件、Electron/electron-builder、Python 运行时准备脚本和 NSIS 资源。
- 主进程与 preload：Python 解析、健康检查、诊断生成与导出 IPC。
- 前端：首页运行环境状态与诊断导出入口。
- 发布与文档：GitHub Actions、README、截图、第三方许可证声明。
- 测试：运行时解析、脱敏、构建契约、DPI 矩阵和安装包冒烟验证。
