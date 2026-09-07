## Why

仓库自动取件在背包已满时不会停止：`bag_auto_stash_template.py` 的 `copy_item_text` 把剪贴板"无响应"（`no-response`）兜底判定为"空格"（`empty`），`transfer_pickup_item` 复用时在背包满场景下把"物品未移动"误判为"物品已取走"，脚本继续取下一件直到跑完全部候选并报告完成，永不触发 `inventory-full` 停止。另外，`stash_pickup_template.py` 中的画面像素变化确认逻辑（`wait_for_patch_change` 等）是死代码：生产路径从不执行它，且其"画面变化即转移成功"的判定在背包满时同样不可靠，应一并删除。

## What Changes

- 修复 `bag_auto_stash_template.py::transfer_pickup_item`：取件确认不再把剪贴板无响应兜底为空格。`no-response` 视为"物品未移动"，继续重试；达到尝试上限后以 `inventory-full` 停止。
- 为 `bag_auto_stash_template.py::copy_item_text` 增加 `empty_on_no_response` 参数：入库空格扫描继续使用现有快速判定（默认值不变），取件确认路径显式关闭该兜底。
- 删除 `stash_pickup_template.py` 中整套画面变化取件逻辑：`run`、`main`、`wait_for_patch_change`、`patch_changed`、`changed_item_cells`、`local_patch`、`detect_candidates`、`cell_score`、`cell_bounds`、`annotated_preview`、`ctrl_click`、`emit`、`emit_with` 及专用常量；保留 junfeng 取件依赖的布局识别与窗口识别函数。
- 同步删除/改写依赖已删逻辑的测试，并新增背包满（剪贴板无响应）场景的回归用例。

## Capabilities

### New Capabilities

- 无（无新能力引入）

### Modified Capabilities

- `shared-item-transfer-safety`: 剪贴板确认协议在取件确认路径上不再把"无响应"兜底为"空格"——物品未移动时按重试处理，达到上限以 `inventory-full` 停止。
- `grid-stat-stash-pickup`: 移除"格子画面像素变化"作为转移确认依据，取件确认统一由剪贴板复制协议承担；背包满必须可靠触发 `inventory-full` 停止。

## Impact

- `src/assets/scripts/bag_auto_stash_template.py`：`copy_item_text` 签名（新增可选参数）、`transfer_pickup_item` 确认分支。
- `src/assets/scripts/stash_pickup_template.py`：删除约 60% 的取件流程代码；保留的函数均被 `junfeng_highlight_pickup.py` 引用，无对外 API 破坏（脚本本身不作为独立可执行入口被使用）。
- `test/stashPickup.test.js`、`test/adaptiveTiming.test.js`、`test/automationTimingProtocol.test.js`、`test/inputTiming.test.js`、`test/stashPickupIntegration.test.js`、`test/bagAutoStash.test.js`：用例删除、改写与新增。
- 行为影响：君锋镇高亮取件与仓库取件共用 `transfer_pickup_item`，两处同时受益；入库空格扫描行为不变。
