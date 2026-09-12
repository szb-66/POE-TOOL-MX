## 1. 共享判定与显示选择

- [x] 1.1 `shared/sanctumDisplay.js`：新增 `sanctumPositionUnconfirmed(floor)`——实时身份已确认、非入口待选、且位置未确认；在 `test/sanctumPresentation.test.js` 覆盖后运行 `node --test test/sanctumPresentation.test.js`。
- [x] 1.2 `shared/sanctumPresentation.js`：新增 `sanctumDisplayFloors(state)` 返回 `{ live, history, floor }`，实时身份有效时忽略 `savedRoute`，否则按原逻辑回退历史快照；用同一测试文件覆盖停止/重启回退场景。

## 2. 隐藏未定位时的历史悬浮标记

- [x] 2.1 `electron/modules/sanctum/service.js` `getResultState()`：`sanctumPositionUnconfirmed(this.state.floor)` 为真时提前返回 `null`，不改 `overlayResult` 数据；运行 `node --test test/sanctumResultOverlay.test.js test/sanctumOverlay.test.js`。

## 3. 页面实时优先与警告

- [x] 3.1 `src/domains/sanctum/SanctumView.vue`：用 `sanctumDisplayFloors` 计算 `floor/historyRoute/shownRecommendation/display`；“当前位置”由实时楼层决定；新增顶部黄色 `el-alert`（`positionUnconfirmed` 为真时）；上次路线提示仅在历史模式显示；向房间详情传入当前显示楼层；运行 `node --test test/sanctumView.test.js` 验证 Vite 转换通过。
- [x] 3.2 `src/domains/sanctum/SanctumRoomDetails.vue`：改收 `floor` prop，截图证据绑定当前显示楼层，避免实时模式下引用旧楼层；Vite 转换验证同上。

## 4. 回归测试

- [x] 4.1 `test/sanctumPresentation.test.js`：新增“重识别未确认位置时不沿用历史当前位置”用例，覆盖实时优先、停止/重启历史回退、确认位置与入口待选不告警。
- [x] 4.2 `test/sanctumResultOverlay.test.js`：新增“重识别未定位隐藏旧遮罩、手动定位后恢复”用例，并断言 `overlayResult` 快照仍保留。

## 5. 验证与规格

- [x] 5.1 运行受影响测试：`node --test test/sanctumPresentation.test.js test/sanctumResultOverlay.test.js test/sanctumOverlay.test.js test/sanctumPathCapture.test.js test/sanctumView.test.js`，全部通过。
- [x] 5.2 运行 `npm test` 全量回归，全部通过。
- [x] 5.3 运行 `openspec validate fix-sanctum-stale-current-room --strict`，通过。
- [ ] 5.4 开发版 `npm run electron:dev` 实机核对：重扫后未定位时页面“当前位置”为待确认、顶部黄色警告、地图无当前标记、游戏内无旧标记；手动定位或下一次识别成功后恢复；重启仍显示上次保存位置；gameplayAccepted 保持 false。
