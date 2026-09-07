## Context

动机见 proposal.md。现状：自动放入每完成一格通过 `step-completed` 事件清空对应仓库格（`src/stores/puzzle.js` 的 `listenExecution`），但执行完成后方案仍停留在上一张，必须再次「自动识别两页」才能更新计数并重算。当前展示方案 `currentSolution.sourceSlots` 已完整记录九块来源碎片的页、行、列，扣除所需信息全部在渲染进程内，无需截图。

## Goals / Non-Goals

**Goals:**
- 完成当前海图后一次点击完成扣除、清约束、重置执行状态与下一张重算。
- 主进程执行状态与渲染进程一致，页面重进不复活旧状态。
- 幂等：对自动放入已消耗的格子重复扣除无副作用。

**Non-Goals:**
- 不引入任何持久化字段或设置项。
- 不改变识别、求解、自动放入的既有协议与自动化安全预检。
- 不自动触发；完成动作始终由用户点击发起。
- 不在完成时重新识别仓库——新掉落的碎片留待用户下次主动识别。

## Decisions

### 1. 扣除以 `currentSolution.sourceSlots` 为唯一依据
来源格在求解时由 `assignSourceSlots` 从已识别页分配，是“这张海图用掉了什么”的权威记录。对每个来源按 `page`/`row`/`column` 用 `emptySlots(page)[index]` 置空即可。自动放入期间已被 `step-completed` 置空的格子再次置空无副作用。
- 备选：按 `execution.completed` 步数扣除——被否：无法覆盖手动放置完成的场景，且与方案来源记录脱节。

### 2. store 新增 `completeCurrentChart()`，本地状态先行、主进程同步尽力而为
该 action 依次：守卫（executing / 无方案）→ 置空九格 → 清空 `requiredExits`/`forbiddenExits` → 本地 `execution` 置 idle → `solutionIndex = 0` → `recompute()`。主进程同步通过新 IPC 调用完成，失败仅记录不阻塞本地结果（本地状态是重算的事实来源，主进程状态只是显示缓存）。
- 备选：复用 `analyze({ preserveSolution: false })` 的 `resetExecution`——被否：会触发截图识别流程，与本变更“免识别”的目标冲突。

### 3. 主进程新增 `resetExecution()` 与新 IPC 通道 `puzzle-complete-chart`
`PuzzleAnalysisService.resetExecution()` 将执行状态置为 idle 并 `publishExecution({ event: 'reset' })`，防御性关闭遮罩并释放自动化锁（正常完成路径已释放，重复释放安全）。新增通道贯通 `electron/modules/ipc/puzzle.js` → `electron/preload.cjs`（`completePuzzleChart`）→ `src/api/electron.js`（渲染 API 与浏览器兜底 stub）。
- 备选：不新增通道，仅本地重置——被否：页面卸载重进时 `refreshExecutionStatus()` 会把主进程的 `completed` 状态拉回，与 spec「状态同步持久」冲突。

### 4. 页面按钮无确认弹窗，成功后给出剩余数量反馈
按钮位于标题操作区「自动放入」旁，`:disabled="executing || analyzing || !currentSolution"`。点击直接调用 store action，成功后 `ElMessage.success('已扣除当前海图 9 块碎片，剩余 N 块已重新计算')`；守卫失败时用返回错误提示。无确认弹窗为已确认的产品决策。

## Risks / Trade-offs

- [用户在游戏内尚未真正放入碎片时误点完成] → 按钮文案明确为“当前海图已完成”，误扣可通过一次「自动识别两页」完整恢复。
- [仓库新掉落的碎片在完成时不可见] → 符合“免识别”诉求；用户随时可主动识别更新，不阻塞流程。
- [主进程 IPC 新通道在旧版本组合下缺失] → 渲染 API 用可选调用与兜底 stub，调用失败不影响本地状态与重算。
- [重算后剩余碎片不足或类型组合无解] → 复用现有 `INSUFFICIENT_FRAGMENTS` / `NO_SOLUTION` 反馈链路，无需新增文案分支。

## Migration Plan

无需迁移：无持久化字段变化、无协议破坏；旧客户端调用新通道走兜底 stub 返回成功。回滚即回退本变更的 store、页面与 IPC 代码。
