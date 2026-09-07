## 1. 建立回归反馈环

- [x] 1.1 扩展 `test/bagAutoStash.test.js`：残留旧文本（复制后内容与复制前相同）不判定 `"copied"`；复制到新文本判定 `"copied"`；剪贴板变空且序列号变化判定 `"empty"`
- [x] 1.2 确认 `test/chaosRecipeAutomation.test.js` 的取件复制清空机制已消除残留旧文本路径，无需修改
- [x] 1.3 确认 `test/junfengHighlight.test.js` 现有桩场景在复用控制器语义下保持通过

## 2. 修复 bag/君锋剪贴板复制确认

- [x] 2.1 修改 `src/assets/scripts/bag_auto_stash_template.py` 的 `_copy_item_text_once`：内容双验证判定（新文本 → copied、变空且序列号变化 → empty、残留旧文本 → 等待至超时 no-response）

## 3. 验证与清理

- [x] 3.1 运行定向测试（bagAutoStash、junfengHighlight、chaosRecipeAutomation）确认通过
- [x] 3.2 运行全量 `npm test`，确认存仓、拾取与配方流程无回归
- [x] 3.3 检查并删除失败尝试遗留的调试代码，再运行 `openspec validate fix-clipboard-copy-verification --strict`
