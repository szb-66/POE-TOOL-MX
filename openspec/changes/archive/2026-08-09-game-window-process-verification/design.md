## Context

当前全部游戏窗口识别（前台监视器、DPI 识别、查价、自动喝药、地图洗练等）只按窗口标题包含配置名称判定。已用真实窗口复现：标题为“Path of Exile 编年史 - Google Chrome”的普通窗口位于前台时，`foreground_watcher.py` 输出 `game: true`，导致“仅在游戏窗口前台时生效”的快捷键在浏览器中仍注册并触发。详见 proposal.md - Why。

## Goals / Non-Goals

**Goals:**
- 所有游戏窗口识别统一为“标题包含匹配 + 客户端进程名匹配”。
- 保持现有“游戏窗口名称”自定义能力，进程名使用默认列表并通过共享配置热更新。
- 旧版配置（无进程名字段）自动兼容，不要求用户重新配置。

**Non-Goals:**
- 本期不新增进程名编辑 UI；进程名列表作为共享配置字段持久化，后续可在设置页扩展编辑。
- 不重构 Python 脚本为共享模块，沿用各脚本内嵌同一判定逻辑的现有风格。

## Decisions

1. **进程名校验使用白名单，而非排除浏览器黑名单。** 白名单能根除标题误判；黑名单无法覆盖所有非游戏程序。默认列表：`PathOfExile.exe`、`PathOfExile_x64.exe`、`PathOfExileSteam.exe`、`PathOfExile_x64Steam.exe`（POE1/POE2 国服、国际服、Steam 常见进程名），大小写不敏感。备选方案：仅排除浏览器进程，被否决（不完整）。
2. **进程名随共享配置 JSON 热更新。** `game-window-titles.json` 扩展 `processNames` 字段；旧文件缺失该字段时读取默认列表，写入时补齐。所有 Python 脚本沿用现有 `POE_GAME_WINDOW_TITLES_FILE` 读取机制，解析同一文件中的 `processNames`。
3. **进程名获取失败时保守判定为非游戏。** 使用 `GetWindowThreadProcessId` → `OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION)` → `QueryFullProcessImageNameW` 读取 exe 文件名；任何一步失败或进程名不在白名单，都不识别为游戏窗口。备选方案：失败时仅按标题判定，被否决（会重新引入误判窗口）。
4. **JS 侧保留标题优先级函数，新增“窗口整体判定”。** `gameWindowTitlePriority` 继续用于同名候选排序；`isGameWindowTitle` 扩展为同时接收进程名，或新增 `isGameWindowCandidate(title, processName)`，由 DPI 枚举脚本传入每个候选窗口的进程名后过滤。

## Risks / Trade-offs

- 自定义客户端的进程名不在默认列表时会被漏识别 → 共享配置已支持 `processNames` 字段，后续可通过设置页补充；本期默认列表覆盖官方国服/国际服/Steam 客户端。
- 游戏通过启动器代理窗口运行（窗口标题含游戏名但进程是启动器）时不会被识别 → 符合“游戏未真正启动”的安全语义。
- 修改全部 Python 模板的一致性风险 → 每个脚本内嵌相同的 `game_window_process_names()` 与窗口判定函数，并通过现有源码断言测试保证全部接入。

## Migration Plan

1. 共享配置读写升级：读取时兼容 v1 无 `processNames`，写入时始终包含默认或已配置列表。
2. 全部窗口识别脚本与内嵌 Python 同时更新，避免部分模块行为不一致。
3. 回归测试覆盖浏览器误判、真实游戏进程匹配、旧配置兼容三条路径；验证在开发版进行。

## Open Questions

<!-- 无。 -->
