# Design: 查价器高价值智能预选引擎

## Context

详见 [proposal.md](./proposal.md) 中的动机说明。当前查价模型构建集中在 `electron/modules/priceCheck/query.js`，综合词缀计算在 `electron/modules/priceCheck/pseudo.js` 与 `pseudoRules.js`，状态过滤初始化在 `shared/priceCheckMetadata.js`，浮窗 UI 在 `src/domains/priceCheck/PriceCheckOverlayView.vue`。

项目同时支持国服（简体中文 `catalog.json`）与国际服（英文/简繁本地化 `catalog.international.json`），目录中每条官方 stat 均带有独立于语言的稳定英文 `refs` 数组；物品解析器 `electron/modules/item/parser.js` 已输出 `category`、`rarity`、`tier`、`tags`、`sourceSubtype`（`foulborn` / `corrupted` / `searing-exarch` / `eater-of-worlds` / `enchant`）、`influences` 及武器/防具/宝石/地图/海图/星团等结构化属性。

## Goals / Non-Goals

**Goals:**
- 建立纯本地、声明式、零网络依赖的智能预选引擎，作为 `initialSelection = 'auto'` 的唯一决策层。
- 所有规则基于稳定英文 `ref`、官方大类 `category`、稀有度、词缀来源/类型、`tier` 与数值门槛，确保国服与国际服行为完全一致且易于回归测试。
- 解决四大核心痛点：低价值 T1/T2 误选、高价值无阶/特殊品类词缀与聚合属性漏选、综合词缀无门槛与误吞分裂词缀、稀有底材与低价值状态过窄过滤。
- 为每条属性与词缀提供轻量只读 `autoSelection` 元数据，用于浮窗 tooltip 解释与“恢复自动 / 清空”快捷操作，但不污染官方交易请求结构。

**Non-Goals:**
- 不引入外部动态估价接口（如 poe.ninja / poeprices.info）或远端热更新规则。
- 不改变 `initialSelection` 现有的 `auto / all / none` 三档配置枚举，不增加用户自定义规则管理页面。
- 不自动下浮普通词缀或属性的默认值（严格遵守原值不下浮原则，仅对星团天赋数等极少数精确语义项补充 `max = 原值`）。
- 不改变地图、海图、先祖秘藏日志、佣兵凭证、内脏及未鉴定传奇候选解析的既有专属流程。

## Decisions

### Decision 1: 独立声明式规则与评估引擎（`autoSelectRules.js` + `autoSelect.js`）
- **方案**：在 `electron/modules/priceCheck/` 下新增 `autoSelectRules.js`（纯声明式数据：部位阈值表、高价值词缀规则集、局部吸收集合、特殊品类/传奇/底材白名单）与 `autoSelect.js`（纯函数评估管线 `applyAutoSelection(model, options)`）。
- **理由**：将复杂且会随赛季演进的预选逻辑从 1100+ 行的 `query.js` 解耦；规则以英文 `ref` 精确匹配 + 少量受控前缀/正则（如星团大天赋 `^1 Added Passive Skill is `、禁断珠宝 `if you have the matching modifier on Forbidden (?:Flesh|Flame)$`、守望之眼 `while affected by `、巨光谱 `per Grand Spectrum$`）表达，避免硬编码中文文案导致国际服失效。
- **备选方案**：在 `query.js` 内直接堆叠 `if/else` 分支 → 难以维护、难以单独单测和审计。

### Decision 2: 两阶段评估管线（聚合吸收 → 优先级评分与上限截断）
`createPriceCheckModel` 完成原始词缀映射、属性收集、综合词缀计算和势力条件生成后，统一进入 `applyAutoSelection(model, options)`：
1. **模式分流**：
   - `all`：保留全选词缀语义，不执行白名单裁剪，但仍记录元数据方便 UI“恢复自动”按需使用。
   - `none`：保持词缀全不选（尊重既有日志/星团/普通装备的 `none` 规格，仅保留回忆束丝、地图阶级、海图默认属性等既有必选结构属性）。
   - `auto`：执行完整智能预选管线。
2. **底材（`identity.nameEnabled`）判定**：
   - 不可取消大类、传奇、通货、命运卡、宝石、地图、海图、日志、内脏、佣兵凭证、星团珠宝、普通/魔法装备：默认 `true`。
   - 普通稀有装备（`armour.*`、`weapon.*`、`accessory.*`、`jewel`、`jewel.abyss`）：默认 `false`（按大类查询），除非命中**高价值特色底材表**（如冥河腰带 / Stygian Vise、双玉/紫晶/蛋白石/朱砂/蓝晶等特色底材，支持中英文底材名匹配）。
3. **聚合属性预选与局部词缀抑制**：
   - **硬通货结构属性**（高优先级、不计入普通词缀上限）：6L（`links >= 6`）、高等级/高品质宝石（普通/改造宝石 `gemLevel >= 20 || quality >= 20`，觉醒宝石 `gemLevel >= 5 || quality >= 20`）、高物等做装底材（普通/魔法装备 `ilvl >= 84`、星团珠宝 `ilvl >= 84`）、回忆束丝、地图/海图/日志既有默认属性。
   - **武器高 DPS**：按单手/双手武器大类设定 `pdps` / `edps` 阈值（例如单手武器 `pdps >= 320` / `edps >= 400`，双手/弓 `pdps >= 520` / `edps >= 700`）；启用 `pdps` 时标记抑制局部物理伤害词缀，启用 `edps` 时标记抑制局部元素点伤词缀。
   - **防具高三防**：按胸甲/头盔/手套/鞋子/盾牌部位设定 `armour`、`evasion`、`energyShield` 阈值（例如胸甲 ES ≥ 450、护甲/闪避 ≥ 1500；头/手/鞋 ES ≥ 200、护甲/闪避 ≥ 650；盾 ES ≥ 250、护甲/闪避 ≥ 1000）；启用对应防御属性时标记抑制对应局部防御词缀。
