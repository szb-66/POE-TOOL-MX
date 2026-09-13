# PoB 导出数据基线

生成命令：`python scripts/generatePobCompatibilityData.py`。
只读一致性检查：`python scripts/generatePobCompatibilityData.py --check`。
在本项目开发环境可使用 `.runtime/python-runtime/python.exe`。

覆盖明细按解压内容检查；内容一致时保留已有 gzip 文件及其哈希，避免 Python/zlib 压缩差异引起误报或无意义数据变更。内容过期、文件损坏和报告哈希不符仍会校验失败。

默认不联网，从 `snapshot.json.gz`、固定依赖和项目国服快照生成随应用分发的
`electron/assets/pob-export/compatibility.json`。不读取账号、认证或角色缓存。
`--refresh --pob-data <本地 PoB 目录>` 用于显式更新来源快照；PoB Lua 文件必须匹配固定提交。

固定来源：

- `cn-poe-utils@0.0.9`：基础映射及引用元数据。
- PoeCharm `ac05b82ca47009780c1ebd6518108e876ccd44b5`：14 份简体中文翻译文件。
- PoB 2.67.2，提交 `b32759ab0f31a1c8499a0d420cb0f0633d4fe478`：底材、传奇底材关联、技能身份、3.29 天赋树。
- 项目中的国服交易目录、制作底材、技能目录和传奇原始页面；具体输入文件及 SHA-256 见覆盖报告。
- `overrides.json`：有来源依据的国服别名、上下文消歧与兼容模板；不根据相似字形猜测身份。

`coverage.json` 提供来源哈希与类别统计，`coverage-details.json.gz` 是完整候选记录清单。
统计单位是来源候选记录，包含别名和重复来源，不能相加后称为独立物品数量。
其中 `cnItems` 单独检查国服角色装备目录；`grafts` 单独检查 16 个 PoB 嫁接底材。
嫁接运行时复用转换依赖的通用珠宝底材索引，并保留 `itemType: Graft` 和专属装备栏位。

当前国服目录检查包含 3363 条：3361 条有身份映射；赏金猎人饰品由 PoB 非战斗导入规则排除，
血肉嫁接（Fleshgraft）在固定 PoB 版本没有底材定义，遇到时阻止导出。
PoB 自己生成的随机剑与能量之刃计算底材不属于官网角色物品底材，不臆造中文名称。

词缀统计与上述身份覆盖不同：不同来源的冲突、无唯一英文引用、负值变换信息不足和复杂占位符
均保留具体原因，不能视为已翻译。新增数值模板还经过运行时参数回填核验；不一致的候选不安装。
运行时未知词缀保留原文并提示可能影响 PoB 计算，关键身份或结构缺失则一次收集问题并阻止导出。
`cosmeticMods` 属于外观描述，不是战斗词缀；不会注入 PoB 计算。

回归入口：`node --test test/pobExport.test.js test/pobExportCoverage.test.js test/pobExportState.test.js`。
测试会解压导入码核对 XML，也检查整个固定角色目录、传奇底材关联和 PoB 宝石身份。
它们不能代替用新增真实官网样本持续核验，更不能证明所有未来赛季或上游缺失内容都受支持。
