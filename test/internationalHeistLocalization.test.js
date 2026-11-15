import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { createLocalizationDictionary } from '../electron/modules/localization/text.js'
import { matchMapRequirements } from '../electron/modules/item/matcher.js'

// Actual, signature-verified ClientStrings copied into an offline fixture;
// these are never activated or fetched during the test.
const clientStrings=JSON.parse(readFileSync(new URL('./fixtures/heist-client-strings.json',import.meta.url)))
const entry=(id,en,cn,tw=cn,table='baseitemtypes',kind='dat')=>({id,en,cn,tw,table,kind,field:kind==='stat'?'variant:0':'Name',sourceHash:createHash('sha256').update(en).digest('hex')})
const target=entry('Metadata/Items/Heist/HeistFinalObjective29','Golden Matatl Idol',undefined,'黃金麥塔爾神像')
const modifier=entry('heist-life','Monsters have {0}% more Life','怪物生命总增 {0}%','怪物有 {0}% 更多生命','metadata/statdescriptions/map_stat_descriptions.txt','stat')
const entries=[...clientStrings,target,modifier]
const runtime=(source=entries,revision='active')=>new LocalizationRuntime({serverId:'international',entries:()=>source,revision:()=>revision})
const field=(id,locale)=>clientStrings.find(entry=>entry.id===id)[locale]
const render=(id,locale,values)=>field(id,locale).replace(/\{(\d+)\}/g,(_,parameter)=>values[Number(parameter)])
const text=(locale,kind='Contracts',{targetName=locale==='tw'?'黃金麥塔爾神像':'Golden Matatl Idol',job='Lockpicking',npc='"Karst, the Lockpick"'}={})=>{
  const language=locale==='en'?{itemClass:'Item Class',category:kind,rarity:'Rarity',rare:'Rare',quantity:'Item Quantity',itemRarity:'Item Rarity',level:'Item Level'}
    :locale==='cn'?{itemClass:'物品类别',category:kind==='Contracts'?'契约':'蓝图',rarity:'稀有度',rare:'稀有',quantity:'物品数量',itemRarity:'物品稀有度',level:'物品等级'}
      :{itemClass:'物品種類',category:kind==='Contracts'?'契約':'藍圖',rarity:'稀有度',rare:'稀有',quantity:'物品數量',itemRarity:'物品稀有度',level:'物品等級'}
  const metadata=[`${field('ItemDisplayHeistContractLevel',locale)}: 83`,render('ItemDisplayHeistContractObjectiveWithValue',locale,[targetName,'Moderate Value']),
    render('ItemDisplayHeistContractJob',locale,['5',job]),render('ItemDisplayHeistJobRequirement',locale,['3 (unmet)','Deception']),render('ItemDisplayHeistContractNPC',locale,[npc])]
  if(kind==='Blueprints')for(const id of ['ItemDisplayHeistBlueprintWings','ItemDisplayHeistBlueprintEscapeRooms','ItemDisplayHeistBlueprintRewardRooms'])metadata.push(`${field(id,locale)}: 4/4`)
  return [`${language.itemClass}: ${language.category}`,`${language.rarity}: ${language.rare}`,locale==='en'?'Doom Trail':locale==='cn'?'灾厄之途':'災厄之途',kind==='Contracts'?'Contract: Bunker':'Blueprint: Bunker','--------',...metadata,
    `${language.quantity}: +80%`,`${language.itemRarity}: +20%`,`${field('ItemDisplayHeistAlertLevelReduction',locale)}: +30%`,`${field('ItemDisplayHeistLockdownTimeIncrease',locale)}: +40%`,`${field('ItemDisplayHeistMaxReinforcements',locale)}: -25%`,
    '--------',`${language.level}: 83`,'--------','{ Prefix Modifier "Healthy" (Tier: 1) }',locale==='en'?'Monsters have 30% more Life':locale==='cn'?'怪物生命总增 30%':'怪物有 30% 更多生命',
    '--------',field(kind==='Contracts'?'ItemDescriptionHeistContract':'ItemDescriptionHeistBlueprint',locale)].join('\n')
}
const mapConfig={targetKind:'heist',match:{mandatoryStats:{quantity:{enabled:true,value:80},timeBeforeLockdown:{enabled:true,value:40}},whitelist:['Monsters have #% more Life'],blacklist:[]}}

test('完整契约/蓝图的实际英文简繁结构和English参数统一，不把目标/要求/揭露信息混入词缀',()=>{
  for(const kind of ['Contracts','Blueprints'])for(const locale of ['en','cn','tw']){
    const source=text(locale,kind),item=runtime().parseItem(source,'active')
    assert.equal(item.category,kind==='Contracts'?'契约':'蓝图',`${kind}/${locale}`)
    assert.equal(item.areaLevel,83)
    assert.deepEqual(item.heistStats,{quantity:80,rarity:20,alertLevelReduction:30,timeBeforeLockdown:40,maximumAliveReinforcements:-25})
    assert.deepEqual(item.explicitMods,['Monsters have 30% more Life'])
    assert.equal(item.modifiers[0].tier,1)
    assert.equal(item.isQuestItem,false)
    assert.equal(matchMapRequirements(item,mapConfig).isMatch,true)
    assert.equal(matchMapRequirements(item,{...mapConfig,match:{...mapConfig.match,blacklist:['more Life']}}).reason,'blacklist')
    assert.equal(item.originalText,source)
    assert.match(item.canonicalText,/Requires Deception \(Level 3 \(unmet\)\)/)
  }
})

