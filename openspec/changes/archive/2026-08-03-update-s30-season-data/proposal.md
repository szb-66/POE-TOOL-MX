## Why

国服已经进入 S30（POE1 3.29“永火之咒”），但应用内置做装、技能宝石、传奇物品和帮助文档仍标记并依赖 3.28 Mirage 快照。继续使用旧快照会遗漏新物品与新宝石，也可能把已变更或移除的数据用于做装、剧情技能选择、传奇识别和离线降级。

## What Changes

- 将做装、技能宝石和中文传奇物品的版本化原始快照从 3.28 独立升级到 3.29，并重新生成经过完整校验的内置目录。
- 将做装规则集、版本展示、帮助说明和数据哨兵调整为 S30 / POE1 3.29 的实际规则与来源统计；不再把 Mirage 专属内容误报为当前赛季能力。
- 核对国服交易目录、认证赛季列表和仓库接口在 S30 标识下的兼容性；在线目录继续以腾讯官方接口为准，离线目录保持安全降级。
- 更新国服 Vendor 离线数据的版本元数据，并验证现有中文搜索表达式在 S30 客户端文本下仍然有效。
- 增加当前版本、快照隔离、关键新数据和旧赛季残留检查，确保以后的赛季升级不会只改展示文本。

## Capabilities

### New Capabilities

- `season-data-baseline`: 定义应用各离线/在线数据源必须共同指向当前国服赛季、保留旧版本快照并通过一致性审计后才能发布的跨目录基线。

### Modified Capabilities

- `crafting-data-catalog`: 当前补丁原始快照、做装目录、规则集和版本提示从 3.28 Mirage 更新为 S30 / POE1 3.29，并对新旧内容执行安全边界校验。
- `skill-gem-catalog`: 当前维护版本更新为 3.29，目录必须包含 S30 新增宝石且保留原有完整性哨兵。
- `cn-unique-item-snapshot`: 当前维护版本更新为 3.29，目录必须包含 S30 新增传奇并保持图片与身份完整性。
- `cn-trade-catalog`: S30 启动时必须验证腾讯官方交易元数据可加载，并让内置目录的版本状态准确反映其离线降级用途。
- `vendor-regex-shop`: 内置国服 Vendor 数据版本更新为 S30，并以当前客户端中文文本验证表达式。
- `manual-beastcrafting`: 按 3.29 移除旧二分/三分执行入口，新的魔符破裂配方因缺少魔符模型而准确禁用。
- `fossil-crafting`: 按 3.29 将分裂化石改为重铸后随机破裂一条显式词缀，不再创建 Split 副本。

## Impact

受影响范围包括 `scripts/generateCraftingData.js`、`scripts/generateSkillGemData.js`、`scripts/generateUniqueItemSnapshot.js`，`electron/assets/*` 版本化原始与规范化数据，做装规则模块、查价目录与国服接口客户端、Vendor 数据、帮助页、相关 OpenSpec 主规格和测试。更新过程会联网读取 POEDB 与腾讯国服公开接口；应用运行时仍不请求 POEDB，旧 3.28 原始快照不会被覆盖。
