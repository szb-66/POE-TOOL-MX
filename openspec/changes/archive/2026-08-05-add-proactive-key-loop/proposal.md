## Why

战斗辅助目前只支持被动喝药(像素检测→触发)。玩家在使用鼠标宏/盾冲等场景需要按固定间隔主动喝药或触发技能,每次手动按键容易失误且无法与被动喝药同时生效。需要新增"主动式循环喝药":配置多个按键条目、每个条目独立循环间隔,开启后按各自间隔循环发送,且与被动喝药互不干扰、可并行运行。

## What Changes

- 战斗辅助页面新增"主动喝药循环"面板:可添加多个按键条目,每条目含启用开关、按键、独立循环间隔(毫秒),支持删除;提供独立的开始/停止按钮和运行状态
- 主动循环开启时立即按下对应按键,并按每个条目的独立间隔循环发送;游戏窗口不在前台时暂停发送,回焦后自动恢复
- 主动循环使用独立后台进程与独立配置文件,与被动喝药、一键回城并行运行,互不影响
- 运行中修改循环配置经热更新生效,不重启进程
- 首页战斗辅助卡片外露两组独立操作(被动喝药启停 + 主动循环启停),状态分别显示两类触发计数,运行状态文案区分被动/循环/两者
- 配置持久化于战斗辅助配置的 `loop` 段,启动校验拆分:被动喝药与主动循环各自独立校验

## Capabilities

### New Capabilities

- `proactive-key-loop`: 按固定间隔循环发送配置按键的主动式功能,覆盖多条目独立间隔、独立进程运行、前台安全约束与热更新

### Modified Capabilities

- `combat-assist`: 战斗辅助配置新增主动循环段,页面新增循环面板,运行与前台约束扩展覆盖循环进程
- `dashboard-home`: 战斗辅助卡片新增主动循环启停操作与运行状态展示

## Impact

- `shared/combatAssist.js`: 配置默认值、规范化与独立校验(`validateLoopAssist`)
- `src/assets/scripts/combat_assist_template.py`: 新增 `--mode loop` 运行模式
- `electron/modules/ipc/combat.js`、`electron/preload.cjs`: 新增循环进程 4 个 IPC 通道,状态事件带来源标记
- `src/api/electron.js`、`src/stores/combat.js`、`src/utils/combatService.js`: 渲染端桥接与状态分流
- `src/domains/combat/CombatView.vue`、`src/domains/dashboard/*`: 页面面板与首页外露
- `src/domains/settings/settingsStore.js`: 配置保存同步写两份运行时配置并支持失败回滚
