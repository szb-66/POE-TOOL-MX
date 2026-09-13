// Explicitly reviewed mechanics. Exact text (including numbers and negations)
// is required; a matched name alone is never a parameter source.
const compact = text => text.replace(/\s/g, '')
const definitions = new Map()
function define(text, rule, options = {}) {
  definitions.set(compact(text), Object.freeze({rule, mode:'conditional', event:'room', scope:'any', stacking:'unique', ...options}))
}
const conditional = (text, rule, scope, direction, options = {}) => define(text,rule,{scope,direction,...options})
const numeric = (text, rule, event, value, options = {}) => define(text,rule,{mode:'numeric',event,value,...options})

conditional('防御总增 50%', 'defencesMore', 'combat', 1, {value:50})
conditional('每个房间开始时，对你施加一个随机的神龛效果', 'randomShrine', 'combat', 1, {event:'entry',random:true})
conditional('最多复制3项随机贡品奖励', 'copyTributes', 'reward', 1, {value:3,event:'acquire',random:true,once:true})
conditional('复制一个随机贡品奖励', 'copyTributes', 'reward', 1, {value:1,event:'acquire',random:true,once:true})
numeric('完成房间时你获得的耀金币提高10%（从商人处购买物品后移除）', 'completionCoinsIncrease', 'completion', 10, {expires:'purchase'})
conditional('商人的商店可以被重随了', 'merchantReroll', 'merchant', 1, {event:'purchase'})
conditional('你在商人处的下一次购买不会产生消耗', 'freePurchase', 'merchant', 1, {event:'purchase',once:true})
numeric('增加 +100 层启迪', 'gainInspiration', 'acquire', 100)
numeric('陷阱对坚毅的影响降低50%', 'trapResolveModifier', 'resolveLoss', -50, {scope:'trap'})
conditional('你获得的下一个次要恩赐转换为一个随机主要恩赐', 'upgradeNextBoon', 'boon', 1, {event:'gainBoon',once:true,random:true})
numeric('每次你使用喷泉时，获得+40最大坚毅', 'fountainMaxResolve', 'fountain', 40, {scope:'fountain'})
conditional('当你使用喷泉时获得一个随机次要恩赐', 'fountainBoon', 'fountain', 1, {event:'fountain',random:true})
numeric('增加 +150 最大坚毅', 'gainMaxResolve', 'acquire', 150)
conditional('当你的启迪变为0时，触发奥术增幅者', 'arcaneAegis', 'combat', 1, {event:'inspirationDepleted'})
numeric('进入首领房间时恢复50%最大坚毅', 'bossRecoveryPercent', 'entry', 50, {scope:'boss'})
numeric('坚毅低于50%时，恢复的坚毅增加100%', 'lowResolveRecovery', 'recovery', 100, {threshold:50})
numeric('坚毅低于50%时，获得的耀金币提高100%', 'lowResolveCoins', 'coinGain', 100, {threshold:50})
conditional('你和你的召唤生物伤害增加50%', 'playerDamageIncrease', 'combat', 1, {value:50})
conditional('怪物的生命上限降低30%', 'monsterLifeReduced', 'combat', 1, {value:30})
numeric('怪物对坚毅的影响降低25%', 'monsterResolveModifier', 'resolveLoss', -25, {scope:'combat'})
conditional('怪物的行动速度降低20%', 'monsterActionSlow', 'combat', 1, {value:20})
conditional('陷阱现在更慢了', 'slowTraps', 'trap', 1)
numeric('获得的耀金币翻倍', 'coinsDouble', 'coinGain', 2)
numeric('本楼层获得的耀金币翻倍', 'coinsDoubleFloor', 'coinGain', 2, {expires:'floor'})
conditional('拾取耀金币时恢复坚毅', 'coinPickupRecovery', 'coins', 1, {event:'coinPickup'})
numeric('当坚毅变为0时，恢复所有坚毅，然后失去50%当前最大坚毅，并移除一个随机恩赐', 'reviveSacred', 'resolveDepleted', 100, {random:true,once:true})
numeric('当坚毅变为0时，恢复到75%最大坚毅一次', 'reviveOnce', 'resolveDepleted', 75, {once:true})
numeric('你拥有启迪时失去的坚毅减少40%', 'inspiredResolveReduction', 'resolveLoss', 40)
numeric('当你获得痛苦时，获得 +30 层启迪', 'inspirationOnAffliction', 'gainAffliction', 30)
numeric('每个楼层开始时获得 +100 层启迪', 'inspirationOnFloor', 'floorStart', 100)
numeric('下次你的坚毅低于20%时，恢复50%坚毅', 'lowResolveRescue', 'resolveLoss', 50, {threshold:20,once:true})
conditional('被击中而失去坚毅后的1秒内不会再失去坚毅', 'hitGracePeriod', 'combat', 1, {event:'hit',value:1})
numeric('在完成房间时恢复+15坚毅', 'recoveryOnRoom', 'completion', 15)
conditional('每个房间内首次承受伤害不会失去坚毅', 'firstHitImmune', 'combat', 1, {event:'hit',usesPerRoom:1})
conditional('陷阱现在失效了', 'trapsDisabled', 'trap', 1)
numeric('商人处的出售价格降低50%', 'merchantPrice', 'purchase', -50, {scope:'merchant'})
numeric('坚毅恢复提高50%', 'recoveryIncrease', 'recovery', 50)
numeric('当你被击中而失去坚毅时，获得 10 枚耀金币', 'coinsOnHit', 'hitResolveLoss', 10, {scope:'combat'})
numeric('找到的耀金币数量增加50%', 'coinsFoundModifier', 'coinGain', 50)
conditional('移动速度提高60%', 'movementSpeedIncrease', 'any', 1, {value:60})
conditional('怪物伤害减少40%', 'monsterDamageReduced', 'combat', 1, {value:40})
conditional('无坚毅缓阻或坚毅护盾，无法避免失去坚毅', 'noResolveDefences', 'combat', -1)
conditional('无法获得坚毅护盾', 'noResolveAegis', 'combat', -1)
conditional('敌人击中无视你的坚毅缓阻', 'ignoreResolveMitigation', 'combat', -1)
conditional('无法避免被敌人击中造成的坚毅损失', 'noResolveAvoidance', 'combat', -1)
conditional('怪物击中时使用石化', 'petrifyingHit', 'combat', -1, {event:'hit'})
conditional('商人仅提供一个选项', 'merchantOneOption', 'merchant', -1, {value:1})
conditional('非传奇物品失去效果', 'nonUniqueItemsDisabled', 'combat', -1)
conditional('移动速度降低40%。', 'movementSpeedReduced', 'any', -1, {value:40})
conditional('房间内的宝箱被打开时会爆炸', 'explodingChests', 'chest', -1, {event:'chestOpen'})
conditional('守卫们有一个石像鬼陪伴', 'gargoyleGuards', 'combat', -1)
conditional('怪物的行动速度减缓不会低于基础速度怪物的攻击，施法，移动速度提高30%', 'monsterSpeedFloor', 'combat', -1, {value:30})
numeric('减少100最大坚毅', 'gainMaxResolve', 'acquire', -100)
conditional('怪物总会击退怪物造成的击退距离提高', 'monsterKnockback', 'combat', -1, {event:'hit'})
conditional('怪物击中时施加坚毅要害', 'resolveWeakness', 'combat', -1, {event:'hit'})
conditional('守卫死亡时释放一个异动奇点', 'deathAnomaly', 'combat', -1, {event:'guardDeath'})
conditional('怪物击中时施加束缚之链', 'bindingHit', 'combat', -1, {event:'hit'})
numeric('使用药剂时失去10层坚毅', 'flaskResolveLoss', 'flask', 10)
conditional('当你使用喷泉时获得一个随机次要痛苦', 'fountainAffliction', 'fountain', -1, {event:'fountain',random:true})
conditional('当你获得痛苦时，获得一个额外的随机次要痛苦', 'extraAffliction', 'affliction', -1, {event:'gainAffliction',random:true})
conditional('商人提供的选项减少50%', 'merchantOptionsReduced', 'merchant', -1, {value:50})
conditional('你最多可以拥有5个恩赐', 'boonLimit', 'boon', -1, {value:5,event:'gainBoon'})
numeric('坚毅低于50%时，失去的坚毅增加100%', 'lowResolveLoss', 'resolveLoss', 100, {threshold:50})
numeric('你无法获得耀金币', 'cannotGainCoins', 'coinGain', 0)
conditional('能见度降低90%隐藏小地图', 'localVisibilityReduced', 'any', -1, {value:90})
conditional('怪物的生命上限总增 50%', 'monsterLifeMore', 'combat', -1, {value:50})
numeric('宝箱不再掉落耀金币', 'noChestCoins', 'coinGain', 0, {scope:'chest'})
numeric('怪物不再掉落耀金币', 'noMonsterCoins', 'coinGain', 0, {scope:'combat'})
numeric('完成房间时损失30枚耀金币', 'completionCoinLoss', 'completion', 30)
numeric('在完成楼层时损失所有的耀金币', 'floorCoinLoss', 'floorEnd', 100)
numeric('商人处的出售价格提高50%', 'merchantPrice', 'purchase', 50, {scope:'merchant'})
numeric('当你被击中而失去坚毅时，损失20枚耀金币', 'coinsOnHit', 'hitResolveLoss', -20, {scope:'combat'})
conditional('房间内会生成异动奇点', 'roomAnomaly', 'any', -1)
conditional('陷阱现在更快了', 'fastTraps', 'trap', -1)
conditional('你和你的召唤生物伤害总降 40%', 'playerDamageLess', 'combat', -1, {value:40})
numeric('找到的耀金币数量减少50%', 'coinsFoundModifier', 'coinGain', -50)

