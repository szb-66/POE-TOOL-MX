# 原生市集简繁翻译

## 实现边界

原生市集由两类文字组成：搜索按钮、占位符与数值上下限来自本地 ClientStrings；筛选栏目、选项、词缀和物品候选来自游戏实例下发的压缩目录。仅修改 DAT／CSD 或 `fr` tag 无法覆盖后者。

本组件独立实现目录字段替换和中文查询名称还原，保留游戏布局、控件、交易 ID、选项值、数值和查询结构。现有简繁资源、备份事务和 `fr` 入口不变；没有扩展远端 DAT／CSD 签名协议，也没有加入覆盖层或助手市集。

结构兼容模式面向 Windows x64 Steam 国际服 POE1，以此前完成真实中文显示验收的客户端作为 ABI 基准：

- Steam Build `26694821`，游戏日志版本 `3.30.0b`，基准 EXE SHA-256为 `7f762cadbe0a7315091e105121010d2f35296db8046294e0bf49aacfff67db3c`。
- 基准资料的 `validatedInGame` 记录基准客户端此前的实机证据，不能代表后续版本均已实机验证。本轮新解析器、DLL和目录的实际验收另见[结构兼容验收记录](native-market-acceptance.md)。
- 解析结果用 `referenceValidatedInGame` 表示基准证据、`structurallyCompatible` 表示当前结构检查结果；目标EXE哈希不等于基准时，目标的 `validatedInGame` 为 `false`，不将自动兼容误报为新版本实机通过。
- 新 Build、完整EXE哈希或时间戳变化不再单独触发拒绝。只有七个关键完整函数、十二个调用点及字段关系都能按基准独立核实时才启用；不支持POE2或独立客户端。
- 关键函数正文任意字节、可靠边界或调用关系发生变化，均停止并提示“市集结构无法确认兼容”。不保证所有小更新通过，不使用固定地址增量猜测，也不通配陌生指令。

市集目录的Build、EXE和汉化发布版本保留为来源记录；已确认结构兼容的游戏可复用原文仍一致的条目，无需为相同内容重新上传词库。组件或目录损坏、受管索引不匹配和未完成事务等保护仍保留。

采用 DLL 注入，仍存在账号和兼容风险。版本校验不能消除这些风险。用户提供的第三方程序仅用于研究机制，未运行该安装包，不作为运行依赖，也未复制其二进制或整套词库。

## 使用与停止

在国际服侧边栏“游戏汉化”应用简体或繁体汉化后，打开语言切换按钮下方的“市集翻译”开关。首次默认关闭，之后记住选择；助手运行期间会自动为新启动的游戏启用对应语言的市集翻译，游戏退出后继续等待下次启动，无需逐次点击。助手重启时会在主窗口显示前完成开关恢复和首次进程检测，窗口出现后可以直接启动游戏，无需先打开汉化页面。界面只保留一行开关，失败或需要重启时显示简短提示。

在游戏已经运行时打开开关，或启动助手时游戏已经运行，会先尝试接回该游戏已加载的同路径市集组件。只有原会话已初始化、语言及完整词库一致时才恢复查询转换；不会向未加载组件的旧游戏迟注入。没有可接续状态时等待游戏重启，状态不一致时明确提示。开关偏好保存在当前国际服汉化目录的 `market-settings.json`；切服和助手退出仅停止当前会话，不清除偏好。关闭开关才取消后续自动启用。

游戏会把目录字符串复制到自己的缓存中，缓存跨角色登录保留。因此：

- 必须在首次目录加载前启用；已经进入过游戏的会话不能补做完整翻译。
- 同一游戏进程只允许同一模式和词库。修改模式或词库后必须重启游戏。
- 开关开启期间自动跟随有效的受管简繁模式；恢复原版或资源无效时暂停，重新应用有效语言后恢复监听。版本或 Hook 冲突失败不反复尝试同一 PID，具体错误保留至该进程退出。
- 停止、切服、助手退出或管道断开会恢复原调用。已显示的中文缓存仍可能保留，**关闭再打开市集不会清除缓存**，必须完整重启游戏刷新。控制连接中断期间不要使用缓存中文名称搜索；开启市集开关后重启助手可接回一致的原会话，无需重启游戏。
- DLL 不强制卸载；提供给游戏的译文节点保留至游戏退出，避免悬空指针。

## 组件与协议

- `electron/native/market-localization/MarketHook.cpp`：MinHook 1.3.4 管理字段读取与查询构造挂钩，nlohmann/json 3.11.3 解析目录规则和查询。
- `electron/native/market-localization/compatibility.json`：已验收ABI家族、七个完整函数的长度／哈希及12个允许调用点的完整上下文和字段键。
- `electron/native/localization-helper/MarketHost.cs` 与 `MarketCompatibility.cs`：现有helper的独立 `--market-host` 常驻模式及磁盘结构核验，不复用一次性资源操作管道。
- `electron/modules/marketLocalization/`：Electron 会话与主窗口 IPC 管理。
- `electron/assets/market-localization/catalog.json`：随助手发布的项目目录，未知条目透传原文。

