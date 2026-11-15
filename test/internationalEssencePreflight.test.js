import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { generatePythonScript } from '../src/utils/pythonScriptGenerator.js'
import { LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { pythonPath } from './helpers/python.js'

const template=readFileSync(new URL('../src/assets/scripts/crafting_template.py',import.meta.url),'utf8')
const entry=(id,en,cn,tw=cn)=>({table:'baseitemtypes',field:'Name',kind:'dat',id,en,cn,tw,sourceHash:createHash('sha256').update(en).digest('hex')})
const english='Deafening Essence of Greed',simplified='破空精华之贪婪',traditional='破空精髓之貪婪'
const known=[english,'Essence of Horror']
const trustedEntries=[entry('Metadata/Items/Currency/EssenceGreed7',english,simplified,traditional),entry('Metadata/Items/Currency/CurrencyRerollRare','Chaos Orb','混沌石')]
const snapshot=(entries=trustedEntries)=>new LocalizationRuntime({serverId:'international',entries:()=>entries,revision:()=> 'signed-active',baseNames:()=>known}).snapshot()

// Execute the production-generated functions, with every clipboard/mouse
// boundary replaced in memory. Importing the generated module would create OS controllers.
function preflight(localizationSnapshot,names,{sequenceChanged=true}={}) {
  const script=generatePythonScript({serverId:'international',localizationSnapshot,craftingKind:'essence',globalShortcuts:{end:'F12'},currencyPositions:{},itemPosition:{x:1,y:2},actionPosition:{x:3,y:4},filePaths:{},preset:{moduleTwo:{enabled:true,affixGroups:[]},moduleThree:{},moduleEldritch:{}}},template)
  const code=`import ast,json,types
tree=ast.parse(${JSON.stringify(script)})
namespace={'json':json}
for node in tree.body:
    if isinstance(node,ast.Assign) and any(isinstance(target,ast.Name) and target.id in ('localization_snapshot','currency_expected_names','CURRENCY_NAMES') for target in node.targets):
        exec(compile(ast.Module(body=[node],type_ignores=[]),'generated.py','exec'),namespace)
    if isinstance(node,ast.FunctionDef) and node.name in ('copied_item_header','detected_item_name','normalized_copied_item_name','currency_identity_matches','preflight_specialized_action'):
        exec(compile(ast.Module(body=[node],type_ignores=[]),'generated.py','exec'),namespace)
results=[]
for name in json.loads(${JSON.stringify(JSON.stringify(names))}):
    state={'sequence':1,'error':None,'clicks':0}
    text='物品種類: 可堆疊通貨\\n稀有度: 通貨\\n'+name+'\\n--------\\n堆疊數量: 1/9'
    def copy(*args,**kwargs):
        if ${sequenceChanged?'True':'False'}: state['sequence']+=1
        return text
    def fail(reason,code): state['error']=code;return False
    namespace.update({'GetClipboardSequenceNumber':lambda:state['sequence'],'move_mouse':lambda *args:True,'action_position':{'x':1,'y':1},'pyperclip':types.SimpleNamespace(paste=lambda:''),'send_copy_command':copy,'fail_item_runtime':fail})
    passed=namespace['preflight_specialized_action']()
    results.append({'name':name,'passed':passed,'error':state['error']})
print(json.dumps(results,ensure_ascii=False))`
  const result=spawnSync(pythonPath,['-'],{input:code,encoding:'utf8',env:{...process.env,PYTHONUTF8:'1',PYTHONIOENCODING:'utf-8',PYTHONDONTWRITEBYTECODE:'1'}})
  assert.equal(result.status,0,result.stderr)
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

test('真实生成脚本对已知英文与当前简繁精华同等去除合法名称尾注',()=>{
  const names=[english,simplified,traditional].flatMap(name=>[name,`${name}[1c]`,`${name}[0.4c]`,`${name}(★)`,`${name}[1c](★)`])
  assert.ok(preflight(snapshot(),names).every(result=>result.passed))
})

test('未知、错误通货与精华名称、歧义译名和破损尾注仍停止',()=>{
  const ambiguous=snapshot([...trustedEntries,entry('Metadata/Items/Currency/EssenceAnger7','Deafening Essence of Anger',simplified,traditional)])
  const names=['Chaos Orb[1c]','混沌石[1c]','Remnant of Corruption','Essence of DefinitelyNotAnEssence',`Fake ${english}[1c]`,'未知精华[1c]',`${english}[1c]Suffix`]
  for (const result of preflight(snapshot(),names)) {
    assert.equal(result.passed,false,result.name)
    assert.equal(result.error,'ESSENCE_TYPE_MISMATCH',result.name)
  }
  for (const result of preflight(ambiguous,[`${simplified}[1c]`,`${traditional}[1c]`])) assert.equal(result.passed,false,result.name)
})

test('无汉化时只接受已知规范英文精华，空目录和无新复制证据不放行',()=>{
  const trusted=new LocalizationRuntime({serverId:'international',baseNames:()=>known}).snapshot()
  assert.deepEqual(preflight(trusted,[`${english.toLowerCase()}[1c]`,'Essence of Horror(★)',`${traditional}[1c]`]).map(result=>result.passed),[true,true,false])
  assert.equal(preflight({...trusted,canonicalEssenceNames:[]},[english])[0].passed,false)
  const stale=preflight(trusted,[english],{sequenceChanged:false})[0]
  assert.equal(stale.passed,false);assert.equal(stale.error,'ESSENCE_NOT_FOUND')
})
