## Context

两个页签共享同一个 Pinia store 的 `state`：「实际状态」（`SanctumRunObservation.vue`，纯 props 组件）确认的 `runObservation`/`rewardLedger` 经 IPC 由主进程 `planSanctumFloor` 重算 `recommendation` 后整体回写，「楼层规划」据此更新。合并只是 UI 归位，无数据流改动。`name="observations"` 无外部引用（无深链、无测试断言）。

## Goals / Non-Goals

**Goals:**
- 删除「实际状态」页签，组件原样内嵌到「楼层规划」页签地图布局之后通栏展示
- 保持组件、store、IPC、主进程零改动

**Non-Goals:**
- 不重排/重构观察卡片内部布局
- 不改动浮窗、采集流程与路线计算

## Decisions

- **通栏放在 `.floor-layout` 之后**：观察卡片含资源表单、账本编辑行等宽内容，300px 侧栏会挤压表单；折叠收起会藏住与路线联动的核心信息。备选方案（侧栏内、折叠）已否。
- **`<el-drawer>` 保持在 pane 末尾**：抽屉 `append-to-body`，位置无关，不动。
- **禁用条件沿用原样** `store.readOnly || store.busy || !identity`：与数据绑定一致，不重新设计。

## Risks / Trade-offs

- [合并后页面变长] → 观察卡片自身已有 `<details>` 折叠区，页面本身可滚动，暂不加额外折叠。
- [规格文档页签数不一致] → delta 同步修改 `sanctum-planning` 的「圣所页面与浮窗」要求。