结构模式目录使用9,113条官方法语名称、本地48张CSD的26,090个同形English/French模板，以及官方交易API的英法快照。当前已晋升目录合计34,092条规则，保留380个静态筛选展示位置的简繁覆盖。动态规则必须有精确法语 `source`，词缀还匹配交易ID；当前原文不同就保持原文。既有20个明确分类label和限定scope的固定筛选选项是稳定元数据例外，不能推广为任意无原文规则。

最初直接读取官方法语API返回403，CSD候选因此遗漏了远端综合词缀。后续通过正常浏览器成功读取[官方英文交易词缀](https://www.pathofexile.com/api/trade/data/stats)与[官方法语交易词缀](https://fr.pathofexile.com/api/trade/data/stats)，没有绕过接口验证。维护快照分别有18,643和18,624行，综合词缀均为298行；以gzip保存原始字节，来源清单记录URL、UTC记录时间和解压后SHA-256，生成前必须验证哈希。快照只供目录维护，不由运行组件动态请求。

生成器先核对同一交易ID的官方英文与现有翻译英文模板，语义变化或同ID多种官方英文时保守跳过，不借用旧CSD译文；通过后绑定精确官方法语，CSD仍可提供独立核实的原文变体。对全部298项综合词缀审计后，确认24项官方原文使用`+X`：Mana、Energy Shield两项及插槽宝石等级22项。`official-pseudo-parameter-spellings.json`逐项记录准确ID、英文、法语及来源哈希，只有三者完全相符才允许该参数拼写，不把任意`X`视为参数。最初已核对的24个综合词缀术语在英文完全一致时优先使用对应译文，避免与同义CSD译文产生表述歧义。

当前已晋升目录简体词缀11,453、繁体8,960。全部298个官方综合词缀的精确法语原文均有简体译文，简体缺项为零；繁体覆盖52项，其余246项缺少可靠繁体译文，保持原文。全目录仍有1,046个原可翻译候选缺少可靠法语来源，报告同时记录391个英文漂移模板，均保留原文。不同规则可以覆盖同一ID的不同可靠原文，因此规则数不等于词缀ID数。这些是离线证据，不代表所有文字都已实机验收。正式目录晋升和最终结果见验收记录。

变异宝石的完整候选名来自`items/text`，基础`type`与`discriminator`共同决定查询身份，只有基础名汉化不足以按“远程之幻化武器”等完整中文名检索。维护源另保存[官方英文items](https://www.pathofexile.com/api/trade/data/items)与[官方法语items](https://fr.pathofexile.com/api/trade/data/items)的gzip快照、URL、UTC时间及原始字节哈希。配对限定宝石组，先用本地官方表身份及准确英文核实基础EN→FR类型，再按基础类型与discriminator建立双边唯一配对；不使用数组顺序或仅凭discriminator猜测。

完整英文名必须精确对应已验签`activeskills.DisplayedName`或`gemeffects.Name`，同语言有不同译文时保留该语言原文。瓦尔组合仅在官方英文明确为`基础名 (变异名)`且两部分都有可靠译文时生成中文组合；法语来源始终使用官方完整text，不拼接或调整大小写。完整变异名规则只反查`term`；查询`type.option`继续还原基础法语名并保留原discriminator。

当前官方265个变异候选均有可靠完整text映射，含50个瓦尔组合；其中263项有简体、265项有繁体。较旧国际列表以外的Fireball of Radiation及对应瓦尔项只有可靠繁体译文，简体模式沿用既有繁体回退。`gemVariants`报告区分官方数、当前列表数、匹配数、简繁数与跳过原因；`itemsComplete`也要求变异完整text已覆盖，不能仅凭基础类型存在译文计为完整。

Electron 与 host 使用 JSON 行协议 `marketProtocolVersion: 1`，只允许 `enable / resume / disable / status / self-test`。host 自行查找唯一匹配的进程，渲染进程不能指定 PID 或 DLL 路径。`resume` 不执行注入：核对已加载模块的路径及既有状态后，复用 DLL 原有 `configure` 身份校验，仅接受完全相同的语言和规则。host 与 DLL 使用限当前用户、首实例且校验客户端 PID 的命名管道，消息为 uint32 小端长度加 UTF-8 JSON，最大 16 MiB。

管道安全按 Windows 当前 User SID 建立独占访问规则，并显式设置 Medium／NoWriteUp 完整性标签，兼容“管理员助手＋同账号普通权限游戏”。不能使用 `PipeOptions.CurrentUserOnly` 代替该策略：它在 Windows 上同时限制提权身份，管理员进程的 Owner SID 可能是 Administrators，普通权限同账号的该组仅有 deny-only 身份，连接会被拒绝。[微软文档](https://learn.microsoft.com/en-us/dotnet/api/system.io.pipes.pipeoptions?view=net-8.0)、[.NET 8 实现](https://github.com/dotnet/runtime/blob/v8.0.0/src/libraries/System.IO.Pipes/src/System/IO/Pipes/NamedPipeServerStream.Windows.cs)。原生组件自检必须读回实际管道的 Owner、受保护 DACL 和完整性标签，不能只验证构造参数。

host仍核对Steam manifest、路径、x64、当前实际Build对应的受管资源状态、索引哈希和事务日志，拒绝已知第三方市集Hook。C#在磁盘PE中按长前导唯一定位七个函数：目录读取、查询构造、字符串构造／析构及items、stats、filters三个reader；每个函数都须符合可靠函数边界、完整正文长度和完整正文SHA-256。

十二处完整上下文必须位于对应reader内，CALL仍指向解析出的目录读取函数，LEA取得对应只读字段键。PE文件／映像边界、节权限和ASLR重定位覆盖一并核验。DLL在挂钩前独立核验内存映像，不能只信任控制端提供的地址。前导相同而函数后半部变化、零候选／多候选、字段键或调用目标变化都拒绝启用。

该机制允许Build／哈希／元数据变化、非关键代码变化，或关键完整正文和关系仍完全相同的位置变化。它不对相对位移做通配；即使只是小更新，只要关键正文发生变化也需要重新适配。结构不兼容时保留开关偏好、当前会话返回原调用并提示具体原因，不对同一个失败PID反复尝试。

目录规则分 `items / stats / filters`。只替换展示与检索文字；stats 的 `type` 是查询身份，禁止翻译。简体按 `cn → tw → 原文` 回退，繁体按 `tw → 原文` 回退。交易词缀通过稳定 ID 和参数模板对齐；不同原文对应同一中文物品名时补充原文以区分候选。查询只精确还原 `query.name / type / term` 中的已知名称，并且该会话必须实际观察到与规则完全相同的物品原文；仅存在于离线词库、没有在当前会话确认的名称不能反查。name/type 的变体对象仅修改 `option`，保留 discriminator、词缀 ID、数值范围和其他键值。

## 构建与验证

```powershell
npm run localization:build
npm run runtime:verify
node scripts/verifyMarketCompatibility.js "E:\SteamLibrary\steamapps\common\Path of Exile\PathOfExileSteam.exe"
node --test test/market*.test.js test/localizationDistribution.test.js
```

维护者重新生成候选时可执行 `node scripts/generateMarketLocalizationCatalog.js --game-directory <Steam游戏目录> --localization-storage <国际服汉化缓存目录> --output .cache/native-market/structure-catalog.json`；只读导出官方法语名称与同形词缀模板，保存来源表哈希后生成目录。默认同时读取`scripts/market-localization/official-trade-stats.source.json`与两份gzip官方快照；可通过`--official-trade-stats-directory <维护源目录>`显式选择同格式来源。快照更新时同时正常获取英法响应，并记录原始字节哈希、来源URL与时间；不能只更新法语或将旧ID当作英文语义证据。无法读取、哈希不符或结构无法核验时停止生成，不绕过官方接口验证。候选验证后再整体晋升组件及正式目录，已缓存旧规则的游戏必须完整重启。

变异宝石维护源默认读取同目录的`official-trade-items.source.json`及英法gzip快照，也可用`--official-trade-items-directory <维护源目录>`指定。官方新条目可以在准确双语身份及已验签名称均可证明时先于旧国际列表生成；缺来源、双边配对重复、英文变化、discriminator不符或译文歧义均保守跳过。

可执行 `node scripts/auditMarketPseudoCoverage.js --catalog .cache/native-market/structure-catalog.json --output .cache/native-market/pseudo-coverage-audit.json`，逐项输出全部官方综合词缀的ID、英法原文、简繁覆盖状态及缺失原因。仅校验最初截图24项不能替代298项完整覆盖回归；正式资产测试也要求全部298项简体精确命中。

单独重建 DLL 可执行 `npm run market:build`。构建脚本固定依赖提交／头文件哈希，运行原生离线自测，再分发 DLL、原生自测程序、兼容资料、依赖指纹和完整许可证。`runtime:verify` 同时执行原资源组件自检、独立 market host 自检和原生市集自检，缺件或指纹不符时拒绝打包。不会对真实游戏应用汉化或发起交易。

真实游戏验收见[市集实机验收记录](native-market-acceptance.md)。最小原型验证通过与完整目录的全部内容实测是不同的验收项，未验证项如实保留。
