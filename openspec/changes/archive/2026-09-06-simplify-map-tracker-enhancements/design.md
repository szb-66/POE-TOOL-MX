# 增强项精简 — 技术设计

## Context

上一变更（map-tracker-ux-clarity）后，跟踪器增强项为击杀/角色/掉落/词缀/机制/备注六项。本次删除后三项及其采集链路（词缀快捷键采集、机制日志解析、备注手动录入）。

## Goals / Non-Goals

**Goals:** 三条链路（captureNextMap/nextMap、map-mechanic 解析、notes）连根删除；投入物取消开关依赖；旧数据字段自然剥落。

**Non-Goals:** 不做旧记录迁移；不改击杀/角色/掉落链路；不新增聚合统计。

## Decisions

1. **投入物整体移除**：用户追加确认删除。`addInvestment`、`add-investment` IPC、抽屉投入物区块与历史/CSV 展示全部删除；`createMapRun` 的 `deviceInputs` 字段移除后 `uniqueStrings` 失去唯一消费方一并删除；`EDITABLE_FIELDS` 只剩 `areaName`。
2. **parser 机制特征一并删除**：`map-mechanic` 的唯一消费方是跟踪器机制增强；删除后特征匹配成为死代码，按根因清理原则从 `clientEvents/parser.js` 删除，事件白名单同步收缩。
3. **旧字段自然剥落**：`createMapRun` 白名单重建使 `mapModifiers/notes/mechanics` 在读取与重写时消失，`EDITABLE_FIELDS` 收缩为 `areaName/deviceInputs`，无需迁移脚本。
4. **快捷键链路收缩**：`mapTrackerCapture` 从 featureCatalog、shortcutConfig、scriptService 注册/分发、设置页列表删除；`shortcuts.captureMap` 设置键删除。

## Risks / Trade-offs

- [旧分片 JSON 残留三个字段] → 读取被白名单忽略、重写时消失，无消费方，无害。
- [用户丢失历史备注/词缀数据展示] → 用户明确要求移除；原始 JSON 文件仍在磁盘可查。

## Open Questions

（无）
