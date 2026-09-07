## Why

当前应用只能依赖用户手动访问发布页下载新版本，无法在应用内获取更新信息、下载或安装。现有 Windows NSIS 与 GitHub Release 流程已具备自动更新的基础，需要补齐客户端状态机、界面与发布元数据。

## What Changes

- 在应用内提供当前版本、可用版本、发布时间、发布说明和下载进度。
- 新增默认手动、可选自动检查与下载的更新模式，安装始终需要用户确认。
- 将更新流程放在 Electron 主进程中，通过受控 IPC 向渲染进程暴露状态与操作。
- 安装前先执行现有资源清理，清理失败时不强制退出或安装。
- 发布流程增加 `latest.yml` 和 NSIS `.blockmap` 资产，使用公开 GitHub Release 作为首期更新源。
- 保留有序更新源边界，为后续国内对象存储主源和 GitHub 回退扩展。

## Capabilities

### New Capabilities

- `application-update`: 定义 Windows 应用内版本检查、更新下载、用户确认安装、设置持久化与失败隔离行为。

### Modified Capabilities

- `github-release-distribution`: 发布契约增加 Electron Updater 所需的更新元数据和差分资产。

## Impact

- 新增 `electron-updater` 运行时依赖与主进程更新服务。
- 扩展 IPC、preload 桥接、渲染层 Electron API、设置 Store 与设置页。
- 调整 GitHub Release 工作流和发布契约测试。
- 首个包含更新能力的版本仍需手动安装；后续版本才能使用应用内更新。
