import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { generateMapRollingScript } from '../src/utils/pythonScriptGenerator.js'
import { LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { pythonPath } from './helpers/python.js'

const template=readFileSync(new URL('../src/assets/scripts/map_rolling_template.py',import.meta.url),'utf8')
const snapshot=()=>new LocalizationRuntime({serverId:'international'}).snapshot()
const categories=['Maps (Low)','Maps (Mid)','Maps (Top)','Maps (Uber)']
const item=(category,extra={})=>({category,mapTier:17,quality:20,rarity:'普通',good:false,explicitMods:[],...extra})

// Only compile production functions and data. Every input boundary is replaced
// in memory, so the generated module never creates an OS controller.
function replay(method,cases,localizationSnapshot=snapshot()) {
  const script=generateMapRollingScript({serverId:'international',localizationSnapshot,globalShortcuts:{end:'F12'},currencyPositions:{wisdom:{x:1,y:1},scouring:{x:2,y:2},alchemy:{x:3,y:3},chaos:{x:4,y:4}},filePaths:{},mapConfig:{targetKind:'atlas',method,autoStash:true,vaal:{enabled:false},exalted:{enabled:false},match:{mandatoryStats:{},optionalStats:{}}}},template)
  const code=`import ast,json,types
tree=ast.parse(${JSON.stringify(script)})
ns={'json':json}
for node in tree.body:
    if isinstance(node,ast.Assign) and any(isinstance(target,ast.Name) and target.id in ('localization_snapshot','map_config','currency_expected_names','CURRENCY_NAMES','currency_positions','required_currency_types') for target in node.targets):
        exec(compile(ast.Module(body=[node],type_ignores=[]),'generated.py','exec'),ns)
    if isinstance(node,ast.FunctionDef) and node.name in ('rolling_target_label','item_matches_rolling_target','rolling_item_level_label','completed_map_result','failed_map_result','_explicit_affix_count','fill_rare_map_affixes','process_single_map','read_current_rolling_target','copied_item_header','detected_item_name','normalized_copied_item_name','currency_identity_matches','preflight_required_currencies'):
        exec(compile(ast.Module(body=[node],type_ignores=[]),'generated.py','exec'),ns)
results=[]
for case in json.loads(${JSON.stringify(JSON.stringify(cases))}):
    events=[]
    state=dict(case['item'])
    def apply(currency,x,y):
        events.append(currency)
        if case.get('readError'): return {'error':'unconfirmed'}
        if currency=='wisdom': state['isUnidentified']=False
        elif currency=='scouring': state.update(rarity='普通',good=False)
        else: state.update(rarity='稀有',good=True)
        return dict(state)
    ns.update(is_running=True,fatal_error_reason='',apply_currency_and_read=apply,stash_item=lambda x,y:events.append('stash'),check_map_base=lambda value:value.get('good',False),check_map_mods=lambda value:value.get('good',False))
    outcome=ns['process_single_map'](dict(state),10,20)
    ns.update(read_and_parse=lambda *args,**kwargs:'request',wait_for_parse_result=lambda request:dict(state))
    batch=ns['read_current_rolling_target'](10,20,attempts=1)
    header=ns['copied_item_header']('物品種類: '+str(state['category'])+'\\n稀有度: 稀有\\nKnown Map\\n--------')
    results.append({'outcome':outcome,'events':events,'batchAccepted':not bool(batch.get('error')),'copiedName':ns['detected_item_name'](header)})
clipboard={'sequence':1,'currency':None,'failure':None}
def move(x,y):
    clipboard['currency']=next(currency for currency,position in ns['currency_positions'].items() if position=={'x':x,'y':y})
    return True
def copy(*args,**kwargs):
    clipboard['sequence']+=1
    name=ns['currency_expected_names'][clipboard['currency']]
    if isinstance(name,list): name=name[0]
    return '物品種類: 可堆疊通貨\\n稀有度: 通貨\\n'+name+'[1c]\\n--------'
def fail(currency,reason,actual='',failure_code='CONFIGURATION_MISSING'):
    clipboard['failure']=failure_code
    return False
ns.update(verified_currency_types=set(),GetClipboardSequenceNumber=lambda:clipboard['sequence'],move_mouse=move,pyperclip=types.SimpleNamespace(paste=lambda:''),send_copy_command=copy,fail_currency_preflight=fail)
preflight=ns['preflight_required_currencies']()
def wrong_copy(*args,**kwargs):
    clipboard['sequence']+=1
    return 'Item Class: Maps (Uber)\\nRarity: Normal\\nKnown Map\\n--------'
ns['send_copy_command']=wrong_copy
wrong_preflight=ns['preflight_required_currencies']()
print(json.dumps({'results':results,'requiredCurrencies':ns['required_currency_types'],'preflight':preflight,'wrongPreflight':wrong_preflight,'wrongCode':clipboard['failure']},ensure_ascii=False))`
  const result=spawnSync(pythonPath,['-'],{input:code,encoding:'utf8',env:{...process.env,PYTHONUTF8:'1',PYTHONIOENCODING:'utf-8',PYTHONDONTWRITEBYTECODE:'1'}})
  assert.equal(result.status,0,result.stderr)
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

test('真实生成脚本四类地图按实际稀有度走统一点金/混沌策略，不因17阶跳过',()=>{
  for(const method of ['alchemy','chaos']) {
    const cases=categories.flatMap(category=>[
      {item:item(category)},
      {item:item(category,{rarity:'魔法'})},
      {item:item(category,{rarity:'稀有'})},
      {item:item(category,{rarity:'稀有',good:true})}
    ])
    const result=replay(method,cases)
    assert.equal(result.preflight,true)
    assert.equal(result.wrongPreflight,false)
    assert.equal(result.wrongCode,'CURRENCY_TYPE_MISMATCH')
    assert.deepEqual(result.requiredCurrencies,method==='alchemy'?['wisdom','scouring','alchemy']:['wisdom','scouring','alchemy','chaos'])
    result.results.forEach((value,index)=>{
      const expected= index%4===0?['alchemy','stash']:index%4===1?['scouring','alchemy','stash']:index%4===2?(method==='alchemy'?['scouring','alchemy','stash']:['chaos','stash']):['stash']
      assert.deepEqual(value.events,expected,`${method}/${cases[index].item.category}/${index%4}`)
      assert.equal(value.outcome.qualified,true)
      assert.equal(value.batchAccepted,true)
      assert.equal(value.copiedName,'Known Map')
    })
  }
})

test('四类中英文简繁snapshot别名用于批量识别，未知类别和安全状态仍阻止制作',()=>{
  const current=snapshot()
  const aliases=Object.entries(current.structureAliases).filter(([,canonical])=>canonical==='Maps').map(([alias])=>alias)
  assert.ok(categories.every(category=>aliases.includes(category)),'共享四类结构别名已注入生成快照')
  assert.ok(aliases.some(alias=>alias.includes('地图') && alias.includes('Low')))
  assert.ok(aliases.some(alias=>alias.includes('地圖') && alias.includes('Uber')))
  const normal=replay('alchemy',aliases.map(category=>({item:item(category)})),current)
  assert.ok(normal.results.every(value=>value.outcome.qualified && value.batchAccepted))
  const states=[{category:'Maps (Unknown)'},{category:'Body Armours'},{isQuestItem:true},{isLegendary:true},{isUnmodifiable:true},{isCorrupted:true},{isCorrupted:true,good:true}]
  const guarded=replay('alchemy',states.map(extra=>({item:item('Maps (Uber)',extra)})))
  guarded.results.forEach(value=>assert.deepEqual(value.events,value.outcome.qualified?['stash']:[]))
  assert.equal(guarded.results[0].outcome.code,'MAP_TARGET_MISMATCH')
  assert.equal(guarded.results[1].outcome.code,'MAP_TARGET_MISMATCH')
  const failed=replay('alchemy',[{item:item('Maps (Uber)'),readError:true}]).results[0]
  assert.equal(failed.outcome.code,'MAP_REREAD_FAILED')
  assert.deepEqual(failed.events,['alchemy'])
})

test('无汉化快照四类英文也可制作，统一类别不按地图阶级或品质分流',()=>{
  const cases=categories.flatMap(category=>[0,1,16,17,20].map(mapTier=>({item:item(category,{mapTier,quality:mapTier})})))
  const values=replay('alchemy',cases,{}).results
  assert.ok(values.every(value=>value.outcome.qualified && value.batchAccepted))
  values.forEach(value=>assert.deepEqual(value.events,['alchemy','stash']))
})
