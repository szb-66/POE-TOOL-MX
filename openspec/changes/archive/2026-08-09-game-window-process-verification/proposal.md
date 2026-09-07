## Why

当前所有“游戏窗口识别”仅按窗口标题包含游戏名称（“流放之路”“Path of Exile”）判断。浏览器标签页标题只要包含这些词（例如“Path of Exile 编年史 - Google Chrome”），就会被误判为游戏窗口：开启“仅在游戏窗口前台时生效”后，切换到这类浏览器页面时快捷键仍然注册并被触发；同根因还会让自动喝药等脚本向非游戏窗口发送输入。

## What Changes

- 游戏窗口识别增加“客户端进程名”维度：只有窗口标题匹配配置名称 **且** 窗口所属进程匹配游戏客户端进程名列表时，才判定为游戏窗口。
- 前台监视器、公共界面检测、查价、DPI 识别、自动喝药、地图洗练等所有使用窗口识别的地方统一采用同一判定规则。
- 进程名列表纳入共享配置并热更新；旧版配置缺少进程名时使用默认列表，不破坏现有标题自定义能力。
- 新增针对浏览器等非游戏窗口标题误判的回归测试。

## Capabilities

### New Capabilities

<!-- 无新增能力，均为既有能力的行为修正。 -->

### Modified Capabilities

- `game-window-title-configuration`: 识别游戏窗口从“标题包含匹配”扩展为“标题包含匹配 + 客户端进程名匹配”，共享配置同步进程名列表。
- `game-scoped-shortcut-registration`: 前台监视器按标题 + 进程名判定游戏前台，避免浏览器页面被误判后注册快捷键。
- `combat-assist`: 自动喝药前台校验同时验证标题与客户端进程名。
- `proactive-key-loop`: 主动循环喝药前台校验同时验证标题与客户端进程名。
- `map-rolling-foreground-start`: 查找、恢复、激活游戏窗口时过滤非游戏客户端进程。
- `cn-price-check-overlay`: 查价复制前的前台确认同时验证标题与客户端进程名。
- `game-display-dpi`: 自动识别游戏窗口 DPI 时过滤非游戏客户端进程。

## Impact

- `shared/gameWindowTitles.js`：新增默认进程名列表与校验函数。
- `electron/modules/system/gameWindowTitles.js`：共享配置扩展进程名字段并兼容旧格式。
- `electron/modules/system/gameDpi.js`、`electron/modules/priceCheck/clipboardCapture.js`：内嵌 Python 识别逻辑增加进程名校验。
- `src/assets/scripts/foreground_watcher.py` 及全部 Python 自动化模板：`is_game_foreground` / `find_game_window` 等窗口识别函数统一增加进程名校验。
- 设置页与存储：保持现有“游戏窗口名称”编辑能力，进程名使用默认列表并随共享配置持久化。
- 测试：更新现有标题匹配与脚本源码断言，新增浏览器误判回归用例。
