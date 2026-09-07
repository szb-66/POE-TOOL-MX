## Why

普通仓库和君锋镇取件在发出一次 Ctrl+左键后直接计为成功，背包已满时来源物品仍留在原位，流程却会继续点击后续候选。需要恢复简单、有限且可提前结束的点击后复制确认。

## What Changes

- 普通仓库和君锋镇对每个来源物品最多执行三轮“Ctrl+左键后原地 Ctrl+C”。
- 任一轮复制为空时立即确认成功并处理下一候选；三轮仍复制到物品时以 `inventory-full` 停止。
- `pickedItems` 只在来源格确认清空后增加，同一来源格最多点击三次。
- 保留每轮输入前的前台门禁和所有结束路径的输入释放，不增加背包扫描、尺寸计算或新配置。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `shared-item-transfer-safety`: 将取件方向从单次点击改为最多三次点击后复制确认，入库方向仍保持单次点击。
- `grid-stat-stash-pickup`: 普通仓库取件按三轮确认结果统计成功或报告背包已满。
- `junfeng-highlight-pickup`: 君锋镇取件使用与普通仓库相同的三轮确认规则。

## Impact

- 影响共享 Python 输入控制器、普通仓库与君锋镇共用的取件脚本以及相应 Node/Python 回归测试。
- 调整 `inventory-full`、`transfer-unconfirmed` 和 `pickedItems` 的运行时语义；不改变 IPC 事件字段或 UI 配置。
- 无新增依赖，仅在开发版验证，不执行打包。
