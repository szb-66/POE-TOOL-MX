import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('做装页面以选择底材、手动通货、装备变化和三级目录为主流程', async () => {
  const [router, sidebar, view] = await Promise.all([
    readFile('src/router/index.js', 'utf8'),
    readFile('src/components/Layout/Sidebar.vue', 'utf8'),
    readFile('src/domains/crafting/CraftPlannerView.vue', 'utf8')
  ])
  assert.match(router, /path: '\/craft-planner'/)
  assert.match(sidebar, /index="\/craft-planner"/)
  for (const label of ['更新 POEDB 数据', '选择底材', '当前装备', '手动使用通货', '制作历史', '词缀目录', '价格数据已停用']) {
    assert.match(view, new RegExp(label))
  }
  assert.match(view, /el-cascader/)
  assert.doesNotMatch(view, /getPrices|refreshPrices|startPlan|推荐路径|价格与覆盖/)
  assert.doesNotMatch(view, /<img/)
  assert.match(view, /store\.applyCurrency\(currency\.id\)/)
  assert.match(view, /currency\.description/)
  assert.match(view, /currency\.requirements/)
  assert.match(view, /currency\.consequences/)
  assert.match(view, /currency\.unavailableReason/)
  for (const text of ['displayedBaseStats', 'baseDefencePercentile', '基础防御百分比', 'baseDefenceChange', 'formatBaseDefences', 'requirementText', 'socketRows', 'baseImplicits', 'probabilityModel', '社区经验值', 'qualityChange', 'socketChange', 'linkChange', 'implicitChange']) assert.match(view, new RegExp(text))
  for (const label of ['破溃宝珠', '破裂锁定', 'fractured-badge']) assert.match(view, new RegExp(label))
  assert.match(view, /store\.applyEssence\(essence\.id\)/)
  assert.match(view, /essence\.guaranteedModifier\.text/)
  assert.match(view, /essence\.randomModifierLevelCap/)
  assert.match(view, /精华保证/)
  assert.match(view, /store\.applyBenchCraft\(craft\.id\)/)
  for (const label of ['工艺台', '普通工艺', '元工艺', '移除动作', '额外 1 重铸石', '解锁']) assert.match(view, new RegExp(label))
  assert.match(view, /craft\.unavailableReason/)
  assert.match(view, /store\.applyFossils/)
  for (const label of ['化石', '混乱共振器', '空孔', '纠缠揭示', '分裂化石生成副本']) assert.match(view, new RegExp(label))
  assert.match(view, /store\.applyHarvestCraft\(craft\.id\)/)
  for (const label of ['花园', '仅可执行', '当前候选', '同类倾向重铸', '品质效果']) assert.match(view, new RegExp(label))
  assert.match(view, /store\.applyEldritchCraft\(craft\.id\)/)
  for (const label of ['古灵', '焊界者', '灭界者', '当前：', '估计升级概率', '元工艺边界']) assert.match(view, new RegExp(label))
  assert.match(view, /store\.applyInfluenceCraft\(craft\.id\)/)
  assert.match(view, /store\.configureAwakenerDonor/)
  for (const label of ['势力', '六种势力崇高石', '统御宝珠', '觉醒者之石', '供体配置', '供体已销毁', 'ModGroup 冲突丢弃']) assert.match(view, new RegExp(label))
  assert.match(view, /store\.applyVeiledCraft\(craft\.id\)/)
  assert.match(view, /store\.selectVeiledOption\(option\.modifierId, option\.tierId\)/)
  for (const label of ['加密', '加密崇高石', '加密混沌石', '未揭露', '揭露三选一', '候选结果', '单项权重']) assert.match(view, new RegExp(label))
  assert.match(view, /store\.applyBeastcraft\(craft\.id/)
  assert.match(view, /store\.selectSplitResult\(result\.itemId\)/)
  for (const label of ['野兽', '主野兽等级', '希内科拉预览', '选择一件分裂产物', '有拓印', '预见中']) assert.match(view, new RegExp(label))
  assert.match(view, /record\.event\.costs/)
  assert.match(view, /affix\.rolledText/)
  assert.match(view, /affix\.tierName/)
  assert.match(view, /store\.undo/)
  assert.match(view, /store\.redo/)
  assert.match(view, /store\.reset/)
  assert.match(view, /family\.subitemCount/)
  assert.match(view, /family\.availableCount/)
  assert.match(view, /family\.totalWeight/)
  assert.match(view, /family\.displayTags/)
  assert.match(view, /familyChecked\(family\)/)
  assert.match(view, /familyIndeterminate\(family\)/)
  assert.match(view, /toggleFamily\(family/)
  assert.match(view, /toggleTier\(row/)
  for (const label of ['已选目标', '仅供手动制作对照', '清空全部', '移除已选目标']) assert.match(view, new RegExp(label))
  for (const behavior of ['selectedTierSnapshots', 'selectedTargets', 'tierSelectionKey', 'toggleFamilySelection', 'toggleTierSelection', 'removeSelectedTarget', 'openSelectedTarget', 'clearSelectedTargets']) assert.match(view, new RegExp(behavior))
  assert.match(view, /clearSelectedTargets\(\); selectedFossilIds/)
  assert.doesNotMatch(view, /selectedTierIds|availableTierIds/)
  for (const label of ['T级', '名称', '出现等级', '具体效果', '标签', '单项权重']) assert.match(view, new RegExp(label))
  assert.ok(view.indexOf('1. 选择底材') < view.indexOf('2. 当前装备'))
  assert.ok(view.indexOf('2. 当前装备') < view.indexOf('3. 手动使用通货'))
  assert.ok(view.indexOf('3. 手动使用通货') < view.indexOf('4. 词缀目录'))
})

test('preload 暴露具名手动做装与三级目录接口并保留兼容接口', async () => {
  const preload = await readFile('electron/preload.cjs', 'utf8')
  const api = await readFile('src/api/electron.js', 'utf8')
  const store = await readFile('src/domains/crafting/craftingStore.js', 'utf8')
  for (const name of ['getCraftingStatus', 'searchCraftingBases', 'searchCraftingModifierCatalog', 'createManualCraftingSession', 'applyManualCraftingCurrency', 'listManualCraftingEssences', 'applyManualCraftingEssence', 'listManualCraftingBenchCrafts', 'applyManualCraftingBenchCraft', 'listManualCraftingFossils', 'applyManualCraftingFossils', 'listManualCraftingHarvestCrafts', 'applyManualCraftingHarvestCraft', 'listManualCraftingEldritchCrafts', 'applyManualCraftingEldritchCraft', 'listManualCraftingInfluenceCrafts', 'listAwakenerDonorCandidates', 'configureAwakenerDonor', 'clearAwakenerDonor', 'applyManualCraftingInfluenceCraft', 'listManualCraftingVeiledCrafts', 'applyManualCraftingVeiledCraft', 'selectManualCraftingVeiledOption', 'listManualCraftingBeastcrafts', 'applyManualCraftingBeastcraft', 'selectManualCraftingSplitResult', 'previewManualCraftingCurrency', 'undoManualCraftingAction', 'redoManualCraftingAction', 'resetManualCraftingSession']) {
    assert.match(preload, new RegExp(name))
  }
  assert.match(api, /crafting:\s*\{/)
  assert.match(api, /仅 Electron 客户端支持手动做装/)
  assert.match(store, /const eldritch = ref/)
  assert.match(store, /applyManualEldritchCraft/)
  assert.match(store, /listManualEldritchCrafts/)
  assert.match(store, /const influence = ref/)
  assert.match(store, /listManualInfluenceCrafts/)
  assert.match(store, /applyManualInfluenceCraft/)
  assert.match(store, /listAwakenerDonorCandidates/)
  assert.match(store, /configureAwakenerDonor/)
  assert.match(store, /const veiled = ref/)
  assert.match(store, /listManualVeiledCrafts/)
  assert.match(store, /applyManualVeiledCraft/)
  assert.match(store, /selectManualVeiledOption/)
  assert.match(store, /const beastcraft = ref/)
  assert.match(store, /listManualBeastcrafts/)
  assert.match(store, /applyManualBeastcraft/)
  assert.match(store, /selectManualSplitResult/)
})

test('帮助页声明数据来源、限制、OCR 风险和非商业用途', async () => {
  const help = await readFile('src/views/Help.vue', 'utf8')
  for (const text of ['POEDB', 'poecurrency.top', 'OCR', '手动模拟器不再读取', '个人、非商业']) assert.match(help, new RegExp(text))
})

test('做装页与帮助页公开 S30 花园变化及赛季专属通货边界', async () => {
  const help = await readFile('src/views/Help.vue', 'utf8')
  const view = await readFile('src/domains/crafting/CraftPlannerView.vue', 'utf8')
  for (const text of ['憎恨结晶参与 12 条配方', '5 条保证标签重铸', '6 条元素伤害转换', 'S30 特殊通货边界', '无常瓦尔宝珠', '占卜球', '雾隐水晶', '永火纪念币', '传奇状态模型']) assert.match(help, new RegExp(text))
  for (const text of ['POE1 3.29', '74 条花园配方', '憎恨结晶关联 11 条装备工艺', '1 条宝石转换']) assert.match(view, new RegExp(text))
})

test('帮助页公开基础通货作用、生效条件和支持边界', async () => {
  const help = await readFile('src/views/Help.vue', 'utf8')
  for (const text of ['磨刀石', '护甲片', '珠宝匠石', '幻色石', '链接石', '祝福石', '束缚石', 'poe1-3.29-community-v1', '蜕变石', '改造石', '增幅石', '富豪石', '点金石', '混沌石', '重铸石', '崇高石', '剥离石', '神圣石', '破溃宝珠', '至少有 4 条', '忽略全部元工艺', '禁用原因', '不执行近似结果']) assert.match(help, new RegExp(text))
})

test('装备卡与帮助页公开圣玉和共享基础防御百分比边界', async () => {
  const help = await readFile('src/views/Help.vue', 'utf8')
  const view = await readFile('src/domains/crafting/CraftPlannerView.vue', 'utf8')
  for (const text of ['圣玉', '基础防御百分比', '护甲、闪避值、能量护盾和结界共享', '不会改变普通品质', '神圣石重骰的是显式词缀数值']) assert.match(help, new RegExp(text))
  for (const text of ['baseDefencePercentile', '基础防御百分比', 'baseDefenceChange', 'formatBaseDefences']) assert.match(view, new RegExp(text))
})

test('装备卡与帮助页公开卡兰德之镜的原件、副本和不可修改语义', async () => {
  const help = await readFile('src/views/Help.vue', 'utf8')
  const view = await readFile('src/domains/crafting/CraftPlannerView.vue', 'utf8')
  for (const text of ['卡兰德之镜', '原件完全不变', '镜像副本', '不能再次复制', 'Reflective Oil']) assert.match(help, new RegExp(text))
  for (const text of ['createdMirrorItem', '原件未改变', '生成镜像副本', 'state-badge mirrored', 'mirror-result']) assert.match(view, new RegExp(text))
})

test('装备卡与帮助页公开附魔标记、移除动作和三重铸石成本边界', async () => {
  const help = await readFile('src/views/Help.vue', 'utf8')
  const view = await readFile('src/domains/crafting/CraftPlannerView.vue', 'utf8')
  for (const text of ['附魔与移除', '移除附魔', '3 枚重铸石', '腐化装备允许', '镜像装备不能', '回火石与裁缝石']) assert.match(help, new RegExp(text))
  for (const text of ['state-badge enchanted', '已附魔', 'removedEnchantment', '已移除附魔', 'remove-enchantment', 'defaultQualityActive']) assert.match(view, new RegExp(text))
})

test('帮助页和装备卡公开 3.29 催化剂类型、派生值与概率边界', async () => {
  const help = await readFile('src/views/Help.vue', 'utf8')
  const view = await readFile('src/domains/crafting/CraftPlannerView.vue', 'utf8')
  for (const text of ['首饰催化剂规则', '13 种催化剂', '左旋', '右旋', '污秽催化剂', '1–20%', '向下取整', '自 3.15 起', '不会消耗品质']) assert.match(help, new RegExp(text))
  for (const text of ['catalystQualityLabel', 'displayedBaseImplicits', 'displayedPrefixes', 'displayedSuffixes', 'catalystQualityChange']) assert.match(view, new RegExp(text))
})

test('装备卡与帮助页公开瓦尔四结果、真实隐式和未支持边界', async () => {
  const help = await readFile('src/views/Help.vue', 'utf8')
  const view = await readFile('src/domains/crafting/CraftPlannerView.vue', 'utf8')
  for (const text of ['瓦尔宝珠与装备腐化', '腐化隐式', '白色插槽', '稀有重铸', '1/144', '珠宝具有专属']) assert.match(help, new RegExp(text))
  for (const text of ['displayedVaalImplicit', 'corruptionOutcomeLabel', 'corruptionReplacedImplicit', 'vaalOutcomeLabel']) assert.match(view, new RegExp(text))
})

test('帮助页公开精华阶级、重铸和元工艺限制', async () => {
  const help = await readFile('src/views/Help.vue', 'utf8')
  for (const text of ['精华制作规则', 'T1 低语', 'T4 哀嚎', 'T5 咆哮', 'T8 特殊精华', '元工艺', '保证一条特殊词缀']) assert.match(help, new RegExp(text))
  assert.doesNotMatch(help, /精华、化石、隐匿、腐化/)
})

test('帮助页公开工艺替换、移除、占位和多大师上限', async () => {
  const help = await readFile('src/views/Help.vue', 'utf8')
  const view = await readFile('src/domains/crafting/CraftPlannerView.vue', 'utf8')
  for (const text of ['工艺台与元工艺规则', '唯一工艺替换', '额外一枚重铸石', '移除工艺词缀', '前缀无法被变更', '后缀无法被变更', '最多 3 个工艺词缀', '自身计入三条上限']) assert.match(help, new RegExp(text))
  assert.match(view, /currentAffixLimit\('prefix'\)/)
  assert.match(view, /尚未进行制作/)
})

test('帮助页公开化石乘数、共振器限制与特殊化石边界', async () => {
  const view = await readFile('src/domains/crafting/CraftPlannerView.vue', 'utf8')
  const help = await readFile('src/views/Help.vue', 'utf8')
  for (const text of ['fossil.candidateCount', 'record.event.corruptedImplicit', '腐化固定词缀：']) assert.match(view, new RegExp(text))
  for (const text of ['化石与共振器制作规则', '1–4 个孔', '乘 10', '乘 0.15', '五彩化石', '棱面', '镂空', '雕刻', '圣洁化石', '纠缠化石', '分裂化石', '随机破裂一条显式词缀', '镶金化石', '溅血化石', '腐化固定词缀自身权重', '当前活动规则为 POE1 3.29']) assert.match(help, new RegExp(text))
})

test('帮助页公开花园当前配方、元工艺、转换与安全禁用边界', async () => {
  const help = await readFile('src/views/Help.vue', 'utf8')
  for (const text of ['花园工艺规则', '全部 74 条', '共 16 种标签', '自 3.27 起', '乘 0.1', '3.29', '已移除追忆物品工艺', '移除并添加', '随机势力', '品质效果', '追忆固定词缀', '不伪造结果']) assert.match(help, new RegExp(text))
  assert.doesNotMatch(help, /花园、野兽、腐化/)
})

test('帮助页公开古灵支配、元工艺矩阵和冲突石估计边界', async () => {
  const help = await readFile('src/views/Help.vue', 'utf8')
  for (const text of ['古灵隐式与支配通货规则', '古灵混沌石', '古灵崇高石', '古灵无效石', '冲突石', 'T1 被降阶', 'T6 被选中', '社区实测估计', '不是官方']) assert.match(help, new RegExp(text))
})

test('帮助页公开六势力崇高、尊崇升级与觉醒供体销毁规则', async () => {
  const help = await readFile('src/views/Help.vue', 'utf8')
  for (const text of ['六大势力与尊崇制作规则', '塑界者', '裂界者', '圣战者', '救赎者', '狩猎者', '督军', '六种势力崇高石', '统御宝珠', '尊崇 T1', '觉醒者之石', '供体被销毁', 'ModGroup 冲突', '撤销并恢复']) assert.match(help, new RegExp(text))
})

test('帮助页公开加密通货、占位、三选一与阻断边界', async () => {
  const help = await readFile('src/views/Help.vue', 'utf8')
  for (const text of ['加密制作与揭露规则', '加密崇高石', '加密混沌石', '未揭露词缀', '三选一揭露', 'ModGroup 阻断', '无法骰出攻击/施法', '签名加密词缀']) assert.match(help, new RegExp(text))
})

test('帮助页公开 3.29 野兽增删、魔符破裂、拓印与预见边界', async () => {
  const help = await readFile('src/views/Help.vue', 'utf8')
  for (const text of ['3.29 装备野兽工艺规则', '主野兽等级', '加前删后', '随机元工艺', '猫、鸟、蟹、蛛之势', '魔符破裂', '已移除二分 / 三分', '拓印', '希内科拉之锁', '综合隐式重骰']) assert.match(help, new RegExp(text))
})
