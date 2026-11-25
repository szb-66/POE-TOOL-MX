# Tasks

## 1. 声明式高价值预选规则引擎

- [x] 1.1 新增 `electron/modules/priceCheck/autoSelectRules.js`，基于稳定英文 `ref`、物品大类 `category`、词缀来源与数值阈值定义白名单规则表、部位综合阈值、聚合属性阈值与局部吸收映射、特色底材表、特殊品类（传奇变体/腐化基底/法师之血、星团大天赋、普通与深渊珠宝、药剂/酊剂、忆境与双王基底）规则，并通过脚本或单测验证规则表中全部精确 `ref` 均真实存在于国服与国际服目录
- [x] 1.2 新增 `electron/modules/priceCheck/autoSelect.js`，实现 `applyAutoSelection(model, options)` 管线（模式分流、底材 `nameEnabled` 智能判定、聚合属性与局部词缀吸收、综合词缀部位门槛与分裂保护、优先级评分与上限截断、星团天赋数精确上下限及 `autoSelection` 元数据标注），并编写 `test/priceCheckAutoSelection.test.js` 覆盖全品类与边界场景并通过 `node --test test/priceCheckAutoSelection.test.js`

## 2. 查价模型与状态过滤集成

- [x] 2.1 更新 `shared/priceCheckMetadata.js` 中 `createPriceCheckStateFilters`，保留高价值结构状态（未鉴定/忆境/分裂之物/分裂/秽生/复制及适用腐化）默认初始化，放宽 `crafted`、`searing`、`tangled`、`veiled` 及无腐化基底的普通黄装 `corrupted` 默认为 `any`，并保持 `sanitizePriceCheckStateFilters` 与旧布尔模型迁移兼容
- [x] 2.2 更新 `electron/modules/priceCheck/query.js` 与 `electron/modules/priceCheck/pseudo.js`：将 `createPriceCheckModel` 接入 `applyAutoSelection`，在 `stat` 中保留 `sourceSubtype` 供预选与清理链路识别，支持普通低物等单势力黄装放宽默认经典势力勾选，并在 `sanitizePriceCheckModel` 中安全保留可选 `autoSelection` 元数据且确保 `buildOfficialTradeQuery` 不提交该元数据；同步更新受新默认策略影响的既有测试（`test/priceCheckPseudoAndState.test.js`、`test/priceCheckInfluenceMemory.test.js`、`test/clusterJewelPriceCheck.test.js`、`test/priceCheck.test.js` 等）并运行全部查价相关 `node --test` 通过

## 3. 浮窗可解释性与快捷操作 UI

- [x] 3.1 更新 `src/domains/priceCheck/PriceCheckOverlayView.vue`：保持现有紧凑布局与词缀顺序，为属性与词缀行补充轻量 tooltip（合并来源文本与 `autoSelection.reason`），并在词缀区标题旁新增仅作用于当前物品的“恢复自动”与“清空”快捷按钮；验证组件逻辑与 Vite 开发转换无错误
- [x] 3.2 补充浮窗预览或组件行为测试覆盖 tooltip 文案构造及“恢复自动 / 清空”快捷操作（不改动全局设置、不自动发查询），并验证 `node --test test/priceCheckPreview.test.js` 通过

## 4. 整体验证与 OpenSpec 校验

- [x] 4.1 运行全部受影响测试、完整 `npm test`、Vite 构建/转换检查与 `openspec validate upgrade-price-check-auto-selection --strict`，确认零报错、零回归
