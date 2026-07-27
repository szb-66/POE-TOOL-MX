# 技能宝石原始页面快照

该目录缓存 POEDB 中文主动技能宝石与辅助宝石页面，并由生成脚本输出剧情模块使用的规范化目录。

- `npm run skills:data`：完全离线读取当前补丁快照并重建目录。
- `npm run skills:data:missing`：仅显式抓取缺失或不兼容来源后重建。
- `npm run skills:data:refresh`：显式重新抓取全部来源后重建。

应用运行时只读取 `src/domains/story/skillCatalog.json`，不会访问 POEDB。
