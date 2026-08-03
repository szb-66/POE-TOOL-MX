<template>
  <div class="craft-page">
    <header class="page-heading">
      <div><h2>POE1 手动做装模拟器</h2><p>选择底材，像游戏里一样使用通货、精华、工艺台、化石、花园、古灵、势力、加密与野兽工艺，并观察每一步装备变化。</p></div>
      <div class="header-actions">
        <el-button size="small" :loading="store.updating" @click="updateData">更新 POEDB 数据</el-button>
        <el-button v-if="store.updating" size="small" @click="store.cancelUpdate">取消</el-button>
      </div>
    </header>

    <el-alert v-if="pageError" :title="pageError" type="error" show-icon closable @close="pageError = ''" />
    <section class="status-strip">
      <div><strong>数据 {{ store.status?.league || '未知赛季' }} · {{ store.status?.patch || '未知版本' }}</strong><span>{{ formatDate(store.status?.generatedAt) }} · {{ store.status?.counts?.bases || 0 }} 底材 / {{ store.status?.counts?.modifierEntries || 0 }} 词缀</span></div>
      <el-tag v-if="versionUnconfirmed" type="warning">版本未确认</el-tag>
      <el-tag type="info">价格数据已停用</el-tag>
    </section>
    <el-progress v-if="store.updating && store.updateProgress" :percentage="updatePercent" />
    <el-alert v-if="store.updateError" :title="`数据更新失败：${store.updateError}，当前快照未被替换。`" type="error" :closable="false" />

    <el-card class="base-panel">
      <template #header><b>1. 选择底材</b></template>
      <div class="base-form">
        <el-form-item label="分类"><el-cascader v-model="baseCategoryPath" :options="baseCategoryOptions" clearable placeholder="全部分类" @change="categoryChanged" /></el-form-item>
        <el-form-item label="底材"><el-select v-model="form.baseId" filterable remote placeholder="输入中文名称" :remote-method="searchBaseByName" @change="selectBase"><el-option v-for="base in store.bases" :key="base.id" :label="base.displayName || base.name" :value="base.id"><span>{{ base.displayName || base.name }}</span><small>{{ base.categoryPath.join(' / ') }}</small></el-option></el-select></el-form-item>
        <el-form-item label="物品等级"><el-input-number v-model="form.itemLevel" :min="1" :max="100" /></el-form-item>
        <el-form-item label="随机种子"><el-input-number v-model="form.seed" :min="1" :max="2147483647" /></el-form-item>
        <el-button type="primary" :disabled="!form.baseId" @click="createItem">创建装备</el-button>
      </div>
      <p v-if="selectedBase" class="base-summary">{{ selectedBase.categoryPath.join(' / ') }} / {{ selectedBase.displayName || selectedBase.name }} · 需求等级 {{ selectedBase.requiredLevel }}</p>
    </el-card>

    <template v-if="store.session">
      <div class="workbench">
        <section class="item-column">
          <el-card>
            <template #header><div class="card-heading"><b>2. 当前装备</b><div><el-button size="small" :disabled="!store.canUndo" @click="store.undo">撤销</el-button><el-button size="small" :disabled="!store.canRedo" @click="store.redo">重做</el-button><el-button size="small" type="danger" plain @click="store.reset">重置</el-button></div></div></template>
            <article class="poe-item" :class="`rarity-${store.currentState.rarity}`">
              <div class="item-title"><span>{{ rarityLabel }} <em v-for="influence in store.currentState.influences" :key="influence" class="state-badge influence">{{ influenceLabel(influence) }}</em><em v-if="store.currentState.split" class="state-badge">Split</em><em v-if="store.currentState.corrupted" class="state-badge corrupted">已腐化</em><em v-if="store.currentState.mirrored" class="state-badge mirrored">镜像</em><em v-if="store.currentState.enchanted" class="state-badge enchanted">已附魔</em><em v-if="store.session.foreseeing" class="state-badge foreseeing">预见中</em><em v-if="store.session.imprint" class="state-badge imprint">有拓印</em></span><strong>{{ store.session.base.displayName || store.session.base.name }}</strong></div>
              <div class="item-meta"><span>物品等级：{{ store.session.itemLevel }}</span><span>前缀 {{ store.currentState.prefixes.length }}/{{ currentAffixLimit('prefix') }} · 后缀 {{ store.currentState.suffixes.length }}/{{ currentAffixLimit('suffix') }}</span></div>
              <div v-if="store.session.base.qualityType !== 'none'" class="item-property quality-property"><b>品质：</b><span>+{{ store.currentState.quality }}%</span></div>
              <div v-if="store.currentState.catalystQuality?.type" class="item-property quality-property"><b>{{ catalystQualityLabel }}品质：</b><span>+{{ store.currentState.catalystQuality.amount }}%</span></div>
              <div v-if="store.currentState.baseDefencePercentile != null" class="item-property base-defence-property"><b>基础防御百分比：</b><span>{{ store.currentState.baseDefencePercentile }}%</span></div>
              <div v-for="stat in displayedBaseStats" :key="stat.id" class="item-property"><b>{{ stat.label }}：</b><span>{{ stat.displayValues.join('—') }}</span></div>
              <div v-if="requirementText" class="item-requirements"><b>需求</b><span>{{ requirementText }}</span></div>
              <div v-if="socketRows.length" class="socket-row" :aria-label="`插槽 ${socketRows.map((socket) => socket.color).join('-')}，连接 ${store.currentState.links.map((group) => group.length).join('+')}`"><template v-for="socket in socketRows" :key="socket.id"><i class="socket" :class="`socket-${socket.color.toLowerCase()}`">{{ socket.color }}</i><i v-if="socket.linkedToNext" class="socket-link" /></template></div>
              <div v-for="implicit in displayedBaseImplicits" :key="implicit.id" class="implicit-row" :class="{ catalysed: implicit.catalystMatched }">{{ rolledTextWithRanges(implicit) }}</div>
              <div v-if="displayedVaalImplicit" class="implicit-row vaal-implicit"><b>瓦尔隐式 · T{{ displayedVaalImplicit.tier }}</b><span>{{ displayedVaalImplicit.displayText || displayedVaalImplicit.rolledText || displayedVaalImplicit.text }}</span><small>{{ displayedVaalImplicit.displayTags.map((tag) => tag.label).join(' / ') || '无标签' }}</small></div>
              <div v-for="implicit in store.currentState.implicits" :key="implicit" class="implicit-row">{{ implicit }}</div>
              <div v-for="implicit in displayedEldritchImplicits" :key="implicit.source" class="implicit-row eldritch-implicit" :class="[implicit.source, { catalysed: implicit.catalystMatched }]"><b>{{ implicit.source === 'exarch' ? '焊界者' : '灭界者' }} · T{{ implicit.tier }}</b><span>{{ implicit.displayText || implicit.rolledText || implicit.text }}</span><small>{{ implicit.displayTags.map((tag) => tag.label).join(' / ') || '无标签' }}</small></div>
              <div v-if="eldritchImplicits.length" class="dominance-row"><b>{{ store.eldritch.dominance.label }}</b><span>{{ store.eldritch.dominance.affixType === 'prefix' ? '支配通货将目标前缀' : store.eldritch.dominance.affixType === 'suffix' ? '支配通货将目标后缀' : '两侧同阶，支配通货不生效' }}</span></div>
              <div v-if="store.currentState.qualityEffect" class="quality-effect-row"><b>品质效果</b><span>{{ store.currentState.qualityEffect }}</span></div>
              <div v-if="!allAffixes.length" class="empty-affixes">无显式词缀</div>
              <div v-for="affix in displayedPrefixes" :key="affixKey(affix)" class="affix-row prefix" :class="{ 'veiled-pending': affix.veiled, fractured: affix.fractured, catalysed: affix.catalystMatched }"><span class="affix-kind">前缀</span><div class="affix-effects"><p v-for="(line, index) in effectLines(affix)" :key="index">{{ line }}</p><small>{{ sourceLabel(affix) }} · {{ affix.displayTags.map((tag) => tag.label).join(' / ') || '无标签' }}</small></div><div class="affix-tier"><b>{{ affixTierSummary(affix) }}</b><span><em v-if="affix.fractured" class="fractured-badge">破裂</em><em v-if="affix.veiled" class="veiled-badge">未揭露</em><em v-if="affix.source === 'essence' && affix.sourceItemId" class="essence-guaranteed">精华保证</em><em v-if="affix.source === 'crafted'" class="crafted-mod">{{ affix.metaCraft ? '元工艺' : '工艺台' }}</em></span></div></div>
              <div v-for="affix in displayedSuffixes" :key="affixKey(affix)" class="affix-row suffix" :class="{ 'veiled-pending': affix.veiled, fractured: affix.fractured, catalysed: affix.catalystMatched }"><span class="affix-kind">后缀</span><div class="affix-effects"><p v-for="(line, index) in effectLines(affix)" :key="index">{{ line }}</p><small>{{ sourceLabel(affix) }} · {{ affix.displayTags.map((tag) => tag.label).join(' / ') || '无标签' }}</small></div><div class="affix-tier"><b>{{ affixTierSummary(affix) }}</b><span><em v-if="affix.fractured" class="fractured-badge">破裂</em><em v-if="affix.veiled" class="veiled-badge">未揭露</em><em v-if="affix.source === 'essence' && affix.sourceItemId" class="essence-guaranteed">精华保证</em><em v-if="affix.source === 'crafted'" class="crafted-mod">{{ affix.metaCraft ? '元工艺' : '工艺台' }}</em></span></div></div>
            </article>
            <el-alert v-if="store.lastEvent" :title="store.lastEvent.summary" type="success" :closable="false" />
            <div v-if="store.lastEvent?.removedEnchantment" class="enchantment-result"><b>已移除附魔</b><span>{{ store.lastEvent.removedEnchantment }}</span><small>品质数值和装备其他属性保持不变</small></div>
            <div v-if="store.lastEvent?.createdItem" class="split-result"><b>分裂化石生成副本</b><span>Split · {{ store.lastEvent.createdItem.prefixes.length }} 前缀 / {{ store.lastEvent.createdItem.suffixes.length }} 后缀</span><small>{{ [...store.lastEvent.createdItem.prefixes, ...store.lastEvent.createdItem.suffixes].map((entry) => entry.rolledText || entry.text).join('；') }}</small></div>
            <div v-if="store.lastEvent?.createdMirrorItem" class="split-result mirror-result"><b>原件未改变 · 生成镜像副本</b><span>镜像 · {{ store.lastEvent.createdMirrorItem.state.prefixes.length }} 前缀 / {{ store.lastEvent.createdMirrorItem.state.suffixes.length }} 后缀</span><small>{{ [...store.lastEvent.createdMirrorItem.state.prefixes, ...store.lastEvent.createdMirrorItem.state.suffixes].map(affixText).join('；') || '无显式词缀' }}</small></div>
            <section v-if="store.session.pendingSplitResults?.length" class="split-picker"><b>选择一件分裂产物继续制作</b><small>选择前全部制作动作暂停；未选中的产物只保留在本次历史记录中。</small><button v-for="(result, index) in store.session.pendingSplitResults" :key="result.itemId" :disabled="store.applying" @click="chooseSplitResult(result)"><strong>产物 {{ index + 1 }} · {{ result.state.rarity === 'magic' ? '魔法' : '稀有' }}</strong><span>{{ result.state.prefixes.length }} 前缀 / {{ result.state.suffixes.length }} 后缀</span><small>{{ [...result.state.prefixes, ...result.state.suffixes].map(affixText).join('；') || '无显式词缀' }}</small></button></section>
          </el-card>

          <el-card class="history-card">
            <template #header><div class="card-heading"><b>制作历史（{{ store.session.history.length }}）</b><small v-if="totalSpent.length">累计消耗：{{ formatCosts(totalSpent) }}</small></div></template>
            <el-timeline v-if="store.session.history.length">
              <el-timeline-item v-for="(record, index) in [...store.session.history].reverse()" :key="index" :timestamp="`步骤 ${store.session.history.length - index}`">
                <b>{{ record.event.actionName }}</b><p>{{ record.event.summary }}</p>
                <small v-if="record.event.guaranteedModifier">保证词缀：{{ record.event.guaranteedModifier.text }}</small><small v-if="record.event.guaranteedModifiers?.length">保证词缀：{{ record.event.guaranteedModifiers.map((entry) => `${entry.sourceItemName ? `${entry.sourceItemName} · ` : ''}${entry.text}`).join('；') }}</small><small v-if="record.event.guaranteedTag">保证标签：{{ harvestTagLabel(record.event.guaranteedTag) }}</small><small v-if="record.event.originalTags?.length">原词缀标签按 {{ record.event.weightMultiplier }} 倍权重参与重铸：{{ record.event.originalTags.map(harvestTagLabel).join(' / ') }}</small><small v-if="record.event.convertedFrom">转换：{{ affixText(record.event.convertedFrom) }} → {{ affixText(record.event.convertedTo) }}</small><small v-if="record.event.removedModifier">移除：{{ affixText(record.event.removedModifier) }}</small><small v-if="record.event.addedModifier">添加：{{ affixText(record.event.addedModifier) }}</small><small v-if="record.event.guaranteedInfluenceModifier">保证势力词缀：{{ record.event.guaranteedInfluenceModifier.text }}</small><small v-if="record.event.influenceChange">势力：{{ formatInfluences(record.event.influenceChange.before) }} → {{ formatInfluences(record.event.influenceChange.after) }}</small><small v-if="record.event.qualityEffect">品质效果：{{ record.event.qualityEffect }}</small><small v-if="record.event.fossils?.length">化石：{{ record.event.fossils.map((entry) => entry.name).join(' + ') }}</small><small v-if="record.event.tangled">纠缠揭示：更多{{ record.event.tangled.moreLabel }}，无{{ record.event.tangled.blockedLabel }}</small><small v-if="record.event.createdItem">结果：原物品与一个副本均获得 Split</small><small v-if="record.event.replacedCraft">替换：{{ record.event.replacedCraft.text || record.event.replacedCraft.name }}</small><small v-if="record.event.eldritchBefore">古灵支配：{{ record.event.dominanceBefore.label }} → {{ record.event.dominanceAfter.label }}</small><small v-if="record.event.conflict">冲突结果：{{ eldritchSourceLabel(record.event.conflict.upgradeSource) }}升级，{{ eldritchSourceLabel(record.event.conflict.downgradeSource) }}降级（操作前估计 {{ formatPercent(record.event.conflict[`${record.event.conflict.upgradeSource}UpgradeChance`]) }}）</small>
                <small v-if="record.event.addedInfluenceModifier">新增势力词缀：{{ affixText(record.event.addedInfluenceModifier) }}</small><small v-if="record.event.upgradedFrom">统御升阶：{{ affixText(record.event.upgradedFrom) }} → {{ affixText(record.event.upgradedTo) }}{{ record.event.rerolledElevated ? '（尊崇 T1 重骰）' : '' }}</small><small v-if="record.event.inheritedModifiers?.length">觉醒继承：{{ record.event.inheritedModifiers.map((entry) => `${influenceLabel(entry.influence)} · ${affixText(entry.modifier)}`).join('；') }}</small><small v-if="record.event.discardedConflict">ModGroup 冲突丢弃：{{ influenceLabel(record.event.discardedConflict.influence) }} · {{ affixText(record.event.discardedConflict.modifier) }}</small><small v-if="record.event.donorConsumed">供体已销毁</small><small v-if="record.event.costs?.length">消耗：{{ formatCosts(record.event.costs) }}</small>
                <small v-if="record.event.pendingVeil">未揭露占位：{{ record.event.pendingVeil.affixType === 'prefix' ? '前缀' : '后缀' }}</small><small v-if="record.event.unveilOptions?.length">揭露三选一：{{ record.event.unveilOptions.map((entry) => entry.text).join('；') }}</small><small v-if="record.event.selectedModifier">揭露结果：{{ affixText(record.event.selectedModifier) }}</small>
                <small v-if="record.event.fracturedModifier">破裂锁定：{{ affixText(record.event.fracturedModifier) }}</small>
                <small v-if="record.event.corruptionOutcome">瓦尔结果：{{ record.event.corruptionOutcomeLabel }}</small><small v-if="record.event.corruptedImplicit">腐化固定词缀：{{ record.event.corruptedImplicit.rolledText || record.event.corruptedImplicit.text }}</small><small v-if="record.event.corruptionReplacedImplicit">替换隐式：{{ record.event.corruptionReplacedImplicit.text }}</small><small v-if="record.event.qualityChange">品质：{{ record.event.qualityChange.before }}% → {{ record.event.qualityChange.after }}%</small><small v-if="record.event.catalystQualityChange">催化剂品质：{{ record.event.catalystQualityChange.beforeLabel }} → {{ record.event.catalystQualityChange.afterLabel }}</small><small v-if="record.event.socketChange">孔色：{{ record.event.socketChange.before }} → {{ record.event.socketChange.after }}</small><small v-if="record.event.linkChange">连接：{{ record.event.linkChange.before }} → {{ record.event.linkChange.after }}</small><small v-if="record.event.implicitChange">固有词缀：{{ record.event.implicitChange.before.filter(Boolean).join('；') }} → {{ record.event.implicitChange.after.filter(Boolean).join('；') }}</small>
                <small v-if="record.event.baseDefenceChange">基础防御：{{ record.event.baseDefenceChange.percentileBefore }}%（{{ formatBaseDefences(record.event.baseDefenceChange.before) }}）→ {{ record.event.baseDefenceChange.percentileAfter }}%（{{ formatBaseDefences(record.event.baseDefenceChange.after) }}）</small>
                <small v-if="record.event.createdItems?.length">分裂产生 {{ record.event.createdItems.length }} 件待选物品</small><small v-if="record.event.selectedItemId">选择分裂产物：{{ record.event.selectedItemId }}</small><small v-if="record.event.imprintCreated">已创建并绑定当前物品的拓印</small><small v-if="record.event.imprintRestored">已恢复并消费拓印</small><small v-if="record.event.foreseeingApplied">已应用希内科拉预见状态</small><small v-if="record.event.foreseeingConsumed">本次修改已消费预见状态</small>
                <small v-if="record.event.createdMirrorItem">原件未改变；生成镜像副本并切换当前目标：{{ record.event.createdMirrorItem.itemId }}</small>
                <small v-if="record.event.removedEnchantment">移除附魔：{{ record.event.removedEnchantment }}</small>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="尚未进行制作" :image-size="48" />
          </el-card>
        </section>

        <el-card class="currency-panel" :class="{ 'details-hidden': !showCraftDetails }">
            <template #header><div class="card-heading"><b>3. 手动使用通货、精华、工艺台、化石、花园、古灵、势力与加密工艺</b><el-switch v-model="showCraftDetails" active-text="详细信息显示" /></div></template>
          <el-tabs>
            <el-tab-pane label="基础通货">
              <p class="section-note">点击可用的核心通货、破溃宝珠或污秽通货即可应用；机制已知但概率不足的项保留说明并禁用，不生成猜测结果。</p>
              <div class="currency-grid">
                <button v-for="currency in sortedCurrencies" :key="currency.id" class="currency-card" :class="{ disabled: !currency.canApply, destructive: currency.destructive }" :disabled="!currency.canApply || store.applying" @click="useCurrency(currency)">
                  <strong>{{ currency.name }} <i v-if="currency.supportLevel && currency.supportLevel !== 'supported'">仅说明</i></strong><span>{{ currency.description }}</span><small><b>条件：</b>{{ currency.requirements }}</small><small><b>结果：</b>{{ currency.consequences }}</small><small v-if="currency.cost?.length"><b>消耗：</b>{{ formatCosts(currency.cost) }}</small><small v-if="currency.probabilityModel"><b>概率模型：</b>{{ currency.probabilityModel }}（社区经验值，非官方精确表）</small><em v-if="!currency.canApply">{{ currency.unavailableReason }}</em>
                  <div v-if="currency.preview" class="currency-preview"><b>希内科拉预览</b><small v-if="currency.preview.state.corruptionOutcome">瓦尔结果：{{ vaalOutcomeLabel(currency.preview.state.corruptionOutcome) }}</small><small v-if="currency.preview.state.vaalImplicit">瓦尔隐式：{{ currency.preview.state.vaalImplicit.rolledText }}</small><small v-if="currency.preview.state.catalystQuality?.type">{{ catalystLabel(currency.preview.state.catalystQuality.type) }}品质 {{ currency.preview.state.catalystQuality.amount }}%</small><small>孔位：{{ currency.preview.state.sockets.map((socket) => socket.color).join('-') || '无孔' }} · 连接 {{ currency.preview.state.links.map((group) => group.length).join('+') || '无' }}</small><small>{{ currency.preview.state.rarity === 'rare' ? '稀有' : currency.preview.state.rarity === 'magic' ? '魔法' : '普通' }} · {{ [...currency.preview.state.prefixes, ...currency.preview.state.suffixes].map(affixText).join('；') || '无显式词缀' }}</small></div>
                </button>
              </div>
            </el-tab-pane>
            <el-tab-pane :label="`精华 (${store.essences.items.length})`">
              <div class="essence-filters"><el-input v-model="essenceQuery" clearable placeholder="搜索精华或保证效果" /><el-select v-model="essenceTierFilter" placeholder="全部阶级"><el-option label="全部阶级" :value="0" /><el-option v-for="tier in 8" :key="tier" :label="tier === 8 ? 'T8 特殊精华' : `T${tier}`" :value="tier" /></el-select></div>
              <el-alert v-if="store.essences.unresolvedCount" :title="`${store.essences.unresolvedCount} 条精华记录无法唯一解析，已禁止应用。`" type="warning" :closable="false" />
              <div v-if="filteredEssences.length" class="essence-grid">
                <button v-for="essence in filteredEssences" :key="essence.id" class="currency-card essence-card" :class="{ disabled: !essence.canApply, destructive: essence.destructive }" :disabled="!essence.canApply || store.applying" @click="useEssence(essence)">
                  <strong>{{ essence.name }} <i>{{ essence.essenceTier === 8 ? '特殊 T8' : `T${essence.essenceTier}` }}</i></strong>
                  <span class="guaranteed-effect">保证：{{ essence.guaranteedModifier.text }}</span>
                  <small><b>条件：</b>{{ essence.requirements }}</small><small><b>结果：</b>{{ essence.consequences }}</small>
                  <small v-if="essence.randomModifierLevelCap"><b>随机词缀上限：</b>等级 {{ essence.randomModifierLevelCap }}</small>
                  <em v-if="!essence.canApply">{{ essence.unavailableReason }}</em>
                </button>
              </div>
              <el-empty v-else description="没有匹配当前底材的精华" :image-size="48" />
            </el-tab-pane>
            <el-tab-pane :label="`工艺台 (${store.benchCrafts.items.length})`">
              <div class="bench-filters"><el-input v-model="benchQuery" clearable placeholder="搜索名称、效果、标签或解锁位置" /><el-select v-model="benchAffixFilter"><el-option label="全部位置" value="" /><el-option label="前缀" value="prefix" /><el-option label="后缀" value="suffix" /></el-select><el-select v-model="benchKindFilter"><el-option label="全部工艺" value="" /><el-option label="普通工艺" value="modifier" /><el-option label="元工艺" value="meta" /><el-option label="腐化定孔" value="corrupted-sockets" /><el-option label="腐化定连" value="corrupted-links" /><el-option label="腐化定色" value="corrupted-colours" /><el-option label="移除动作" value="remove" /></el-select></div>
              <el-alert v-if="store.benchCrafts.unresolvedCount" :title="`${store.benchCrafts.unresolvedCount} 条工艺记录无法唯一映射，已禁止应用。`" type="warning" :closable="false" />
              <div v-if="filteredBenchCrafts.length" class="bench-grid">
                <button v-for="craft in filteredBenchCrafts" :key="craft.id" class="currency-card bench-card" :class="{ disabled: !craft.canApply, meta: craft.isMeta, remove: craft.kind === 'remove' }" :disabled="!craft.canApply || store.applying" @click="useBenchCraft(craft)">
                  <strong>{{ craft.name }} <i>{{ benchKindLabel(craft) }}</i></strong>
                  <span class="guaranteed-effect">{{ craft.effect }}</span>
                  <template v-if="showCraftDetails"><small><b>消耗：</b>{{ formatCosts(craft.cost) }}</small><small v-if="craft.replacesExisting"><b>替换：</b>{{ craft.replacedAffix?.text || craft.replacedAffix?.name }}（额外 1 重铸石）</small>
                  <small v-if="craft.requiredLevel > 1"><b>物品等级：</b>{{ craft.requiredLevel }}</small><small><b>解锁：</b>{{ craft.unlock }}</small>
                  <small><b>结果：</b>{{ craft.consequences }}</small><span class="tags"><i v-for="tag in craft.displayTags" :key="tag.id">{{ tag.label }}</i></span></template>
                  <em v-if="!craft.canApply">{{ craft.unavailableReason }}</em>
                </button>
              </div>
              <el-empty v-else description="没有符合筛选条件的工艺" :image-size="48" />
            </el-tab-pane>
            <el-tab-pane :label="`化石 (${store.fossils.items.length})`">
              <p class="section-note">选择 1–4 孔混乱共振器并装满不同化石；共振器只重铸稀有装备，且不受任何元工艺保护。</p>
              <div class="resonator-builder">
                <el-radio-group v-model="resonatorSockets"><el-radio-button v-for="resonator in store.fossils.resonators" :key="resonator.id" :value="resonator.sockets">{{ resonator.sockets }} 孔</el-radio-button></el-radio-group>
                <div class="fossil-slots"><span v-for="slot in resonatorSockets" :key="slot" :class="{ filled: selectedFossils[slot - 1] }">{{ selectedFossils[slot - 1]?.name || '空孔' }}</span></div>
                <el-button type="primary" :disabled="Boolean(fossilSelectionReason) || store.applying" @click="useFossils">使用{{ selectedResonator?.name || '共振器' }}</el-button>
                <small v-if="fossilSelectionReason" class="selection-reason">{{ fossilSelectionReason }}</small>
              </div>
              <el-input v-model="fossilQuery" clearable placeholder="搜索化石、作用或标签后果" class="fossil-search" />
              <div class="fossil-grid">
                <button v-for="fossil in filteredFossils" :key="fossil.id" class="currency-card fossil-card" :class="{ selected: selectedFossilIds.includes(fossil.id), disabled: !fossil.selectable }" :disabled="!fossil.selectable" @click="toggleFossil(fossil)">
                  <strong>{{ fossil.name }} <i>{{ fossil.special ? '特殊' : '权重' }}</i></strong>
                  <span class="guaranteed-effect">{{ fossil.description }}</span>
                  <small><b>当前底材：</b>{{ fossil.consequences }}</small><small v-if="fossil.special === 'bloodstained'"><b>腐化候选：</b>{{ fossil.candidateCount }}</small>
                  <em v-if="fossil.unavailableReason">{{ fossil.unavailableReason }}</em>
                </button>
              </div>
            </el-tab-pane>
            <el-tab-pane :label="`花园 (${store.harvest.total})`">
              <p class="section-note">当前 POE1 3.29 快照的 74 条花园配方都会列出；3.29 已移除追忆物品工艺。憎恨结晶关联 11 条装备工艺和 1 条宝石转换，不能准确改变装备状态的配方会安全禁用。</p>
              <el-alert :title="`当前状态可执行 ${store.harvest.executableCount} / ${store.harvest.total} 条；同类倾向重铸采用可审计的 10 倍 / 0.1 倍权重模型。`" type="info" :closable="false" />
              <div class="harvest-filters"><el-input v-model="harvestQuery" clearable placeholder="搜索花园工艺、标签或结果" /><el-select v-model="harvestCategory"><el-option label="全部类别" value="" /><el-option v-for="category in store.harvest.categories" :key="category.id" :label="`${category.label} (${category.count})`" :value="category.id" /></el-select><el-checkbox v-model="harvestAvailableOnly">仅可执行</el-checkbox></div>
              <div v-if="filteredHarvest.length" class="harvest-grid">
                <button v-for="craft in filteredHarvest" :key="craft.id" class="currency-card harvest-card" :class="{ disabled: !craft.canApply }" :disabled="!craft.canApply || store.applying" @click="useHarvestCraft(craft)">
                  <strong>{{ craft.name }} <i>{{ craft.categoryLabel }}</i></strong>
                  <span class="core-function">{{ craft.consequences }}</span><small><b>消耗：</b>{{ formatCosts(craft.cost) }}</small><small v-if="craft.tagLabel"><b>保证标签：</b>{{ craft.tagLabel }}</small><small><b>当前候选：</b>{{ craft.candidateCount }}</small>
                  <em v-if="!craft.canApply">{{ craft.unavailableReason }}</em>
                </button>
              </div>
              <el-empty v-else description="没有符合筛选条件的花园工艺" :image-size="48" />
            </el-tab-pane>
            <el-tab-pane :label="`古灵 (${store.eldritch.total})`">
              <p class="section-note">焊界者高阶时支配前缀，灭界者高阶时支配后缀；同阶无支配。直接隐式通货只替换同侧并清除普通固定词缀。</p>
              <el-alert :title="`当前：${store.eldritch.dominance.label}，可执行 ${store.eldritch.executableCount} / ${store.eldritch.total} 种通货。冲突石概率为社区实测估计，非官方公布常数。`" type="info" :closable="false" />
              <div class="eldritch-help"><b>元工艺边界</b><span>古灵混沌忽略前/后缀锁；古灵崇高遵守无法骰出攻击/法术；古灵无效同时遵守位置锁和标签保护。</span></div>
              <div class="eldritch-grid">
                <button v-for="craft in sortedEldritch" :key="craft.id" class="currency-card eldritch-card" :class="{ disabled: !craft.canApply }" :disabled="!craft.canApply || store.applying" @click="useEldritchCraft(craft)">
                  <strong>{{ craft.name }} <i>{{ craft.kind === 'implicit' ? `${eldritchSourceLabel(craft.source)} T${craft.tier}` : craft.kind === 'conflict' ? '升降阶' : craft.targetAffixType === 'prefix' ? '前缀' : craft.targetAffixType === 'suffix' ? '后缀' : '需支配' }}</i></strong>
                  <span>{{ craft.description }}</span><small><b>消耗：</b>{{ formatCosts(craft.cost) }}</small><small><b>条件：</b>{{ craft.requirements }}</small><small><b>候选：</b>{{ craft.candidateCount }}</small><small><b>结果：</b>{{ craft.consequences }}</small>
                  <small v-if="craft.conflictProbabilities"><b>估计升级概率：</b>焊界 {{ formatPercent(craft.conflictProbabilities.exarch) }} / 灭界 {{ formatPercent(craft.conflictProbabilities.eater) }}</small>
                  <em v-if="!craft.canApply">{{ craft.unavailableReason }}</em>
                </button>
              </div>
            </el-tab-pane>
            <el-tab-pane :label="`加密 (${store.veiled.total})`">
              <p class="section-note">加密通货先生成一个占用真实词缀位但没有效果的未揭露词缀；当前版本可直接在物品上进行三选一揭露。</p>
              <el-alert :title="`当前可执行 ${store.veiled.executableCount} / ${store.veiled.total} 种加密通货。三选一按真实权重生成，并实时应用 ModGroup 阻断。`" type="info" :closable="false" />
              <div class="veiled-help"><b>元工艺边界</b><span>加密崇高石的移除遵守前/后缀无法改变，但忽略无法骰出攻击/施法；加密混沌石保留锁定侧，普通重铸遵守生成标签限制；揭露选项始终忽略攻击/施法限制。</span></div>
              <div class="veiled-grid">
                <button v-for="craft in sortedVeiled" :key="craft.id" class="currency-card veiled-card" :class="{ disabled: !craft.canApply, destructive: craft.destructive }" :disabled="!craft.canApply || store.applying" @click="useVeiledCraft(craft)">
                  <strong>{{ craft.name }} <i>{{ craft.kind === 'exalted' ? '移除并添加' : '重铸并保证' }}</i></strong>
                  <span>{{ craft.description }}</span><small><b>消耗：</b>{{ formatCosts(craft.cost) }}</small><small><b>条件：</b>{{ craft.requirements }}</small><small><b>候选结果：</b>{{ craft.candidateCount }}</small><small><b>结果：</b>{{ craft.consequences }}</small>
                  <em v-if="!craft.canApply">{{ craft.unavailableReason }}</em>
                </button>
              </div>
              <section v-if="store.veiled.pending" class="unveil-panel">
                <div class="unveil-heading"><div><b>未揭露的加密{{ store.veiled.pending.affixType === 'prefix' ? '前缀' : '后缀' }}</b><small>从以下三个真实候选中选择一个；选择前仍可用工艺台占用 ModGroup 来改变候选。</small></div><el-tag type="warning">占用 1 个{{ store.veiled.pending.affixType === 'prefix' ? '前缀' : '后缀' }}位</el-tag></div>
                <el-alert v-if="store.veiled.unveilUnavailableReason" :title="store.veiled.unveilUnavailableReason" type="warning" :closable="false" />
                <div class="unveil-options">
                  <button v-for="option in store.veiled.options" :key="`${option.modifierId}:${option.tierId}`" class="unveil-option" :disabled="!store.veiled.canUnveil || store.applying" @click="chooseVeiledOption(option)">
                    <strong><span>{{ option.tierName }}</span>{{ option.name }}</strong>
                    <p>{{ option.text }}</p>
                    <small>出现等级 {{ option.requiredLevel }} · 单项权重 {{ option.weight }}</small>
                    <span class="tags"><i v-for="tag in option.displayTags" :key="tag.id">{{ tag.label }}</i><i v-if="!option.displayTags.length">无标签</i></span>
                    <em>选择此词缀</em>
                  </button>
                </div>
              </section>
            </el-tab-pane>
            <el-tab-pane :label="`势力 (${store.influence.total})`">
              <p class="section-note">六种势力崇高石会给无势力稀有装备添加对应势力词缀；统御宝珠处理尊崇升阶；觉醒者之石会永久销毁供体并合并两种不同势力。</p>
              <el-alert :title="`当前可执行 ${store.influence.executableCount} / ${store.influence.total} 种势力通货。候选按底材、物品等级、ModGroup、槽位及元属性实时过滤。`" type="info" :closable="false" />
              <div class="influence-help"><b>重要边界</b><span>势力崇高石遵守“无法骰出攻击/法术”；统御宝珠不会影响受前后缀锁保护的词缀；觉醒者之石忽略全部元属性并重骰其他显式词缀。</span></div>
              <div class="influence-grid">
                <button v-for="craft in sortedInfluence" :key="craft.id" class="currency-card influence-card" :class="{ disabled: !craft.canApply }" :disabled="!craft.canApply || store.applying" @click="useInfluenceCraft(craft)">
                  <strong>{{ craft.name }} <i>{{ craft.kind === 'exalted' ? influenceLabel(craft.influence) : craft.kind === 'dominance' ? '移除并升阶' : '双装备合并' }}</i></strong>
                  <span>{{ craft.description }}</span><small><b>消耗：</b>{{ formatCosts(craft.cost) }}</small><small><b>条件：</b>{{ craft.requirements }}</small><small><b>当前候选：</b>{{ craft.candidateCount }}</small><small><b>结果：</b>{{ craft.consequences }}</small>
                  <em v-if="!craft.canApply">{{ craft.unavailableReason }}</em>
                </button>
              </div>

              <section class="donor-builder">
                <div class="donor-heading"><div><b>觉醒者供体配置</b><small>选择一件同装备类型、不同单势力且具有真实词缀阶级的装备。配置代表从仓库选中该供体，不消耗制作通货。</small></div><el-button v-if="store.session.awakenerDonor" size="small" type="danger" plain @click="clearDonor">清除供体</el-button></div>
                <div class="donor-form">
                  <el-select v-model="donorForm.baseId" filterable placeholder="供体底材" @change="loadDonorTiers"><el-option v-for="base in store.awakenerDonorOptions.bases" :key="base.id" :label="base.displayName || base.name" :value="base.id" /></el-select>
                  <el-input-number v-model="donorForm.itemLevel" :min="1" :max="100" @change="loadDonorTiers" />
                  <el-select v-model="donorForm.influence" placeholder="供体势力" @change="loadDonorTiers"><el-option v-for="entry in store.awakenerDonorOptions.influences" :key="entry.id" :label="entry.label" :value="entry.id" /></el-select>
                  <el-select v-model="donorTierKey" filterable placeholder="具体势力词缀阶级"><el-option v-for="entry in store.awakenerDonorOptions.candidates" :key="`${entry.modifierId}:${entry.tierId}`" :label="`${entry.tierName} · ${entry.text}`" :value="`${entry.modifierId}|${entry.tierId}`"><span>{{ entry.tierName }} · {{ entry.text }}</span><small>权重 {{ entry.weight }} · 等级 {{ entry.requiredLevel }}</small></el-option></el-select>
                  <el-button type="primary" :disabled="!donorTierKey || store.applying" @click="configureDonor">配置供体</el-button>
                </div>
                <article v-if="store.session.awakenerDonor" class="donor-preview">
                  <b>{{ influenceLabel(store.session.awakenerDonor.state.influences[0]) }} · {{ store.session.awakenerDonor.base.displayName || store.session.awakenerDonor.base.name }}</b>
                  <span>物品等级 {{ store.session.awakenerDonor.itemLevel }} · {{ store.session.awakenerDonor.state.rarity === 'magic' ? '魔法' : '稀有' }}</span>
                  <div v-for="affix in donorAffixes" :key="affixKey(affix)"><strong>{{ affix.affixType === 'prefix' ? '前缀' : '后缀' }} · {{ affix.tierName }}</strong><p>{{ affix.rolledText || affix.text }}</p><small>{{ affix.displayTags.map((tag) => tag.label).join(' / ') || '无标签' }} · 单项权重 {{ affix.weight }}</small></div>
                </article>
              </section>
            </el-tab-pane>
            <el-tab-pane :label="`野兽 (${store.beastcraft.total})`">
              <div class="beast-heading"><div><p class="section-note">装备相关野兽工艺以 POE1 {{ store.beastcraft.ruleset?.patch || '3.29' }} 为规则基线；3.29 已移除二分 / 三分，新的魔符破裂配方因缺少魔符模型而安全禁用。</p><small>增删前后缀的新增池使用主野兽等级，而不是装备物品等级。</small></div><el-input-number v-model="beastLevel" :min="68" :max="100" controls-position="right" @change="reloadBeastcrafts" /></div>
              <el-alert :title="`当前可执行 ${store.beastcraft.executableCount} / ${store.beastcraft.total} 条装备配方；主野兽等级 ${store.beastcraft.beastLevel}。`" type="info" :closable="false" />
              <div class="beast-grid">
                <button v-for="craft in sortedBeastcraft" :key="craft.id" class="currency-card beast-card" :class="{ disabled: !craft.canApply, unsupported: !craft.supported }" :disabled="!craft.canApply || store.applying" @click="useBeastcraft(craft)">
                  <strong>{{ craft.name }} <i>{{ beastCategoryLabel(craft.category) }}</i></strong><span>{{ craft.description }}</span><small><b>主要野兽：</b>{{ craft.beast }}<template v-if="craft.secondaryBeast"> + {{ craft.secondaryBeast }}</template></small><small><b>结果：</b>{{ craft.consequences }}</small><em v-if="!craft.canApply">{{ craft.unavailableReason }}</em>
                </button>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>

      <el-card class="catalog-panel">
        <template #header><div class="card-heading"><div><b>4. 词缀目录</b><small>按流亡编年史：来源 → Mod Family → 具体阶级</small></div><el-input v-model="catalogQuery" clearable placeholder="搜索名称、效果" @input="debouncedCatalog" /></div></template>
        <section class="selected-targets" aria-label="已选词缀目标">
          <header>
            <div><strong>已选目标（{{ selectedTargets.length }}）</strong><small>仅供手动制作对照，不执行自动路径或概率优化。</small></div>
            <el-button size="small" :disabled="!selectedTargets.length" @click="clearSelectedTargets">清空全部</el-button>
          </header>
          <div v-if="selectedTargets.length" class="selected-target-list">
            <article v-for="target in selectedTargets" :key="target.key" class="selected-target-row">
              <button class="selected-target-main" type="button" @click="openSelectedTarget(target)">
                <span class="selected-target-heading"><b>{{ target.sourceLabel }} · {{ target.affixLabel }} · T{{ target.tier.tier }}</b><strong>{{ target.tier.name || target.tier.modifierName }}</strong></span>
                <span class="selected-target-effect">{{ target.tier.text }}</span>
                <span class="selected-target-meta"><span class="tags"><i v-for="tag in target.tier.displayTags" :key="tag.id">{{ tag.label }}</i></span><em>单项权重 {{ target.tier.weight }}</em></span>
              </button>
              <el-button size="small" type="danger" plain aria-label="移除已选目标" @click="removeSelectedTarget(target)">移除</el-button>
            </article>
          </div>
          <p v-else class="selected-target-empty">可勾选 Mod Family，或打开详情多选具体 T 级；已选项在搜索后仍会保留。</p>
        </section>
        <el-collapse>
          <el-collapse-item v-for="group in store.catalog.groups" :key="group.id" :name="group.id">
            <template #title><div class="source-title"><strong>{{ group.label }}</strong><el-tag v-if="group.covered" size="small" type="success">{{ group.prefix.length + group.suffix.length }} 组</el-tag><el-tag v-else size="small" type="warning">{{ group.coverageMessage }}</el-tag></div></template>
            <el-tabs>
              <el-tab-pane v-for="affixType in ['prefix', 'suffix']" :key="affixType" :label="affixType === 'prefix' ? `前缀 (${group.prefix.length})` : `后缀 (${group.suffix.length})`">
                <div v-if="group[affixType].length" class="family-list">
                  <div v-for="family in group[affixType]" :key="family.id" class="family-row">
                    <el-checkbox :model-value="familyChecked(family)" :indeterminate="familyIndeterminate(family)" @change="toggleFamily(family, $event)" />
                    <button class="family-main" @click="openFamily(family)"><span class="family-name"><strong>{{ family.name }}</strong><span class="tags"><i v-for="tag in family.displayTags" :key="tag.id">{{ tag.label }}</i></span></span><span class="family-metrics"><em>{{ family.availableCount }}/{{ family.subitemCount }} 项</em><em>总权重 {{ family.totalWeight }} · {{ formatProbability(family.probability) }}</em></span></button>
                  </div>
                </div>
                <el-empty v-else :description="group.coverageMessage || '没有此类词缀'" :image-size="42" />
              </el-tab-pane>
            </el-tabs>
          </el-collapse-item>
        </el-collapse>
      </el-card>

      <el-dialog v-model="detailVisible" :title="detailFamily ? `${catalogSourceLabel(detailFamily.sourceDomain)} · ${detailFamily.affixType === 'prefix' ? '前缀' : '后缀'} · ${detailFamily.name}` : '词缀详情'" width="min(1000px, 92vw)">
        <el-table :data="detailFamily?.tiers || []" max-height="560">
          <el-table-column width="48"><template #default="{ row }"><el-checkbox :model-value="selectedTierKeys.has(tierSelectionKey(row))" :disabled="!row.available" @change="toggleTier(row, $event, detailFamily)" /></template></el-table-column>
          <el-table-column label="T级" width="72"><template #default="{ row }">T{{ row.tier }}</template></el-table-column>
          <el-table-column label="名称" min-width="130"><template #default="{ row }"><b>{{ row.name || row.modifierName }}</b></template></el-table-column>
          <el-table-column prop="requiredLevel" label="出现等级" width="92" />
          <el-table-column label="具体效果" min-width="250"><template #default="{ row }"><span :class="{ unavailable: !row.available }">{{ row.text }}</span><small v-if="!row.available">{{ row.unavailableReason }}</small></template></el-table-column>
          <el-table-column label="标签" min-width="150"><template #default="{ row }"><span class="tags"><i v-for="tag in row.displayTags" :key="tag.id">{{ tag.label }}</i></span></template></el-table-column>
          <el-table-column label="单项权重" width="150"><template #default="{ row }">{{ row.weight }} · {{ formatProbability(row.probability) }}</template></el-table-column>
        </el-table>
      </el-dialog>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useCraftingStore } from './craftingStore.js'
