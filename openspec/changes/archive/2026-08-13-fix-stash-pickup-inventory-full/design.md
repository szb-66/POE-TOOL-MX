## Context

仓库取件（`StashPickupManager`）与君锋镇取件（`JunfengHighlightManager`）实际运行的脚本都是 `junfeng_highlight_pickup.py`，其转移确认复用 `bag_auto_stash_template.py` 的 `transfer_pickup_item`（剪贴板复制确认）。见 proposal.md - Why 中的根因说明。`stash_pickup_template.py` 的 `run()` 画面像素变化取件流程在运行时无人调用，仅被测试引用。

实机验证发现：国服客户端在格子为空时复制，剪贴板内容不变化（保持点击前复制的物品文本），因此"无响应"同时出现在"取件成功（空格）"与"背包满（物品仍在）"两种场景，无法区分。`chaos_recipe_pick_template.py` 的 `transfer_item`（复制前先 `pyperclip.copy("")` 清空剪贴板，再按文本比较）已被验证可正常工作。

## Goals / Non-Goals

**Goals:**
- 修复背包满时取件不停，且取件成功后不误报 `inventory-full`。
- 取件确认以"清空剪贴板后复制的内容"为唯一依据：空=已转移、非空=未转移。
- 删除 `stash_pickup_template.py` 中未被生产引用的画面变化取件逻辑。
- 保持入库空格扫描的快速判定行为不变。

**Non-Goals:**
- 不改动 `junfeng_highlight_pickup.py` 的主流程（其 `before_status` 判空与逐格复制确认结构保持不变）。
- 不引入新的配置项或 UI。
- 不改变 `chaos_recipe_pick_template.py` 的转移逻辑（其清空剪贴板 + 文本比较方案作为取件确认的参照实现）。

## Decisions

### 1. 取件确认在复制前清空剪贴板（`clear_first`）

`_copy_item_text_once(ctrl_held=False, clear_first=False)`：`clear_first=True` 时复制前先 `pyperclip.copy("")`，清空后的判定与现有路径分离：

```python
if clear_first:
    try:
        pyperclip.copy("")
    except Exception:
        return "unreadable", ""
before_seq = clipboard_sequence_number()
before_text = str(pyperclip.paste() or "")
if not self._send_copy(ctrl_held):
    return "unreadable", ""
deadline = time.monotonic() + self.clipboard_delay
while is_running:
    current_seq = clipboard_sequence_number()
    current_text = str(pyperclip.paste() or "")
    if current_text.strip():
        if clear_first or current_text != before_text:
            return "copied", current_text
    elif clear_first:
        return "empty", ""
    elif before_seq is not None and current_seq is not None:
        if current_seq != before_seq:
            return "empty", ""
    else:
        if current_text != before_text:
            return "empty", ""
    remaining = deadline - time.monotonic()
    if remaining <= 0:
        break
    time.sleep(min(CLIPBOARD_POLL_INTERVAL_SECONDS, remaining))
return "no-response", ""
```

- 清空模式下：轮询到非空 → `copied`（物品还在）；剪贴板为空 → `empty`（空格，已转移）。序列号不作为判空条件。
- 默认（入库空格扫描）路径保持原判定与 `no-response → empty` 快速兜底，行为零变化。

### 2. `transfer_pickup_item` 使用 `clear_first=True`

```python
copy_status, _text = controller.copy_item_text(ctrl_held=True, clear_first=True)
if copy_status == "empty":
    return True, ""   # 清空后复制为空 → 空格 → 物品已取走
if copy_status != "copied":
    return False, runtime_stop_reason or "transfer-unconfirmed"  # unreadable
# copied → 物品仍在，重试；三轮后 inventory-full
```

- `empty` → 成功；`copied` → 重试；`unreadable` → `transfer-unconfirmed` 停止；三轮 `copied` → `inventory-full`。
- 不再依赖 `no-response` 判定，消除"空格/物品仍在"歧义。

替代方案（已否决）：保留 `no-response` 重试逻辑——无法区分取件成功与背包满，正是本次实机误报的根因。

### 3. `empty_on_no_response` 参数保留但取件路径不再依赖

`copy_item_text(ctrl_held=False, empty_on_no_response=True, clear_first=False)`：`empty_on_no_response` 默认仍为 `True`（入库扫描不变）；`transfer_pickup_item` 显式传 `clear_first=True`。`no-response` 在清空模式下不会产生，取件分支无需处理。

### 4. 删除 `stash_pickup_template.py` 画面变化取件

删除 `run`、`main`、`wait_for_patch_change`、`patch_changed`、`changed_item_cells`、`local_patch`、`detect_candidates`、`cell_score`、`cell_bounds`、`annotated_preview`、`ctrl_click`、`emit`、`emit_with` 与 `TRANSFER_ATTEMPTS`、`PATCH_POLL_INTERVAL_SECONDS`，以及不再使用的 `import base64`、`import argparse`。保留 `apply_fixed_timing`（junfeng 导入并在启动时调用，其 `PATCH_VERIFY_SECONDS` 全局设置随函数保留）、窗口/前台识别、`region_rect`/`capture` 与全部网格布局识别函数（`choose_layout` 链）。

验证方式：`junfeng_highlight_pickup.py` 的 `from stash_pickup_template import (...)` 只引用保留函数；删除后 junfeng 集成测试与脚本导入必须通过。

## Risks / Trade-offs

- 清空剪贴板会占用系统剪贴板一瞬间，但复制动作本身也会占用，无额外风险。
- 游戏写入物品文本存在延迟时，清空模式下轮询到非空即 `copied`，与现有轮询时序一致；空格场景可能需等待整个 `clipboard_delay`（adaptive 上限）——与 chaos_recipe 行为一致，可接受。
- `clear_first` 是取件路径显式参数，未来新增取件式调用容易漏传——缓解：`transfer_pickup_item` 是取件唯一入口，测试断言锁定其调用形态。
- 删除死代码面较大（约 15 个测试用例受影响），存在误删被隐式依赖函数的风险。缓解：以 junfeng 脚本 import 清单为准绳逐函数核对，删除后运行 junfeng 相关测试验证。
