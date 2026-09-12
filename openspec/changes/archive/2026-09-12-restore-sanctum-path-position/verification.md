# 验证记录

## 用户实测

2026-09-12，用户在本机开发版完成实机核对后反馈“可以了”；此前“本次识别未确定当前房间”的失败场景不再出现。

本变更实施前的失败帧已用用户真实存档与截图固定：首列实际 3 间，`room_candidates` 因中间房碎片宽高比超出常规范围漏检，已走链只剩 `1:2→2:2` 且起点不在首列，`positionStatus: unknown`。逐像素核对确认 `0:1→1:2` 的红线属于同列下方房间，被漏检房间到 `1:2` 的实心金线 `path_evidence` 为 `support 1.00 / fill 1.00`。

修复后同一截图输出 28 间、首列 `0:0/0:1/0:2`、已走链 `0:1→1:2` 与 `1:2→2:2`、`currentRoomId 2:2`、`confirmed`。

## 自动化验证

- 新增用例：`test/sanctumPathCapture.test.js` 9 项全部通过，含端到端碎片样本与 `merge_fragmented_rooms` 首/中/尾及拒绝用例。
- 受影响文件 6 个共 72 项全部通过。
- `npm test`：2543 项，2541 通过、2 跳过、0 失败。
- `npx openspec validate restore-sanctum-path-position --strict` 通过。

## 改动复核

仅修改 `src/assets/scripts/sanctum_recognition.py`（碎片收集与 `merge_fragmented_rooms` 对齐补位）、`test/sanctumPathCapture.test.js`，新增 `test/fixtures/sanctum/vault-missing-middle-room.png` 与 evidence md；`sanctum_paths.py` 的定位逻辑未改。先前设想的“删除已走链首列校验”未实施，无失败方案残留。未打包。

## 已知边界

- 某列全部房间都被切碎、没有任何同列已识别房间可对齐时不会补回该列，仍以手动设为当前位置兜底。
- 用户未说明逐项核对明细，验证结论以“识别失败场景已消除”为准，不扩展为其他事项的验收。
