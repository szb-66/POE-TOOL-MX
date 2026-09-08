## ADDED Requirements

### Requirement: 地图名称对齐编年史
系统 SHALL 使用编年史异界舆图对应区域的中文名称，并保留页面未列出的现有条目。历史记录、当前地图、筛选、统计及导出 SHALL 使用统一名称，且 MUST NOT 将不同地图因旧译名相同而混淆。

#### Scenario: 旧名称记录
- **WHEN** 加载区域 ID 为 MapWorldsStrand、旧名称为滨海山丘的记录
- **THEN** 名称为致命岩滩，MapWorldsAtoll 仍为滨海山丘

#### Scenario: 页面未收录区域
- **WHEN** 加载页面未收录的现有地图
- **THEN** 保留现有名称及未知区域回退行为
