## 1. 装备制作脚本（crafting_template.py）

- [x] 1.1 新增 `seen_item_texts` 有界记录（容量 8，FIFO 淘汰）与 `STALE_COPY_BACKOFF_SECONDS = 0.2` 模板常量，提供记录更新/命中查询的辅助函数
- [x] 1.2 `read_current_item` 增加新鲜度验证：通货后读取结果为"未变化"或命中 seen_item_texts 时，退避后二次复制复核；两次一致接受（更新记录），不一致取较新者；`allow_unchanged_text=True` 路径不启用验证
- [x] 1.3 `wait_for_parse_result` 的 requestId 不匹配分支补 `max_wait` 超时检查，超时返回读取失败
- [x] 1.4 确认词缀主循环、增幅补读、预处理循环对"未变化"的消费语义在验证层之下保持不变（如需调整生成代码，落入第 3 组任务）

## 2. 地图洗练脚本（map_rolling_template.py）

- [x] 2.1 新增同款 seen_texts 记录、退避常量与辅助函数
- [x] 2.2 `read_current_rolling_target` 增加同款新鲜度验证（洗练循环判定输入经过验证；显式放行路径不启用）
- [x] 2.3 `wait_for_parse_result` 的 requestId 不匹配分支补超时检查

## 3. 生成器与判定日志（python.js）

- [x] 3.1 生成的 `augment_single_affix_if_needed` 在决定使用增幅石时输出 explicitMods/detailedMods 数量日志行
- [x] 3.2 核对生成的三条循环（预处理/词缀主循环/增幅补读）无需为验证层改变判定逻辑，如有遗漏在此收敛

## 4. 测试

- [x] 4.1 `test/craftingParseSynchronization.test.js`：新增可疑文本退避复核断言（两次一致接受、不一致取新者）
- [x] 4.2 新增"未变化退避复核仍不变才按无新信息处理"断言
- [x] 4.3 新增 requestId 不匹配等待最终超时返回失败断言
- [x] 4.4 覆盖地图洗练读取的同款验证断言

## 5. 验证

- [x] 5.1 运行 `node --test test/craftingParseSynchronization.test.js` 通过
- [x] 5.2 运行 `npm test` 全量通过
- [x] 5.3 运行 `openspec validate --strict` 校验本变更通过