export function extendedSanctumRule(rawText) {
  if (typeof rawText !== 'string') return null
  const text = compact(rawText), found = definitions.get(text)
  if (found) return {...found}
  let match = /^你下次攻击的(?:(\d+)个)?守卫将立即死亡$/.exec(text)
  if (match && (!match[1] || +match[1] >= 2 && +match[1] <= 10)) return {rule:'guardKill',mode:'conditional',event:'guardAttack',scope:'guards',direction:1,remainingUses:+match[1] || 1,stacking:'unique'}
  match = /^如果你完成接下来([12])个房间并且未失去坚毅或启迪，获得150层启迪$/.exec(text)
  if (match) return {rule:'flawlessInspiration',mode:'conditional',event:'completion',scope:'any',direction:1,remainingRooms:+match[1],value:150,stacking:'unique'}
  return null
}

export const SANCTUM_EXTENDED_RULES = Object.freeze([...definitions.values()].reduce((rules,item)=>({...rules,[item.rule]:item}), {
  guardKill:{rule:'guardKill',mode:'conditional',event:'guardAttack',scope:'guards',direction:1},
  flawlessInspiration:{rule:'flawlessInspiration',mode:'conditional',event:'completion',scope:'any',direction:1}
}))

// Existing structural mechanics share the same evaluation metadata. Their
// flags still feed knowledge/reachability; the conditional explanation never
// synthesizes unseen room contents.
export const SANCTUM_BASE_RULES = Object.freeze({
  cannotRecover:{scope:'recovery',direction:-1,reason:'无法恢复坚毅，恢复机会失效'},
  cannotGainInspiration:{scope:'inspiration',direction:-1,reason:'无法获得启迪，相关奖励不产生启迪收益'},
  cannotGainBoons:{scope:'boon',direction:-1,reason:'不能获得恩赐，相关房间的恩赐机会失效'},
  roomsHidden:{scope:'any',direction:-1,reason:'房间内容隐藏，不推断未知房间'},
  rewardsHidden:{scope:'reward',direction:-1,reason:'奖励隐藏，无法比较未读取奖励'},
  afflictionsHidden:{scope:'any',direction:-1,reason:'后续痛苦隐藏，无法保证风险已知'},
  typesHidden:{scope:'any',direction:-1,reason:'房型隐藏，后续布局选择不确定'},
  visionReduced:{scope:'any',direction:-1,reason:'可见房间减少，降低后续选择的信息完整性'},
  visionIncreased:{scope:'any',direction:1,reason:'可见房间增加，提供后续读取机会，不推算未显示内容'},
  fullMapRevealed:{scope:'any',direction:1,reason:'地图完全显示，提供后续读取与分支选择机会'},
  randomDestination:{scope:'any',direction:-1,reason:'可能进入随机房间，所选路线和目标不保证到达'},
  relicEffectReduction:{scope:'relic',direction:-1,reason:'已装备圣物效果降低'},
  relicEffectIncrease:{scope:'relic',direction:1,reason:'已装备圣物效果提高'},
  minorAfflictionImmune:{scope:'affliction',direction:1,reason:'不能再获得次要痛苦'},
  convertNextAffliction:{scope:'affliction',direction:1,reason:'下一痛苦转换为随机次要恩赐，结果需重新读取'},
  convertNextBoon:{scope:'boon',direction:-1,reason:'下一恩赐转换为随机次要痛苦，结果需重新读取'},
  recoveryReduced:{scope:'recovery',direction:-1,reason:'坚毅恢复降低50%'},
  lethalTraps:{scope:'trap',direction:-1,reason:'陷阱会结束本轮'},
  dangerousTraps:{scope:'trap',direction:-1,reason:'陷阱对坚毅影响提高'},
  dangerousMonsters:{scope:'combat',direction:-1,reason:'怪物危险效果在战斗房间生效'},
  endsOnResolveLoss:{scope:'any',direction:-1,reason:'失去坚毅即结束本轮，无法假定无伤'},
  randomAfflictionEachRoom:{scope:'any',direction:-1,reason:'本房间随机临时痛苦；完成房间移除，不假定具体随机结果'},
  preventResolveLoss:{scope:'any',direction:1,reason:'本房间不会失去坚毅'},
  resolveLossCountdown:{scope:'any',direction:-1,reason:'到期完成房间会失去坚毅'},
  completionResolveLossPercent:{scope:'any',direction:-1,reason:'完成房间按当前坚毅失去坚毅'},
})

export const SANCTUM_STATE_RULES = Object.freeze(Object.fromEntries([
  ...Object.entries(SANCTUM_BASE_RULES).map(([rule,metadata])=>[rule,{rule,mode:'conditional',event:'room',stacking:'unique',...metadata}]),
  ...Object.entries(SANCTUM_EXTENDED_RULES)
]))
