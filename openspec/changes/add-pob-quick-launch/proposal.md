## Why

角色导出后仍需手动寻找、安装和更新中文 PoB。将启动和组件管理集中到导出页，并允许直接关联已有安装。

## What Changes

- 新增路径默认空白的启动卡片，支持保存、选择与清空目录。
- 自动安装及更新 PoeCharm 与 PoB Portable，显示状态和进度。
- 支持已有安装启动、更新备份、失败回滚和中断恢复。
- 下载、校验、解压显示阶段真实进度，安装/更新按钮切换为停止，取消后清理或回滚。
- 隔离状态通知异常，区分业务错误、取消与通信失败，保留阶段诊断。

## Capabilities

### New Capabilities
- `pob-quick-launch`: 本地中文 PoB 的安装、更新和启动生命周期。

### Modified Capabilities
无。

## Impact

新增 Electron 服务及 IPC、preload 和前端 API；导出页增加卡片，保留原导出行为。使用 yauzl 和原生文件流处理归档，移除不再使用的 extract-zip 直接依赖。下载来自官方 GitHub，配置仅保存在本机。

- 页面统一命名为“POB”，同步侧栏、模块管理及页面标题；路由保持不变。
