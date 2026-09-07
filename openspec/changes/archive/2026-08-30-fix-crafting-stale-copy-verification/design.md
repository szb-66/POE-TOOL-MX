# Design: 装备/地图制作的复制新鲜度验证

## Context

见 proposal.md - Why。现有复制证据链（`crafting-clipboard-evidence`）以 `before_text`（本次 Ctrl+C 前的剪贴板内容）为唯一新旧判据：同文本 → "未变化"快速跳过；不同文本 → 无条件接受。快速循环期间剪贴板落后物品真实状态多轮，"不同"不等于"新鲜"，过期文本由此进入增幅判定与匹配判定。游戏行为依据：Ctrl+C 读取的是当前渲染的 tooltip 控件而非物品数据，点击与复制挤进同一帧时读到重建前内容（上一轮变更 proposal 已记录该现象）。

关键代码位置：

- `src/assets/scripts/crafting_template.py`：`clipboard_changed` / `wait_for_clipboard_change` / `read_clipboard_to_file` / `read_current_item` / `wait_for_parse_result`。
- `src/assets/scripts/map_rolling_template.py`：同构链路（`read_and_parse` / `read_current_rolling_target` / `wait_for_parse_result`）。
- `src/utils/python.js`：生成的词缀主循环、`augment_single_affix_if_needed`、预处理循环。

## Goals / Non-Goals

**Goals:**

- 通货后读取在"可疑文本"上退避复核，杜绝跨轮过期文本进入消费点判定。
- 两条脚本链路（装备、地图洗练）行为一致。
- 修复解析等待在 requestId 不匹配分支的无限挂起。
- 保留增幅判定计数日志，为可能的"解析计数"残留问题留证据。

**Non-Goals:**

- 不加每轮固定延时（settle）；正常速度零开销。
- 不改变显式同文本放行路径（首读/插槽/古灵/地图初始扫描）的语义。
- 不调整 Node 侧解析、匹配与文件协议；requestId 机制保持不变。
- 不处理等待日志显示误差等纯外观问题。

## Decisions

### D1: 可疑判据 = 未变化 ∪ 命中 seen_texts，而不是只比对 before_text

现状只与"上一条"比对。改为脚本维护 `seen_texts`（dict 作有序集合，容量 8，FIFO 淘汰），记录每次**接受分发**的文本。可疑 =（同文本未变化）或（文本 ∈ seen_texts 且本次运行已使用过通货）。理由：过期文本与 before_text 不同但与更早状态相同，只有历史记录能识别。容量 8 的有界集合防止长会话内存增长；随机重滚产生完全相同全文的概率可忽略，即便出现也只是触发一次多余复核。

### D2: 处置动作 = 退避约 200ms 后二次复制，两次一致才接受

可疑时不立即判定：`time.sleep(STALE_COPY_BACKOFF_SECONDS)`（模板常量，默认 0.2s）后重新执行一次完整复制；两次文本一致 → 接受（视为状态稳定，含合法重复）；不一致 → 接受较新者并丢弃第一次。理由：退避跨过卡顿窗口，比"立即重试（仍在同一窗口内）"有效；"复制直到稳定"不依赖对游戏 tooltip 重建深度的精确建模。备选"固定 settle 延时后复制"会让每轮都多付 ~100ms，否决。

### D3: 验证放在 read 层（`read_current_item` / `read_current_rolling_target`），生成循环不改判定逻辑

新鲜度验证作为 read 层默认行为（通货后读取路径），消费点（词缀主循环的 unchanged→continue、增幅补读沿用旧结果等）语义不变——它们拿到的"未变化"已经是"退避复核后仍未变化"的结论。理由：单点收敛，装备与地图生成代码改动最小；`python.js` 仅需为增幅判定补一行计数日志。`allow_unchanged_text=True` 的调用点不启用验证（决策单调：计数只增/命中即停，过期只会多花通货，方向安全）。

### D4: requestId 等待分支统一受 max_wait 约束

`wait_for_parse_result` 的 requestId 不匹配分支现状缺少 `wait_count > max_wait` 检查，解析端丢文件事件时无限循环。补上与其它分支一致的超时返回（读取失败 → 既有重试/停止机制）。纯防御修复，不改变正常路径。

### D5: 增幅判定日志

`augment_single_affix_if_needed` 决定使用增幅石时，输出一行包含 explicitMods 数量与 detailedMods 数量的日志。若上线后弹窗仍偶发，可用日志直接区分"过期文本"与"解析计数"两类根因，无需再猜。

## Risks / Trade-offs

- [退避 200ms 在持续卡顿下仍可能不够] → 复核两次仍可疑时按现有 unchanged 语义处理并进入下一轮，下一轮自然再次复核；不会误判，代价是多轮 200ms。
- [合法的重复文本（随机重滚极小概率全文相同）被多复核一次] → 仅一次退避开销，二次一致即接受，不会死循环。
- [seen_texts 记忆跨"重铸→重新制作"等状态大跳变] → 记录仅用于识别"可疑"，命中后仍以复核结果为准；大跳变文本不在记录内，直接接受，无影响。
- [地图洗练每轮等待上界收紧了原"永不超时"行为] → 解析端正常时结果在秒级返回，上界仅拦截挂起，属目标行为。

## Migration Plan

纯脚本模板与生成器改动，随应用更新分发；无数据迁移。回滚即还原本次改动。

## Open Questions

（无）
