# remove-sanctum-relic-dead-features

## Why

对照参考项目 Exile-UI 圣物管理器核对后发现：当前圣物功能存在一处规则映射失配——「每个楼层开始时获得#层启迪」已成功匹配目录并计入启迪评分，却因解析端映射为空规则而在效果汇总中被当作"未支持效果/计算缺口"展示；同时残留三条无用户入口或无数据来源的死功能（`previewRelicText` 链路、固定摆放位置 `positions`、互斥组 `exclusiveGroup`），三者均不在 `sanctum-relic-management` 规格内，属未请求的能力，徒增维护面。

## What Changes

- 修复 `inspirationOnFloor` 规则映射：解析端将「每个楼层开始时获得#层启迪」映射到已存在的规则标识（现映射为 `null`，导致 `applySanctumEffects` 的既有分支不可达、已匹配词缀误报为未知效果）。
- 删除 `previewRelicText` 整条链路（IPC 注册、服务方法、preload 暴露）；相关服务层测试改为不依赖该入口。
- 删除圣物固定摆放位置 `positions`：求解器输入校验与过滤、偏好保存校验、空状态字段、清空按钮传参及对应测试断言。旧持久化数据中的残留字段被自然忽略，无需迁移。
- 删除圣物互斥组 `exclusiveGroup`：求解器互斥检查及测试对照数据（生产目录与解析器从不生成该字段）。
- 本轮不新增功能；参考项目差异中的"游戏内 Ctrl+F 仓库搜索联动""筛选网格高亮""游戏内圣物浮窗"经确认不在范围内。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `sanctum-relic-management`: 澄清搭配评分的效果边界——与目录唯一匹配的启迪类词缀按已识别处理并计入对应评分，不得因规则映射缺失而在评分缺口/未知效果中展示。

## Impact

- 代码：`electron/modules/sanctum/loadout.js`、`electron/modules/sanctum/service.js`、`electron/modules/sanctum/relicParser.js`、`electron/modules/ipc/sanctum.js`、`electron/preload.cjs`、`shared/sanctum.js`、`src/domains/sanctum/SanctumRelics.vue`。
- 测试：`test/sanctumRelicParser.test.js`、`test/sanctumLoadout.test.js`、`test/sanctumService.test.js`（删除/改写相关断言，并为楼层启迪映射补一条断言）。
- 兼容性：IPC 通道 `previewRelicText` 移除（前端从未调用）；旧存档 `loadoutPreferences.positions` 残留字段被忽略，无需迁移；求解器输入契约收紧（不再接受 `positions`），仅内部调用方受影响。
