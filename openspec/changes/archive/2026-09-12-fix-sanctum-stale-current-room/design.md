## Context

见 proposal.md。当前实现中位置有三个来源：识别算法写入 `floor.currentRoomId/positionStatus`、手动 pin（`positionOverride`，`stop()` 已清空）、以及历史快照 `routeResult/overlayResult`。重识别未定位时 `state.floor` 已是 `currentRoomId=null/positionStatus=unknown`，但页面 `SanctumView.vue` 用 `savedRoute?.floor || state.floor` 决定显示楼层，`getResultState` 又继续返回旧 `overlayResult`，于历史位置被当作本次结果。数据层无需变更，需要给展示层一个统一的“实时/历史”选择规则。

## Goals / Non-Goals

**Goals:** 最近一次实时识别结果优先；未确认位置时页面显示待确认并给出可操作警告；地图不标历史当前房间、不显示历史路线预览；游戏内悬浮标记隐藏但快照保留；停止/未读到地图/重启恢复仍按历史语义展示；手动定位与后续识别成功立即恢复。

**Non-Goals:** 不改识别算法与 `sanctum_paths.locate_position`；不改 `routeResult`/`overlayResult` 的保存结构和持久化；不清理历史快照数据；不改变重启“上次保存”显示与结果遮罩的环境检查；不新增截图或输入流程。

## Decisions

- **实时权威判定**：以 `floor.identityConfirmed === true` 表示本轮有实时识别身份；仅此时把 `state.floor` 作为显示与位置权威。停止、未读到地图、重启恢复都会把 `identityConfirmed` 置 false，自然回退历史显示。备选方案“新增后端 flag”会产生重复状态且没有额外信息。
- **未确认位置判定**：`identityConfirmed && !initialSelection && !(positionStatus==='confirmed' && currentRoomId)` 提取为共享谓词 `sanctumPositionUnconfirmed`，页面警告与 `getResultState` 悬浮标记隐藏共用，避免两处条件漂移。
- **显示楼层选择**：共享 `sanctumDisplayFloors(state)` 返回 `{live, history, floor}`；`live` 有效时忽略 `savedRoute`，否则按原逻辑用 `savedRoute` 回退。`SanctumView` 的 `floor/shownRecommendation/display` 与房间截图证据都走同一结果，避免截图绑定旧楼层。
- **悬浮标记隐藏而非清空**：只在新谓词命中时让 `getResultState` 返回 null，保留 `overlayResult`；手动定位、后续识别成功、或停止/重启后按原规格恢复。备选“直接清空 overlayResult”会破坏“失败保留快照”的既有要求。
- **页面提示**：顶部 `el-alert type="warning"`，文案指向两个可操作动作（重新采集、房间详情里设为当前位置）；识别确认位置后随谓词消失。

## Risks / Trade-offs

- [入口待选时被误判为未确认] → 谓词显式排除 `initialSelection`，入口仍显示“选择首个房间”和首房候选。
- [停止后页面回退历史位置，用户误以为仍实时] → 历史模式保留“上次保存/历史参考”标注与停止原因，符合既有规格。
- [重识别未定位时地图全部房间显示未知状态] → 这是位置未知的既有展示语义，避免伪造已完成/可达链；用户已确认接受。
- [悬浮标记在停止后恢复显示旧位置] → 停止是显式动作且页面仍有历史标注；如需停止也隐藏可再扩展谓词。

## Migration Plan

无数据迁移。纯展示与判断逻辑，回滚即还原相关文件。
