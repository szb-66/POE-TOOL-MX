## Context

现状：取件期间 `service.consumeItem()` 在本地逐件维护精确快照（脚本确认物品转移后才上报），并只调用 `control.sync()` 更新游戏内浮窗；主窗口快照只在收到 `completed` 事件 1.5 秒后的一次网络 `refresh()` 更新，而国服 `get-stash-items` 接口数据只在游戏内切换地图后更新，自动刷新必然拿旧数据并覆盖本地快照。浮窗切换单件配方时勾选来自陈旧的 `selectedItemIdsByRecipe`，`computeState` 优先读取该字段导致可取数错误。浮窗 `control.runtime` 的时序字段从不随主窗口运行时同步。详见 proposal.md。

## Goals / Non-Goals

**Goals:**
- 取件完成/停止后数量完全由本地精确快照驱动，不自动请求网络。
- 浮窗切换单件配方后取出立即可用（勾选基于最新快照即时重算）。
- 浮窗取件时序恒等于全局“自动操作”配置。

**Non-Goals:**
- 不改变取件脚本、取件安全校验、断点生命周期等既有行为。
- 不引入新 IPC 通道（复用现有 `chaos-recipe-snapshot-updated`）。
- 不解决国服接口返回旧数据的接口延迟问题本身（通过不自动刷新规避）。

## Decisions

**D1：在取件完成/停止时广播本地快照，而不是逐件广播。**
`automation.send()` 的 `completed`/`stopped` 事件已通过 `onStatusChange` 汇到 main.js。在该挂接点向主窗口发送 `chaos-recipe-snapshot-updated`，携带 `service.snapshot`（已实施）。
- 备选：逐件广播（每件 `item-picked` 都发）。被否：广播频率高，且主窗口每次收到都会重置单件勾选并回推运行时，取件中用户取消勾选会被反复覆盖。

**D2：失败原因保留在浮窗本地 state，后续状态推送不覆盖。**
`applyState()` 的 `Object.assign(state, snapshot)` 在 apply 前暂存 `actionReason`/`recipeSelectionReason`，apply 后按失败标记恢复（已实施）。
- 备选：让主进程 computeState 记住错误。被否：错误是 renderer 侧一次性交互结果，主进程状态模型会因此携带跨请求的 UI 痕迹。

**D3：移除取件完成后的自动网络刷新，本地快照为准。**
删除 `src/stores/chaosRecipe.js` `listenAutomation` 中 completed 分支的 `setTimeout(() => { void refresh().catch(() => {}) }, 1500)`。取件后数量更新唯一来源是 D1 的本地快照广播。
- 理由：国服 `get-stash-items` 数据只在游戏内切换地图后更新，取件刚结束时的自动刷新必然返回取件前旧数据，把 `consumeItem` 维护的准确快照覆盖回旧值（用户实测确认）。
- 备选：保留刷新仅作校准。被否：实测会回退数量，且用户明确要求不得自动获取网络数据。
- 保留用户手动"刷新仓库"（主面板、首页、浮窗按钮）作为唯一网络数据入口。

**D4：浮窗切换单件配方时基于最新快照即时重算勾选。**
`controlOverlay.selectRecipe()` 切换到单件配方时，从 `service.snapshot.recipes[id].candidates` 取全部 id 作为勾选，并同步写入 `runtime.selectedItemIdsByRecipe[id]`，使 `computeState` 的可取数立即正确，取出立即可用。
- 备选：依赖主窗口 `syncRuntime` 回推。被否：回推是异步 IPC，取件后立即切换时在途未达，勾选过期导致 `availableCount=0`、按钮禁用（用户实测"首次点击无反应，再点一次才成功"）。
- 符合既有 spec：选择单件配方时默认勾选全部候选。

**D6：移除取件完成广播后的运行时回推，消除迟到覆盖竞态。**
`src/stores/chaosRecipe.js` 的 `onSnapshotUpdated` 只更新本地 `snapshot` 与 `resetSingleSelections`，不再调用 `syncRuntime()` 回推浮窗。
- 理由：取件完成广播触发的 `syncRuntime`（A）携带主窗口旧 `activeRecipeId`（如取件前的'jeweller'），经异步 IPC（含 `registerConsumer` 等待）迟到到达并 `setRuntime` 整体覆盖，把浮窗刚切换的配方拉回旧值；用户立即点取件时按旧配方生成计划失败（用户实测"取完工匠石切幻色石，第一次取件不生效，再点一次才生效"）。
- D4 已让浮窗切配方时基于 `service.snapshot` 自行重算勾选，A 的回推不再必要；不切配方直接取出时，旧勾选经 `createPickingPlan` 用最新快照过滤即取出剩余物品，行为正确。
- 保留其余 `syncRuntime`（主窗口主动操作、配方切换回推、手动刷新）——这些是正确方向的主动同步。

**D5：浮窗取件时序接入全局设置。**
`src/stores/chaosRecipe.js` 的 `runtimePayload` 增加 `operationDelayMs/adaptiveTiming/adaptiveTimeoutMs/fixedTiming`（从 settingsStore 读取），每次 `syncRuntime` 都随运行时携带，`setRuntime` 覆盖浮窗时序。
- 与 `stashPickup.js` `runtime()`、`junfeng.js` 的既有实现对齐（二者均携带全局时序，商城配方此前缺失）。
- 备选：在初始化时调用 `automation-timing-update`。被否：该通道只在用户修改设置时触发，应用重启后浮窗仍回退默认时序；随 `syncRuntime` 携带与运行时生命周期一致且无需新增调用点。

## Risks / Trade-offs

- [主窗口每次收到快照广播都会重置单件勾选为全选] → 与手动刷新后的行为一致（spec 默认全选），仅发生在取件完成/停止时。
- [广播快照携带全量 items，体积较大] → 与现有 `chaos-recipe-snapshot-updated`（浮窗刷新仓库按钮）同一载荷与通道，无新增成本。
- [手动刷新在未切换地图时仍显示旧数据] → 接口同步延迟，属用户已知约束；手动刷新是唯一网络入口，用户自行把握时机。
- [移除自动刷新后广播若未送达则数量不更新] → 广播走主窗口 webContents 事件，取件期间主窗口持续在线；极端情况下用户可手动刷新。

## Migration Plan

无需数据迁移。改动集中在主进程挂接点、store 与浮窗组件，发布即生效，回滚为还原相应代码改动。
