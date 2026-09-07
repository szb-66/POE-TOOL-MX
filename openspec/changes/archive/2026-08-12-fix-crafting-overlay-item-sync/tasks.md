## 1. 建立回归反馈环

- [x] 1.1 扩展 `test/craftingParseSynchronization.test.js`：装备模板在复制到旧剪贴板内容（粘贴内容与复制前相同或为空）时 `read_clipboard_to_file` 返回失败且不写入请求文件
- [x] 1.2 新增测试：剪贴板序列号变化但内容未变时，`wait_for_clipboard_change` 等待直至内容实际变化或超时，不立即判定成功
- [x] 1.3 新增装备模板测试：首次解析失败只重试复制读取一次、不重复 `apply_currency`；二次失败后设置致命停止原因并停止

## 2. 修复剪贴板复制验证（两个模板）

- [x] 2.1 修改 `src/assets/scripts/crafting_template.py`：`clipboard_changed` 判定改为序列号变化且粘贴内容非空且不等于 `before_text`；`read_clipboard_to_file` 在粘贴内容为空或等于复制前内容时返回失败
- [x] 2.2 同步修改 `src/assets/scripts/map_rolling_template.py` 的相同逻辑，保持两模板一致

## 3. 装备制作失败只重试读取

- [x] 3.1 在 `src/utils/python.js` 的 `craft_affixes` 生成逻辑中抽取 `read_current_item()`（复制 + 等待解析 + 校验，最多重试一次，重试不应用通货）
- [x] 3.2 替换 `craft_affixes` 循环内读取/解析失败路径：不再 `continue` 应用通货，改为重试一次读取后仍失败则致命停止（EVENT + 释放输入 + 可区分原因）
- [x] 3.3 `augment_single_affix_if_needed` 增幅后读取复用 `read_current_item`

## 4. 验证与清理

- [x] 4.1 运行定向测试（craftingParseSynchronization、adaptiveTiming、mapRuntimeTemplate、bagAutoStash、augmentationCrafting、chartRolling）确认通过
- [x] 4.2 运行全量 `npm test`，确认前台门禁、停止快捷键、通货预检与既有文件协议保持通过
- [x] 4.3 检查并删除失败尝试遗留的调试代码，再运行 `openspec validate fix-crafting-overlay-item-sync --strict`
