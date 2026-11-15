# 2026-11-15 物品与地图汉化复查及四类统一

本节为最新交付，覆盖任务第7节。用户明确Low、Mid、Top、Uber共用同一异界地图制作流程；先前普通/T17区分仅为历史记录，运行策略、正则筛选与当前说明均已更新。

## 修复范围

- 详细头：真实简繁Tier与Lvl分离，修复Tier丢失或误读为80、古灵两来源及六级别丢失；保留工艺、破碎和引用名称。英文、汉化、混合未知或冲突头均停止；Unicode横线及全角数值范围保持目录条件匹配。
- 数字变体：按可信stat条件、数值handler和原始顺序选择模板，消除单复数假歧义。抽象English别名只补同table/stat/handler/参数且纯单复数兄弟，不把正负效果或固定1/2条件互换，真正歧义不任取候选。
- 精华：和固定通货共用合法尾注清理；规范英文沿现有国际服目录下发，当前简繁译名唯一匹配。未知、歧义和破损尾注不放行，不接受任意Essence of字符串。
- 契约／蓝图：准确ClientStrings ID/en/hash处理字符串参数、目标、Job/NPC需求、揭露字段及固定说明，元数据不进入词缀；冒号底材不影响中文随机稀有名。缺少当前精确映射的中文Job/NPC参数仍停止，实际受管中文结构＋英文参数可用，不从复合名称猜译。
- 地图身份：国际服不再把底材覆盖成“地图”；魔法图保留可靠身份，已知尺寸用于批量，旧底材未知尺寸不猜测。显式Item Tier独立下发，不推断为分类或词缀Tier。
- 四类统一：移除普通/T17按钮与17阶点金门禁，四类共用目录、预设和原安全预检。四页来源的131条词缀、稳定ID、variants与来源hash保留；旧region迁移不删已选条件。兼容Header矩阵依据用户提供四类和有限结构别名构建，不冒称已采集英文实机Header。

## 最终验证

- 完整已验签66,726条3.30.0b资源仅作内存fixture，未激活：四类×三语×5种真实地图stat×数量1/2，共120组规范识别／黑名单通过；当前戒指真实生命目录三语×三阶，共9组数值、Tier与条件判断通过。日志为`.cache/international-crafting-recheck-live-maps-final.log`、`.cache/international-crafting-recheck-live-items.log`。
- 正式回归执行真实fileChanged业务源码、解析／匹配器及Python黑名单／统计函数，存储和输入边界使用假对象；四类、两种已知底材、四语、数量1/2的64组结果一致，别名不重复计数。未知词缀、换词库和缺可靠尺寸均保留停止或未知行为。
- 97项制作专项、15项原契约流程、79项目录／正则／预设专项等通过，存在重叠，不相加为全量数。
- 最终`npm test`：2,946项通过，0失败、0跳过，退出码0；`.cache/international-crafting-recheck-npm-test.log`。`npm run build`通过，保留既有分包体积提示；`.cache/international-crafting-recheck-build.log`。全量亦覆盖Vue开发转换。
- 国际服现有配置以`--diagnostic-exit-after-interactive --diagnostic-startup-json`启动：实例锁及模块运行态成功，34,111ms到达interactive，正常退出码0；未切服或改用户任务开关。摘要`.cache/international-crafting-recheck-startup-summary.json`，日志`.cache/international-crafting-recheck-startup.log`。
- OpenSpec严格校验与差异空白检查通过。6个测试临时目录及1份启动临时jsonl已移入回收站，正式回归和验证摘要保留；最后仅同步说明及注释，未再改变可执行逻辑。
- 未进行游戏内输入、词库候选激活、打包、安装、提交或外部部署。真实画面、DPI和操作效果留待使用反馈，不将离线文本称为英文画面实测。

---

# 2026-11-15 Review 修复增量验证（上一轮）

本节仅记录已完成的 review 修复及对应专项证据。下方“正常开放与受管汉化验证”为 review 前基线，其中 2,892 项全量通过、构建和启动结果不代表本轮 review 修复后的最终验证。

## 已核对的修复与证据