4. **综合词缀（Pseudo）阈值与分裂保护**：
   - 维持 `pseudo.js` 负责数值汇总与替换组，将 `auto` 模式下的“是否默认勾选”决策统一交由 `autoSelect.js`（`pseudo.js` 仅作为默认基础生成，避免规则分散在两处）。
   - 按部位设定综合门槛（如胸甲总生命 ≥ 90、头/手/鞋/腰带 ≥ 70、戒指/项链 ≥ 55；总元素抗性 ≥ 70%，单部位饰品/腰带 ≥ 65%；总混沌抗性 ≥ 25%；鞋子移速 ≥ 25%；单属性 ≥ 45 或全属性 ≥ 25；全域暴伤 ≥ 25%；攻施速 ≥ 10%；攻击元素伤 ≥ 30%；饰品/珠宝总 ES ≥ 35）。
   - 纯工艺来源构成的综合项不自动勾选。
   - 若某条综合项的来源包含高价值 `fractured` 或 `foulborn` 词缀，保留该特殊来源词缀本身为启用状态，不自动启用对应普通综合项覆盖它（若仍有其他强来源，由特殊来源优先）。
5. **词缀候选评分与上限截断**：
   - **必选层（不占普通截断名额或最高优先级）**：秽生词缀、日志词缀、地图/海图/内脏基底、星团附魔与大天赋（同时为 `Adds # Passive Skills` 设 `min = max = value`）、忆境基底、传奇腐化基底、变体型传奇核心随机词缀、法师之血药剂数、高价值分裂词缀、高价值势力底材的经典势力。
   - **普通高价值白名单层**：按部位/通用/珠宝/深渊珠宝/药剂/酊剂/双王基底白名单打分（区分核心 T1/T2 与无阶稀有词缀，如 +1/+2 技能等级、法压、额外箭矢、额外诅咒、保留效能、持续伤害加成、暴击伤害加成、冷却回复、非引导减耗、击中/暴击充能等）。
   - **上限截断**：普通稀有装备对“非必选普通高价值词缀 + 综合项”设置清晰上限（最多 4 项），超限时按分数从高到低保留，其余标记 `reason: '超过自动预选上限'`。

### Decision 3: 状态过滤默认值与可信清理兼容
- **方案**：`createPriceCheckStateFilters(facts, context)` 增加可选 `context`（包含 `rarity`、`category`、`hasCorruptedImplicit` 等）。
  - 始终保持高价值结构状态为 `'true'`：`mirrored`、`fractured`、`split`、`mutated`、`synthesised`；未鉴定时 `identified: 'false'`。
  - `crafted`、`searing`、`tangled`、`veiled` 默认初始化为 `'any'`（`facts` 仍忠实保留 `true`，且用户手动选 `'true'`/`'false'` 完全生效）。
  - `corrupted`：当物品为传奇、宝石、地图/海图、存在腐化基底（`hasCorruptedImplicit`）或未传入 `context`（保持旧调用/旧模型兼容）时初始化为 `'true'`；当明确是普通稀有装备且没有腐化基底时初始化为 `'any'`。
- **理由**：彻底消除工艺词缀和低阶双王灰烬造成的大量 0 结果，同时不破坏任何已有三态手动编辑能力或旧模型迁移测试。

### Decision 4: 浮窗轻量化元数据与快捷操作
- **方案**：
  - 每条 `property` 和 `stat` 可携带可选 `autoSelection: { enabled: boolean, reason: string }`（纯展示与复位用途，`sanitizePriceCheckModel` 透传清理，`buildOfficialTradeQuery` 完全忽略）。
  - `PriceCheckOverlayView.vue`：
    - 属性行与词缀行的 `title` 结合来源文本与 `autoSelection.reason` 展示轻量 tooltip；
    - 词缀区 `<h3>` 右侧新增紧凑按钮“恢复自动”与“清空”，仅修改当前 `state.model.stats` 的 `enabled`（不触发搜索、不改全局设置）。
    - 手动消歧（`resolveStatCandidate`）后 `refreshPseudoStats` 沿用现有逻辑，不覆写用户已手动编辑过的勾选状态。

## Risks / Trade-offs

- [部分历史单元测试断言了旧默认行为（如普通黄装默认勾选底材、工艺/焚界默认 `stateFilters='true'`、低数值总抗/总生命默认勾选、任意 T1/T2 默认勾选）] → 在实现阶段系统梳理并更新与新规格冲突的历史测试断言，同时保留所有协议安全性、查询构造与手动覆盖测试不放松。
- [英文 `ref` 白名单可能存在冷门词缀漏覆盖] → 规则结构声明式集中管理，并编写目录 ref 校验测试确认规则表中引用的精确 `ref` 均真实存在于 `catalog.json` / `catalog.international.json`，避免拼写错误导致规则静默失效。
- [稀有装备默认取消具体底材可能被误认为无法查底材] → 浮窗名称行保持常驻可见，一键点击即可切回具体底材，且白/蓝底材与特色高价值底材仍默认勾选。
