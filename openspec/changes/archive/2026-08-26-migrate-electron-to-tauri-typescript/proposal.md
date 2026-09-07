## Why

当前桌面端将完整 Electron/Chromium 主程序以管理员权限运行，已经出现过 Chromium 沙盒与提权进程冲突，并且全部产品代码仍以无静态类型的 JavaScript 为主。项目需要在保留现有 Windows 功能和整体管理员运行决策的前提下，迁移到更轻量、边界更明确的 Tauri v2 与严格 TypeScript 架构。

## What Changes

- **BREAKING**：以 Tauri v2/WebView2 和 Rust 系统层替换 Electron 主进程、preload、229 个 IPC 入口、electron-builder 与 Electron updater；首版 Tauri 主程序继续使用 `requireAdministrator`。
- 将 Vue、Pinia、共享领域逻辑、制作/解析/匹配逻辑和产品侧桌面桥接迁为严格 TypeScript；大型制作计算使用 Web Worker，最终产品路径不再依赖 JavaScript 或 Node sidecar。
- 建立类型化 `desktopApi`，由 Rust 命令和事件实现窗口、浮窗、DPI、快捷键、文件、Cookie、网络、更新、诊断及 Python 生命周期；每个窗口按最小 capability 授权。
- 保留现有界面、错误语义、自动化预检、紧急停止、多显示器/DPI、透明浮窗、账号登录、查价、反馈和制作行为。
- 从 `%APPDATA%\流放助手` 直接、幂等地迁移文件数据、白名单 Local Storage 设置和允许的账号 Cookie；失败时保留原数据并安全降级。
- Electron 到 Tauri 使用一次完整安装器切换，随后使用签名的 Tauri updater；打包、安装和发布仍需单独授权。
- 如果管理员 Tauri/WebView2 仍发生启动或沙盒冲突，不关闭沙盒；另行提出普通权限主程序与高权限 Host 的后续变更。

## Capabilities

### New Capabilities

- `tauri-desktop-runtime`: Tauri 管理员主程序、WebView2 启动、多窗口桌面能力、功能对等与性能切换门槛。
- `typed-desktop-bridge`: Vue 到 Rust 的类型化命令/事件契约、窗口 capability 和敏感能力隔离。
- `electron-user-data-migration`: 对旧 Electron 文件、Local Storage 与账号 Cookie 的直接、幂等、安全迁移。

### Modified Capabilities

- `stable-user-data`: 在运行时替换期间继续使用稳定用户数据根目录，并保证备份、兼容读取和失败回退。
- `application-update`: 从 Electron 更新链切换为一次完整安装器迁移和签名 Tauri updater。
- `bundled-python-runtime`: 由管理员权限 Rust 系统层启动、监督和停止随包 Python 运行时，同时保持现有安全预检。

## Impact

- 主要受影响区域：`src`、`shared`、新 `src-tauri`、开发启动脚本、测试与发布配置；迁移完成后删除 `electron` 和 Electron 专用依赖。
- 新增 Rust/Tauri、TypeScript、Vue 类型检查、Web Worker、Windows 清单、capability、数据迁移和 Tauri updater 工具链。
- 现有 Electron 版本在完整功能对等前保持冻结且可运行；默认仅执行开发版验证，不生成安装包。
- 切换前必须通过 Windows 10/11 x64 功能回归，并在正式包获批后验证安装体积下降至少 35%、空闲内存下降至少 20%、冷启动不慢于 Electron 基线。
