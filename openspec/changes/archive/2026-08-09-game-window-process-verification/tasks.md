## 1. 共享配置与主进程识别层

- [x] 1.1 `shared/gameWindowTitles.js` 新增默认游戏客户端进程名列表、校验函数与“标题+进程名”整体判定函数
- [x] 1.2 `electron/modules/system/gameWindowTitles.js` 共享配置扩展 `processNames` 字段，旧配置自动补齐默认列表
- [x] 1.3 `electron/modules/system/gameDpi.js` 枚举候选时读取窗口进程名，仅保留标题与进程名同时匹配的窗口
- [x] 1.4 `electron/modules/priceCheck/clipboardCapture.js` 内嵌 Python 前台校验同时验证标题与进程名

## 2. Python 窗口识别脚本统一接入进程名校验

- [x] 2.1 `foreground_watcher.py` 前台判定增加进程名校验并读取共享配置中的 `processNames`
- [x] 2.2 `crafting_template.py` 的 `is_game_foreground` / `find_game_window` 增加进程名校验
- [x] 2.3 `map_rolling_template.py` 的 `is_game_foreground` / `find_game_window` 增加进程名校验
- [x] 2.4 `combat_assist_template.py` 的 `is_game_foreground` 增加进程名校验
- [x] 2.5 `bag_auto_stash_template.py` 的 `is_game_foreground` / `find_game_window` 增加进程名校验
- [x] 2.6 `chaos_recipe_pick_template.py` 的 `is_game_foreground` / `find_game_window` 增加进程名校验
- [x] 2.7 `stash_pickup_template.py` 的 `is_game_foreground` / `find_game_window` 增加进程名校验
- [x] 2.8 `puzzle_analyzer.py` 的 `is_game_foreground` / `find_game_window` 增加进程名校验
- [x] 2.9 `stash_tab_selector.py` 的窗口识别增加进程名校验

## 3. 回归测试

- [x] 3.1 新增浏览器标题含游戏名但进程非游戏客户端的误判回归测试
- [x] 3.2 更新共享标题匹配、DPI、快捷键门禁相关测试以覆盖进程名校验
- [x] 3.3 更新 Python 脚本源码断言测试，确认全部脚本接入同一进程名校验
- [x] 3.4 用模拟浏览器窗口在开发版端到端验证前台监视器输出 `game: false`

## 4. 验证与收尾

- [x] 4.1 `openspec validate` 通过
- [x] 4.2 运行完整测试套件并确认无回归
- [x] 4.3 检查无遗留调试代码或无效修改

## 5. 审查修复

- [x] 5.1 前台监视器在 game 不变但 reason/进程名变化时重新上报事件
- [x] 5.2 默认进程名列表补充 Epic 客户端变体并同步全部副本
- [x] 5.3 进程名配置链路：IPC、preload、渲染 API、设置存储与设置页编辑入口
- [x] 5.4 进程名配置保存时归一化为 basename，Python 读取同样归一化
- [x] 5.5 OpenSpec 规格补充进程名可编辑与前台原因通知明细
