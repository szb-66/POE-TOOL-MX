# 任务清单

## 1. 后端

- [x] 1.1 `model.js`：增强项只剩 kills/character/loot；快捷键只剩 refreshKills；`createMapRun` 移除 `mapModifiers`/`notes`/`mechanics`
- [x] 1.2 `stateMachine.js`：移除 `map-mechanic` 处理
- [x] 1.3 `service.js`：移除 `nextMap` 状态、`captureNextMap`、`addNote`；`handleEvent` 移除机制开关条件；`removeCurrentEntry` 白名单只剩 loot；删除不再使用的 `assertEnabledFeatureForeground`
- [x] 1.4 `repository.js`：`EDITABLE_FIELDS` 收缩为 `areaName`；CSV 列移除词缀/备注/机制/投入物
- [x] 1.5 `clientEvents/parser.js`：移除机制特征匹配与 `VERIFIED_MECHANIC_PATTERNS`
- [x] 1.6 追加：移除投入物——`model.js` 删 `deviceInputs` 与孤儿 `uniqueStrings`；`service.js` 删 `addInvestment`；`repository.js`/`ipc`/`preload`/`api` 删 add-investment 链路

## 2. IPC 与装配

- [x] 2.1 `ipc/mapTracker.js` 删除 `capture-map`/`add-note` handler；`mapTrackerValidation.js` 增强白名单收缩为 kills/character/loot
- [x] 2.2 `preload.cjs` 删除 `captureMapTrackerMap`/`addMapTrackerNote`；`src/api/electron.js` 删除 `captureMap`/`addNote` 两处

## 3. 前端

- [x] 3.1 `MapTrackerDrawer.vue`：移除当前备注区块、备注/投入物按钮调整、待记录地图区块、词缀/备注/机制列与展开行、编辑备注、三个增强开关与说明
- [x] 3.2 `MapTrackerOverlayView.vue`：移除机制/备注 chips；`src/stores/mapTracker.js` 移除 `nextMap`
- [x] 3.3 快捷键链路：`featureCatalog.js`、`shortcutConfig.js`、`scriptService.js`、`SettingsView.vue` 移除 `mapTrackerCapture`
- [x] 3.4 追加：`MapTrackerDrawer.vue` 移除地图仪投入区块、添加投入物按钮与历史展开行

## 4. 测试与验证

- [x] 4.1 更新 `test/mapTracker*.test.js` 与 `test/clientEvents.test.js` 相关断言与用例
- [x] 4.2 `node --test test/mapTracker*.test.js test/clientEvents.test.js` → 全量 `npm test` → `npm run build` → `openspec validate simplify-map-tracker-enhancements --strict`
