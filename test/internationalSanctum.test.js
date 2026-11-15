import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createInternationalSanctumCatalog } from '../scripts/sanctum/internationalCatalog.js'
import { createLocalizedSanctumCatalog, normalizeSanctumEvidence } from '../electron/modules/sanctum/localization.js'
import { isCurrentSanctumEntry, resolveSanctumCatalogText } from '../electron/modules/sanctum/catalog.js'
import { parseSanctumRoomTexts, parseSanctumCurrentEffects } from '../electron/modules/sanctum/liveDriver.js'
import { parseStatusTooltip } from '../electron/modules/sanctum/statusRecognition.js'
import { parseResourceRegions } from '../electron/modules/sanctum/runObservation.js'
import { parseSanctumResearch } from '../electron/modules/sanctum/research.js'
import { runPython } from './helpers/python.js'

const base = JSON.parse(readFileSync(new URL('../electron/assets/sanctum/catalog.international.json', import.meta.url)))
const entry = (id, en, tw, cn) => ({ table: 'ClientStrings', id, field: 'Text', kind: 'dat', en, tw, cn, sourceHash: createHash('sha256').update(en).digest('hex') })
const entries = [entry('fountain', 'Contains Fountain', '包含噴泉', '包含喷泉'), entry('recover', 'Recover {0} Resolve', '恢復 {0} 點堅毅', '恢复 {0} 点坚毅'),
  entry('skull', 'Demonic Skull', '惡魔頭骨', '恶魔头骨'), entry('no-recovery', 'Cannot recover Resolve', '無法恢復堅毅', '不能恢复坚毅'),
  entry('offers', 'Offers Items on Completion', '完成後提供物品', '完成后提供物品'), entry('coins', 'Chaos Orb', '混沌石', '混沌石'),
  entry('resolve', 'Resolve', '堅毅', '坚毅'), entry('inspiration', 'Inspiration', '啟迪', '启迪')]
const catalog = () => createLocalizedSanctumCatalog(base, { entriesProvider: () => entries, revisionProvider: () => 'signed-current' })

test('国际服独立当前目录记录来源与审核证据，不等价规则保持未知', () => {
  assert.equal(base.server, 'international')
  assert.equal(base.patch, '3.30.0')
  assert.equal(base.versionEvidence.sentinel, 'Covens v3.30')
  assert.ok(base.sources.every(source => /^[a-f0-9]{64}$/.test(source.sha256)))
  assert.equal(base.entries.filter(entry => ['boon','affliction'].includes(entry.kind) && entry.rules.every(Boolean)).length, 114)
  for (const name of ['Gold Trophy','Orb of Negation','Gold Magnet','Charred Coin','Wooden Effigy','Hungry Fangs','Voodoo Doll','Enchanted Urn','Unholy Urn']) {
    const unsupported = base.entries.find(entry => entry.name === name)
    assert.equal(unsupported.ruleSupport,'unsupported',name)
    assert.deepEqual(unsupported.rules,[null],name)
    assert.ok(unsupported.reviewEvidence.reason,name)
  }
  assert.equal(new Set(base.entries.map(entry => entry.id)).size, base.entries.length)
  assert.equal(isCurrentSanctumEntry(base, base.entries[0]), true)
  assert.equal(isCurrentSanctumEntry({ ...base, patch: '3.29' }, base.entries[0]), false)
  assert.equal(isCurrentSanctumEntry({ ...base, versionEvidence: null }, base.entries[0]), false)
  assert.equal(resolveSanctumCatalogText(base, 'affliction', 'Ghastly Scythe').reason, 'AMBIGUOUS')
})

