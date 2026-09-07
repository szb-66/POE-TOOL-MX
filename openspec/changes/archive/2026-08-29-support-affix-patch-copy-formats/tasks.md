# 任务：支持词缀补丁复制格式

## 1. 解析器根因修复（electron/modules/item/parser.js）

- [x] 1.1 词缀头 affixType 识别扩展：`前缀(?:属性|词缀)` 与 `后缀(?:属性|词缀)`（现仅 `前缀属性/后缀属性`）
- [x] 1.2 semanticType 语义词表扩展：工艺、附魔、隐式、传奇、隐匿、灾魇六类由 `XX属性` 改为 `XX(?:属性|词缀)`（基底已是双措辞写法，保持不动）
- [x] 1.3 `cleanModifierLine` 新增清洗：剥除行首 `▲/▽ ` 标记、行尾连续 `[...]` 注释组；保持既有数值区间清洗行为与顺序（先尾注后区间）

## 2. 回归样例与测试

- [x] 2.1 `src/utils/supportedItemFormats.js`：新增词缀补丁格式真实样例（圣骑士长靴，T2 官方文案，含 `{ ▲ 前缀词缀 }`/`{ ▽ 后缀词缀 }`/`{ 破碎的 ▲ 前缀词缀 }`/`{ 焚界者基底词缀（上级L3） }` 头部与数值区间行）
- [x] 2.2 `test/supportedItemFormats.test.js`：新样例断言——破碎/前缀/后缀分组正确、等阶正确、焚界/灭界头归类固有词缀、势力（焚界者物品/灭界者物品/分裂之物）识别、可匹配文本无区间与装饰
- [x] 2.3 `test/supportedItemFormats.test.js`：T1 变体单测——同一词缀文本带/不带 `▲/▽ ` 行首标记解析结果完全一致
- [x] 2.4 `test/supportedItemFormats.test.js`：T0 变体单测——`[④/③双缀][①单(★100)]` 等尾注剥净、分组正确；改写文案词缀进入查价未映射（unknownStats）且保留原文

## 3. 验证

- [x] 3.1 运行 `node --test test/supportedItemFormats.test.js test/priceCheck.test.js`（含全样例端到端查价映射循环）
- [x] 3.2 运行 `npm test` 全量测试，确认官方格式与既有补丁格式行为不变
- [x] 3.3 运行 `openspec validate "support-affix-patch-copy-formats" --strict` 并归档前核对规格场景全部有对应测试