import { familySelectionState, selectableFamilyTiers, tierSelectionKey, toggleFamilySelection, toggleTierSelection } from './modSelection.js'
import { CATALYST_LABELS, displayedCatalystEntry } from '../../../electron/modules/crafting/catalystRules.js'
import { VAAL_OUTCOME_LABELS } from '../../../electron/modules/crafting/vaalRules.js'
import { affixTierSummary, effectLines, formatProbability, rolledTextWithRanges } from './displayFormat.js'

const store = useCraftingStore()
const pageError = ref('')
const selectedBase = ref(null)
const baseCategoryPath = ref([])
const baseQuery = reactive({ category: '', itemClass: '', query: '' })
const form = reactive({ baseId: '', itemLevel: 86, seed: 20260722, variant: { kind: 'normal', influences: [], fracturedTierId: null, implicits: [] } })
const catalogQuery = ref('')
const showCraftDetails = ref(localStorage.getItem('crafting:show-details') !== 'false')
const essenceQuery = ref('')
const essenceTierFilter = ref(0)
const benchQuery = ref('')
const benchAffixFilter = ref('')
const benchKindFilter = ref('')
const fossilQuery = ref('')
const harvestQuery = ref('')
const harvestCategory = ref('')
const harvestAvailableOnly = ref(false)
const resonatorSockets = ref(1)
const selectedFossilIds = ref([])
const detailVisible = ref(false)
const detailFamily = ref(null)
const selectedTierKeys = ref(new Set())
const selectedTierSnapshots = ref(new Map())
const donorForm = reactive({ baseId: '', itemLevel: 86, influence: '', seed: 20260722 })
const donorTierKey = ref('')
const beastLevel = ref(83)
let catalogTimer = null

