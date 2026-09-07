# 地图跟踪器增强项精简

## Why

地图词缀、赛季机制、备注三个增强项价值有限：词缀采集依赖手动快捷键且只对下一局生效，赛季机制只识别 3 种对话特征，备注是纯手动文本。用户确认全部移除，让跟踪器聚焦自动采集（时长、死亡、传送门、击杀、角色、掉落、投入物）。

## What Changes

- **BREAKING** 移除地图词缀增强：删除"记录下一张地图"快捷键、`captureNextMap`、`nextMap` 状态与开局词缀写入；旧记录中的 `mapModifiers` 字段随模型白名单自然剥落。
- **BREAKING** 移除赛季机制增强：删除日志机制特征解析（`map-mechanic` 事件）与 `run.mechanics` 字段；历史表、展开详情、CSV、浮窗不再展示机制。
- **BREAKING** 移除备注增强：删除添加/编辑备注入口、`run.notes` 字段与浮窗备注标签。
- **BREAKING** 移除地图仪投入物：删除添加投入物入口、`run.deviceInputs` 字段与历史/CSV 展示。
- 旧设置文件中的 `enhancements.modifiers/mechanics/notes` 与 `shortcuts.captureMap` 在下次保存时被白名单静默丢弃。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `map-tracker`：增强项只剩击杀、角色、掉落；删除词缀采集、机制识别、备注、地图仪投入物的记录与展示；历史、CSV、浮窗相应收缩，可编辑字段仅剩地图显示名。
- `client-log-events`：结构化事件白名单移除 `map-mechanic`。
- `game-scoped-shortcut-registration`：地图跟踪快捷键只剩击杀刷新键。

## Impact

- 后端：`electron/modules/mapTracker/`（model、stateMachine、service、repository）、`electron/modules/clientEvents/parser.js`、`electron/modules/ipc/`（mapTracker.js、mapTrackerValidation.js）、`electron/preload.cjs`。- 前端：`MapTrackerDrawer.vue`、`MapTrackerOverlayView.vue`、`src/stores/mapTracker.js`、`src/utils/scriptService.js`、`src/utils/shortcutConfig.js`、`src/features/featureCatalog.js`、设置页快捷键列表、`src/api/electron.js`。
- 测试：`test/mapTracker*.test.js`、`test/clientEvents.test.js`。
