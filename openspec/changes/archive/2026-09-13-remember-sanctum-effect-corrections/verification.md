# 验证记录

日期：2026-09-13。开发环境验证，未打包。保留了工作区原有改动。

## 行为回归

`test/sanctumEffectMemory.test.js` 覆盖精确全半角与空白归一、数字与标点区别、同名变体边界、换行变动、重复分散来源、跨轮次与重启、替换和忽略、修改与删除、取消无副作用、仅本次、额外添加、过期版本、伪造来源、采集失败、历史隔离、一次性旧记录迁移、词库失效，以及来源截图跨重读和实际 resetRun 保留。

相关测试：`node --test --test-concurrency=2 test/sanctumEffectMemory.test.js test/sanctumEffectCorrection.test.js test/sanctumEvidence.test.js test/sanctumEffectRecognition.test.js test/sanctumStatusRewards.test.js`，41/41 通过。

首次全量：`npm test -- --test-concurrency=4`，2607 通过、1 失败、2 跳过。失败项为未改动的 `craftingCurrencyUsage.test.js` 中“旧 iteration 快速覆盖回放只能观察到最终快照”：300ms 防抖回调尚未完成就执行了固定 700ms 等待后的断言；输出记录实际数组稍后已变为 `[20]`。单独运行该文件 7/7 通过，没有为本任务修改该测试或其产品实现。

降低并发后全量：`npm test -- --test-concurrency=2`，2611 通过、0 失败、2 跳过。补齐原始来源保留与变体边界后，对最终源码再次全量运行，同样 2611 通过、0 失败、2 跳过，共 2613 项，约 345 秒；包含最终 Vue 开发转换。

## 开发版交互

使用现有 Vite 开发服务器加载真实 `SanctumRunObservation`、`SanctumEffectReview`、`SanctumEffectRules` 和 Pinia store。通过临时本机 HTTP 适配调用真实 SanctumService 与独立临时 SanctumRepository；合成 OCR 明确标注为测试数据，无游戏输入，也不访问用户实际存档。

- 正常效果保留核对入口，未知卡片仅显示未解决文字，没有“已纳入”说明。
- 核对弹窗显示原始 OCR 和缺图原因；默认勾选记忆。搜索并选择“全知之眼”后，当前卡片更新，规则数从 0 到 1。
- 模拟跨楼层改变词条顺序和数量，同一错误自动替换，保持 1 条规则。
- 管理列表可按原文和效果名称搜索，将替换改为忽略，版本从 1 到 2，当前效果同步消失。
- 搜索“刺客之刃”展示 10 个带完整数字描述的变体；取消修改后版本及忽略动作保持不变。
- 重新创建服务并从本地仓库恢复，规则仍存在，界面标记历史来源。在历史状态删除规则，历史效果不改变；下次识别恢复待核对。
- 取消勾选记忆后应用忽略，当前问题消失但规则数仍为 0；已忽略文字再次打开仍可编辑。弹窗重读后问题重新出现。
- 无来源额外添加显示仅本次说明；应用后效果添加，原未知问题仍提示，记忆数不变。
- 页面、临时适配服务和临时存档已清理。复选框的浏览器 setChecked 操作曾超时，改用可见标签点击后确认选中值变化；不是产品功能失败。

截图来源绑定、拒绝其他目标或整屏代替浮窗，以及持久化原图由真实证据存储回归验证；没有执行新的实机游戏采集。

## OpenSpec

`openspec validate remember-sanctum-effect-corrections --strict` 通过。
