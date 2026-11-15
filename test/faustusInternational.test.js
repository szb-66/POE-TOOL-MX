import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createFaustusRuntimeLanguage } from '../electron/modules/faustus/runtimeLanguage.js'
import { FaustusManager } from '../electron/modules/faustus/manager.js'
import { normalizeFaustusStartRequest } from '../electron/modules/faustus/schema.js'
import { getServer } from '../shared/serverMode.js'
import { pythonPath } from './helpers/python.js'

const entry = (table, id, en, cn, tw, field = 'Text') => ({ kind: 'dat', table, id, field, en, cn, tw, sourceHash: createHash('sha256').update(en).digest('hex') })
const entries = [
  entry('clientstrings2', 'AsyncTradeStashPanelTitle', 'Merchant', '商人', '商人'),
  entry('clientstrings2', 'AsyncTradeStashTabName', 'Shop', '商店', '商店'),
  entry('clientstrings2', 'AsyncTradeStashPanelPriceItemConfirmationTitle', 'Set Item Price', '设置物品价格', '設定物品價格'),
  entry('clientstrings2', 'AsyncTradeStashPanelPriceItemConfirmationActionButton', 'List Item', '上架物品', '上架物品'),
  entry('baseitemtypes', 'Metadata/Items/Currency/CurrencyRerollRare', 'Chaos Orb', '混沌石', '混沌石', 'Name'),
  entry('baseitemtypes', 'Metadata/Items/Currency/CurrencyModValues', 'Divine Orb', '神圣石', '神聖石', 'Name'),
  entry('baseitemtypes', 'Metadata/Items/Armours/HelmetStr12', 'Royal Burgonet', '君主之盔', '皇室堅盔', 'Name')
]
const footprints = { schemaVersion: 1, strictKnownItems: true, items: { '*\u001froyal burgonet': { width: 2, height: 2 } }, categories: {} }
const profile = (extra = {}) => createFaustusRuntimeLanguage({ server: getServer('international'), entries, revision: 'active-r1', footprints, ...extra })

test('浮士德按稳定条目标识构建英文及活动简繁快照，不采用候选与错误源hash', () => {
  const active = profile()
  assert.deepEqual(active.anchors.priceTitle, ['Set Item Price', '设置物品价格', '設定物品價格'])
  assert.deepEqual(active.currencies.divine, ['Divine Orb', '神圣石', '神聖石'])
  assert.equal(active.itemBaseAliases['君主之盔'], 'royal burgonet')
  assert.equal(active.itemBaseAliases['royal burgonet'], 'royal burgonet')
  assert.deepEqual(profile({ revision: '' }).anchors.priceTitle, ['Set Item Price'])
  assert.deepEqual(profile({ entries: entries.map(item => ({ ...item, sourceHash: 'invalid' })) }).currencies.divine, ['Divine Orb'])
  const cn = createFaustusRuntimeLanguage({ entries, revision: 'active-r1', footprints })
  assert.deepEqual(cn.currencies.divine, ['神圣石'])
  assert.equal(cn.localizationRevision, '')
})

test('浮士德歧义通货译名拒绝启动，底材歧义不猜身份', () => {
  assert.throws(() => profile({ entries: [...entries, entry('baseitemtypes', 'Metadata/Items/Currency/CurrencyModValues', 'Divine Orb', '混沌石', undefined, 'Name')] }), /歧义/)
  assert.equal(profile({ entries: [...entries, entry('baseitemtypes', 'different', 'Other Helmet', '君主之盔', undefined, 'Name')] }).itemBaseAliases['君主之盔'], null)
})

test('浮士德管理器覆盖渲染端语言字段，受管资源更新后重新取得快照', () => {
  let revision = 'active-r1'
  const manager = new FaustusManager({ server: getServer('international'), fileSystem: { existsSync: () => true },
    localizationProvider: () => entries, localizationRevisionProvider: () => revision })
  const first = manager.internalRuntimeConfig({ runtime_language: { serverId: 'cn', currencies: { chaos: ['wrong'] } } })
  assert.equal(first.runtime_language.serverId, 'international')
  assert.equal(first.runtime_language.localizationRevision, 'active-r1')
  revision = ''
  assert.deepEqual(manager.internalRuntimeConfig({}).runtime_language.anchors.shop, ['Shop'])
  assert.deepEqual(first.runtime_language.anchors.shop, ['Shop', '商店'])
  assert.throws(() => normalizeFaustusStartRequest({ config: {}, runtime_language: {} }), /不支持/)
})

test('浮士德可信快照在真实Python识别和占位链路支持英文、简体、繁体且保留拒绝条件', () => {
  const script = String.raw`import importlib.util,json,sys
spec=importlib.util.spec_from_file_location('faustus','src/assets/scripts/faustus_market_repricing.py')
f=importlib.util.module_from_spec(spec);spec.loader.exec_module(f)
data=json.load(sys.stdin);language=data['language'];footprints=data['footprints']
def candidate(text,y=0):return {'text':text,'score':0.99,'box':[[0,y],[150,y],[150,y+20],[0,y+20]]}
result=[]
for title,merchant,shop,submit,currency,item in [
 ('Set Item Price','Merchant','Shop','List Item','Chaos Orb','Item Class: Helmets\nRarity: Rare\nDoom Crown\nRoyal Burgonet\n--------'),
 ('设置物品价格','商人','商店','上架物品','神圣石','物品类别: 头部\n稀有度: 稀有\n灾变\n君主之盔\n--------'),
 ('設定物品價格','商人','商店','上架物品','神聖石','物品種類：頭部\n稀有度：稀有\n災變\n皇室堅盔\n--------')]:
 adapter=f.GameAdapter.__new__(f.GameAdapter);adapter.config={'runtime_language':language}
 context=adapter._price_context_from_candidates([candidate(title),candidate(currency,40),candidate(submit,80)])
 parsed=f.parse_item_header(item.replace('\\n','\n'),language['itemBaseAliases'])
 result.append([f.validate_page_anchors([candidate(merchant),candidate(shop)],language)[0],context['currencyCode'],f.resolve_item_footprint(parsed,footprints)])
for text in ['Orb of Alchemy','神聖石碎片']:
 try:f.select_unique_currency([candidate(text)],language=language);raise AssertionError('wrong currency accepted')
 except f.ItemSkip:pass
try:f.select_unique_currency([candidate('Chaos Orb'),candidate('混沌石')],language=language);raise AssertionError('duplicate currency accepted')
except f.ItemSkip:pass
assert f.validate_page_anchors([candidate('Merchant')],language)[0] is False
magic=f.parse_item_header('Item Class: Helmets\nRarity: Magic\nStout Royal Burgonet of the Rainbow\n--------'.replace('\\n','\n'),language['itemBaseAliases'])
assert f.resolve_item_footprint(magic,footprints)=={'width':2,'height':2}
adapter=f.GameAdapter.__new__(f.GameAdapter);adapter.config={'runtime_language':language};adapter._price_open_started=None;adapter._popup_region=lambda:{};adapter.trace_timing=lambda *args,**kwargs:None
for warning in ['Cannot modify this item yet','錯誤','冷却中']:
 adapter.capture_ocr=lambda _,text=warning:[candidate(text)]
 assert adapter.submission_result()=='submit_warning'
print(json.dumps(result))`
  const result = spawnSync(pythonPath, ['-c', script], { input: JSON.stringify({ language: profile(), footprints }), encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout.trim()), [[true, 'chaos', { width: 2, height: 2 }], [true, 'divine', { width: 2, height: 2 }], [true, 'divine', { width: 2, height: 2 }]])
})
