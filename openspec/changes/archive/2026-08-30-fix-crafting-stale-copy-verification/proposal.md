# Propose: 装备/地图制作的复制新鲜度验证（拒收跨轮过期文本）

## Why

装备制作与地图洗练存在偶发的"周期突然变快 + 判定失真"：游戏卡顿时，Ctrl+C 会在 tooltip 重渲染完成前被处理，复制到旧状态文本。上一轮修复（crafting-clipboard-evidence-chain）只防御了"与上一条剪贴板文本相同"的情况，并把"文本未变化"推断为"状态未推进"；该前提不成立——通货可能已生效，只是复制读到了重建前的控件内容。更严重的是，快速循环期间剪贴板内容落后物品真实状态多轮，此时一次"与上一条不同"的过期文本会被无条件当作新读取接受，导致：增幅石被用在词缀已满的物品上（游戏内弹窗"此物品无法再新增任何属性"）、词缀匹配/地图洗练命中在过期状态上（面板词缀与实际物品对不上）。这些问题偶发、依赖卡顿时机，与"制作速度突然变快"强相关。

## What Changes

- 读取引入"新鲜度验证"：通货后读取若返回"文本未变化"或命中本次运行已接受过的文本（seen_texts，最近 8 条），视为可疑——退避约 200ms 后再复制复核一次；两次一致才接受（更新 seen_texts），不一致取较新者。把"立即重试（仍落在同一卡顿窗口）"改为"跨过卡顿窗口复核"。
- 装备脚本（`crafting_template.py`）与地图洗练脚本（`map_rolling_template.py`）同一套机制；词缀主循环、增幅补读、预处理循环、洗练循环的判定输入均经过验证，消费点的"未变化按无新信息处理"语义保持。
- 显式同文本放行路径（制作前首次读取、插槽、古灵、地图初始扫描）行为保持不变——其决策单调（计数只增/命中即停），过期文本只会多花通货，方向安全。
- `wait_for_parse_result` 的 requestId 不匹配分支补 `max_wait` 超时检查，消除 Node 侧丢文件事件时的无限挂起。
- 增幅石使用判定处输出 explicitMods/detailedMods 数量日志，用于区分"过期文本"与"解析计数"两类残留问题。
- 不加每轮固定延时；正常速度下零开销，仅可疑场景多花约 200ms。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `crafting-clipboard-evidence`: 新增"通货后读取的新鲜度验证"需求——可疑文本（未变化或命中已接受历史文本）必须退避复核、两次一致才接受；并新增解析结果等待的超时要求。

## Impact

- `src/assets/scripts/crafting_template.py`：新增 seen_texts 状态与退避复核逻辑；`read_current_item`/`wait_for_clipboard_change` 链路调整；`wait_for_parse_result` 超时修复。
- `src/assets/scripts/map_rolling_template.py`：同款机制（`read_current_rolling_target` 链路）与超时修复。
- `src/utils/python.js`：增幅判定日志行（如需在生成代码中输出）。
- `test/craftingParseSynchronization.test.js`：新增新鲜度验证与超时断言。
