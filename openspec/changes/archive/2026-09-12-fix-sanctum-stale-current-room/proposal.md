## Why

重新采集/重扫后如果本次识别没有确认当前位置，页面会经 `savedRoute` 回退继续显示上次（含手动设定）的“当前位置”和路线，且没有任何“本次未识别”提示；用户无法区分这是定位功能异常保留的旧位置，还是本次没识别出来。这也违背了“手动定位下一次识别失效”和“定位缺口显示位置待确认”的既有要求。

## What Changes

- 页面以最近一次实时识别结果（`identityConfirmed`）为位置权威：识别确认当前位置时显示该房间；识别完成但仍未确认位置且不是入口待选时，“当前位置”显示“待确认”，地图保留本次房间结构但不再标历史当前房间、不再显示历史路线预览。
- 新增顶部黄色警告：本次识别未确定当前房间；请重新采集，或打开房间详情点击“设为当前位置”。
- 游戏内悬浮标记在最近一次识别未确认位置时一并隐藏；`overlayResult` 快照仍保留，停止、重启或重新确认位置后按既有历史语义恢复显示。
- 历史/保存结果回退仅在本次没有实时识别身份时使用（停止、未读到地图、重启恢复、显式重置）；重启恢复仍按“上次保存”语义显示保存的位置。
- 不改动识别算法、`routeResult`/`overlayResult` 的保存数据与持久化结构。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `sanctum-recognition`: 修改“失败后的路线展示快照”——最近一次识别已读到地图但未确认位置时，以本次地图显示位置待确认，历史快照的当前位置不得当作本次识别结果。
- `sanctum-planning`: 修改“恢复保存的游戏路线标记”——最近一次识别明确未确认位置时隐藏历史悬浮标记；新增“重识别未确认位置时的页面提示”——显示待确认与可操作警告。

## Impact

- `src/domains/sanctum/SanctumView.vue`、`src/domains/sanctum/SanctumRoomDetails.vue`（实时/历史显示选择、警告、证据楼层）。
- `shared/sanctumDisplay.js`、`shared/sanctumPresentation.js`（未确认位置判定与显示楼层选择）。
- `electron/modules/sanctum/service.js`（`getResultState` 未定位时隐藏历史标记）。
- `test/sanctumPresentation.test.js`、`test/sanctumResultOverlay.test.js`（回归用例）。
