## Context

清空链路 `getResultState`（`electron/modules/sanctum/service.js:381`）要求 `sanctumResultTitle(...) === false`。`sanctumResultTitle`（`electron/modules/sanctum/resultObservation.js:7`）读取 `detection.interfaces['sanctum-map'].matched`，键缺失时返回 `null`。共享检测进程的 `interfaces` 来自 Python `check_titles`（`src/assets/scripts/bag_auto_stash_template.py:608`），其底层 `match_titles`（`src/assets/scripts/interface_titles.py:25`）只输出命中条目，因此线上 `interfaces` 永远不含 `matched: false`，清空分支不可达。单元测试夹具 `detection(false)` 手工构造了 `{matched: false}`，掩盖了协议缺口。

现有消费方对 `interfaces['sanctum-map']` 的读取只有两处：`resultObservation.js:10`（本次修复目标）与 `controlOverlay.js:17`（`=== true` 判断，键值形状变化无影响）。`sanctum_native.py:270` 独立调用 `match_titles` 并用真值判断 `bool(matched.get('sanctum-map'))`，若让 `match_titles` 默认输出未匹配条目会把 `{matched: false}` 判为真，破坏 HUD 布局选择——因此默认行为必须保持"只输出命中条目"。

## Goals / Non-Goals

**Goals:**
- 让公共检测通道能表达"圣所地图标题明确未匹配"，使 `sanctumResultTitle` 在真实运行中可返回 `false`，关图清空分支可达。
- 不改变"缺少标题（检测未运行/失焦/过期/模板无效/环境失配）不清空"的既有语义。

**Non-Goals:**
- 不改动 JS 侧任何文件（`resultObservation.js`、`service.js` 已按布尔契约实现并有完整测试）。
- 不处理 `clearOnMapClose` 为 `false` 的场景（八列/出口确认守卫在真实识别数据下的通过率），那是独立问题。
- 不改变其他标题模板（仓库/背包/君锋等）的输出契约。

## Decisions

1. **在 Python 匹配器上加可选参数，而非改默认行为**：`match_titles(..., report_unmatched=False)`，未命中且开启时输出 `{'matched': False}`。默认关闭保证 `sanctum_native.py` 等现有调用方真值判断不变；开启点仅 `check_titles` 一处（公共检测通道，正是负信号的唯一需求方）。替代方案是 JS 端用"键缺失 + 检测健康 + 模板已配置"推断负信号——需要经协调器暴露模板配置状态、引入多重脆弱启发式，且测试契约本就是显式 `matched: false`，故不采用。
2. **异常路径不产出负信号**：模板无效（`title_region`/解码抛错）与环境失配（`check_titles` 预检）走现有 `title_issues` 分支，不输出条目；JS 端得到 `null`，维持"无效标题不清空"。
3. **心跳不受影响**：`bag_auto_stash_template.py:1019` 的发射条件含 `config.get("interface_titles")`，配置了圣所标题后每 ~200ms 必发帧；地图关闭后 `receivedAt` 持续刷新，满足 `receivedAt > savedAt` 与新鲜度门槛，清空在关图后约 0.5 秒内完成。

## Risks / Trade-offs

- [其他消费方拿到新形状 `{matched: false}`] → 全库检索确认 `interfaces` 读取点仅 `resultObservation.js` 与 `controlOverlay.js`，后者为 `=== true` 判断；协调器与 `sharedTitleLatency.test.js` 的接口键数断言基于模拟事件，不经过 `check_titles`，不受影响。
- [检测负载增加] → 未命中时仅多输出一个常数大小字典项（无图片数据），每 200ms 一次，可忽略。
- [修复后个别地图仍不关图] → 属 `sanctumPenultimateRoom` 守卫未通过（`savedOverlay.clearOnMapClose === false`），与协议缺口无关；验证时先确认协议修复生效，再单独排查。

## Migration Plan

随下一版本发布，无数据迁移；`savedOverlay` 持久化格式不变。回滚即还原两个 Python 文件。

## Open Questions

（无）
