## Why

上一次未完成的修改用"高亮金框"识别首列当前房间，实测金框亮度随动画波动导致漏检，且为让入口待选在红线地图生效而放宽了条件（无已走线即视为未推进），玩家移动到第二列后一旦采集不到已走线就被判定成"入口待选"，当前标识停在第一列。手动设定的当前位置又会跨重采保留，进一步固化了错误标识；而你本机存档与实机截图证明：非首列靠已走金线可正常定位，首列房间可用"右侧仍可达的候选出边"唯一定位。实机复核又发现同一症状的另一来源：已揭示房间被图标切碎后漏检（第一列中间房），该房已走金线缺段，链起点落到第二列而无法定位。

## What Changes

- 删除首列高亮金框方案：不再测量房间边框亮度、不再产出 `entryFrame`、不再有 `positionSource: 'entry-frame'` 分支。
- 新增首列候选路径定位：无已走链时，最左列为 0 且首列中恰好一个房间仍有可达（`matched + gold + available`）出边，则确认该房为当前位置；多个候选仍按入口待选处理，无候选保持位置待确认。
- 恢复非首列定位：已走连续链分支与上次修改前完全一致。
- 修复已揭示房间碎片漏检：`room_candidates` 将宽高比超出常规、但与该列已识别房间中心对齐且纵向不重叠的暗色碎片补回房间（覆盖该列首、中、尾任一位置），避免房间缺失使已走链从第二列起算而无法定位。
- 入口待选条件恢复原样（全部已确认连线可达），撤销"无 visited 即可"的宽松条件，移动后不再误报第一列当前房。
- 手动选定当前位置改为下一次识别（采集、读取实际状态等实时动作）即失效；移除跨重采保留与"手动让位自动"逻辑。
- 保留结果遮罩刷新：实时观察失效后手动修正仍能按最近一次含地图区域的观察更新保存的遮罩。
- 清理失败方案产物：删除变更 `fix-sanctum-first-column-position` 目录、样本 `test/fixtures/sanctum/first-column-current-room.png` 及 `supplied-samples.json` 中的登记。
- **BREAKING**（仅开发版行为）：`positionSource` 不再出现 `entry-frame`；依赖该字段判断来源的外部逻辑需改用 `positionStatus`。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `sanctum-recognition`: 修改"动画无关路径定位"——删除金框例外，改为首列唯一可达出边定位；恢复入口待选原条件；手动设定当前位置在下一次识别失效（撤销同楼层持久与让位）。
- `sanctum-planning`: 修改"识别结束后的两房间遮罩"——保留手动修正后使用最近一次含地图区域的观察刷新保存遮罩。

## Impact

- `src/assets/scripts/sanctum_recognition.py`（删除 `entry_frame_evidence` 与标注；`room_candidates` 增加碎片对齐补位）、`src/assets/scripts/sanctum_paths.py`（`locate_position` 首列候选分支、入口条件恢复）。
- `electron/modules/sanctum/service.js`（`stop` 恢复清空 `positionOverride`、`applyPosition` 删除让位、`setCurrentRoom` 恢复经 `applyPosition`、`resetRun` 清理；保留 `lastMapObservation` 与 `retainOverlayResult` 回退）、`electron/modules/sanctum/liveDriver.js`（`observe` 删除让位，保留套用 pin）。
- `test/sanctumPathCapture.test.js`（首列候选、碎片补位与手动失效用例）、`test/sanctumResultOverlay.test.js`（遮罩刷新用例保留）、`test/fixtures/sanctum/`（删除金框样本与登记，新增 `vault-missing-middle-room.png` 实机碎片样本）。
- OpenSpec：删除被取代的 `openspec/changes/fix-sanctum-first-column-position/`；不改变采集输入流程、安全预检与浮窗显隐条件。
