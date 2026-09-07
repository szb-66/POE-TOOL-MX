# 地图跟踪器功能澄清与废字段清理 — 技术设计

## Context

地图跟踪器由 `electron/modules/mapTracker/`（service/stateMachine/model/repository + 若干辅助模块）与前端 `src/domains/mapTracker/MapTrackerDrawer.vue`、`src/stores/mapTracker.js` 组成，通过 `electron/modules/ipc/mapTracker.js` 暴露 15 个 IPC 通道。

代码考古结论（本设计的依据）：
- `settings.characterName` 无任何后端消费方；`settings.buildName` 唯一去向是 `service.js:64` 写入 `run.character.build`，此后无人读取。
- `settings.league` 用于 `repository.shardPath` 分片目录名、历史筛选、表格列与 CSV 列；与设置页全局赛季（`poeCnAccount` store）零联动。
- 画面识别链路是死代码：`service.recognizeMechanics()`/`addMechanic()` 只有测试调用，无 IPC handler、无定时调用；`mechanics` 增强的强制校准门槛在 `src/stores/mapTracker.js:42` 与 `configurationIssues.js:378`，识别收益为零。
- 赛季机制的实际生产路径只有 `clientEvents/parser.js` 的 `VERIFIED_MECHANIC_PATTERNS`（delirium/expedition/betrayal 文本匹配）→ `map-mechanic` 事件 → `stateMachine.js:45`。

## Goals / Non-Goals

**Goals:**
- 删除三个无效设置项（league/characterName/buildName）与整条画面校准链路，保持旧数据可读。
- 抽屉中每个增强开关获得一行用途说明，卡片获得模块总述。
- 新记录归档不依赖用户输入的赛季。

**Non-Goals:**
- 不做设置页全局赛季与地图跟踪器的联动（赛季维度已整体移除）。
- 不迁移旧分片目录、不重写旧记录的 `league` 字段。
- 不增强日志文本匹配的机制覆盖面（仍为迷雾/远征/背叛三种）。
- 不改动浮窗、仪表盘卡片、击杀/掉落/词缀采集链路。

## Decisions

1. **旧数据零迁移，分片目录退化为 `standard`**
   `repository.shardPath` 保持 `runs/<safeSegment(run.league)>/<月>.json` 结构不变；`createMapRun` 不再携带 league 后，新记录 `league` 为 undefined → `safeSegment` 归一为 `standard`。`listShardPaths` 本就扫描全部子目录，旧赛季目录自动继续可查询、可导出。
   *备选*：写迁移脚本把旧目录合并到 `standard` —— 收益为零且破坏旧数据按赛季分组的可读性，放弃。

2. **废字段从模型层移除而非仅隐藏 UI**
   `DEFAULT_MAP_TRACKER_SETTINGS` 与 `normalizeMapTrackerSettings` 删除 `league/characterName/buildName/calibratedMechanics/mechanicCalibrations` 键；旧 settings.json 的多余键在下次保存时被 normalize 静默丢弃（现有 `normalizeMapTrackerSettings` 是白名单式重建，无需额外代码）。`createMapRun` 同步删除 `league`；`EDITABLE_FIELDS` 保留 `mechanics`（旧记录机制数据仍可编辑展示）。

3. **画面校准链路整体删除，不留开关**
   删除文件：`mechanicCatalog.js`、`mechanicRecognizer.js`、`src/assets/scripts/map_tracker_mechanics.py`。
   删除方法：`service.calibrateMechanic/recognizeMechanics/addMechanic`、`repository.saveMechanicTemplate`。
   删除通道：IPC `map-tracker:calibrate-mechanic`、preload `calibrateMapTrackerMechanic`、`src/api/electron.js` 对应封装、`main.js` 的 `createMechanicRecognizer` 注入与脚本路径解析（`pythonDetector` 若无其他使用方则一并清理引用）。
   *备选*：保留校准数据接通识别 —— 用户已确认移除，且识别从未验证过准确率，复活成本高，放弃。
   已落盘的 `map-tracker/templates/*.png` 与 settings 中的校准键不主动清理磁盘文件（无害残留，避免删除用户数据目录内容的额外逻辑）。

4. **机制增强门槛走现有"无门槛"路径**
   `stores/mapTracker.js` 的 `enhancementCheck` 删除 `mechanics` 分支（落入默认空检查），`setEnhancement` 的引导标题只剩 loot 分支；`configurationIssues.js` 删除 `collectMapTrackerMechanicConfigurationIssues`。机制开关行为与 notes 一致：直接启用。

5. **说明文字复用浮窗卡片的展示模式**
   `enhancementOptions` 每项加 `description` 字段；开关网格改为"开关 + 说明小字"行式布局，样式复用 `.overlay-settings p` 的既有小字样式（新增一条 `.enhancement-list` 规则即可），不引入新组件。模块总述放在"当前地图"卡片 `el-empty`/网格下方一行小字，或卡片 header 下的说明段落。

6. **CSV 与历史 UI 的赛季痕迹一并移除**
   `runsToCsv` 列数组删除 `league`；抽屉筛选表单删除赛季输入、表格删除赛季列、展开详情删除赛季行。`filters.league` 查询参数保留在 IPC 协议中（repository 按 league 过滤的代码路径保留，永远收不到值）——*备选*：连 repository 的 league 过滤一起删；保留是因为它同时服务于旧目录过滤能力且删除会牵动 validation 白名单，两行代码换零收益，不值得。实际上 `sanitizeQuery` 若白名单含 league 也一并删掉更干净——实施时按最小 diff 原则处理：只删 UI 传参，不删协议字段。

## Risks / Trade-offs

- [旧记录仍含 `league` 字段，新旧数据混合] → 无消费方读取该字段，展示层已不出现；`createMapRun` 重写（编辑/删除）时自然剥落。
- [用户已校准的模板 PNG 残留在 userData] → 无害文件，不做磁盘清理；若未来重做画面识别可复用。
- [删除 pythonDetector 引用可能影响其他模块] → 实施时先 grep `pythonDetector` 的全部使用方，仅删除 map-tracker 专属引用。
- [测试中大量 `league`/校准引用] → 更新 `mapTrackerModel/Service/IpcValidation` 等测试时以"行为移除后"的断言为准，不保留死参数兼容。

## Migration Plan

无部署迁移：旧设置键白名单式丢弃、旧分片目录继续扫描、CSV 列变化仅影响新导出文件。回滚 = revert 提交，无数据格式破坏。

## Open Questions

（无）
