## Context

见 proposal.md。两个规划器均将 frontier 无条件写入 unknown；knownRoom.missing 又混合了 hidden/unrevealed 与 failed。已有知识状态和 not-shown 足以分类，无须迁移数据。

## Goals / Non-Goals

**Goals:** 从信息来源区分机制限制和读取缺口，两套规划器共享边界说明与目标提示分类。

**Non-Goals:** 不改变已知路线资格、评分、结构约束或自动操作。

## Decisions

- 知识层只把真实缺口放入 missing，机制限制以独立说明返回；共享边界辅助函数根据实际房间知识判定，而非前端过滤文案。
- frontier 仍控制截断和 partial，但不再自动增加 unknown。无已知下一房时根据边界真实缺口或机制限制给出不同原因。
- pendingRouteTargets 保持结构检查，返回目标标识供调用方分类；机制边界后的目标进入现有 reason，读取边界后的目标仍待确认。
- 未展示奖励数量和时机分别判断，防止一个 not-shown 遮蔽另一个实际读取错误。
- 旧版评分只报告它使用的奖励和痛苦读取缺口；战斗布局不参与旧版评分。机制限制仍正常说明。精确评分权重只在数量和领取时机可用时核对，避免未展示数量引出额外告警。
- 边界目标按读取失败分支的结构可达性分类，无关支路失败不得将机制边界后的目标改为待确认。
- 普通机制说明聚合到现有 reason，视图继续使用同一 unknown，不新增前端兼容过滤。

## Risks / Trade-offs

- [把 unknown 误认为未揭示] → 仅显式未揭示、隐藏或 not-shown 作为机制证据；可见或无证据的读取缺口保留。
- [缺口变少误报完整路线] → 保留 complete、partial 及未知段截断规则，用三种策略回归验证。

## Migration Plan

无数据迁移。重算推荐后使用新分类；仅在开发版验证，不打包。
