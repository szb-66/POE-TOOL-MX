## 1. 实战策略：效果逐节点传播

- [x] 1.1 `electron/modules/sanctum/practicalPlanner.js`：`legal` 增加 `fx` 默认参数（默认起点 `active` 效果），禁选判定按传入效果计算 `knownRoom`；全库核对 `legal(` 调用点。验证：`node --test test/sanctumPractical.test.js` 现有用例通过
- [x] 1.2 同文件：循环内删除静态 `facts.get(id)`，改用 `knownRoom(rooms.get(id), floor, before)`；后继过滤、`reach`、`pendingRouteTargets`、尾部启发（行 177）显式传当前路径效果。验证：现有用例通过，无 `facts` 残留引用

## 2. 旧版策略：completion 效果传播

- [x] 2.1 `electron/modules/sanctum/planner.js`：本房间 `scoreRoom` 保持用 entry 效果，`stack.push` 携带的效果集合并入本房间 `trigger==='completion'` 效果。验证：`node --test test/sanctumPlanner.test.js` 现有用例通过

## 3. 效果改变结果的证明测试

- [x] 3.1 `test/sanctumPractical.test.js`：新增用例——中途房间带已确认 entry 触发 `afflictionsHidden`/`rewardsHidden`，断言其后房间按字段隐藏评估（missing 提示、风险/禁选豁免），且同图无该效果时推荐不同。验证：`node --test test/sanctumPractical.test.js`
- [x] 3.2 `test/sanctumPlanner.test.js`：新增用例——房间带 completion 触发效果（如完成后失去坚毅），断言下一房推演出现对应损失/风险标记，本房间评分不受影响。验证：`node --test test/sanctumPlanner.test.js`

## 4. 全量验证

- [x] 4.1 运行受影响测试文件后执行 `npm test`，修正因新语义失败的既有断言（按新语义修正而非放宽），确认无回归。验证：`npm test` 全绿
- [x] 4.2 `openspec validate fix-sanctum-effect-path-planning --strict` 通过
