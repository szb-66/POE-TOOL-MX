## Context

战斗辅助已有完整的 Python 子进程链路(combat_assist_template.py + 主进程 IPC + combat-status 事件回灌 store),被动喝药与一键回城均复用该链路。主动循环与其机制同构:同样的按键模拟、同样的前台校验、同样的配置热加载。功能已按本设计实现并通过全量测试。

## Goals / Non-Goals

**Goals:**
- 复用现有子进程/IPC/热更新链路,最小新增架构
- 与被动喝药、一键回城完全并行,互不互斥

**Non-Goals:**
- 不为主动循环新增全局快捷键(与被动喝药快捷键体系分离,后续可按需添加)
- 不做按键序列(单条目单键,与被动喝药的按键序列区分)

## Decisions

**1. 独立进程 + 独立配置文件,而非在 potion 进程内加模式**
`--mode loop` 独立进程,配置写 `combat_loop_config.json`,与 `combat_potion_config.json` 分离。
- 备选:复用 potion 进程切换模式——会与被动喝药互斥,违背并行需求;配置结构不同(列表 vs 双资源)会使热重载解析互相污染。

**2. 循环 tick 模型:统一 50ms tick + 逐条目到期判断**
每轮 tick 检查每个启用条目的 `now - last_press >= intervalMs`;`last_press` 初始为 0,因此启动第一轮立即按下(满足"开启时就按对应按键")。
- 备选:每条目独立定时器——Python 单线程下无意义,统一 tick 更简单,50ms 精度对 ≥100ms 间隔足够。

**3. 状态事件带 `origin: 'loop'` 走同一 combat-status 通道**
主进程 sendStatus 统一注入 origin,渲染端 `applyStatus` 按 origin 分流到独立的 `loopRunning/loopFocused/loopTriggers/loopLastError`。
- 备选:独立事件通道——需要新增 preload 监听与 store,收益低。

**4. 校验拆分:启动严格、保存宽松**
`combat-start-potion` 用 `validatePotionAssist` 严格校验、`combat-start-loop` 用 `validateLoopAssist`;`combat-update-*-config` 仅规范化(允许"只配循环、禁用被动"的用户保存);settingsStore 保存路径用综合校验(任一模块有效即可),串行提交且 loop 失败时回写 potion 旧配置,避免磁盘与 UI 分叉。

**5. 首页外露:combat 卡片内并列两组按钮**
沿用现有 actionsFor 多按钮能力,不新建卡片;状态文案拼接"被动喝药 + 主动循环",前台状态要求两进程都前台才显示"游戏窗口前台"。

## Risks / Trade-offs

- 两进程同时向游戏发键,理论上可能叠加输入 → 用户自行承担配置责任;与现有被动喝药行为一致
- 统一 tick 的发送时点存在 ≤tick(50ms)的抖动 → 对药水/技能循环场景可接受,间隔下限 100ms
- 并行提交改为串行+回滚,保存路径多一次 IPC 往返 → 仅保存时发生,无感知
