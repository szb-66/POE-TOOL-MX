# 组合启停开关设计

## Context

现有组合模型由 `src/domains/items/affixConfig.js` 的 `normalizeAffixGroup` 定义（id/name/requiredAffixes/selectedAffixes/selectedCount），所有入口（预设 store、主进程 `electron/modules/item/matcher.js` 的 `matchAffixes`、启动校验 `src/utils/validation.js` 的 `hasEffectiveAffixGroups`）都从该模型读取。预设通过 JSON 持久化，旧数据无 `enabled` 字段。

## Goals / Non-Goals

**Goals:**
- 组合级 `enabled` 开关，默认开启，向后兼容旧预设
- 停用组合不参与匹配（整体结果与逐组诊断都不含停用组合）
- 全部停用时启动校验拒绝运行

**Non-Goals:**
- 不改动组合内词缀条件模型
- 不做组合排序、批量开关或跨预设开关同步

## Decisions

### D1: `enabled` 字段由 `normalizeAffixGroup` 统一规范化
`normalizeAffixGroup` 输出 `enabled: input.enabled !== false`。所有消费方（store、matcher、validation、UI）拿到的都是规范形状，旧预设自动迁移为开启。克隆组合自动继承该字段（`cloneAffixGroup` 已走 `normalizeAffixGroup`）。

### D2: 匹配引擎内过滤停用组合
在 `matchAffixes` 的 `groups.map` 前过滤 `enabled === false`，而不是在调用方过滤。理由：所有调用方（file.js 的数组与旧单组兼容路径、潜在新入口）自动获得一致语义，避免遗漏调用点导致"关闭仍命中"的隐蔽 bug。

### D3: 校验复用 `hasEffectiveAffixGroups` 语义
`hasEffectiveAffixGroups` 只统计 `enabled !== false` 且有词缀条件的组合。全关时现有报错文案"词缀制作至少需要配置一个有效的达标组合"自动生效，无需新增错误分支。

### D4: UI 开关放在组合头部
`ModuleTwo.vue` 组合 header 增加 `el-switch`，直接绑定 `group.enabled`，`@change="commit"` 与现有名称输入/复制/删除同一持久化路径。

## Risks / Trade-offs

- [旧版本读取新预设忽略未知字段] → `enabled` 只是可选布尔字段，JSON 兼容，旧版默认视为开启
- [全关时用户困惑为何无法启动] → 校验文案已覆盖"有效达标组合"语境，UI 开关状态可见即可理解
