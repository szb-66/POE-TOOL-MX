## Context

见 proposal.md 和两份 delta spec。应用当前使用 Electron 43、Vue 3、Pinia、Windows x64 NSIS，GitHub 标签工作流已会生成安装包、`latest.yml` 和 `.blockmap`，但 Release 只上传安装包、SHA-256 和第三方声明。设置保存在渲染进程 localStorage，主进程有统一异步退出清理，工作区存在需要保留的在途修改。

## Goals / Non-Goals

**Goals:**

- 以可测试、可替换的主进程服务封装 GitHub 更新。
- 将所有网络与安装权限留在主进程，渲染层只获得有限状态和命令。
- 在开发版中用假更新器验证全部状态转移，不要求正式打包。

**Non-Goals:**

- 本变更不接入国内对象存储、不配置代码签名、不做静默安装或预发布通道。
- 不在本次开发版验证中执行真实覆盖安装。

## Decisions

### 使用 electron-updater 的 NSIS 更新器

选择 `electron-updater` 而不是 Electron 内置 Squirrel 更新，因为现有产物已是 electron-builder NSIS，且需要 GitHub provider、下载进度和 `.blockmap` 差分支持。`autoDownload` 由模式控制，`allowDowngrade` 和预发布自动下载保持关闭。

### 可注入的 ApplicationUpdateService

服务接收 updater、定时器、当前版本、开发/打包标记、状态发布器和安装前清理函数。生产环境适配 `electron-updater`；测试注入 EventEmitter 假实现，不访问网络。服务维护单一快照，状态为 idle、checking、available、not-available、downloading、downloaded 或 error。

### 设置由渲染层持久化并显式配置主进程

沿用现有 settings Store，新增 `updateMode` enum（`manual`/`automatic`），默认 `manual`。Store 加载后调用 `update-configure`；主进程在收到配置前不启动定时器，避免 localStorage 与主进程出现两份配置。自动模式使用 30 秒首次延迟和 6 小时周期；切换回手动时清理定时器。

### 受控 IPC 与纯数据快照

preload 只暴露 getState/configure/check/download/restartAndInstall/onStateChanged。参数只允许模式 enum，不允许渲染层提供 URL、文件路径或命令。错误在主进程转为不包含凭据、URL 查询参数或完整本地路径的短文本。

### 安装使用严格的预清理路径

正常退出保持现有“清理失败仍退出”语义。更新安装单独调用可重用的严格清理：全部清理成功后才调用 `quitAndInstall`，任一失败或 8 秒超时都恢复可操作状态。服务防止重复安装请求。

### GitHub 发布资产

package 增加显式 GitHub publish provider，使构建内生成 `app-update.yml`。标签工作流保留现有 `gh release create`，将同版本 `.blockmap` 和 `latest.yml` 一并传入，并在上传前验证它们存在且版本一致。这不需要新增客户端 GitHub token。

## Risks / Trade-offs

- [未签名安装包会触发 SmartScreen/UAC] → 继续显示明确警告，安装必须由用户确认，后续正式扩大覆盖前引入签名。
- [GitHub 在大陆网络下可能失败] → 失败仅影响更新模块，保留有序 provider 工厂边界以后接国内 generic 源。
- [更新事件异步竞态] → 以单任务锁、状态机和事件解绑清理防止重复下载或定时器泄漏。
- [首个升级版无法被旧版自动获取] → 将该版本标记为需手动安装的过渡版。

## Migration Plan

1. 先发布包含更新客户端的过渡版，说明用户需手动安装。
2. 下一个稳定版同时发布完整更新资产，执行真实覆盖升级验收。
3. 若更新链路异常，可从后续版本禁用自动检查；用户始终保留 GitHub Release 手动下载路径。
