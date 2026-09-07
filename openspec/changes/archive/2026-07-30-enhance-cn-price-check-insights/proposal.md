## Why

国服查价浮窗的查询设置目前与页面配置各自维护，价格结果只能逐条查看，且未鉴定传奇会把底材误作物品名并触发官方接口 `Unknown item name`。同时，混沌石与神圣石混合计价缺少可解释的 DC 换算来源，无法形成可靠的价格分布。

## What Changes

- 为查价器可选行、候选项和视图切换增加悬浮与键盘聚焦样式。
- 将“默认查询设置”改为“查询设置”，在页面与浮窗之间双向同步六项查询设置。
- 接入现有 poecurrency.top POE1 汇总接口，以一小时缓存提供 DC 比，并支持最后有效缓存和手动参考值降级。
- 新增最多 100 条去重挂单样本的等价价格点分布模式，标明各价格点中的 D/C 原始挂单数量。
- 使用国服官方物品目录解析所有未鉴定传奇；单候选自动选择，多候选由用户确认后查询。

## Capabilities

### New Capabilities
- `cn-price-distribution`: 定义混合通货换算、100 条样本抓取、价格点占比与 DC 比降级行为。
- `unidentified-unique-resolution`: 定义未鉴定传奇的官方目录候选解析和用户确认流程。

### Modified Capabilities
- `cn-price-check`: 查询设置改为跨窗口双向同步，分页样本上限扩展并避免无效传奇名称请求。
- `cn-price-check-overlay`: 浮窗增加完整设置、DC 比、悬浮反馈和价格分布视图。
- `cn-trade-catalog`: 官方交易目录增加物品名称、底材和传奇标记。

## Impact

涉及查价 Store 与页面、查价浮窗、price-check IPC/preload、主进程查价服务与客户端、交易目录加载和现有价格服务。继续复用腾讯国服认证 Session 与 poecurrency.top，不新增依赖，不自动交易或发送私聊。
