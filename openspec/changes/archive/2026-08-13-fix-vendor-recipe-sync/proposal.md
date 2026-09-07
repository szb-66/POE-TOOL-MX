## Why

商城配方在游戏内浮窗完成自动取件后存在三类可复现故障：①浮窗配方菜单括号中的数量与主窗口配方卡片数量回到取件前旧值；②取件后立即切换配方再点“取出配方”无反应，需再次点击同一配方后才可取出；③浮窗取件速度明显慢于“设置 → 自动操作”中的全局时序。

根因：①取件完成后主窗口仍保留 1.5 秒自动网络刷新，而国服仓库接口数据只在游戏内切换地图后更新，自动刷新必然用旧数据覆盖取件期间 `consumeItem` 维护的本地精确快照；②浮窗切换单件配方时勾选来自陈旧的 `selectedItemIdsByRecipe`，而状态计算优先读取该字段，主窗口异步回推到达前勾选过期导致可取数为 0；③浮窗 `control.runtime` 的时序字段从不随主窗口运行时同步（仓库取件与君锋镇均携带全局时序，唯独商城配方缺失），仅在用户修改设置时临时覆盖，应用重启后回退默认值。

## What Changes

- 取件完成（completed）或停止（stopped）时，主进程向主窗口广播取件期间维护的本地精确快照（`chaos-recipe-snapshot-updated`），作为取件后数量更新的唯一来源。
- **移除**取件完成后 1.5 秒的自动网络 `refresh()`：取件完成后系统 MUST NOT 自动重新获取仓库网络数据，数量完全由本地消费模型（逐件 `consumeItem`）驱动。
- 浮窗切换单件配方时，基于当前最新快照的候选**实时重算勾选**并同步 `selectedItemIdsByRecipe`，不再依赖主窗口异步回推，解决“首次切换后取出无反应”。
- 浮窗取件时序接入全局设置：运行时同步携带 `operationDelayMs/adaptiveTiming/adaptiveTimeoutMs/fixedTiming`（与仓库取件、君锋镇一致），浮窗取件速度恒等于“设置 → 自动操作”配置。
- 游戏内控制浮窗的配方切换与取出失败时，错误原因不再被后续状态推送覆盖，用户能看到具体失败原因。

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- `cn-chaos-recipe-overlay`: 取件完成后控制浮窗与主窗口共享同一份本地精确快照；切换单件配方时勾选基于最新快照即时对齐；浮窗取件使用全局自动化时序；失败原因保持可见。
- `vendor-recipe-automation`: 取件完成/停止时立即向主窗口广播最新快照且禁止自动网络刷新；单件配方勾选与最新快照即时对齐；取件计划使用全局自动化时序。

## Impact

- `electron/main.js`：混沌配方自动取件的 `onStatusChange` 挂接点在取件完成/停止时广播最新快照（已实施）。
- `src/domains/shop/ChaosRecipeControlOverlayView.vue`：失败原因不被状态推送覆盖（已实施）。
- `src/stores/chaosRecipe.js`：`listenAutomation` 移除取件后自动网络刷新；`runtimePayload` 携带全局时序四字段。
- `electron/modules/chaosRecipe/controlOverlay.js`：`selectRecipe` 切换单件配方时基于最新快照重算勾选。
- 不涉及 API 契约变化，IPC 通道复用现有 `chaos-recipe-snapshot-updated`。
