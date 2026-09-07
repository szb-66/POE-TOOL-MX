## 1. 修复剪贴板确认兜底

- [x] 1.1 修改 `src/assets/scripts/bag_auto_stash_template.py::copy_item_text`：新增 `empty_on_no_response=True` 参数，超时无响应时按参数返回 `("empty", "")` 或 `("no-response", "")`
- [x] 1.2 修改 `src/assets/scripts/bag_auto_stash_template.py::transfer_pickup_item`：调用 `copy_item_text(ctrl_held=True, empty_on_no_response=False)`，`empty` 判成功、`no-response` 继续重试、`unreadable` 停止、三轮后 `inventory-full`

## 2. 删除画面变化取件死代码

- [x] 2.1 从 `src/assets/scripts/stash_pickup_template.py` 删除 `run`、`main`、`wait_for_patch_change`、`patch_changed`、`changed_item_cells`、`local_patch`、`detect_candidates`、`cell_score`、`cell_bounds`、`annotated_preview`、`ctrl_click`、`emit`、`emit_with`
- [x] 2.2 删除该文件不再使用的常量（`TRANSFER_ATTEMPTS`、`PATCH_POLL_INTERVAL_SECONDS`）与 import（`base64`、`argparse`）
- [x] 2.3 核对 `junfeng_highlight_pickup.py` 的 `from stash_pickup_template import (...)` 引用清单，确认保留函数齐全且可导入

## 3. 更新测试

- [x] 3.1 `test/stashPickup.test.js`：删除依赖已删函数的用例（前台验证、预览激活、patch_changed、emit_with、第二件重试、多格跳过）；改写布局识别用例去掉 `detect_candidates` 断言；改写 408-413 用例断言脚本已无画面确认代码
- [x] 3.2 `test/adaptiveTiming.test.js`：删除 154-164 行 `wait_for_patch_change` 断言用例
- [x] 3.3 `test/automationTimingProtocol.test.js`：删除 50-76 行伪时钟用例；从 35-43 行脚本列表移除 `stash_pickup_template.py`
- [x] 3.4 `test/inputTiming.test.js`：删除 67-75 行仓库取件 `ctrl_click` 时序用例
- [x] 3.5 `test/stashPickupIntegration.test.js`：更新 109 行正则匹配 `copy_item_text(ctrl_held=True, empty_on_no_response=False)`
- [x] 3.6 `test/bagAutoStash.test.js`：为 `transfer_pickup_item` 用例追加 no-response 场景（三轮无响应 → `inventory-full`；无响应后 `empty` → 成功）

## 4. 验证

- [x] 4.1 运行受影响测试：`node --test test/stashPickup.test.js test/stashPickupIntegration.test.js test/bagAutoStash.test.js test/junfengHighlight.test.js test/junfengIntegration.test.js test/adaptiveTiming.test.js test/automationTimingProtocol.test.js test/inputTiming.test.js test/gameWindowTitles.test.js`
- [x] 4.2 运行全量 `npm test` 确认无回归

## 5. 修正取件确认误报（清空剪贴板方案）

实机发现 `no-response` 无法区分"取件成功（空格）"与"背包满（物品仍在）"——两种场景剪贴板内容都不变化，导致取一件即误报 `inventory-full`。改为 chaos_recipe 已验证的机制：复制前清空剪贴板，空格=空、物品=非空，可靠区分。

- [x] 5.1 修改 `bag_auto_stash_template.py::_copy_item_text_once`：新增 `clear_first` 参数，清空模式下非空即 `copied`、超时仍空即 `empty`，不再产生 `no-response`
- [x] 5.2 修改 `bag_auto_stash_template.py::copy_item_text`：透传 `clear_first` 参数
- [x] 5.3 修改 `bag_auto_stash_template.py::transfer_pickup_item`：调用 `copy_item_text(ctrl_held=True, clear_first=True)`，`empty` 判成功、`copied` 重试、`unreadable` 停止、三轮后 `inventory-full`
- [x] 5.4 更新 `test/bagAutoStash.test.js`：mock 签名补 `clear_first`；1051 行用例补 `pyperclip.copy` mock；no-response 用例改为 clear_first 语义
- [x] 5.5 更新 `test/junfengHighlight.test.js`：5 处 mock 签名补 `clear_first`
- [x] 5.6 更新 `test/stashPickupIntegration.test.js`：正则匹配 `copy_item_text(ctrl_held=True, clear_first=True)`
- [x] 5.7 运行受影响测试与全量 `npm test`
