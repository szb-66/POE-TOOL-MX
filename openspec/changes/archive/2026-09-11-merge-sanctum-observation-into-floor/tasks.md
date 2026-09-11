## 1. 页面合并

- [x] 1.1 在 `src/domains/sanctum/SanctumView.vue` 的「楼层规划」pane 内 `.floor-layout` 结束后、`el-drawer` 之前插入 `<SanctumRunObservation :state="store.state" :disabled="store.readOnly || store.busy || !identity" :action="perform" />`，验证模板编译无报错
- [x] 1.2 删除「实际状态」tab-pane（`name="observations"`），验证页签栏只剩楼层规划、圣物管理、设置

## 2. 验证

- [x] 2.1 运行 `node --test test/sanctumView.test.js`，确认 `SanctumView.vue` 与 `SanctumRunObservation.vue` 的 Vite 开发转换（含 scoped Less）通过
- [x] 2.2 `npm run electron:dev` 打开圣所页面人工核对：合并后的楼层规划页签内，确认资源/奖励账本后推荐路线就地更新；确认资源、重读状态栏、账本编辑在合并位置功能正常，无控制台 error
- [x] 2.3 运行 `openspec validate --strict` 通过