test('NPC引号逗号与目标价值字符串保留，额外中文参数只在当前词库精确映射时通过',()=>{
  const known=[entry('fixture-job','Lockpicking','开锁','撬鎖','test-heist-names'),entry('fixture-npc','Karst, the Lockpick','卡斯特，解密者','卡司特，撬鎖者','test-heist-names'),entry('fixture-value','Moderate Value','中等价值','中等價值','test-heist-names')]
  for(const [locale,job,npc]of[['cn','开锁','"卡斯特，解密者"'],['tw','撬鎖','"卡司特，撬鎖者"']]){
    const source=text(locale,'Contracts',{job,npc}).replace('Moderate Value',locale==='cn'?'中等价值':'中等價值')
    const item=runtime([...entries,...known]).parseItem(source,'active')
    assert.match(item.canonicalText,/Requires "Karst, the Lockpick"/)
    assert.match(item.canonicalText,/Golden Matatl Idol \(Moderate Value\)/)
    assert.deepEqual(item.explicitMods,['Monsters have 30% more Life'])
    assert.throws(()=>runtime().parseItem(source,'active'),/未匹配/,'当前资源没有独立Job/NPC译名时不能猜译')
  }
})

test('活动ClientStrings标签进入snapshot，大小写Lockdown字段和实际简繁揭露名可用',()=>{
  const value=runtime().snapshot().structureAliases
  for(const [alias,canonical]of[['赏金目标','Heist Target'],['劫盜目標','Heist Target'],['发现的侧厅','Wings Revealed'],['已揭露側廂','Wings Revealed'],['揭露逃脫路線','Escape Routes Revealed'],['最大生存支援','Maximum Alive Reinforcements'],['Time Before Lockdown','Time before Lockdown']])assert.equal(value[alias],canonical,alias)
  const source=text('cn','Blueprints').replace('封锁前的时间','Time Before Lockdown')
  assert.equal(runtime().parseItem(source,'active').heistStats.timeBeforeLockdown,40)
})

test('legacy ## 仅移除已知结构字段前缀，不豁免未知中文身份或词缀',()=>{
  for(const locale of ['cn','tw']){
    const source=text(locale).replace(locale==='cn'?'物品等级: 83':'物品等級: 83',locale==='cn'?'## 物品等级: 83':'## 物品等級: 83')
    const item=runtime().parseItem(source,'active')
    assert.equal(item.level,83)
    assert.deepEqual(item.explicitMods,['Monsters have 30% more Life'])
    assert.equal(item.originalText,source)
    assert.throws(()=>runtime().parseItem(source+'\n## 未知关键状态: 未知状态','active'),/未匹配/)
    assert.throws(()=>runtime().parseItem(source+'\n## 未知危险词缀','active'),/未匹配/)
  }
})

test('错误稳定ID/en/hash、结构标签歧义、未知目标/Job参数与候选失效都不静默省略',()=>{
  const wings=clientStrings.find(entry=>entry.id==='ItemDisplayHeistBlueprintWings')
  for(const wrong of [{...wings,id:'WrongItemDisplayId',cn:'伪侧厅'}, {...wings,sourceHash:'0'.repeat(64),cn:'伪侧厅'}, {...wings,en:'Other Wings',sourceHash:createHash('sha256').update('Other Wings').digest('hex'),cn:'伪侧厅'}]){
    const source=[...entries.filter(entry=>entry.id!==wings.id),wrong]
    assert.ok(!createLocalizationDictionary(source).aliasesFor('Wings Revealed').includes('伪侧厅'))
    assert.throws(()=>runtime(source).parseItem(text('cn','Blueprints').replace('发现的侧厅','伪侧厅'),'active'),/未匹配/)
  }
  const collision=entries.map(entry=>['ItemDisplayHeistBlueprintWings','ItemDisplayHeistBlueprintEscapeRooms'].includes(entry.id)?{...entry,cn:'重复结构标签'}:entry)
  assert.throws(()=>runtime(collision).parseItem(text('cn','Blueprints').replace('发现的侧厅','重复结构标签'),'active'),/多个候选/)
  assert.throws(()=>runtime().parseItem(text('cn','Contracts',{targetName:'未知目标'}),'active'),/未匹配/)
  assert.throws(()=>runtime().parseItem(text('cn','Contracts',{job:'未知职业'}),'active'),/未匹配/)
  assert.throws(()=>runtime([...entries,entry('target-conflict','Other Idol',undefined,'黃金麥塔爾神像')]).parseItem(text('tw'),'active'),/多个.*候选/)
  assert.throws(()=>runtime(entries,'').parseItem(text('tw'),''),/未匹配/)
})
