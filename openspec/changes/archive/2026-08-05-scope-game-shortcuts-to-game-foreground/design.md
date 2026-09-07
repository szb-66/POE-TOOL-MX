## Context

现有快捷键在渲染进程启动后通过 `init-shortcuts-from-settings` 一次性注册为系统级 `globalShortcut`，与游戏窗口状态无关。系统级热键注册后会吞掉对应按键，游戏外的 B 等普通键因此失效。各自动化脚本已具备前台安全门禁，但快捷键注册层没有。

## Goals / Non-Goals

**Goals:**

- 用户配置的游戏快捷键只在游戏窗口位于前台时生效。
- 开关默认开启、可持久化、可在设置页关闭恢复旧行为。
- 前台状态变化后快捷键注册/注销延迟 ≤ 约 250ms。
- 监视器不可用时有明确回退（无条件注册）与诊断记录。

**Non-Goals:**

- 不改现有快捷键字段名、捕获控件、查价模块开关语义与脚本执行流程。
- 不做游戏内聊天输入识别；门禁只按前台窗口判定。
- 不新增原生依赖，前台探测复用已捆绑的 Python 运行时与 ctypes。

## Decisions

1. **前台判定标准**：系统前台窗口标题包含配置的游戏窗口名称（默认“流放之路”/“Path of Exile”），与现有 DPI 识别、自动化脚本的判定一致。
2. **持续 Python 监视器而非轮询 spawn**：`foreground_watcher.py` 每 250ms 调用一次 `GetForegroundWindow`/`GetWindowTextW`，只在状态变化时输出 `EVENT {"event":"foreground","game":true|false}`；主进程解析事件并调用 `setScopeActive`，避免每 250ms 创建 Python 进程。
3. **意图集与已注册集分离**：`intendedShortcuts` 保存用户配置，`registeredShortcuts` 保存当前实际注册；门禁开启且游戏未在前台时只保存意图、返回 `deferred`，进入前台后统一注册；集合注册失败回滚到上一组成功注册集合。
4. **回退策略**：前台监视器最终失败时 `setScopeAvailable(false)`，按旧行为无条件注册并记录 `foreground_watcher_failed` 诊断；开关保持开启状态，首页提示“前台监视不可用”。
5. **启动默认安全**：门禁开启时首个前台报告到达前不注册任何用户快捷键，保证游戏未启动场景下 B 等按键不受影响。
6. **开发者快捷键豁免**：F12 / Ctrl+Shift+I 由 `main.js` 直接注册，不进入意图集。

## Risks / Trade-offs

- [切窗后最多 250ms 内快捷键仍被拦截] → 监视器 250ms 轮询即为上限，可接受；相比全局拦截已消除持续破坏。
- [监视器依赖 Python 可用性] → 失败回退到旧行为并记录诊断，不丢失功能。
- [集合注册失败回滚可能导致前台注册为空] → 与既有事务回滚语义一致，失败列表会反馈到首页健康状态。
