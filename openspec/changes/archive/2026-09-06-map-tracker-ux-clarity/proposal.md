# 地图跟踪器功能澄清与废字段清理

## Why

地图跟踪器的部分设置项与增强功能缺乏可理解的说明，用户无法判断各字段的作用：BD 名称只落库从不展示、角色名输入框后端从不读取（角色名实际来自 `/whois` 自动采集，设置页登录也只能获取账号名，无法联动）、赛季名称手动输入且与设置页全局赛季无联动；画面机制校准是强制门槛，但其识别逻辑（`recognizeMechanics`/`addMechanic`）从未接入任何生产调用方——门槛拦了，收益为零。用户用起来不知道这个模块到底在做什么。

## What Changes

- **BREAKING** 移除赛季名称设置项：不再手动输入赛季；新记录统一归档到 `standard` 分片目录，历史中不再提供赛季筛选、赛季列与 CSV 赛季列；旧赛季目录数据保留、仍可查询与导出（零迁移）。
- **BREAKING** 移除角色名输入框与 Build 名称设置项：角色信息完全由 `/whois` 命令自动采集（`run.character.build` 字段随之不再写入）。
- **BREAKING** 整体移除画面机制校准：删除校准 UI、配置引导门槛、模板存储、IPC 通道与识别死代码（`mechanicRecognizer.js`、`map_tracker_mechanics.py`、`mechanicCatalog.js`）；赛季机制增强继续仅由已验证的日志文本匹配驱动（迷雾/远征/背叛）。
- 为每个增强开关（击杀/角色/掉落/地图词缀/赛季机制/备注）增加一行说明文字，讲清采集方式与数据去向。
- 在"当前地图"卡片增加模块总述，说明自动开局/自动保存/统计范围。
- 旧 settings.json 中的废弃键在下次保存时自然丢弃，不需要迁移脚本。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `map-tracker`：移除赛季/角色名/Build 名称设置项与画面机制校准路径；机制识别仅保留已验证日志特征；历史保存与筛选不再包含赛季维度；抽屉需展示模块总述与每个增强项的用途说明。
- `contextual-automation-configuration-guide`：移除"启用画面机制识别"引导分支，机制增强不再要求模板校准。

## Impact

- 后端：`electron/modules/mapTracker/`（model.js、stateMachine.js、service.js、repository.js），删除 `mechanicCatalog.js`、`mechanicRecognizer.js`、`src/assets/scripts/map_tracker_mechanics.py`。
- 装配与 IPC：`electron/main.js`（recognizer 注入）、`electron/modules/ipc/mapTracker.js`、`mapTrackerValidation.js`、`electron/preload.cjs`。
- 前端：`src/domains/mapTracker/MapTrackerDrawer.vue`、`src/stores/mapTracker.js`、`src/domains/configurationGuide/`（configurationIssues.js、ConfigurationIssueEditor.vue）、`src/api/electron.js`。
- 测试：`test/mapTracker*.test.js` 中与 league、characterName、buildName、校准相关的用例与断言。
- 数据兼容：旧分片目录与旧记录中的 league 字段保留原样、仍可读取；新记录 league 为空并落入 `standard` 目录。