- Review 2：不再拼接词库中所有含关键字的怪物、技能及场景描述。商店词缀取国际服独立物品目录的英文模式，与当前有效受管条目相交，再对物品词缀、名称及实际物品说明的正负例生成紧凑中英文条件；指定数值仅固定对应参数，物品类别按字段分解，完整性与250字符门槛不变。3.30物品稀有度英文条件同步为Item Rarity。公共压缩算法放入shared，主进程不依赖仅开发环境存在的前端源码。
- 真实已验签66,726条3.30.0b资源仅作为内存离线fixture，未激活：58个商店条件单选均能生成；生命、火抗、30移速分别109／15／80字符，组合206字符，物理伤害单选245字符；全部58个条件的冷查询约3369ms。仓库保留246条真实显示文本及原始sourceHash摘录；行为测试覆盖三语、工艺状态后缀、组合、错误属性、130／20移速、同文歧义、损坏哈希与超长不截断。终结说明中的“生命上限”作为实际负例，不再误匹配最大生命条件。
- 正则最后收尾专项：`node --test test/localizedMerchantSearch.test.js test/localizedCatalogLifecycle.test.js test/localizedFeatureCatalog.test.js test/vendorEnglishRegex.test.js test/vendorRegex.test.js`，20项通过。真实Vue hook和实际IPC源码回归确认：无汉化的none继续英文生成；unavailable首次加载及运行中均阻断，旧映射和迟到响应不可回写。
- Review 3：8条奖励ClientStrings采用独立白名单（稳定ID、英文、sourceHash及参数身份），当前译文仍仅来自活动词库。数量和通货单独解析，覆盖简繁参数顺序、Singular、折行及混合文本；未知、歧义、无效数量、错误来源及失效词库不产生已确认奖励。next-floor独立展示，并将当前路线无法确认兑现写入计算缺口，不误计为本层奖励。
- 圣所专项首轮8文件70项通过；追加0数量边界后4文件32项通过。复核再移除国际服旧英文奖励正则旁路，缺x、0、超限、标点不符与未知Gain奖励均保留缺口；效果观测和finalize共用包含词库revision的scope，换词库强制重读。对应46项及OCR／恢复18项回归全部通过。此为模拟OCR行与控制器回放，不是游戏英文画面实测。
- Review 1：魔法名称按实际匹配跨度排除被更长底材别名完整包含的短底材，修复 Imperial Skean／帝國雙刃匕内含 Skean／雙刃匕造成的假歧义；分离的两个底材、同别名多身份及 Latin 词中子串仍拒绝。共用解析与浮士德采用相同规则。
- 对应专项：`node --test test/magicBaseIdentity.test.js test/localizedPriceCheck.test.js test/localizationDisplayText.test.js test/internationalLocalizationRuntime.test.js test/faustusInternational.test.js test/faustusAutomation.test.js`，33 项通过，0 失败、0 跳过。新增样本来自真实 3.30.0b Dagger7／Dagger21 的英文、繁体和 sourceHash，覆盖大小写、空白与词界；对应文件差异空白检查通过。
- Review 4：制作搜索改为保留原字段再追加可靠别名。真实 LocalizationRuntime／词典遇到 Essence → 精华时，`aliasesFor('精华')` 会返回空列表；旧实现因此丢失来源标签，修复后“精华”来源搜索有结果，英文规范字段及中文效果别名均可搜索。
- Review 5：恢复国际服 attachBag 向背包、仓库取件和君锋镇初始化传入 `restoreEnabled:false`。新增回归执行完整 `installFeatureRuntime.initialize → attachBag → 生产初始化函数` 调用链，仅替换外部存储、事件和输入边界；验证国际服不恢复任务且不改磁盘启用配置，国服仍按保存配置恢复。
- Review 4／5 对应专项：`node --test --test-concurrency=2 test/internationalAutomationStartup.test.js test/internationalLocalizationRuntime.test.js test/craftingDataRepository.test.js test/featureRuntime.test.js`，26 项通过，0 失败。新增测试只使用内存状态，没有新建临时文件或发送游戏输入。
- Review 6：维护文档的 PoB 快照检查补齐 `--lua-root "<现有 PoB 安装目录>\runtime" --check`；`python scripts/generateInternationalPobData.py --help` 确认 `--lua-root` 必填、目录包含 lua51.dll 且不会被修改。未为此执行 PoB GUI、重新生成快照或修改已有运行时。
- 本次文档增量的 `openspec validate add-international-server-mode --strict` 与三个修改文档的 `git diff --check` 通过；最终验证记录补全后仍需核对最终状态。

## 最终验证

- 全部源码收尾后，最终 `npm test`：2,913项通过，0失败、0跳过，退出码0；日志 `.cache/international-review-fixes-npm-test-final.log`。不把前一轮2,908项或中间专项相加为最终总数。
- 最终 `npm run build` 通过，退出码0；保留既有分包体积提示，日志 `.cache/international-review-fixes-build-final.log`。
- 国际服现有配置下，以 `--diagnostic-exit-after-interactive --diagnostic-startup-json` 启动，实例锁成功、模块运行态成功、27,264ms到达interactive，正常退出码0；没有existing_instance拦截，未切服或改启用配置。摘要 `.cache/international-review-fixes-startup-summary.json`，主进程日志 `.cache/international-review-fixes-startup-final.log`。
- 最终OpenSpec严格校验与差异空白检查通过；正式回归fixture保留，内联诊断未创建临时脚本。三轮全量检查遗留的18个client-events临时目录，以及2份本轮启动临时jsonl日志均已移入回收站；验证摘要和日志留在.cache。
- 本轮无游戏内输入、词库候选激活、PoB GUI操作、打包、安装、提交或外部服务部署。圣所next-floor兑现仍明确计算未知，真实画面、DPI与操作效果留待使用反馈。