// ponytail: 用 reason 文案判定"不适用此物品"，后端没有显式字段；升级路径是在 manualCrafting 给每条打 appliesToBase 标记。
const PERMANENT_UNAVAILABLE_PATTERNS = ['只能用于武器', '只能用于护甲', '不能用于该底材', '不能用于当前底材', '该底材不能拥有', '该底材不能生成', '该底材不能使用', '该底材不支持', '不适用于当前底材', '不适用于该底材', '该配方不能用于当前底材', '不能在本装备模拟器中执行']
function craftAvailabilityTier(item) {
  if (item?.canApply ?? item?.selectable) return 0
  if (item?.supported === false) return 2
  if (item?.supportLevel && item.supportLevel !== 'supported') return 2
  const reason = String(item?.unavailableReason || '')
  if (reason && PERMANENT_UNAVAILABLE_PATTERNS.some((pattern) => reason.includes(pattern))) return 2
  return 1
}
function byAvailability(items) { return [...items].sort((a, b) => craftAvailabilityTier(a) - craftAvailabilityTier(b)) }

const versionUnconfirmed = computed(() => store.status?.stale || ['current', 'unknown'].includes(String(store.status?.patch || '').toLowerCase()))
const updatePercent = computed(() => store.updateProgress?.total ? Math.min(100, Math.round(store.updateProgress.completed / store.updateProgress.total * 100)) : 0)
const rarityLabel = computed(() => ({ normal: '普通', magic: '魔法', rare: '稀有' })[store.currentState?.rarity] || '普通')
const allAffixes = computed(() => store.currentState ? [...store.currentState.prefixes, ...store.currentState.suffixes] : [])
const catalystLabel = (type) => CATALYST_LABELS[type] || type || '催化剂'
const catalystQualityLabel = computed(() => catalystLabel(store.currentState?.catalystQuality?.type))
const vaalOutcomeLabel = (outcome) => VAAL_OUTCOME_LABELS[outcome] || outcome || '未知结果'
const catalystDisplay = (entry) => displayedCatalystEntry(entry, store.currentState?.catalystQuality)
const displayedBaseImplicits = computed(() => (store.currentState?.baseImplicits ?? []).map(catalystDisplay))
const displayedPrefixes = computed(() => (store.currentState?.prefixes ?? []).map(catalystDisplay))
const displayedSuffixes = computed(() => (store.currentState?.suffixes ?? []).map(catalystDisplay))
const displayedBaseStats = computed(() => {
  if (!store.currentState || !store.session) return []
  const quality = Number(store.currentState.quality || 0)
  const qualityType = store.session.base.qualityType
  const defaultQualityActive = !store.currentState.qualityEffect
  return store.currentState.baseStats.map((entry) => {
    const affected = defaultQualityActive && (qualityType === 'weapon' ? /物理伤害/.test(entry.label) : qualityType === 'armour' && /护甲|闪避|能量护盾|结界/.test(entry.label))
    return { ...entry, displayValues: entry.rolledValues.map((value) => affected ? Math.floor(value * (1 + quality / 100)) : value) }
  })
})
const requirementText = computed(() => {
  const requirements = store.session?.base.requirements
  if (!requirements) return ''
  return [`等级 ${requirements.level}`, requirements.strength ? `${requirements.strength} 力量` : '', requirements.dexterity ? `${requirements.dexterity} 敏捷` : '', requirements.intelligence ? `${requirements.intelligence} 智慧` : ''].filter(Boolean).join('，')
})
const socketRows = computed(() => {
  const state = store.currentState
  if (!state) return []
  const groupBySocket = new Map(state.links.flatMap((group, groupIndex) => group.map((id) => [id, groupIndex])))
  return state.sockets.map((socket, index) => ({ ...socket, linkedToNext: index < state.sockets.length - 1 && groupBySocket.get(socket.id) === groupBySocket.get(state.sockets[index + 1].id) }))
})
const eldritchImplicits = computed(() => store.currentState ? [store.currentState.eldritchImplicits?.exarch, store.currentState.eldritchImplicits?.eater].filter(Boolean) : [])
const displayedEldritchImplicits = computed(() => eldritchImplicits.value.map(catalystDisplay))
const displayedVaalImplicit = computed(() => store.currentState?.vaalImplicit ? catalystDisplay(store.currentState.vaalImplicit) : null)
const totalSpent = computed(() => {
  const totals = new Map()
  for (const record of store.session?.history ?? []) for (const cost of record.event?.costs ?? []) {
    const current = totals.get(cost.resourceId) ?? { resourceId: cost.resourceId, resourceName: cost.resourceName, amount: 0 }
    current.amount += Number(cost.amount) || 0
    totals.set(cost.resourceId, current)
  }
  return [...totals.values()]
})
const donorAffixes = computed(() => store.session?.awakenerDonor ? [...store.session.awakenerDonor.state.prefixes, ...store.session.awakenerDonor.state.suffixes] : [])
const filteredEssences = computed(() => {
  const needle = essenceQuery.value.trim().toLocaleLowerCase('zh-CN')
  const list = store.essences.items.filter((entry) => (!essenceTierFilter.value || entry.essenceTier === essenceTierFilter.value) && (!needle || `${entry.name} ${entry.guaranteedModifier.text}`.toLocaleLowerCase('zh-CN').includes(needle)))
  return byAvailability(list)
})
const filteredBenchCrafts = computed(() => {
  const needle = benchQuery.value.trim().toLocaleLowerCase('zh-CN')
  const list = store.benchCrafts.items.filter((entry) => (!benchAffixFilter.value || entry.affixType === benchAffixFilter.value) && (!benchKindFilter.value || entry.kind === benchKindFilter.value) && (!needle || `${entry.name} ${entry.effect} ${entry.unlock} ${entry.displayTags.map((tag) => tag.label).join(' ')}`.toLocaleLowerCase('zh-CN').includes(needle)))
  return byAvailability(list)
})
const filteredFossils = computed(() => {
  const needle = fossilQuery.value.trim().toLocaleLowerCase('zh-CN')
  const list = store.fossils.items.filter((entry) => !needle || `${entry.name} ${entry.description} ${entry.consequences}`.toLocaleLowerCase('zh-CN').includes(needle))
  return byAvailability(list)
})
const filteredHarvest = computed(() => {
  const needle = harvestQuery.value.trim().toLocaleLowerCase('zh-CN')
  const list = store.harvest.items.filter((entry) => (!harvestCategory.value || entry.category === harvestCategory.value) && (!harvestAvailableOnly.value || entry.canApply) && (!needle || `${entry.name} ${entry.categoryLabel} ${entry.tagLabel} ${entry.consequences}`.toLocaleLowerCase('zh-CN').includes(needle)))
  return byAvailability(list)
})
const sortedCurrencies = computed(() => byAvailability(store.currencies))
const sortedEldritch = computed(() => byAvailability(store.eldritch.items))
const sortedInfluence = computed(() => byAvailability(store.influence.items))
const sortedVeiled = computed(() => byAvailability(store.veiled.items))
const sortedBeastcraft = computed(() => byAvailability(store.beastcraft.items))
const selectedFossils = computed(() => selectedFossilIds.value.map((id) => store.fossils.items.find((entry) => entry.id === id)).filter(Boolean))
const selectedTargets = computed(() => [...selectedTierSnapshots.value.values()])
const selectedResonator = computed(() => store.fossils.resonators.find((entry) => entry.sockets === resonatorSockets.value))
const fossilSelectionReason = computed(() => {
  if (selectedFossilIds.value.length !== resonatorSockets.value) return `${resonatorSockets.value} 孔共振器还需要 ${resonatorSockets.value - selectedFossilIds.value.length} 枚化石`
  const invalid = selectedFossils.value.find((entry) => !entry.selectable)
  if (invalid) return invalid.unavailableReason || `${invalid.name}当前不可用`
  return selectedResonator.value?.unavailableReason || ''
})
const categoryOptions = (items = []) => items.map((item) => ({ value: item.itemClass || item.name, label: `${item.name} (${item.count})`, ...(item.children?.length ? { children: categoryOptions(item.children) } : {}) }))
const baseCategoryOptions = computed(() => categoryOptions(store.categories))