test('相同英文、受管简繁正文得到相同房型、恢复值和效果，保留原文', () => {
  const data = catalog()
  for (const texts of [['Contains Fountain','Recover 25 Resolve'], ['包含喷泉','恢复 25 点坚毅'], ['包含噴泉','恢復 25 點堅毅']]) {
    const result = parseSanctumRoomTexts(texts, data)
    assert.equal(result.type, 'fountain')
    assert.equal(result.recovery, 25)
    assert.ok(result.rawText.includes(texts[0]))
  }
  for (const text of ['Cannot recover Resolve','不能恢复坚毅','無法恢復堅毅']) {
    const result = parseStatusTooltip({ texts:[text], status:'located' },data)
    assert.equal(result.effectGroup.entries[0].effects[0].rule, 'cannotRecover')
    assert.equal(result.effectGroup.complete, true)
    assert.equal(parseSanctumCurrentEffects([text], data, true)[0].rule, 'cannotRecover')
  }
})

test('当前汉化撤销或歧义不会沿用旧别名，国际服不借国服规则解析未知中文', () => {
  let revision = 'a', current = entries
  const data = createLocalizedSanctumCatalog(base, { entriesProvider: () => current, revisionProvider: () => revision })
  assert.equal(parseStatusTooltip({ texts:['不能恢复坚毅'],status:'located' },data).effectGroup.complete,true)
  revision = 'b'; current = []
  assert.equal(parseStatusTooltip({ texts:['不能恢复坚毅'],status:'located' },data).effectGroup.complete,false)
  assert.equal(parseSanctumCurrentEffects(['不能恢复坚毅'],data,true)[0].status,'unknown')
  current = [...entries,entry('other','Other unmatched effect','無法恢復堅毅','不能恢复坚毅')]; revision='c'
  assert.equal(parseStatusTooltip({ texts:['不能恢复坚毅'],status:'located' },data).effectGroup.complete,false)
  revision=''; current=entries
  assert.equal(data.normalizeText('不能恢复坚毅'),'不能恢复坚毅')
  assert.equal(data.entries.find(entry=>entry.name==='Demonic Skull').aliases.includes('恶魔头骨'),false)
  assert.deepEqual(data.nativeText().offers,['Offers Items on Completion'])
})

test('英文奖励领取、稳定通货图标和英文资源数值进入相同结构', () => {
  const data = catalog()
  const result = parseSanctumRoomTexts(['Receive 4x Chaos Orb on completing the Sanctum'],data)
  assert.deepEqual(result.rewards,[{groupId:'offer',currency:'Chaos Orb',quantity:4,timing:'run'}])
  const icons = normalizeSanctumEvidence({currencyIcons:[{currency:'混沌石',key:'chaos-orb',confidence:1}]},data)
  assert.equal(icons.currencyIcons[0].currency,'Chaos Orb')
  const status = parseStatusTooltip({texts:['Receive 4x Chaos Orb on completing the Sanctum'],status:'located'},data)
  assert.equal(status.hasRewardContext,true)
  assert.equal(status.effectGroup,null)
  const wrapped = parseStatusTooltip({texts:['Receive 4x','Chaos Orb','on completing the Sanctum'],status:'located'},data)
  assert.equal(wrapped.hasRewardContext,true);assert.equal(wrapped.effectGroup,null)
  const mixed = parseStatusTooltip({texts:['+100 to Inspiration','Receive 4x','Chaos Orb','on completing the Sanctum'],status:'located'},data)
  assert.equal(mixed.effectGroup.entries[0].effects[0].rule,'gainInspiration')
  assert.equal(mixed.hasRewardContext,true)
  const floor = {identityConfirmed:true,runId:'run',floorId:'floor:0',currentRoomId:'room'}
  const reads = {hudResourcesRegion:{status:'located',texts:['Resolve: 150/300','Inspiration: 20']}}
  const resources = parseResourceRegions(reads,floor,data)
  assert.equal(resources.resolve,150);assert.equal(resources.maxResolve,300);assert.equal(resources.inspiration,20)
  const traditional = parseResourceRegions({hudResourcesRegion:{status:'located',texts:['堅毅: 150/300','啟迪: 20']}},floor,data)
  assert.equal(traditional.resolve,150);assert.equal(traditional.inspiration,20)
})

