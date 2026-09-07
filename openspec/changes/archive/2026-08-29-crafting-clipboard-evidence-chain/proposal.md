# Propose: 装备制作的剪贴板证据链修复（拒收旧 tooltip 文本）

## Why

装备制作在"改造+增幅 + 固定延迟"下存在假匹配成功：使用通货后游戏 tooltip 重渲染窗口内发出 Ctrl+C 会复制到旧词缀文本，被当作当前物品判定，导致"词缀匹配成功"时背包里实际是没有目标词缀的另一物品，浪费大量通货。用户观察到症状伴生"制作速度突然变快"。

## What Changes

- 修复重试旁路误用：`read_current_item` 与地图洗练的 `read_current_rolling_target` 的同文本放行（`allow_unchanged_text or attempt > 0`）只应服务于"已成功分发解析后的重发"；复制阶段未取得新文本（同文本）的重试不再放行旧文本，避免旧 tooltip 进入证据链污染后续判定。
- 剪贴板等待区分"复制成功但文本未变化"（新增哨兵）与"没有复制到内容"：全部尝试均为同文本时返回未变化结果而非读取失败。
- 生成脚本三个读取消费点处理未变化结果：词缀主循环视为"本 roll 无新信息"直接进入下一轮；增幅补读沿用增幅前结果；预处理沿用上次读取状态并消耗一次尝试。
- 地图洗练读取（`read_current_rolling_target`）同样返回未变化结果：通货后未变化按无新信息处理，洗练循环以默认字段继续滚（自愈）；初始读取显式放行语义不变。
- 显式允许同文本的读取（首次读取、插槽、古灵、地图初始扫描，`allow_unchanged_text=True`）行为保持不变。

## Capabilities

### New Capabilities

- `crafting-clipboard-evidence`: 装备制作复制链路的证据规则——同文本重试仅限解析重发、未变化文本按无新信息处理、显式放行语义不变。

### Modified Capabilities

（无）

## Impact

- `src/assets/scripts/crafting_template.py`：新增 `CLIPBOARD_TEXT_UNCHANGED` 哨兵；`clipboard_changed`/`wait_for_clipboard_change`/`read_clipboard_to_file`/`read_current_item` 证据链调整。
- `src/assets/scripts/map_rolling_template.py`：同款哨兵与证据链调整（`clipboard_changed`/`wait_for_clipboard_change`/`read_clipboard_to_file`/`read_current_rolling_target`）。
- `src/utils/python.js`：生成的预处理循环、词缀主循环、`augment_single_affix_if_needed` 三处 unchanged 处理。
- `test/craftingParseSynchronization.test.js`：同文本哨兵断言更新 + 新增装备与地图读取证据链测试。
