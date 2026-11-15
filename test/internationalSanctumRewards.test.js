import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createLocalizedSanctumCatalog } from '../electron/modules/sanctum/localization.js'
import { parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'
import { parseStatusTooltip } from '../electron/modules/sanctum/statusRecognition.js'
import { planSanctumFloor } from '../electron/modules/sanctum/planner.js'
import { createSanctumStrategy } from '../shared/sanctum.js'
import { rewardDetail } from '../shared/sanctumPresentation.js'

const base = JSON.parse(readFileSync(new URL('../electron/assets/sanctum/catalog.international.json',import.meta.url)))
const templates = JSON.parse(readFileSync(new URL('./fixtures/sanctum/reward-client-strings.json',import.meta.url)))
const currency = (id,en,tw,cn) => ({table:'baseitemtypes',id,field:'Name',kind:'dat',en,tw,cn,sourceHash:createHash('sha256').update(en).digest('hex')})
const currencies = [currency('Metadata/Items/Currency/CurrencyRerollRare','Chaos Orb','混沌石','混沌石'),currency('Metadata/Items/Currency/CurrencyModValues','Divine Orb','神聖石','神圣石')]
const catalog = (entries=[...templates,...currencies], revision='active-signed-fixture',data=base) => createLocalizedSanctumCatalog(data,{entriesProvider:()=>entries,revisionProvider:()=>revision})
const timing = id => id.includes('Dungeon')?'run':id.includes('NextFloor')?'next-floor':id.includes('CurrentFloor')?'floor':'immediate'
const render = (entry,locale,name) => entry[locale].replace(/\{(\d+)\}/g,(_,index) => entry.id.includes('Singular') || index==='1' ? name : '4')

test('实际8条ClientStrings奖励模板按英文参数身份解析简繁参数重排和单数量',()=>{
  const data=catalog()
  assert.equal(templates.length,8)
  for (const entry of templates) for (const [locale,name] of [['en','Chaos Orb'],['cn','混沌石'],['tw','混沌石']]) {
    const text=render(entry,locale,name), amount=entry.id.includes('Singular')?1:4
    const parsed=data.parseReward(text)
    assert.equal(parsed.status,'matched',`${entry.id}/${locale}`)
    assert.deepEqual([parsed.quantity,parsed.currency,parsed.timing],[amount,'Chaos Orb',timing(entry.id)])
    const room=parseSanctumRoomTexts([text],data)
    assert.deepEqual(room.rewards,[{groupId:'offer',currency:'Chaos Orb',quantity:amount,timing:timing(entry.id)}])
    const status=parseStatusTooltip({texts:[text],status:'located'},data)
    assert.equal(status.hasRewardContext,true,`${entry.id}/${locale}`)
    assert.equal(status.effectGroup,null,`${entry.id}/${locale}`)
  }
})

test('繁体通货与数量次序独立，折行奖励不误当词缀也不吞掉相邻奖励',()=>{
  const data=catalog(), template=templates.find(entry=>entry.id==='SanctumMultiDungeonReward')
  const text=render(template,'tw','神聖石')
  assert.deepEqual(parseSanctumRoomTexts([text],data).rewards,[{groupId:'offer',currency:'Divine Orb',quantity:4,timing:'run'}])
  const wrapped=['完成聖域時，','獲得','神聖石x4']
  assert.equal(parseStatusTooltip({texts:wrapped,status:'located'},data).effectGroup,null)
  assert.deepEqual(parseSanctumRoomTexts([...wrapped,'Receive 1x Chaos Orb right now'],data).rewards.map(reward=>[reward.currency,reward.quantity,reward.timing]),[['Divine Orb',4,'run'],['Chaos Orb',1,'immediate']])
})

test('未知、歧义通货和无效数量保留缺口，英文也不能省略通货唯一性检查',()=>{
  const template=templates.find(entry=>entry.id==='SanctumMultiDungeonReward')
  for (const [data,text] of [
    [catalog(),render(template,'cn','不存在的通货')],
    [catalog(),render(template,'en','Unknown Currency')],
    [catalog([...templates,...currencies,currency('conflict','Divine Orb','混沌石','混沌石')]),render(template,'cn','混沌石')],
    [catalog([...templates,...currencies],'active',{...base,entries:[...base.entries,{...base.entries.find(entry=>entry.name==='Chaos Orb'),id:'duplicate-chaos'}]}),render(template,'en','Chaos Orb')],
    [catalog(),render(template,'en','Chaos Orb').replace('4x','9999999x')],
    [catalog(),render(template,'en','Chaos Orb').replace('4x','0x')]
  ]) {
    assert.equal(data.parseReward(text)?.status,'unknown',text)
    const room=parseSanctumRoomTexts([text],data)
    assert.equal(room.rewards.length,0,text)
    assert.equal(room.calculationStatus,'unsupported',text)
    const status=parseStatusTooltip({texts:[text],status:'located'},data)
    assert.equal(status.hasRewardContext,false,text)
    assert.equal(status.effectGroup.complete,false,text)
  }
})

test('错误稳定ID、原文哈希、字段、缺少参数或候选资源不能启用翻译模板',()=>{
  const template=templates.find(entry=>entry.id==='SanctumMultiDungeonReward'), text=render(template,'tw','混沌石')
  for (const source of [{...template,id:'UnrelatedText'},{...template,sourceHash:'0'.repeat(64)},{...template,field:'XBoxText'},{...template,tw:'完成聖域時，獲得 {0}x{0}'}]) {
    const data=catalog([...templates.filter(entry=>entry.id!==template.id),source,...currencies])
    assert.equal(data.parseReward(text),null)
    assert.equal(parseSanctumRoomTexts([text],data).rewards.length,0)
    assert.equal(parseStatusTooltip({texts:[text],status:'located'},data).hasRewardContext,false)
  }
  let revision='active'
  const data=createLocalizedSanctumCatalog(base,{entriesProvider:()=>[...templates,...currencies],revisionProvider:()=>revision})
  assert.equal(data.parseReward(text).status,'matched')
  revision=''
  assert.equal(data.parseReward(text),null)
  assert.equal(parseStatusTooltip({texts:[text],status:'located'},data).hasRewardContext,false)
  assert.equal(data.parseReward('Receive 4x Chaos Orb on completing the Sanctum').status,'matched')
})

test('下一楼层领取独立展示并进入路线缺口，不被当作本层已兑现奖励',()=>{
  const data=catalog(),template=templates.find(entry=>entry.id==='SanctumMultiNextFloorReward')
  const room={id:'reward',column:1,row:0,revealed:true,status:'matched',layout:'exit',terminal:true,...parseSanctumRoomTexts([render(template,'cn','混沌石')],data)}
  assert.equal(room.rewards[0].timing,'next-floor')
  assert.match(rewardDetail(room.rewards[0]),/下一楼层结束/)
  const floor={identityConfirmed:true,runId:'r',floorId:'floor:0',mapKey:'map',currentRoomId:'start',positionStatus:'confirmed',rooms:[{id:'start',column:0,row:0},room],edges:[{from:'start',to:'reward',status:'matched'}]}
  const strategy=createSanctumStrategy();strategy.targetPriority={'Chaos Orb':1}
  const plan=planSanctumFloor(floor,strategy)
  assert.equal(plan.optimal,false)
  assert.ok(JSON.stringify(plan).includes('下一楼层结束时领取'))
})

test('国际服旧英文兼容正则不能绕过模板、数量边界和通货身份校验',()=>{
  const data=catalog()
  for (const text of ['Receive 4 Chaos-Orb on completing the Sanctum','Receive 0 Chaos Orb on completing the Sanctum',
    'Gain 999999999 Chaos Orb on completing the Sanctum','Receive 4 Chaos Orb on completing the Sanctum',
    'Gain 4 Chaos Orb','On Sanctum Completion Receive 4 Unknown Currency']) {
    const room=parseSanctumRoomTexts([text],data)
    assert.equal(room.rewards.length,0,text)
    assert.equal(room.calculationStatus,'unsupported',text)
    assert.notEqual(room.detailsStatus,'matched',text)
    const status=parseStatusTooltip({texts:[text],status:'located'},data)
    assert.equal(status.hasRewardContext,false,text)
    assert.equal(status.effectGroup.complete,false,text)
  }
  const effect=parseStatusTooltip({texts:['Gain +40 Maximum Resolve each time you use a Fountain'],status:'located'},data)
  assert.equal(effect.effectGroup.complete,true)
  assert.equal(effect.effectGroup.effects[0].rule,'fountainMaxResolve')
})
