## 1. 配置层

- [x] 1.1 shared/combatAssist.js 增加 loop 段默认值、规范化(条目 key/intervalMs/enabled、间隔下限 100ms)
- [x] 1.2 新增 validateLoopAssist,validateCombatAssist 改为综合校验(被动或循环任一有效即可)

## 2. Python 运行脚本

- [x] 2.1 combat_assist_template.py 新增 run_loop(统一 tick + 逐条目独立间隔到期判断、启动立即按下、失焦暂停)
- [x] 2.2 main() 支持 --mode loop,RuntimeConfig 热重载校验放宽为允许 potion 或 loop 段

## 3. 主进程 IPC 与桥接

- [x] 3.1 combat.js 抽取 spawnCombatProcess 公共辅助,新增 loop 进程状态与 4 个 handler(启动/停止/状态/热更新),状态事件带 origin 标记,纳入退出清理
- [x] 3.2 preload.cjs 与 src/api/electron.js(mock + 真实)桥接 4 个方法

## 4. 渲染端状态与服务

- [x] 4.1 stores/combat.js applyStatus 按 origin 分流,新增 loopRunning/loopFocused/loopTriggers/loopLastError
- [x] 4.2 combatService.js 新增 startLoopAssist/stopLoopAssist/initLoopAssist,启动时各自独立校验

## 5. 配置保存

- [x] 5.1 settingsStore.updateCombatAssist 串行同步两份运行时配置,loop 失败时回滚 potion 写入

## 6. 页面与首页外露

- [x] 6.1 CombatView.vue 新增"主动喝药循环"面板(添加/删除条目、启用开关、按键捕获、间隔输入、独立启停与状态)
- [x] 6.2 dashboardStatus.js 状态文案与前台判定支持双进程;useDashboard.js 卡片两组独立按钮与 refresh 补查循环状态

## 7. 测试

- [x] 7.1 combatAssist.test.js:loop 规范化/校验用例、run_loop 模拟(独立间隔、启动立即触发、禁用条目、失焦暂停)、IPC 桥接断言
- [x] 7.2 dashboardStatus.test.js:双进程运行文案与前台判定断言
- [x] 7.3 全量测试通过(738 项)