onMounted(async () => { try { await store.initialize(); await loadBases() } catch (error) { pageError.value = error?.message || '做装数据初始化失败' } })
onBeforeUnmount(() => { clearTimeout(catalogTimer); store.dispose() })
watch(resonatorSockets, (count) => { selectedFossilIds.value = selectedFossilIds.value.slice(0, count) })
watch(() => store.currentState?.influences?.join('|'), () => { if (store.session) prepareDonorOptions() })
watch(showCraftDetails, (value) => localStorage.setItem('crafting:show-details', String(value)))

async function loadBases() { await store.searchBases({ ...baseQuery, page: 1, pageSize: 100 }) }
async function categoryChanged(path = []) { baseQuery.category = String(path?.[0] || ''); baseQuery.itemClass = String(path?.length > 1 ? path.at(-1) : ''); form.baseId = ''; selectedBase.value = null; await loadBases() }
function searchBaseByName(query) { baseQuery.query = String(query || ''); loadBases() }
function selectBase(id) { selectedBase.value = store.bases.find((entry) => entry.id === id) || null; if (selectedBase.value && form.itemLevel < selectedBase.value.requiredLevel) form.itemLevel = selectedBase.value.requiredLevel }
async function createItem() { try { await store.createSession({ baseId: form.baseId, itemLevel: form.itemLevel, seed: form.seed, variant: form.variant }); clearSelectedTargets(); selectedFossilIds.value = []; donorForm.baseId = form.baseId; donorForm.itemLevel = form.itemLevel; donorForm.seed = form.seed; donorTierKey.value = ''; await prepareDonorOptions(); ElMessage.success('底材已创建，可以开始制作') } catch (error) { pageError.value = error?.message || '无法创建装备' } }
async function useCurrency(currency) { try { await store.applyCurrency(currency.id); ElMessage.success(store.lastEvent?.summary || `${currency.name}已应用`) } catch (error) { ElMessage.error(error?.message || `${currency.name}无法使用`) } }
async function useEssence(essence) { try { await store.applyEssence(essence.id); ElMessage.success(store.lastEvent?.summary || `${essence.name}已应用`) } catch (error) { ElMessage.error(error?.message || `${essence.name}无法使用`) } }
async function useBenchCraft(craft) { try { await store.applyBenchCraft(craft.id); ElMessage.success(store.lastEvent?.summary || `${craft.name}已应用`) } catch (error) { ElMessage.error(error?.message || `${craft.name}无法使用`) } }
function toggleFossil(fossil) { const index = selectedFossilIds.value.indexOf(fossil.id); if (index >= 0) selectedFossilIds.value = selectedFossilIds.value.filter((id) => id !== fossil.id); else if (selectedFossilIds.value.length < resonatorSockets.value) selectedFossilIds.value = [...selectedFossilIds.value, fossil.id]; else ElMessage.warning(`当前共振器只有 ${resonatorSockets.value} 个孔`) }
async function useFossils() { try { await store.applyFossils({ sockets: resonatorSockets.value, fossilIds: selectedFossilIds.value }); ElMessage.success(store.lastEvent?.summary || '共振器已应用') } catch (error) { ElMessage.error(error?.message || '共振器无法使用') } }
async function useHarvestCraft(craft) { try { await store.applyHarvestCraft(craft.id); ElMessage.success(store.lastEvent?.summary || `${craft.name}已应用`) } catch (error) { ElMessage.error(error?.message || `${craft.name}无法使用`) } }
async function useEldritchCraft(craft) { try { await store.applyEldritchCraft(craft.id); ElMessage.success(store.lastEvent?.summary || `${craft.name}已应用`) } catch (error) { ElMessage.error(error?.message || `${craft.name}无法使用`) } }
async function useInfluenceCraft(craft) { try { await store.applyInfluenceCraft(craft.id); ElMessage.success(store.lastEvent?.summary || `${craft.name}已应用`) } catch (error) { ElMessage.error(error?.message || `${craft.name}无法使用`) } }
async function useVeiledCraft(craft) { try { await store.applyVeiledCraft(craft.id); ElMessage.success(store.lastEvent?.summary || `${craft.name}已应用`) } catch (error) { ElMessage.error(error?.message || `${craft.name}无法使用`) } }
async function chooseVeiledOption(option) { try { await store.selectVeiledOption(option.modifierId, option.tierId); ElMessage.success(store.lastEvent?.summary || '加密词缀已揭露') } catch (error) { ElMessage.error(error?.message || '无法揭露所选词缀') } }
async function reloadBeastcrafts() { try { await store.loadBeastcrafts(beastLevel.value) } catch (error) { ElMessage.error(error?.message || '无法刷新野兽工艺') } }
async function useBeastcraft(craft) { try { await store.applyBeastcraft(craft.id, beastLevel.value); ElMessage.success(store.lastEvent?.summary || `${craft.name}已应用`) } catch (error) { ElMessage.error(error?.message || `${craft.name}无法使用`) } }
async function chooseSplitResult(result) { try { await store.selectSplitResult(result.itemId); ElMessage.success(store.lastEvent?.summary || '已选择分裂产物') } catch (error) { ElMessage.error(error?.message || '无法选择分裂产物') } }
async function prepareDonorOptions() { try { const options = await store.loadAwakenerDonorOptions({}); if (!options.bases.some((entry) => entry.id === donorForm.baseId)) donorForm.baseId = options.bases[0]?.id || ''; if (!options.influences.some((entry) => entry.id === donorForm.influence)) donorForm.influence = options.influences[0]?.id || ''; await loadDonorTiers() } catch (error) { pageError.value = error?.message || '无法加载觉醒者供体选项' } }
async function loadDonorTiers() { donorTierKey.value = ''; if (!donorForm.baseId || !donorForm.influence) return; const base = store.awakenerDonorOptions.bases.find((entry) => entry.id === donorForm.baseId); if (base && donorForm.itemLevel < base.requiredLevel) donorForm.itemLevel = base.requiredLevel; await store.loadAwakenerDonorOptions({ baseId: donorForm.baseId, itemLevel: donorForm.itemLevel, influence: donorForm.influence }) }
async function configureDonor() { try { const [modifierId, tierId] = donorTierKey.value.split('|'); await store.configureAwakenerDonor({ ...donorForm, modifierId, tierId }); ElMessage.success(store.lastEvent?.summary || '觉醒者供体已配置') } catch (error) { ElMessage.error(error?.message || '无法配置觉醒者供体') } }
async function clearDonor() { try { await store.clearAwakenerDonor(); ElMessage.success('觉醒者供体已清除') } catch (error) { ElMessage.error(error?.message || '无法清除供体') } }
async function updateData() { try { await store.updateData(); await loadBases(); ElMessage.success('POEDB 文字数据已更新') } catch {} }
function debouncedCatalog() { clearTimeout(catalogTimer); catalogTimer = setTimeout(() => store.loadCatalog({ baseId: store.session.baseId, itemLevel: store.session.itemLevel, query: catalogQuery.value }), 250) }
function openFamily(family) { detailFamily.value = family; detailVisible.value = true }
function familyChecked(family) { return familySelectionState(selectedTierKeys.value, family).checked }
function familyIndeterminate(family) { return familySelectionState(selectedTierKeys.value, family).indeterminate }
function selectedTargetSnapshot(tier, family) { return { key: tierSelectionKey(tier), tier, family, sourceLabel: catalogSourceLabel(family.sourceDomain), affixLabel: family.affixType === 'prefix' ? '前缀' : '后缀' } }
function toggleFamily(family, checked) {
  selectedTierKeys.value = toggleFamilySelection(selectedTierKeys.value, family, checked)
  const snapshots = new Map(selectedTierSnapshots.value)
  selectableFamilyTiers(family).forEach((tier) => checked ? snapshots.set(tierSelectionKey(tier), selectedTargetSnapshot(tier, family)) : snapshots.delete(tierSelectionKey(tier)))
  selectedTierSnapshots.value = snapshots
}
function toggleTier(tier, checked, family = detailFamily.value) {
  selectedTierKeys.value = toggleTierSelection(selectedTierKeys.value, tier, checked)
  const snapshots = new Map(selectedTierSnapshots.value)
  if (checked && tier.available && family) snapshots.set(tierSelectionKey(tier), selectedTargetSnapshot(tier, family))
  else snapshots.delete(tierSelectionKey(tier))
  selectedTierSnapshots.value = snapshots
}
function removeSelectedTarget(target) { toggleTier(target.tier, false, target.family) }
function clearSelectedTargets() { selectedTierKeys.value = new Set(); selectedTierSnapshots.value = new Map() }
function openSelectedTarget(target) { openFamily(target.family) }
function catalogSourceLabel(source) { return ({ base: '基础', shaper: '塑界者', elder: '裂界者', crusader: '圣战', redeemer: '救赎者', hunter: '狩猎者', warlord: '督军', delve: '地心探险', incursion: '穿越', veiled: '隐匿', crafted: '工艺台', essence: '精华' })[source] || source }
function sourceLabel(affix) { return affix.source === 'beast' ? `野兽 · ${affix.sourceItemName || '势技能'}` : affix.sourceItemName ? `精华 · ${affix.sourceItemName}` : (({ natural: '基础', crafted: '工艺台', essence: '精华', delve: '地心探险', incursion: '穿越', veiled: '隐匿', 'veiled-pending': '加密 · 未揭露', shaper: '塑界者', elder: '裂界者', crusader: '圣战', redeemer: '救赎者', hunter: '狩猎者', warlord: '督军' })[affix.source] || affix.source) }
function beastCategoryLabel(category) { return ({ affix: '增删词缀', influence: '势力词缀', meta: '随机元工艺', aspect: '势技能', split: '分裂', state: '状态', socket: '插槽与连接', unsupported: '说明' })[category] || category }
function benchKindLabel(craft) { return ({ remove: '移除', 'remove-enchantment': '移除附魔', meta: '元工艺', 'corrupted-sockets': '腐化定孔', 'corrupted-links': '腐化定连', 'corrupted-colours': '腐化定色' })[craft.kind] || (craft.affixType === 'prefix' ? '前缀' : '后缀') }
function harvestTagLabel(tag) { return ({ fire: '火焰', cold: '冰霜', lightning: '闪电', physical: '物理', life: '生命', defences: '防御', chaos: '混沌', attack: '攻击', caster: '施法', speed: '速度', critical: '暴击', minion: '召唤生物', elemental: '元素', attribute: '属性', mana: '魔力', drop: '掉落' })[tag] || tag }
function formatInfluences(values = []) { return values.map((entry) => sourceLabel({ source: entry })).join(' + ') || '无' }
function influenceLabel(influence) { return store.influence.influenceLabels?.[influence] || sourceLabel({ source: influence }) }
function affixText(affix) { return affix?.rolledText || affix?.text || affix?.name || '未知词缀' }
function currentAffixLimit(type) { return store.currentState?.rarity === 'rare' ? store.session.base.maxAffixes[type] : 1 }
function affixKey(affix) { return `${affix.tierId}:${affix.rolledValues.join(',')}` }
function formatCosts(costs = []) { return costs.length ? costs.map((entry) => `${entry.amount}×${entry.resourceName}`).join(' + ') : '无' }
function formatBaseDefences(entries = []) { return entries.map((entry) => `${entry.label} ${entry.values.join('—')}`).join(' / ') || '无' }
function eldritchSourceLabel(source) { return source === 'exarch' ? '焊界者' : source === 'eater' ? '灭界者' : '无' }
function formatPercent(value) { return `${(Number(value || 0) * 100).toFixed(0)}%` }
function formatDate(value) { return value ? new Date(value).toLocaleString('zh-CN') : '暂无更新时间' }
</script>

