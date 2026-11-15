import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { generatePythonScript, generateMapRollingScript } from '../src/utils/pythonScriptGenerator.js'
import { pythonPath } from './helpers/python.js'

const craftingTemplate = readFileSync(new URL('../src/assets/scripts/crafting_template.py', import.meta.url), 'utf8')
const mapTemplate = readFileSync(new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url), 'utf8')
const base = {
  globalShortcuts: { end: 'F12' }, itemPosition: { x: 1, y: 2 }, currencyPositions: {},
  preset: { moduleTwo: { enabled: false }, moduleThree: { enabled: false }, moduleEldritch: { enabled: false } },
  inventory: {}, mapConfig: { method: 'alchemy', match: { blacklist: [] } }
}

test('共享生成器可在无window和Vite的Node环境生成，两种语言可显式覆盖服务器默认值', () => {
  assert.equal(globalThis.window, undefined)
  const english = generatePythonScript({ ...base, serverId: 'cn', language: 'en' }, craftingTemplate)
  const chinese = generatePythonScript({ ...base, serverId: 'international', language: 'zh-CN' }, craftingTemplate)
  assert.match(english, /"alteration":\s*"Orb of Alteration"/)
  assert.match(chinese, /currency_expected_names = \{\}/)
  assert.match(generateMapRollingScript({ ...base, language: 'en' }, mapTemplate), /Orb of Alteration/)
  assert.throws(() => generateMapRollingScript({ ...base, language: 'unknown' }, mapTemplate), /语言/)
  assert.throws(() => generatePythonScript({ ...base, craftingKind: '\";print(1)#' }, craftingTemplate), /制作类型/)
})

test('生成器拒绝源码位置的快捷键、路径及插槽数字注入', () => {
  for (const [generate, template] of [[generatePythonScript, craftingTemplate], [generateMapRollingScript, mapTemplate]]) {
    assert.throws(() => generate({ ...base, globalShortcuts: { end: 'F1\");print(1)#' } }, template), /快捷键格式/)
    assert.throws(() => generate({ ...base, filePaths: { itemInfoFile: 'x"\nprint(1)#' } }, template), /通信路径/)
  }
  assert.throws(() => generatePythonScript({ ...base, preset: { ...base.preset, moduleThree: { enabled: true, color: { enabled: true, red: '0);print(1)#', green: 1, blue: 0 } } } }, craftingTemplate), /插槽数量/)
})

test('JSON字符串保留布尔词和模板标记，数据不得二次展开成Python源码', () => {
  const hostile = 'true false null {{DPI_AWARENESS}} ");print("injected")#'
  const script = generateMapRollingScript({ ...base, mapConfig: { ...base.mapConfig, match: { blacklist: [hostile], whitelist: ['safe'] } } }, mapTemplate)
  const result = spawnSync(pythonPath, ['-c', `import ast,json,sys
tree=ast.parse(sys.stdin.read())
node=next(n.value for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='map_config' for t in n.targets))
assert isinstance(node,ast.Call) and isinstance(node.func,ast.Attribute) and node.func.attr=='loads'
print(json.dumps(json.loads(ast.literal_eval(node.args[0]))['match']['blacklist']))`], { input: script, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), [hostile])
})
