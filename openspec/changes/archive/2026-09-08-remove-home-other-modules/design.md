## Context
首页分组由 dashboardGroups 定义，统计与详情共用 useDashboard 的模块列表。动机见 proposal.md。

## Goals / Non-Goals
统一首页卡片和统计范围；不改变侧栏、业务状态或持久化配置。

## Decisions
从首页模块列表移除剧情与模拟状态构造，并删除其他分组及首页专属图标、剧情操作。相比仅隐藏卡片，这可同步排除统计与详情。

## Risks / Trade-offs
误删共享功能 → 仅清理首页调用，保留业务 Store、路由及共享状态计算函数。