test('英文研究文本读取资源和未绑定效果，不根据研究文本虚构当前楼层', () => {
  const value = parseSanctumResearch('Item Class: Sanctum Research\nRarity: Rare\nSanctum Research\n--------\nArea Level: 83\nResolve: 200/300\nInspiration: 10\nAureus: 123\nMinor Afflictions: Demonic Skull',catalog())
  assert.equal(value.status,'parsed');assert.equal(value.coins,123);assert.deepEqual(value.resolve,{current:200,maximum:300})
  assert.equal(value.effects[0].rawText,'Demonic Skull');assert.equal(value.bindingStatus,'unconfirmed')
})

test('国际服目录生成拒绝错误赛季、缺表和中英数值结构冲突', () => {
  const html = language => `<a title="Covens v3.30"></a>${[[language==='en'?'Boon':'恩赐','boon'],['Affliction','affliction'],['Rooms','room']].map(([id,kind])=>`<section id="${id}"><div><img alt="${kind}"><div class="flex-grow-1">${kind}<div>${language==='en'?'Minor Boons':'次要恩赐'}</div><div class="explicitMod">${language==='en'?'100% more Damage':'伤害总增100%'}</div></div></div></section>`).join('')}<section id="Rewards"><table><tbody><tr><td><a href="Chaos_Orb">Chaos Orb</a></td></tr></tbody></table></section>`
  const options = {englishHtml:html('en'),chineseHtml:html('cn'),fetchedAt:'2026-11-15T00:00:00Z'}
  assert.ok(createInternationalSanctumCatalog(options).entries.length)
  assert.throws(()=>createInternationalSanctumCatalog({...options,patch:'3.29'}),/版本/)
  assert.throws(()=>createInternationalSanctumCatalog({...options,englishHtml:options.englishHtml.replace('Covens v3.30','old')}),/赛季标识/)
  assert.throws(()=>createInternationalSanctumCatalog({...options,chineseHtml:options.chineseHtml.replaceAll('100','200')}),/数值不一致/)
})

test('相同图标、相同数字但英文否定或触发条件变化不会自动通过审核', () => {
  const html = (language, description) => `<a title="Covens v3.30"></a><section id="${language==='en'?'Boon':'恩赐'}"><div><img alt="unknown"><div class="flex-grow-1">Unknown<div class="explicitMod">Unknown</div></div></div></section><section id="Affliction"><div><img alt="CurseDemonicSkullIcon"><div class="flex-grow-1">${language==='en'?'Demonic Skull':'恶魔颅骨'}<div>${language==='en'?'Major Afflictions':'主要痛苦'}</div><div class="explicitMod">${description}</div></div></div></section><section id="Rooms"><div class="flex-grow-1">Room</div></section><section id="Rewards"><table><tbody><tr><td><a href="Chaos_Orb">Chaos Orb</a></td></tr></tbody></table></section>`
  const options = { englishHtml:html('en','Cannot recover Resolve'), chineseHtml:html('cn','不能恢复坚毅'), fetchedAt:'2026-11-15T00:00:00Z' }
  const reviewed = createInternationalSanctumCatalog(options).entries.find(entry=>entry.name==='Demonic Skull')
  assert.equal(reviewed.rules[0].rule,'cannotRecover')
  for (const text of ['Can recover Resolve','Cannot recover Resolve after completing a room']) {
    const changed = createInternationalSanctumCatalog({...options,englishHtml:html('en',text)}).entries.find(entry=>entry.name==='Demonic Skull')
    assert.equal(changed.applicability,'unverified')
    assert.deepEqual(changed.rules,[null])
  }
})

test('Python英文及当前受管繁体奖励提示触发图标补读，普通正文不触发', () => {
  const result = runPython(`import sys,json\nsys.path.insert(0,'src/assets/scripts')\nfrom sanctum_ocr import has_currency_offer\nprint(json.dumps([has_currency_offer(['Offers Items on Completion']),has_currency_offer(['完成後提供物品'],{'offers':['完成後提供物品']}),has_currency_offer(['Cannot recover Resolve'])]))`)
  assert.deepEqual(result,[true,true,false])
})
