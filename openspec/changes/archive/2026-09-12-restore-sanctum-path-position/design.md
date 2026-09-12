## Context

见 proposal.md。当前工作区停留在失败方案上：`sanctum_paths.py` 有入口框分支、`sanctum_recognition.py` 产出 `entryFrame`、入口待选被放宽为"无 visited 即入口态"、`service.js`/`liveDriver.js` 让手动位置跨重采保留。实测证据：

- 用户实机首列截图（地图区域 912,265,2000,1215，玩家在 0:1）：`0:1` 有 3 条 gold+available 出边，`0:0`/`0:2` 出边全部红；金框亮度测量在动画下漏检过。
- 入口样本 `vault-entry.png`：三个首列房间都有 gold+available 出边，原"全部连线可达"条件成立并产出首房候选。
- 已走链在 `archives-progress-*`、`vault-*` 实机样本上分别正确定位 1:1、2:1、3:2、4:1，非首列能力无需改动。
- 用户本机存档（12:09/12:10）`visited: 0` + 宽松入口条件给出 `startRoomIds: 0:0,0:1`，规划器据此把第一列候选当当前房；红色连线是不可达路径，房间完成后已走实心金线不会变红。

## Goals / Non-Goals

**Goals:** 删除金框定位；首列用候选路径唯一定位；非首列恢复上次修改前的已走链行为；入口待选恢复原条件；手动位置只影响当前结果；保留手动修正后的遮罩刷新；补齐被图标切碎的已揭示房间，避免漏检断链；清理失败方案产物。

**Non-Goals:** 不新增截图/输入流程；不做动画帧序列或金框亮度分析；不在无路径证据时猜测当前位置（保持未知，手动兜底）；不持久化 `positionOverride` 到磁盘；不改变采集预检、安全停止与浮窗显隐。

## Decisions

- **判定顺序（`locate_position`）**：已走链（权威，保持上次修改前原样）→ 首列唯一候选 → 原入口待选（`all(已确认连线可达到)`）→ 未知。理由：实机样本证明已走链可靠；首列候选规则在用户实机截图与入口样本上分别给出"唯一 0:1"与"多候选入口态"。
- **首列候选条件**：最左列为 0，且首列中恰好一个房间存在 `status == matched && availability == gold && traversal == available` 的出边。理由：玩家选定首房后，未选房间的出边不可达变红，唯一保留可选出边的房间即当前房；`traversal == available` 排除已走实心线误判，避免玩家已离开首列时反被钉回首列。备选"已揭示区域根节点"经样本验证不可行（0:0 与首领房 7:0 的揭示状态会形成伪根），已放弃。
- **房间碎片补位（`sanctum_recognition.py`）**：`room_candidates` 收集过尺寸/填充阈值、宽高比 `.82~.95` 的暗色碎片，`merge_fragmented_rooms` 仅当碎片与同列已识别候选中心 x 对齐（`< height*.025`）且纵向不重叠时补回。理由：已揭示房间的图标会切碎暗色内框，最大碎片可能刚好越过 `.50~.82` 的常规宽高比上限（实机中间房碎片 `90×109`、宽高比 `.83`）而漏检；该房已走金线因此不被采样，链起点落到第二列。对齐条件与列内位置无关，覆盖首、中、尾；实机右下装饰中心偏 `38.5px`、同房重复碎片纵向重叠，均被排除。预演全部现有实机样本新增 0 间。
- **入口待选条件恢复**：撤销"无 visited 即入口态"，恢复上次修改前的"全部已确认连线可达"，`startRoomIds` 不变。理由：恢复到已知基线；移动后即使采集不到已走线也只显示位置待确认，不再出现假当前房。
- **手动位置瞬时化（`service.js`/`liveDriver.js`）**：`stop()` 恢复清空 `positionOverride`（service 与 driver 两侧）；删除 `applyPosition` 与 `observe` 的"自动结果让位"块；`setCurrentRoom` 恢复经 `applyPosition`；`resetRun` 去掉冗余清 pin，仅保留 `lastMapObservation` 清理。所有实时识别动作入口都会先 `stop()`，因此"下一次识别即失效"自然成立，且回归上次修改前的整体语义。
- **遮罩刷新保留**：`updateObservation` 记录 `lastMapObservation`，`rememberRoute`/`retainOverlayResult` 在瞬时观察缺失时回退使用它。理由：该能力与 pin 生命周期无关，属于 `sanctum-planning` 的既有增量，手动修正当次仍要更新游戏内遮罩。
- **产物清理**：删除被取代的 `openspec/changes/fix-sanctum-first-column-position/`、样本 `first-column-current-room.png` 及 `supplied-samples.json` 登记。理由：失败方案不留代码/样本/规格。

## Risks / Trade-offs

- [真入口时某首列房因结构性封锁成为唯一可选出边候选] → 概率低（首列房通常都有至少一条可选出边）；即使误判也可手动修正，且下一次识别不保留。
- [已走实心线被判为 available 导致候选规则误确认首列] → 已走链分支优先，链有效时不进入候选分支；链无效时宁可不定位也不误标。
- [手动位置改为瞬时后，重复查看路线需重新点选] → 这是用户明确要求的行为；修正当次仍会刷新遮罩与推荐。
- [删除旧变更目录后其规划上下文丢失] → 仍需保留的 `sanctum-planning` 增量已复制进本变更；实现代码未提交，按本设计直接修改。

## Migration Plan

无数据迁移：`entryFrame` 是识别期字段，删除后旧存档按无该字段处理；`positionOverride` 本就不落盘，重启维持存档恢复语义。仅在开发版验证，不打包。

## Open Questions

无。
