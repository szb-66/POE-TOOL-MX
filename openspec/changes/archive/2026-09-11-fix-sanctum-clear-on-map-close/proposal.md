# Fix: 圣所结果遮罩"关图清空"从未生效

## Why

"推荐下一房位于倒数第二列时，关图后永久清空结果遮罩"的功能在线上从未触发：共享标题检测器（`interface_titles.py`）只对命中的标题输出条目，地图关闭后 `interfaces` 中根本没有 `sanctum-map` 键；JS 侧 `sanctumResultTitle` 把缺键解释为"缺少标题"返回 `null`，而清空分支严格要求 `=== false`，因此该分支在生产环境是不可达的死代码。单元测试通过是因为夹具手工构造了真实 Python 端从不产出的 `{matched: false}` 形状。

## What Changes

- `interface_titles.py` 的 `match_titles` 新增 `report_unmatched=False` 参数：模板有效但未命中且开启该参数时，输出 `{'matched': False}`；模板无效或环境失配时仍不输出（保持"缺少标题不清空"语义）。
- `bag_auto_stash_template.py` 的 `check_titles`（公共检测进程的 `interfaces` 来源）传 `report_unmatched=True`，使圣所地图标题未匹配时可获得明确的负信号；`sanctum_native.py` 不传参，行为不变。
- JS 侧零改动：`sanctumResultTitle` 已按布尔契约实现，现有 `sanctumResultOverlay.test.js` 用例直接对齐真实协议。
- 新增 1 个 Python 驱动测试，锁定 `report_unmatched` 的输出契约。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `shared-game-interface-detection`: "圣所公共标题按需局部检测"需求扩展——公共检测对圣所地图标题在模板有效且未命中时 SHALL 上报明确的 `matched: false`，模板无效或环境失配时不产出该负信号。`sanctum-planning` 的"关图清空"场景规格不变（本变更是实现合规性修复）。

## Impact

- 代码：`src/assets/scripts/interface_titles.py`、`src/assets/scripts/bag_auto_stash_template.py`；测试：`test/` 新增一个用例，现有 `test/sanctumResultOverlay.test.js`、`test/sharedTitleLatency.test.js` 不需改动。
- 行为影响面：`interfaces['sanctum-map']` 可能出现 `{'matched': false}`；现有消费方（`controlOverlay.js` 的 `=== true` 判断、`sanctum_native.py` 的真值判断）不受影响。
- 风险：若个别真实地图仍不关图，需检查持久化的 `savedOverlay.clearOnMapClose` 是否为 `false`（八列/出口确认守卫未通过），属另一层问题，不在本变更范围。
