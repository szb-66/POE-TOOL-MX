# Tasks: 检测未适配词缀补丁时停止装备制作并提示

## 1. 解析器检测

- [x] 1.1 在 `electron/modules/item/parser.js` 的行循环中记录 `sawAffixHeader`（行匹配 `line.startsWith('{') && line.endsWith('}')`）
- [x] 1.2 解析结束后按设计计算 `itemInfo.affixFormatUnsupported`：信号 A（有词缀头但 `modifiers` 与 `detailedMods` 均为空）或信号 B（魔法/稀有、非未鉴定且所有词缀字段为空）

## 2. 结果透传

- [x] 2.1 在 `electron/modules/ipc/file.js` 的解析结果对象中透传 `affixFormatUnsupported` 字段

## 3. 脚本侧拦截

- [x] 3.1 在 `src/assets/scripts/crafting_template.py` 的 `read_current_item` 成功分支中，按 `({{ENABLE_AFFIX}} or {{ENABLE_ELDRITCH}})` 门控检查 `result.get("affixFormatUnsupported")`，命中则调用 `fail_item_runtime("检测到未适配的词缀补丁格式，无法识别词缀，已停止制作。请更新软件或反馈适配", "AFFIX_PATCH_UNSUPPORTED")` 并返回 `{"error": ...}` 保持调用方契约

## 4. 测试

- [x] 4.1 在 `test/supportedItemFormats.test.js` 新增解析用例：适配的词缀补丁样例不携带标记；改写词缀头措辞（未适配）样例携带标记；魔法/稀有零词缀样例携带标记；普通与未鉴定物品不携带标记
- [x] 4.2 在 `test/itemCraftingInitialPreparation.test.js` 风格下新增脚本用例：词缀模块启用时 `read_current_item` 收到标记即置 fatal 原因并返回 error；仅插槽配置下生成脚本放行不拦截

## 5. 验证

- [x] 5.1 运行受影响测试：`node --test test/supportedItemFormats.test.js test/itemCraftingInitialPreparation.test.js`
- [x] 5.2 运行全量 `npm test`，并执行 OpenSpec 严格校验
