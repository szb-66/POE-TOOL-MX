## Why

用户把“一键回城”设置为 B 后，即使游戏未启动，Electron `globalShortcut` 也会在系统层面拦截 B 键，导致微信等游戏外输入被破坏。根因是所有用户快捷键都在启动时无条件注册，而不是按游戏窗口前台状态注册。

## What Changes

- 新增前台监视 Python 脚本与主进程监视器：每 250ms 读取系统前台窗口标题，按已配置的游戏窗口名称匹配，状态变化时输出结构化事件。
- 快捷键管理器拆分“意图快捷键集”与“当前已注册集”：游戏窗口位于前台时注册全部意图，失焦立即全部注销。
- 新增“仅在游戏窗口前台时生效”开关（默认开启），关闭后恢复全局无条件注册；查价等模块的单个快捷键在门禁下返回 `deferred`，进入游戏前台后自动注册。
- 设置页、首页健康状态、帮助中心与诊断事件同步展示门禁状态；F12 / Ctrl+Shift+I 开发者快捷键不受影响。

## Capabilities

### New Capabilities

- `game-scoped-shortcut-registration`: 用户全局快捷键仅在游戏窗口前台注册，并提供可关闭的开关、前台监视与诊断回退。

### Modified Capabilities

无。

## Impact

- 新增一个 Python 脚本（`foreground_watcher.py`），需要加入 `electron-builder` 的 `extraResources` 与运行时清单。
- 涉及快捷键管理器、IPC、preload、渲染 API、设置页、首页健康状态、帮助中心、诊断允许集合及对应单元测试。
- 不改快捷键字段名、配置迁移、现有脚本执行流程。
