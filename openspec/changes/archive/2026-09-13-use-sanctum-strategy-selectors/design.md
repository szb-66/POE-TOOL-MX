## Context

设置页使用 Element Plus，痛苦列表目前经文本换行转换保存。服务已下发 catalogSummary；货币 manifest 与 layoutLabels 可复用。

## Goals / Non-Goals

**Goals:** 通过目录限制新增值并保持旧配置无损往返。

**Non-Goals:** 不迁移策略键，不修改规划器，不改旧版专属权重输入。

## Decisions

- 复用 el-select 的 filterable/multiple，不启用 allow-create；保留权重按钮，禁用重复项并在添加函数再次校验。
- 痛苦 el-option 使用默认插槽展示名称及中文括号内的 descriptions（多条以分号连接），label 保持纯名称以供选中标签使用；无效果描述时不显示空括号，长效果允许换行。
- 奖励读取 currency/manifest.json，玩法读取 layoutLabels；痛苦由服务以 isCurrentSanctumEntry 过滤，catalogSummary.afflictions 提供 id、label、descriptions。
- 痛苦数组直接绑定。为当前选中的目录外值补充仅供回显的选项；匹配名称的历史值保留原键，并禁用对应 ID 的重复选择，删除后可重新选择标准 ID。
- 预设或外部策略变化时清空待添加项，保留原有深拷贝与 miniboss 默认补齐。

## Risks / Trade-offs

- 历史未知值无法可靠转换 → 原样回显并保留，可由用户移除。
- 目录缺失 → 不允许新增痛苦，但仍可查看和移除历史选项。

## Migration Plan

无存储迁移。新增目录字段可向后兼容；回退页面和目录字段即可恢复原交互。