<style scoped lang="less">
.craft-page { min-height: 100%; padding: 20px; color: var(--text-primary); }
.page-heading, .status-strip, .card-heading, .source-title, .base-form { display: flex; align-items: center; }
.page-heading { justify-content: space-between; gap: 18px; margin-bottom: 14px; h2 { margin: 0 0 5px; } p { margin: 0; color: var(--text-secondary); } }
.status-strip { gap: 10px; padding: 10px 14px; margin-bottom: 14px; background: var(--el-fill-color-light); border-radius: 8px; > div:first-child { flex: 1; display: flex; flex-direction: column; } span { color: var(--text-secondary); font-size: 12px; } }
.base-panel, .catalog-panel { margin-top: 14px; }
.selected-targets { margin-bottom: 14px; overflow: hidden; border: 1px solid var(--el-border-color); border-radius: 7px; background: var(--el-fill-color-extra-light); > header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border-bottom: 1px solid var(--el-border-color-lighter); > div { display: flex; flex-direction: column; gap: 2px; } small { color: var(--text-secondary); } } }
.selected-target-list { display: grid; max-height: 360px; overflow: auto; }
.selected-target-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 9px 12px; border-bottom: 1px solid var(--el-border-color-lighter); &:last-child { border-bottom: 0; } }
.selected-target-main { display: grid; min-width: 0; gap: 4px; padding: 0; border: 0; background: transparent; color: inherit; text-align: left; cursor: pointer; }
.selected-target-heading, .selected-target-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.selected-target-heading b { color: #c69b53; font-size: 11px; }
.selected-target-effect { color: #8c8cff; white-space: pre-line; }
.selected-target-meta { justify-content: space-between; em { color: var(--text-secondary); font-size: 11px; font-style: normal; } }
.selected-target-empty { margin: 0; padding: 14px 12px; color: var(--text-secondary); font-size: 12px; }
.base-form { gap: 12px; flex-wrap: wrap; :deep(.el-form-item) { margin: 0; min-width: 180px; flex: 1; } :deep(.el-select), :deep(.el-cascader), :deep(.el-input-number) { width: 100%; } }
:deep(.el-select-dropdown__item small) { float: right; color: var(--text-secondary); }
.base-summary { margin: 12px 0 0; color: var(--text-secondary); }
.workbench { display: grid; grid-template-columns: minmax(360px, .9fr) minmax(480px, 1.1fr); gap: 14px; margin-top: 14px; align-items: start; }
.item-column { display: grid; gap: 14px; }
.card-heading { justify-content: space-between; gap: 14px; > div:first-child { display: flex; flex-direction: column; } .el-input { width: 280px; } }
.poe-item { overflow: hidden; margin-bottom: 12px; border: 2px solid #8b8b78; background: #111; color: #ddd; font-family: Georgia, 'Microsoft YaHei', serif; &.rarity-magic { border-color: #8888ff; .item-title { color: #8888ff; } } &.rarity-rare { border-color: #ffff77; .item-title { color: #ffff77; } } }
.item-title { display: flex; flex-direction: column; align-items: center; padding: 10px; border-bottom: 1px solid currentColor; color: #c8c8c8; strong { font-size: 18px; } }
.state-badge { margin-left: 5px; padding: 1px 5px; border: 1px solid #9a8cc9; border-radius: 3px; color: #b7a9e6; font-size: 10px; font-style: normal; &.influence { border-color: #c69b53; color: #e3bd78; } &.corrupted { border-color: #b65b5b; color: #df7777; } &.mirrored { border-color: #74a7c8; color: #9ed5f5; } &.enchanted { border-color: #9b7a43; color: #d5b16f; } }
.state-badge.foreseeing { border-color: #9d70d0; color: #cf9cff; } .state-badge.imprint { border-color: #5c9db2; color: #8dd4e8; }
.item-meta { display: flex; justify-content: space-between; gap: 10px; padding: 9px 12px; color: #aaa; font-size: 12px; border-bottom: 1px solid #444; }
.item-property { display: flex; justify-content: center; gap: 4px; padding: 3px 12px; color: #bbb; b { color: #888; font-weight: normal; } &.quality-property span { color: #9ec5ff; } }
.item-requirements { display: flex; justify-content: center; gap: 8px; margin-top: 5px; padding: 7px 12px; border-top: 1px solid #444; border-bottom: 1px solid #444; color: #aaa; b { color: #777; } }
.socket-row { display: flex; align-items: center; justify-content: center; padding: 9px 12px; border-bottom: 1px solid #444; .socket { display: grid; width: 22px; height: 22px; place-items: center; border: 2px solid; border-radius: 50%; background: #181818; font: bold 10px sans-serif; font-style: normal; z-index: 1; } .socket-r { border-color: #d65c51; color: #ff8e83; } .socket-g { border-color: #4aa66c; color: #79d69a; } .socket-b { border-color: #537dc8; color: #87aff4; } .socket-w { border-color: #ddd; color: #fff; } .socket-link { width: 13px; height: 4px; margin: 0 -1px; background: #a68b61; } }
.implicit-row { padding: 8px 12px; border-bottom: 1px solid #444; color: #8ea8d8; text-align: center; }
.implicit-row.catalysed, .affix-row.catalysed p { color: #d6b56d; }
.eldritch-implicit { display: grid; gap: 2px; &.exarch { color: #e29a62; } &.eater { color: #76a7df; } b, small { font-size: 11px; } }
.vaal-implicit { display: grid; gap: 2px; color: #d86868; b, small { font-size: 11px; } }
.dominance-row { display: flex; justify-content: space-between; gap: 8px; padding: 7px 12px; border-bottom: 1px solid #444; color: #d2c087; font-size: 11px; }
.quality-effect-row { display: grid; gap: 3px; padding: 8px 12px; border-bottom: 1px solid #444; color: #b6a3df; text-align: center; b { color: #8e78bd; font-size: 11px; } }
.empty-affixes { padding: 28px; color: #777; text-align: center; }
.affix-row { display: grid; grid-template-columns: 45px minmax(0, 1fr) minmax(150px, auto); gap: 10px; padding: 9px 12px; border-bottom: 1px solid #292929; .affix-kind { color: #8aa; } p { margin: 3px 0; color: #b9b9ff; } small { color: #888; } &.suffix .affix-kind { color: #c99; } }
.affix-effects { min-width: 0; }
.affix-tier { display: flex; flex-direction: column; align-items: flex-end; justify-content: center; gap: 5px; color: #c69b53; text-align: right; }
.essence-guaranteed { padding: 1px 4px; border: 1px solid #c79a43; border-radius: 3px; color: #e2bd72; font-size: 10px; font-style: normal; }
.crafted-mod { margin-left: 4px; padding: 1px 4px; border: 1px solid #6aa17a; border-radius: 3px; color: #8fd0a0; font-size: 10px; font-style: normal; }
.veiled-badge { margin-left: 4px; padding: 1px 4px; border: 1px solid #a283cf; border-radius: 3px; color: #cbb1f0; font-size: 10px; font-style: normal; }
.fractured-badge { margin-left: 4px; padding: 1px 4px; border: 1px solid #b89a58; border-radius: 3px; color: #e0c070; font-size: 10px; font-style: normal; }
.affix-row.fractured { background: linear-gradient(90deg, rgba(151, 116, 45, .18), transparent); }
.affix-row.veiled-pending { background: linear-gradient(90deg, rgba(114, 74, 153, .2), transparent); p { color: #bda6d8; font-style: italic; } }
.currency-panel { position: sticky; top: 10px; }
.currency-panel.details-hidden { .currency-card > small, .currency-card > em, .currency-card > .tags, .currency-preview { display: none; } .core-function { display: block; } }
.section-note { margin-top: 0; color: var(--text-secondary); }
.currency-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
.essence-filters { display: grid; grid-template-columns: 1fr 150px; gap: 8px; margin-bottom: 10px; }
.bench-filters { display: grid; grid-template-columns: minmax(180px, 1fr) 110px 120px; gap: 8px; margin-bottom: 10px; }
.essence-grid { display: grid; max-height: 640px; gap: 8px; overflow: auto; padding-right: 3px; }
.bench-grid { display: grid; max-height: 640px; gap: 8px; overflow: auto; padding-right: 3px; }
.resonator-builder { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 9px; margin-bottom: 10px; padding: 10px; border: 1px solid var(--el-border-color); border-radius: 7px; .selection-reason { grid-column: 1 / -1; color: var(--el-color-danger); } }
.fossil-slots { display: flex; gap: 5px; span { min-width: 58px; padding: 5px 7px; border: 1px dashed var(--el-border-color); border-radius: 5px; color: var(--text-secondary); text-align: center; font-size: 11px; &.filled { border-style: solid; border-color: #8876bc; color: #9d8ad2; } } }
.fossil-search { margin-bottom: 9px; }
.fossil-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); max-height: 640px; gap: 8px; overflow: auto; padding-right: 3px; }
.fossil-card { .guaranteed-effect { min-height: 42px; white-space: pre-line; } strong { display: flex; justify-content: space-between; i { color: var(--text-secondary); font-size: 11px; font-style: normal; } } &.selected { border-color: #8876bc; background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-bg-color)); } }
.harvest-filters { display: grid; grid-template-columns: minmax(190px, 1fr) 150px auto; align-items: center; gap: 8px; margin: 10px 0; }
.harvest-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); max-height: 640px; gap: 8px; overflow: auto; padding-right: 3px; }
.harvest-card { strong { display: flex; justify-content: space-between; gap: 8px; i { color: #9c84c8; font-size: 11px; font-style: normal; } } }
.eldritch-help { display: grid; gap: 3px; margin: 9px 0; padding: 9px 11px; border: 1px solid var(--el-border-color); border-radius: 6px; color: var(--text-secondary); }
.eldritch-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); max-height: 640px; gap: 8px; overflow: auto; padding-right: 3px; }
.eldritch-card { strong { display: flex; justify-content: space-between; gap: 8px; i { color: #da9661; font-size: 11px; font-style: normal; } } }
.influence-help { display: grid; gap: 3px; margin: 9px 0; padding: 9px 11px; border: 1px solid #806b45; border-radius: 6px; color: var(--text-secondary); }
.influence-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); max-height: 540px; gap: 8px; overflow: auto; padding-right: 3px; }
.influence-card { strong { display: flex; justify-content: space-between; gap: 8px; i { color: #d6b36c; font-size: 11px; font-style: normal; } } }
.veiled-help { display: grid; gap: 3px; margin: 9px 0; padding: 9px 11px; border: 1px solid #755a93; border-radius: 6px; color: var(--text-secondary); }
.veiled-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.veiled-card strong { display: flex; justify-content: space-between; gap: 8px; i { color: #b99bd9; font-size: 11px; font-style: normal; } }
.unveil-panel { display: grid; gap: 10px; margin-top: 14px; padding-top: 13px; border-top: 1px solid #755a93; }
.unveil-heading { display: flex; justify-content: space-between; gap: 12px; div { display: grid; gap: 3px; } small { color: var(--text-secondary); } }
.unveil-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.unveil-option { display: grid; gap: 6px; padding: 11px; border: 1px solid #755a93; border-radius: 7px; background: #15111a; color: var(--text-primary); text-align: left; cursor: pointer; strong { display: grid; gap: 2px; color: #cbb1f0; span { color: #9c84c8; font-size: 11px; } } p { min-height: 44px; margin: 0; color: #b9b9ff; white-space: pre-line; } small { color: var(--text-secondary); } > em { color: #cbb1f0; font-style: normal; text-align: right; } &:hover:not(:disabled) { border-color: #b99bd9; transform: translateY(-1px); } &:disabled { opacity: .55; cursor: not-allowed; } }
.donor-builder { display: grid; gap: 10px; margin-top: 14px; padding-top: 13px; border-top: 1px solid var(--el-border-color); }
.donor-heading { display: flex; justify-content: space-between; gap: 12px; > div { display: grid; gap: 3px; } small { color: var(--text-secondary); } }
.donor-form { display: grid; grid-template-columns: 1fr 120px 120px minmax(220px, 1.5fr) auto; gap: 7px; :deep(.el-input-number) { width: 100%; } }
.donor-preview { display: grid; gap: 4px; padding: 10px 12px; border: 1px solid #c69b53; background: #14120e; color: #ddd; > b { color: #e3bd78; } > span, small { color: #999; } div { margin-top: 4px; padding-top: 6px; border-top: 1px solid #3d3426; } p { margin: 3px 0; color: #b9b9ff; white-space: pre-line; } }
.split-result { display: grid; gap: 3px; margin-top: 8px; padding: 9px 11px; border: 1px solid #8876bc; border-radius: 6px; span, small { color: var(--text-secondary); } }
.mirror-result { border-color: #659bbd; background: rgba(76, 137, 174, 0.08); }
.enchantment-result { display: grid; gap: 3px; margin-top: 8px; padding: 9px 11px; border: 1px solid #9b7a43; border-radius: 6px; background: rgba(155, 122, 67, 0.08); span, small { color: var(--text-secondary); } }
.split-picker { display: grid; gap: 8px; margin-top: 10px; padding: 11px; border: 1px solid #8876bc; border-radius: 7px; > small { color: var(--text-secondary); } button { display: grid; gap: 3px; padding: 9px; border: 1px solid #685993; border-radius: 6px; background: #15121b; color: var(--text-primary); text-align: left; cursor: pointer; span, small { color: var(--text-secondary); } &:hover { border-color: #b49be6; } } }
.currency-preview { display: grid; gap: 3px; margin-top: 5px; padding: 7px; border: 1px solid #76549b; border-radius: 5px; background: #17111e; b { color: #cf9cff; } }
.beast-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 9px; p { margin-bottom: 3px; } small { color: var(--text-secondary); } }
.beast-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); max-height: 640px; gap: 8px; overflow: auto; padding-right: 3px; }
.beast-card { strong { display: flex; justify-content: space-between; gap: 8px; i { color: #85b99b; font-size: 11px; font-style: normal; } } &.unsupported { border-style: dashed; } }
.essence-card { strong { display: flex; justify-content: space-between; gap: 8px; i { color: var(--text-secondary); font-size: 11px; font-style: normal; } } .guaranteed-effect { min-height: 0; color: #b9b9ff; } }
.bench-card { strong { display: flex; justify-content: space-between; gap: 8px; i { color: var(--text-secondary); font-size: 11px; font-style: normal; } } .guaranteed-effect { min-height: 0; color: #b9b9ff; } &.meta:not(.disabled) { border-color: #7c70b8; } &.remove:not(.disabled) { border-color: #b76b61; } }
.currency-card { display: flex; flex-direction: column; gap: 5px; padding: 11px; border: 1px solid var(--el-border-color); border-radius: 7px; background: var(--el-bg-color); color: var(--text-primary); text-align: left; cursor: pointer; strong { color: #c69b53; font-size: 15px; } span { min-height: 36px; } small { color: var(--text-secondary); } em { color: var(--el-color-danger); font-style: normal; } &:hover:not(.disabled) { border-color: var(--el-color-primary); transform: translateY(-1px); } &.destructive:not(.disabled) { border-color: #b76b61; } &.disabled { opacity: .55; cursor: not-allowed; } }
.history-card :deep(.el-timeline-item__content) { p { margin: 3px 0; color: var(--text-secondary); } small { display: block; margin-top: 2px; color: var(--text-secondary); } }
.source-title { width: 100%; justify-content: space-between; padding-right: 10px; }
.family-list { display: grid; gap: 5px; }
.family-row { display: grid; grid-template-columns: 28px 1fr; align-items: center; padding: 6px 8px; border-bottom: 1px solid var(--el-border-color-lighter); }
.family-main { display: flex; justify-content: space-between; gap: 12px; border: 0; background: transparent; color: inherit; text-align: left; cursor: pointer; }
.family-name, .family-metrics { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.family-metrics { justify-content: flex-end; flex-shrink: 0; em { padding: 2px 6px; border-radius: 3px; background: var(--el-fill-color); color: var(--text-secondary); font-size: 12px; font-style: normal; } }
.tags { display: inline-flex; flex-wrap: wrap; gap: 3px; i { padding: 1px 5px; border-radius: 3px; background: #28445b; color: #c5e7ff; font-size: 11px; font-style: normal; } }
.unavailable { color: var(--text-secondary); text-decoration: line-through; & + small { display: block; color: var(--el-color-danger); } }
@media (max-width: 1050px) { .workbench { grid-template-columns: 1fr; } .currency-panel { position: static; } .donor-form { grid-template-columns: 1fr 120px 120px; } .donor-form > :nth-child(4) { grid-column: 1 / 3; } }
@media (max-width: 650px) { .craft-page { padding: 12px; } .page-heading, .card-heading, .donor-heading, .unveil-heading, .beast-heading { align-items: flex-start; flex-direction: column; } .currency-grid, .harvest-grid, .eldritch-grid, .influence-grid, .veiled-grid, .unveil-options, .beast-grid { grid-template-columns: 1fr; } .bench-filters, .harvest-filters, .donor-form { grid-template-columns: 1fr; } .donor-form > :nth-child(4) { grid-column: auto; } .family-main { flex-direction: column; } .family-metrics { justify-content: flex-start; } }
</style>