---

# 2026-11-15 国际服正常开放与受管汉化验证（review 前基线）

## 已通过

- 全量 npm test：2,892 项通过，0 失败、0 跳过。全量发现的7项问题均已修正；包括旧能力断言、模板新增字段、查价关闭状态恢复及圣所空目录OCR兼容。
- 全量之后的核心收尾专项：45 项通过，覆盖受管真实显示文本、准确通货预检、英文魔法底材、词缀名称双语、自定义条件、缓存失效及地图联想；背包/运行时相关77项回归通过。
- npm run build 通过；16个受影响Vue组件的Vite开发转换通过；OpenSpec严格校验与差异空白检查通过。
- 国际服开发版以 --diagnostic-exit-after-interactive --diagnostic-startup-json 正常启动至交互就绪，模块运行态初始化成功，退出码0；本次没有 existing_instance 拦截。最后一轮启动使用国际服已有配置，未更改服务器设置。
- 本地原生汉化helper已重新构建。实际新runtime自测：codec6、data39、bundle26、transaction19，通过；没有应用汉化、发布资源或修改游戏文件。
- 独立PoB 3.30普通/无情快照来源固定为官方提交 f5ca0aeeeeba62d7d2c93b1fbd0704c74d54e7ea；国服3.29源和国际服生成器一致性检查均通过。
- 使用已验签66,726条候选数据作为内存离线fixture检查联想性能，未将候选激活：冷查询约2741ms、重复查询约3ms，结果一致。运行时仍只消费当前已应用且验证有效的资源。

## 行为与实际边界

国际服除海图与做装模拟外的能力正常开放，ready状态表示离线适配，不表示游戏实测。页面、IPC、快捷键、浮窗与服务共用能力；海图制作在可信生成层也拒绝，用户旧预设保留。手动查价不依赖快捷开关。

制作共用英文、简体、繁体及混合识别，保留原文；真实GGG显示标记、属性译名、多行参数、详细词缀头、通货精华预检、自由关键词和Python地图统计均有回归。资源变化或失效会停止旧任务、清查询并刷新联想。

圣所独立目录208条，114项效果可计算，9项与旧规则语义不等价的效果保留识别、明确计算未知；未经映射的圣所中文也保留未知。详情见 docs/international-client-acceptance.md。新增白名单随以后受管资源发布生效，不自动发布词库。

本次未执行游戏内操作或PoB GUI导入，未打包、安装、提交或部署服务。真实画面、DPI、键鼠效果及英文模型视觉覆盖未实测，不将其作为功能禁用门槛。PoB导入需支持3.30的版本。新增测试均为保留的产品回归；诊断采用内联脚本，启动临时日志在结束时移入回收站。

以下保留历史验证记录；旧门禁与范围说明已由上述行为替代。

---

# 2026-11-14 六项英文功能验证

## 已通过

- `npm test`：2,813 项通过，0 失败、0 跳过；默认并发限制为 4。
- 最后追加的通信文件隔离、模式、可信脚本、恢复与启动逻辑专项：35 项通过。
- 受影响页面 Vite 转换与 `npm run build` 通过。
- `openspec validate add-international-server-mode --strict` 通过。
- `git diff --check` 通过；国服制作、地图及可行性数据、中文技能目录和内置高亮模型没有差异。
- 英文制作独立快照：1,044 底材、828 工艺、83 份哈希来源；地图／海图／契约蓝图 131／45／98 条、红兽与首领 51 种；技能 838 条。
- 本次测试留下的 142 个临时目录和 7 份临时日志已移入回收站，验证结论保留在本报告与验收说明。
- 覆盖英文通货与精华预检、数字模板、Atlas Drops／Threads、普通六词与腐化九词、Item Tier、独立占位、模型消费者与发布隔离、前端及 IPC 门禁、可信脚本和非法请求保留已有任务。

## 实际限制与待验收

- 开发版启动进程退出码为 0，但启动日志记录 `instance-lock: stopped / existing_instance`，故不能认定新版主窗口启动成功。已保留正在使用的现有助手实例。
- 用户实际执行制作、地图、存取、战斗和剧情操作，以及英文客户端正则匹配，均未在本轮验证。
- 英文标题与网格截图、取件独立测试会话尚未具备，不把内置模型的旧指标视为英文通过。
- 占位目录严格使用本服可识别名称与真实 3.29.3.6 尺寸交集；602 个未知名称未猜测占位。游戏版本目标与尺寸来源版本分别记录。
- 国际服理论可行性覆盖未知，不使用国服 3.29 的上限判定。完整做装模拟、PoB、圣所、浮士德、游戏内查价捕获和配方自动取件不在本轮开放范围。

开发版验收命令和逐项检查表见 `docs/international-client-acceptance.md`。待测能力默认阻断游戏输入，只有显式开发参数可按功能开启测试；没有打包、安装、训练或执行游戏输入。
