# 任务清单

## 1. 后端模型与核心逻辑

- [x] 1.1 `electron/modules/mapTracker/model.js`：从默认设置与 `normalizeMapTrackerSettings` 移除 `league`、`characterName`、`buildName`、`calibratedMechanics`、`mechanicCalibrations`；`createMapRun` 移除 `league` 字段
- [x] 1.2 `electron/modules/mapTracker/stateMachine.js`：构造函数与 `enterArea` 移除 league 参数与盖章逻辑
- [x] 1.3 `electron/modules/mapTracker/service.js`：移除 `SCREEN_MECHANIC_IDS` 导入、`recognizeMechanics` 注入与 `recognizeMechanicsImpl` 字段、`initialize`/`updateSettings` 中的 league 同步、`run.character` 的 `build` 字段写入；删除 `addMechanic`、`recognizeMechanics`、`calibrateMechanic` 三个方法
- [x] 1.4 `electron/modules/mapTracker/repository.js`：删除 `saveMechanicTemplate`；`runsToCsv` 列移除 `league`
- [x] 1.5 删除文件 `electron/modules/mapTracker/mechanicCatalog.js`、`electron/modules/mapTracker/mechanicRecognizer.js`、`src/assets/scripts/map_tracker_mechanics.py`

## 2. IPC 与装配

- [x] 2.1 `electron/modules/ipc/mapTracker.js`：删除 `map-tracker:calibrate-mechanic` handler；`mapTrackerValidation.js` 移除 `characterName`/`buildName`/`league` 设置键白名单（按实际内容最小化处理）
- [x] 2.2 `electron/preload.cjs`：删除 `calibrateMapTrackerMechanic`；`src/api/electron.js` 删除 `calibrateMechanic` 两处（降级桩 + 真实通道）
- [x] 2.3 `electron/main.js`：移除 `createMechanicRecognizer` 注入、`resolveMapTrackerMechanicsScriptPath` 及相关 import；先 grep `pythonDetector` 全部使用方，仅清理 map-tracker 专属引用

## 3. 前端配置门槛与引导

- [x] 3.1 `src/stores/mapTracker.js`：`enhancementCheck` 删除 `mechanics` 分支；`setEnhancement` 引导标题只剩 loot 分支
- [x] 3.2 `src/domains/configurationGuide/configurationIssues.js`：删除 `collectMapTrackerMechanicConfigurationIssues` 及其导出引用
- [x] 3.3 `src/domains/configurationGuide/ConfigurationIssueEditor.vue`：移除机制校准按钮、`SCREEN_MECHANICS` import、`screenMechanics`、`calibrateMechanic` 函数及相关样式

## 4. 抽屉 UI 与 UX 说明

- [x] 4.1 `MapTrackerDrawer.vue`：移除赛季/角色名/Build 名称三个输入框、机制校准区块及 `calibrate`/`isCalibrated`/`screenMechanics` 逻辑
- [x] 4.2 `MapTrackerDrawer.vue`：历史区移除赛季筛选输入、表格赛季列、展开详情赛季行
- [x] 4.3 `MapTrackerDrawer.vue`：`enhancementOptions` 增加说明文案并将开关网格改为"开关 + 一行说明"布局（复用 `.overlay-settings p` 小字样式）；"当前地图"卡片增加模块总述一行（自动开局/自动保存/统计范围）

## 5. 测试与验证

- [x] 5.1 更新 `test/mapTrackerModel.test.js`：移除 calibratedMechanics 断言；验证废弃键被 normalize 丢弃
- [x] 5.2 更新 `test/mapTrackerService.test.js`：移除 `addMechanic`/`recognizeMechanics`/校准相关用例（:13、:70、:94-95）与 league 设置；补一条"旧设置含 league/characterName/buildName 时 normalize 静默丢弃"的断言
- [x] 5.3 更新 `test/mapTrackerIpcValidation.test.js` 移除 buildName 等断言；grep 其余 `test/` 中 league、mechanicCalibrations、calibrateMechanic 引用并清理
- [x] 5.4 运行 `node --test test/mapTracker*.test.js`，再全量 `npm test`；若仓库有 lint/typecheck 脚本一并执行
- [x] 5.5 `openspec validate map-tracker-ux-clarity --strict` 通过
