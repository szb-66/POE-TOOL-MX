## 1. Python 侧协议增强

- [x] 1.1 `src/assets/scripts/interface_titles.py`：`match_titles` 新增 `report_unmatched=False` 参数，未命中且开启时输出 `result[key] = {'matched': False}`；模板抛错/环境失配路径不产出该条目。用 `python -c` 冒烟验证三种输出：默认未命中无键、开启未命中 `{'matched': False}`、命中仍为 `{'matched': True, ...}`
- [x] 1.2 `src/assets/scripts/bag_auto_stash_template.py` `check_titles`：`match_titles` 调用处传 `report_unmatched=True`，并用 `python -m py_compile` 验证语法

## 2. 测试

- [x] 2.1 新增 `test/interfaceTitlesUnmatched.test.js`（复用 `test/helpers/python.js` 的 `runPython`）：合成模板 + 明显不匹配的灰度图，断言 `report_unmatched=True` 输出 `{'sanctum-map': {'matched': False}}`、默认参数不输出该键；运行 `node --test test/interfaceTitlesUnmatched.test.js` 通过
- [x] 2.2 运行 `node --test test/sanctumResultOverlay.test.js test/sharedTitleLatency.test.js test/sanctumPathCapture.test.js`，确认现有契约（明确关图清空、失焦/过期/缺标题不清空、圣所识别回归）全部通过

## 3. 整体验证

- [x] 3.1 运行 `npm test` 全量通过
- [x] 3.2 实机验证（开发版 `npm run electron:dev`）：圣所倒数第二列场景完成采集 → 遮罩显示两房间 → 关闭地图约 0.5 秒内遮罩永久消失 → 再次开图不恢复；对照场景（非倒数第二列）关图再开仍恢复原两房间
