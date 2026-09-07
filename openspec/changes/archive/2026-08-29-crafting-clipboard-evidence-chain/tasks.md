# Tasks: 装备与地图制作的剪贴板证据链修复

## 1. 装备模板证据链（src/assets/scripts/crafting_template.py）

- [x] 1.1 新增哨兵常量 `CLIPBOARD_TEXT_UNCHANGED`
- [x] 1.2 `clipboard_changed`：有序列号变化证据但文本相同时返回哨兵（替代静默 None）
- [x] 1.3 `wait_for_clipboard_change`：记录哨兵出现并继续轮询至超时，结束时按"出现过哨兵/无任何证据"返回哨兵或 False
- [x] 1.4 `read_clipboard_to_file`：哨兵返回字符串 `"unchanged"`，不写入解析请求
- [x] 1.5 `read_current_item`：旁路条件收紧为 `attempt > 0 and last_dispatched`（仅解析分发后的重试放行同文本）；全部尝试未变化时返回 `{"unchanged": True}`

## 2. 生成逻辑消费点（src/utils/python.js）

- [x] 2.1 预处理循环：读取结果为未变化时沿用上次 `result` 并消耗一次预处理尝试
- [x] 2.2 词缀主循环：读取结果为未变化时跳过增幅与匹配判定，直接进入下一轮
- [x] 2.3 `augment_single_affix_if_needed`：增幅补读未变化时沿用增幅前解析结果

## 3. 地图洗练模板同证据链（src/assets/scripts/map_rolling_template.py）

- [x] 3.1 新增哨兵常量并同步 `clipboard_changed`/`wait_for_clipboard_change`/`read_clipboard_to_file` 的三态语义
- [x] 3.2 `read_current_rolling_target`：旁路收紧为 `attempt > 0 and last_dispatched`；全部尝试未变化时优先于空格判定返回 `{"unchanged": True}`

## 4. 测试（test/craftingParseSynchronization.test.js）

- [x] 4.1 更新"序列号变化但内容未变"用例：装备与地图模板均断言哨兵
- [x] 4.2 新增 `read_current_item` 证据链用例：全部尝试同文本 → `{"unchanged": true}` 且不误报失败；未变化后的重试不放行同文本（捕获 allow 参数序列）；解析管线失败后的重试放行同文本重发
- [x] 4.3 新增生成逻辑用例：词缀主循环未变化继续下一轮不报错；增幅补读未变化沿用增幅前结果
- [x] 4.4 新增 `read_current_rolling_target` 证据链用例：全部尝试同文本、未变化后拒收、分发失败后放行重发、初始读取显式放行保持

## 5. 验证

- [x] 5.1 运行受影响测试：`node --test test/craftingParseSynchronization.test.js test/itemCraftingInitialPreparation.test.js test/augmentationCrafting.test.js test/eldritchAutomation.test.js test/currencyPreflight.test.js`
- [x] 5.2 运行全量 `npm test`，并执行 OpenSpec 严格校验
