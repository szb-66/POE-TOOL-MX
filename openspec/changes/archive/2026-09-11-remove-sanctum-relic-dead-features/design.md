# remove-sanctum-relic-dead-features 设计

## Context

圣物功能已具备完整扫描、求解、评分与路线联动；本次是纯收敛性改动（见 proposal.md）。相关现状：

- `electron/modules/sanctum/relicParser.js:13` 将「每个楼层开始时获得#层启迪」的规则通道映射为 `[null, 'inspiration']`；而 `shared/sanctum.js` 的 `applySanctumEffects` 已存在 `inspirationOnFloor` 分支（与 `inspirationOnAffliction`/`inspirationOnRun` 同组 no-op），因映射为空永不触达。结果：该词缀匹配成功、计入启迪评分（`service.solveLoadout` 按 `scoreChannel === 'inspiration'`），却在效果汇总与候选评分缺口中以原文进入 `unknown`。
- `previewRelicText`：`electron/modules/ipc/sanctum.js`、`service.js`、`electron/preload.cjs` 白名单三处就绪，`src/` 无任何调用，用户不可达。
- `positions`（固定摆放位置）：`loadout.js` 支持输入校验与枚举过滤，`service.saveLoadoutPreferences` 支持校验保存，前端仅有整体清空传参；无逐件设置界面，规格未要求。
- `exclusiveGroup`（互斥组）：`loadout.js` 有互斥检查与测试，目录解析器（`scripts/sanctum/relicCatalogParser.js`）与 `relicParser.js` 从不生成该字段，生产路径不可达，规格未要求。

## Goals / Non-Goals

**Goals:**

- 已匹配的楼层启迪词缀不再误报为未支持效果（映射到既有 `inspirationOnFloor` 规则，复用现有 no-op 分支）。
- 删除三条不可达能力的全部代码与测试引用，保持删除后无残留引用。

**Non-Goals:**

- 不新增任何功能（游戏内 Ctrl+F 仓库搜索联动、筛选网格高亮、游戏内圣物浮窗均不在本轮范围）。
- 不为 `positions`/`exclusiveGroup`/`previewRelicText` 补 UI 或数据源；若未来规格要求，再按新 change 引入。
- 不做存档迁移；不调整求解算法、评分权重与目录数据。

## Decisions

1. **修复取"补映射"而非"删分支"**：`relicParser.js` 的空映射改为 `['inspirationOnFloor', 'inspiration']`，让已匹配词缀走 `applySanctumEffects` 现有 no-op 分支（其评分已由 `scoreChannel` 覆盖，路线推演无需额外建模）。备选"删除 `shared/sanctum.js` 的死分支、保持 unknown 展示"被否：那会把已支持词缀永久留在计算缺口里，与现有"未支持效果才显示缺口"的边界矛盾。
2. **删除而非补 UI**：`previewRelicText`、`positions`、`exclusiveGroup` 均无规格要求且不可达；按"删除优先于补全"处理，三条链路一次性移除，避免半成品能力继续膨胀维护面。
3. **旧持久化数据不做迁移**：升级后旧存档 `loadoutPreferences.positions` 残留字段会被 `service.saveLoadoutPreferences` 重建偏好时自然丢弃；残留期间求解器已不读取该键，行为无影响。IPC 通道移除仅影响内部白名单，前端从未调用。
4. **测试同步收敛**：删除用例中对应的 `positions` 入参与 `exclusiveGroup` 对照数据（`sanctumLoadout.test.js` 的互斥对照组与固定位置断言、`sanctumService.test.js` 的 `positions: {}` 传参）；`sanctumRelicParser.test.js` 中经 `previewRelicText` 的服务层调用改为删除该调用（保留"预览不改变状态"之外的扫描断言），并新增一条「每个楼层启迪词缀匹配后 `rule === 'inspirationOnFloor'` 且不进入 `applySanctumEffects` 未知列表」的断言。

## Risks / Trade-offs

- [删除 `positions` 收紧求解器输入契约] 仅内部调用方（`service.solveLoadout`）传入输入，同步修改，无外部 API 承诺 → 同一 change 内一起改并跑求解器测试。
- [旧存档残留字段] 读取侧不感知，重建偏好时丢弃 → 无需迁移，观察一个版本即可。
- [映射修复改变 unknown 展示面] 已匹配词缀从"未知效果/评分缺口"消失属于预期行为修正，规格 delta 已澄清该边界 → 用新增断言锁定。
