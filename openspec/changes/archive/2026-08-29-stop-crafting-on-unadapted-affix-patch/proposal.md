# Propose: 检测未适配词缀补丁时停止装备制作并提示

## Why

词缀补丁更新后复制文本格式变化时，解析器无法识别词缀头，`affixMatch` 永远为 false，装备制作循环会持续消耗通货直到 1000 次上限，全程没有任何提示，用户损失大量通货后才可能发现问题。

## What Changes

- 物品解析器在解析结果中标记"词缀格式未适配"（存在 `{...}` 词缀头但零结构化词缀被识别；或魔法/稀有物品但任何词缀字段全为空）。
- 制作结果 JSON 透传该标记。
- 装备制作脚本在读取物品时检测到该标记，立即停止制作（复用现有 `crafting-runtime-stopped` 停止管道），通过浮层停止原因与主窗口错误状态向用户提示"检测到未适配的词缀补丁格式"，不消耗制作通货（首次读取即拦截）。
- 按模块门控：仅词缀匹配或古灵隐式模块启用时拦截；仅插槽制作不受影响（普通物品无词缀属正常）。

## Capabilities

### New Capabilities

- `unadapted-affix-patch-guard`: 装备制作时检测未适配的词缀补丁格式，在消耗通货前停止制作并通过既有停止管道向用户提示。

### Modified Capabilities

（无 — `supported-item-format-guidance` 对受支持格式的解析要求不变，本变更只新增对未适配格式的检测与停止行为。）

## Impact

- `electron/modules/item/parser.js`：新增 `affixFormatUnsupported` 检测标记。
- `electron/modules/ipc/file.js`：解析结果透传该标记。
- `src/assets/scripts/crafting_template.py`：`read_current_item` 读取成功后检测标记并 `fail_item_runtime` 停止。
- 测试：`test/supportedItemFormats.test.js`（未适配样例检测）、`test/itemCraftingInitialPreparation.test.js`（脚本停止行为与插槽放行）。
- 不改动地图洗练模板（其匹配为子串包含且有文本回退，风险低）。
