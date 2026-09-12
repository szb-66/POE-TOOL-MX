## 1. 删除金框方案并恢复路径定位（Python）

- [x] 1.1 `src/assets/scripts/sanctum_recognition.py`：删除 `entry_frame_evidence()` 与 `analyze_floor` 中首列 `entryFrame` 标注循环；验证 `rg "entryFrame|entry_frame" src electron test` 无残留（测试与样本清理见 3.3）。
- [x] 1.2 `src/assets/scripts/sanctum_paths.py` `locate_position()`：删除入口框分支；新增首列候选分支——无已走链且最左列为 0 时，首列恰有一个房间存在 `status=='matched' && availability=='gold' && traversal=='available'` 的出边则确认该房为当前位置（`positionSource` 保持 `paths`）；入口待选恢复原条件 `all(e['traversal']=='available' for e in confirmed)`；验证 `test/sanctumPathCapture.test.js` 中新用例与 `node --test test/sanctumPathCapture.test.js` 通过。

## 2. 恢复手动定位瞬时语义（Electron）

- [x] 2.1 `electron/modules/sanctum/service.js`：`stop()` 恢复 `this.positionOverride = null` 与 `liveDriver.positionOverride = null`；`applyPosition()` 删除自动结果让位块；`setCurrentRoom()` 的选中分支恢复 `this.state.floor = this.applyPosition(floor)`；`resetRun()` 去掉冗余 pin 清理，保留 `lastMapObservation = null`；验证 3.2 用例断言 `stop()` 后 `positionOverride` 为空且新识别不采用旧 pin。
- [x] 2.2 `electron/modules/sanctum/liveDriver.js` `observe()`：删除自动结果让位块，保留楼层 key 失配清 pin 与套用 pin 逻辑；验证 `node --test test/sanctumLive.test.js` 通过。

## 3. 测试与样本清理

- [x] 3.1 重写 `test/sanctumPathCapture.test.js` 首列用例：唯一 gold+available 出边确认该房；首列多候选且全部已确认连线可达进入入口待选；首列出边全不可达时保持位置待确认且 `initialSelection` 为 false；验证该测试文件通过。
- [x] 3.2 重写 `test/sanctumPathCapture.test.js` 手动定位用例：设定后 `stop()` 清空 pin，`applyPosition` 对新识别不再套用；保留 `test/sanctumResultOverlay.test.js` 遮罩刷新与无观察不生成遮罩用例；验证 `node --test test/sanctumPathCapture.test.js test/sanctumResultOverlay.test.js` 通过。
- [x] 3.3 删除 `test/fixtures/sanctum/first-column-current-room.png` 及 `test/fixtures/sanctum/supplied-samples.json` 中对应登记，并删除依赖它的金框实机用例；验证样本文件不存在、JSON 可解析且无该文件名引用。

## 4. 清理被取代的变更产物

- [x] 4.1 删除 `openspec/changes/fix-sanctum-first-column-position/` 目录（其仍需保留的 `sanctum-planning` 遮罩刷新增量已并入本变更）；验证 `openspec list --json` 不再包含该变更是 `in-progress`。
- [x] 4.2 全仓检索 `entry-frame`、`entryFrame`、`首列入口框`、`金框` 等失败方案关键词，清理文档/注释中的残留；验证 `rg` 仅在本变更 planning 文档的历史说明中出现（如无则彻底为空）。

## 5. 回归与规格校验

- [x] 5.1 运行受影响测试：`node --test test/sanctumPathCapture.test.js test/sanctumRecognition.test.js test/sanctumResultOverlay.test.js test/sanctumLive.test.js test/sanctumPractical.test.js`，全部通过。
- [x] 5.2 运行 `npm test` 全量回归，全部通过。
- [x] 5.3 运行 `openspec validate restore-sanctum-path-position --strict`，通过。
- [x] 5.4 开发版 `npm run electron:dev` 实机核对并记录结论到本变更目录：入口打开地图显示首房候选不误报当前房；进入首列房间后自动确认为该房；移动到后续列后按已走实心金线定位；手动设定位置后执行读取实际状态或重新采集，旧手动位置失效；gameplayAccepted 保持 false。用户 2026-09-12 实机复核反馈“可以了”。

## 6. 修复已揭示房间碎片漏检

- [x] 6.1 `src/assets/scripts/sanctum_recognition.py`：`room_candidates` 收集宽高比 `.82~.95` 的暗色碎片，新增 `merge_fragmented_rooms(candidates, fragments, height)`——仅接受与同列已识别候选中心 x 对齐（`< height*.025`）且纵向不重叠的碎片；验证实机失败截图补回首列中间房并确认 `2:2`，现有实机样本新增 0 间。
- [x] 6.2 新增样本 `test/fixtures/sanctum/vault-missing-middle-room.png` 与 evidence md；`test/sanctumPathCapture.test.js` 增加端到端用例与 `merge_fragmented_rooms` 首/中/尾及拒绝用例；验证该测试文件通过。
- [x] 6.3 运行受影响测试与 `npm test`，`npx openspec validate restore-sanctum-path-position --strict` 通过。
