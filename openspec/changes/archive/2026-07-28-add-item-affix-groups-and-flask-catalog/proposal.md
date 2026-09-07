## Why

物品制作目前只能用一组自由文本表达“必选 + 挑选”条件，既无法从真实词缀目录选择效果和最低 T 级，也无法表达多套可接受结果。现有离线词缀快照覆盖装备与珠宝但不覆盖药剂，导致药剂制作目标无法获得可靠联想和阶级数据。

## What Changes

- 为物品制作新增结构化词缀条件、全库关键词联想和可选最低 T 级。
- 将单组条件升级为可增删、复制和改名的多组条件，组内按 AND/N-of-M、组间按 OR 判定。
- 自动迁移旧 `requiredAffixes`、`selectedAffixes` 和 `selectedCount` 预设。
- 将生命、魔力、复合和功能药剂的 POEDB 页面纳入版本化原始快照，并只解析魔法药剂的普通前后缀作为参考目录。
- 扩展 Electron 匹配结果，报告命中组合和逐组诊断，同时保留现有兼容字段。

## Capabilities

### New Capabilities

- `item-affix-goal-groups`: 定义物品制作的结构化词缀联想、最低 T 级、多组配置、迁移和运行时匹配。

### Modified Capabilities

- `crafting-data-catalog`: 将四类药剂页面加入原始快照与全库参考词缀目录，但不把药剂加入手动做装模拟器底材。

## Impact

- 影响物品预设、物品制作配置 UI、配置校验、脚本启动配置、Electron 物品解析与词缀匹配。
- 新增全库词缀联想 IPC/API，并复用现有内置 `dataset.json` 和数据仓库。
- 扩展 POEDB 来源清单、解析器、原始快照 manifest、生成哨兵和内置规范化数据。
- 不新增运行时依赖，不改变手动做装模拟器的药剂支持边界。
