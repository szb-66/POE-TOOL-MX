## REMOVED Requirements

### Requirement: 航海海图预设可安全传输
**Reason**: 用户不再需要通过配置导入导出分享航海海图预设，入口只保留物品制作、地图、剧情、剧情技能和工具站点。

**Migration**: 本地航海海图预设继续正常保存和使用；旧配置包中的 `preset.chart` 显示为不支持并跳过，不覆盖或删除任何本地海图预设。
