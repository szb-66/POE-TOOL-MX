# 原生市集词库来源与维护

## 当前目录

发布文件为 `electron/assets/market-localization/catalog.json`，`schemaVersion=1`，仅对应已验证的 Steam Build `26673341`／`3.30.0b`。它独立于服务器 DAT／CSD 资源协议，不包含可执行代码。

2026-11-15 本轮目录使用当前本地验签资源 `6e95be38-31b4-497a-8d8f-10def6eb8d16`，目录的 `localizationReleaseId` 记录该版本。游戏 EXE 指纹、规范化来源哈希及覆盖计数均在文件内保存。

| 项目 | 数量 |
|---|---:|
| 总规则 | 35,271 |
| 固定栏目、选项及占位符规则 | 382 |
| 词缀文字及分组标签规则 | 25,253 |
| 物品名称／底材／组合文字规则 | 9,636 |
| 国际服交易词缀 ID | 17,261 |
| 有可靠简体译文的词缀 ID | 12,450 |
| 有可靠繁体译文的词缀 ID | 9,582 |
| 两种语言均未覆盖的词缀 ID | 4,640 |
| 国际服物品目录项 | 6,006 |
| 按底材及传奇名称字段判断完整映射的目录项 | 5,165 |
| 仅部分字段匹配的目录项 | 7 |
| 未匹配物品目录项 | 834 |

规则的紧凑 JSON 为 5,357,962 字节，低于原生通道 16 MiB 上限。以上为数据覆盖，不等于每个条目都做过游戏内搜索验收；未覆盖或有歧义的内容保留原文。

## 来源与约束

- 固定栏目和常见聚合伪词缀的简繁文字由项目自行维护，使用国际服稳定 ID。已有真实目录观测负责核对类别 ID 与法语来源，不能修改这些 ID 或布尔选项值。
- 分组名称另人工核对了用户提供的参考程序中的少量术语：简体采用“综合／外延／基底／工艺”等游戏用语，繁体采用“偽屬性／隨機屬性／固定屬性／工藝”等。繁体“固定屬性”纠正了参考中的“固性屬性”错字；仅核对这些界面用语，不复制其整套词库。
- 普通词缀优先使用当前受管资源的已核验模板。旧国服交易目录仅作为候选，必须同时满足交易 ID、当前英文原文及参数结构一致；不会把“数值”等列表展示占位文字写入游戏。
- 模板检查保留 `#` 参数数量、百分号数量及固定数值；同一 ID 出现互相冲突的译文时按语言舍弃冲突候选。词缀 `type` 属于查询身份，不参与翻译。
- 繁体来自受管导出的官方繁体及项目自行整理的聚合词缀译文，不自动把简体转字形后声称是官方繁体。
- 物品法语源来自本机官方 `BaseItemTypes`、`Words`、`AchievementItems` 表，英文与法语按稳定 ID 对应，再以表／ID／字段及英文哈希对齐受管中文。此次读出 9,113 个相关法语来源，其中 7,648 个字段与有效中文资源对齐。
- 物品规则精确约束法语原文，不把本地 DAT ID 当成远端物品对象的 ID。底材的反向字段为 `type/term`，传奇名称为 `name/term`；只有英文组合结构完全一致时才生成组合文字。
- 同名中文与多个法语源对应时，运行时需保留可区分的原文候选，不能随意挑选一个目标。来源数据、生成器及原生组件均未复制参考程序的整套词库。

## 重新生成

维护者需要先构建现有原生 helper。法语名称提取还需要使用 .NET 8 或以上的 PowerShell 7；提取过程只读游戏资源，不运行或注入游戏。

```powershell
pwsh -NoProfile -File scripts/exportMarketLocalizationNames.ps1 `
  -GameDirectory 'E:\SteamLibrary\steamapps\common\Path of Exile' `
  -OutputPath '.cache/native-market/official-names.fr.json'

node scripts/generateMarketLocalizationCatalog.js `
  --official-names '.cache/native-market/official-names.fr.json' `
  --localization-storage "$env:APPDATA\流放助手\servers\international\localization"

node scripts/generateMarketLocalizationCatalog.js `
  --official-names '.cache/native-market/official-names.fr.json' `
  --localization-storage "$env:APPDATA\流放助手\servers\international\localization" --check

node --test test/marketLocalizationCatalog.test.js
```

`--localization-storage` 仅从本地缓存验签并解码当前活动资源，同时核对其版本与 `transaction-active.json` 一致，不联网、不激活下载候选。离线维护也可用 `--localization '<官方导出 JSON>'` 代替该参数。

生成器采用原子替换，`--check` 只比较当前来源与发布文件，不写目录。PowerShell 提取文件记录读取时的索引指纹；它是法语名称来源快照，不代表后来活动汉化事务的索引指纹。

游戏版本、数据来源或人工固定译文变化后，应重新生成并执行专项测试，再做真实市集验收。游戏已经加载词库时不要直接覆盖发布目录；先停止当前翻译会话，再生成和重新启用。

## 完整筛选目录补齐

`scripts/market-localization/official-filters.tw.json` 保存官方繁体交易 API 的原始筛选树，来源、获取日期及 SHA-256 记录在相邻的 `official-filters.source.json`。生成器校验快照指纹后使用其中的真实字段及选项 ID，`officialFilterTranslations.js` 负责已核对的游戏术语；其余官方繁体标签保留原词，简体采用自然字形转换。职业、结界、宝石、劫盗、禁域及新增类别等术语优先对照当前受管游戏资源，而非直接照搬 API 的旧词或错字。

用户完全退出游戏后，本轮目录与支持作用域的原生组件已整体更新至开发运行时。目录 SHA-256 为 `ca8f643d7e5da904f3b8e09ed13b57e9c8402ccf389ff9f90ed28a1d07882a97`，共 35,271 条规则，其中筛选规则 382 条。官方筛选树的 380 个展示位置均有简繁映射：11 个标题、93 个字段文字、1 个账号输入占位符、275 个内联选项（240 个字符串 ID、35 个空 ID 默认项）。专项测试检查每个位置的匹配身份及译文，并保留选项字符串值，包括闪耀样式的 `"0"` 至 `"12"`。实际游戏显示状态另见实机验收记录。

所有内联选项均按所属筛选字段 `scope` 限定；空 ID 还需要 `defaultOption=true`，不会把全局空字符串当成翻译身份。35 个默认项分成普通“任意”31 项，以及折叠结果“否”、上架时间“任意时间”、销售类型“一口价或定价”、价格“与混沌石等值”各 1 项。字段名称与选项即使同 ID，也不会混用译文。

这次完整覆盖只针对上述静态展示位置。6 个说明提示 `tip` 未改写；`map_completion_reward`、`ultimatum_input`、`ultimatum_output` 的动态 `knownItem` 候选继续由既有物品目录按可靠原文映射，不能据此宣称全部候选已翻译。账号占位符按已观测法语原文精确匹配，其实际刷新仍需游戏内核对。完整筛选扩展使用新的原生 `scope/defaultOption` 支持，应与该运行时一起更新，关闭旧游戏会话后再启用。

```powershell
node scripts/generateMarketLocalizationCatalog.js `
  --official-names '.cache/native-market/official-names.fr.json' `
  --localization-storage "$env:APPDATA\流放助手\servers\international\localization" `
  --output '.cache/native-market/pending-catalog.json'

node --test test/marketLocalizationCatalog.test.js
```
