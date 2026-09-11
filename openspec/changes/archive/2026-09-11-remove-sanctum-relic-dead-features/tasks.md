## 1. 修复楼层启迪词缀映射

- [x] 1.1 `electron/modules/sanctum/relicParser.js`：将「每个楼层开始时获得#层启迪」的规则通道由 `[null, 'inspiration']` 改为 `['inspirationOnFloor', 'inspiration']`；验证：`node --test test/sanctumRelicParser.test.js` 通过
- [x] 1.2 `test/sanctumRelicParser.test.js` 新增断言：该词缀唯一匹配后 `rule === 'inspirationOnFloor'`，且 `applySanctumEffects` 结果的 `unknown` 不含其原文；验证：同上测试文件通过

## 2. 删除 previewRelicText 链路

- [x] 2.1 移除 `electron/modules/ipc/sanctum.js` 的 `previewRelicText` 注册、`electron/modules/sanctum/service.js` 的 `previewRelicText` 方法、`electron/preload.cjs` 白名单中的 `previewRelicText`；验证：全仓 grep 无残留引用
- [x] 2.2 `test/sanctumRelicParser.test.js`：删除经 `service.previewRelicText` 的调用行（保留该用例其余祭坛确认断言）；验证：`node --test test/sanctumRelicParser.test.js` 通过

## 3. 删除固定摆放位置 positions

- [x] 3.1 `electron/modules/sanctum/loadout.js`：删除解构默认值、`positions` 输入校验分支与枚举过滤条件；`electron/modules/sanctum/service.js` `saveLoadoutPreferences`：删除 `positions` 构建与校验循环；`shared/sanctum.js` `emptySanctumState`：删除 `positions` 字段；`src/domains/sanctum/SanctumRelics.vue` 清空按钮传参移除 `positions: {}`；验证：全仓 grep `positions` 在 sanctum 范围无残留
- [x] 3.2 测试收敛：`test/sanctumLoadout.test.js` 删除固定位置入参断言与"固定位置无效"抛错用例，`test/sanctumService.test.js` 删除 `positions: {}` 传参；验证：`node --test test/sanctumLoadout.test.js test/sanctumService.test.js` 通过

## 4. 删除互斥组 exclusiveGroup

- [x] 4.1 `electron/modules/sanctum/loadout.js`：删除互斥检查；`test/sanctumLoadout.test.js`：删除互斥组对照数据与穷举条件；验证：`node --test test/sanctumLoadout.test.js` 通过

## 5. 回归与校验

- [x] 5.1 运行 `npm test` 全量回归并确认无 sanctum 相关失败；验证：测试输出全部通过
- [x] 5.2 `openspec validate remove-sanctum-relic-dead-features --strict` 通过；验证：校验输出无错误
