import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { existsSync as _m0_existsSync, readFileSync as _m0_readFileSync } from 'node:fs'
import _m0_path from 'node:path'
import { spawnSync as _m0_spawnSync } from 'node:child_process'
import { fileURLToPath as _m0_fileURLToPath } from 'node:url'
import { AutomationLock as _m0_AutomationLock } from '../electron/modules/automation/lock.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { existsSync as _m1_existsSync, mkdtempSync as _m1_mkdtempSync, readFileSync as _m1_readFileSync, rmSync as _m1_rmSync, writeFileSync as _m1_writeFileSync } from 'node:fs'
import { tmpdir as _m1_tmpdir } from 'node:os'
import _m1_path from 'node:path'
import { spawnSync as _m1_spawnSync } from 'node:child_process'
import { fileURLToPath as _m1_fileURLToPath } from 'node:url'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { CONNECTED_INTERNAL_MASKS as _m2_CONNECTED_INTERNAL_MASKS, DIRECTIONS as _m2_DIRECTIONS, assignSourceSlots as _m2_assignSourceSlots, solvePuzzle as _m2_solvePuzzle, typeForMask as _m2_typeForMask, validateSolution as _m2_validateSolution } from '../src/domains/puzzle/solver.js'

// === Merged from puzzleAutoPlacement.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const existsSync = _m0_existsSync
  const readFileSync = _m0_readFileSync
  const path = _m0_path
  const spawnSync = _m0_spawnSync
  const fileURLToPath = _m0_fileURLToPath
  const AutomationLock = _m0_AutomationLock
const workspace = fileURLToPath(new URL('..', import.meta.url))
const python = path.join(workspace, '.runtime', 'python-runtime', 'python.exe')
const scripts = path.join(workspace, 'src', 'assets', 'scripts')
const source = relative => readFileSync(path.join(workspace, relative), 'utf8')

test('内置隔离 Python 可直接启动自动放置脚本', { skip: !existsSync(python) }, () => {
  const script = path.join(scripts, 'puzzle_auto_place.py')
  const result = spawnSync(python, [script, '--help'], {
    cwd: scripts,
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1' }
  })
  assert.equal(result.status, 0, result.stderr)
})

test('Python 自动放置几何与逆时针旋转遵守对称性', { skip: !existsSync(python) }, () => {
  const code = [
    `import json,sys;sys.path.insert(0,${JSON.stringify(scripts)})`,
    'from puzzle_auto_place import cell_center, counter_clockwise_turns, verification_neutral_point',
    'region={"left":-600,"top":20,"right":0,"bottom":1020}',
    'atlas={"left":100,"top":100,"right":400,"bottom":400}',
    'inventory={"left":500,"top":100,"right":800,"bottom":700}',
    'display={"x":0,"y":0,"width":1200,"height":800}',
    'print(json.dumps({"center":cell_center(region,10,6,9,5),"neutral":verification_neutral_point(atlas,inventory,display),"corner":counter_clockwise_turns("corner",0,90),"straight":counter_clockwise_turns("straight",90,270),"cross":counter_clockwise_turns("cross",270,90)}))'
  ].join(';')
  const result = spawnSync(python, ['-c', code], { cwd: scripts, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), { center: [-50, 970], neutral: [250, 76], corner: 3, straight: 0, cross: 0 })
})

test('海图点击必须等待落点稳定并保持按键，异常时仍释放按键', { skip: !existsSync(python) }, () => {
  const code = [
    `import json,sys;sys.path.insert(0,${JSON.stringify(scripts)})`,
    'import puzzle_auto_place as module',
    'events=[]',
    'class User32:',
    '  def mouse_event(self,flag,*args): events.append(["mouse",flag])',
    'module.move_physical=lambda x,y: events.append(["move",x,y])',
    'module.user32_api=lambda: User32()',
    'module.is_game_foreground=lambda: events.append(["foreground"]) or True',
    'module.time.sleep=lambda seconds: events.append(["sleep",round(seconds,3)])',
    'module.click_physical(10,20,"left",0.02)',
    'normal=list(events)',
    'events.clear()',
    'sleeps=0',
    'def failing_sleep(seconds):',
    '  global sleeps',
    '  sleeps += 1',
    '  events.append(["sleep",round(seconds,3)])',
    '  if sleeps == 2: raise RuntimeError("hold interrupted")',
    'module.time.sleep=failing_sleep',
    'try: module.click_physical(30,40,"right",0.5)',
    'except RuntimeError: pass',
    'print(json.dumps({"normal":normal,"interrupted":events}))'
  ].join('\n')
  const result = spawnSync(python, ['-c', code], { cwd: scripts, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  const output = JSON.parse(result.stdout)
  assert.deepEqual(output.normal, [
    ['move', 10, 20], ['sleep', 0.02], ['foreground'],
    ['mouse', 0x0002], ['sleep', 0.015], ['mouse', 0x0004], ['sleep', 0.01]
  ])
  assert.deepEqual(output.interrupted, [
    ['move', 30, 40], ['sleep', 0.5], ['foreground'],
    ['mouse', 0x0008], ['sleep', 0.015], ['mouse', 0x0010], ['sleep', 0.01]
  ])
})

test('拿取来源后等待固定画面时序再放置并移出目标格', { skip: !existsSync(python) }, () => {
  const code = [
    `import json,sys;sys.path.insert(0,${JSON.stringify(scripts)})`,
    'import puzzle_auto_place as module',
    'events=[]',
    'module.click_physical=lambda x,y,button,delay: events.append(["click",x,y,button])',
    'module.move_physical=lambda x,y: events.append(["move",x,y])',
    'module.time.sleep=lambda seconds: events.append(["sleep",round(seconds,3)])',
    'module.place_fragment((10,20),(30,40),0.04,(50,60))',
    'print(json.dumps(events))'
  ].join(';')
  const result = spawnSync(python, ['-c', code], { cwd: scripts, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  const events = JSON.parse(result.stdout)
  assert.deepEqual(events.filter(event => event[0] === 'click'), [
    ['click', 10, 20, 'left'], ['click', 30, 40, 'left']
  ])
  assert.deepEqual(events, [
    ['click', 10, 20, 'left'], ['sleep', 0.01], ['click', 30, 40, 'left'], ['move', 50, 60]
  ])
})

test('仓库右键旋转后必须确认实际角度再拿取碎片', { skip: !existsSync(python) }, () => {
  const code = [
    `import json,sys;sys.path.insert(0,${JSON.stringify(scripts)})`,
    'import puzzle_auto_place as module',
    'events=[]',
    'module.timing_mode="fixed"',
    'source={"row":0,"column":0,"occupied":True,"type":"corner","orientation":0,"confidence":0.9,"uncertain":False}',
    'captures=iter([{"success":True,"slots":[{**source,"orientation":0}]+[{}]*59},{"success":True,"slots":[{**source,"orientation":0}]+[{}]*59},{"success":True,"slots":[{**source,"orientation":270}]+[{}]*59}])',
    'module.click_physical=lambda x,y,button,delay: events.append(["click",x,y,button])',
    'module.capture_analyze=lambda *args,**kwargs: events.append(["capture"]) or next(captures)',
    'module.time.sleep=lambda seconds: events.append(["sleep",round(seconds,3)])',
    'ok,confirmed,actual=module.rotate_source_to_target({"left":0,"top":0,"right":600,"bottom":1000},{},source,270,0.04)',
    'print(json.dumps({"ok":ok,"orientation":confirmed["orientation"],"events":events}))'
  ].join(';')
  const result = spawnSync(python, ['-c', code], { cwd: scripts, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  const output = JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
  assert.equal(output.ok, true)
  assert.equal(output.orientation, 270)
  assert.equal(output.events.filter(event => event[0] === 'click' && event[3] === 'right').length, 1, '识别重试不得重复右键')
  assert.equal(output.events.filter(event => event[0] === 'capture').length, 3)
})

test('多次旋转必须逐次确认角度后才能继续下一次右键', { skip: !existsSync(python) }, () => {
  const code = [
    `import json,sys;sys.path.insert(0,${JSON.stringify(scripts)})`,
    'import puzzle_auto_place as module',
    'events=[]',
    'module.timing_mode="fixed"',
    'source={"row":0,"column":0,"occupied":True,"type":"corner","orientation":0,"confidence":0.9,"uncertain":False}',
    'captures=iter([{"success":True,"slots":[{**source,"orientation":270}]+[{}]*59},{"success":True,"slots":[{**source,"orientation":180}]+[{}]*59},{"success":True,"slots":[{**source,"orientation":90}]+[{}]*59}])',
    'module.click_physical=lambda x,y,button,delay: events.append(["click",button])',
    'module.capture_analyze=lambda *args,**kwargs: events.append(["capture"]) or next(captures)',
    'module.time.sleep=lambda seconds: None',
    'ok,confirmed,actual=module.rotate_source_to_target({"left":0,"top":0,"right":600,"bottom":1000},{},source,90,0.04)',
    'print(json.dumps({"ok":ok,"orientation":confirmed["orientation"],"events":events}))'
  ].join(';')
  const result = spawnSync(python, ['-c', code], { cwd: scripts, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  const output = JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
  assert.equal(output.ok, true)
  assert.equal(output.orientation, 90)
  assert.deepEqual(output.events, [
    ['click', 'right'], ['capture'],
    ['click', 'right'], ['capture'],
    ['click', 'right'], ['capture']
  ])
})

test('修正来源旋转确认失败时重试右键并继续', { skip: !existsSync(python) }, () => {
  const code = [
    `import json,sys;sys.path.insert(0,${JSON.stringify(scripts)})`,
    'import puzzle_auto_place as module',
    'events=[]',
    'module.timing_mode="fixed"',
    'source={"row":0,"column":0,"occupied":True,"type":"corner","orientation":0,"confidence":0.9,"corrected":True}',
    'module.click_physical=lambda x,y,button,delay: events.append(["click",button])',
    'module.verify_source_rotation=lambda *args: events.append(["verify"]) or (False, {**source, "orientation":0})',
    'module.time.sleep=lambda seconds: None',
    'ok,confirmed,actual=module.rotate_source_to_target({"left":0,"top":0,"right":600,"bottom":1000},{},source,270,0.04,None,True)',
    'print(json.dumps({"ok":ok,"orientation":confirmed["orientation"],"clicks":[e[1] for e in events if e[0]=="click"],"verifies":sum(1 for e in events if e[0]=="verify")}))'
  ].join('\n')
  const result = spawnSync(python, ['-c', code], { cwd: scripts, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  const output = JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
  assert.equal(output.ok, true)
  assert.equal(output.orientation, 270)
  assert.deepEqual(output.clicks, ['right', 'right', 'right'])
  assert.equal(output.verifies, 3)
})

test('修正来源点击已生效但验证失败时不再补发右键', { skip: !existsSync(python) }, () => {
  const code = [
    `import json,sys;sys.path.insert(0,${JSON.stringify(scripts)})`,
    'import puzzle_auto_place as module',
    'events=[]',
    'module.timing_mode="fixed"',
    'source={"row":0,"column":0,"occupied":True,"type":"corner","orientation":0,"confidence":0.9,"corrected":True}',
    'module.click_physical=lambda x,y,button,delay: events.append(["click",button])',
    'module.verify_source_rotation=lambda *args: events.append(["verify"]) or (False, {**source, "orientation":270})',
    'module.time.sleep=lambda seconds: None',
    'ok,confirmed,actual=module.rotate_source_to_target({"left":0,"top":0,"right":600,"bottom":1000},{},source,270,0.04,None,True)',
    'print(json.dumps({"ok":ok,"orientation":confirmed["orientation"],"unverified":confirmed.get("rotationUnverified"),"clicks":[e[1] for e in events if e[0]=="click"],"verifies":sum(1 for e in events if e[0]=="verify")}))'
  ].join('\n')
  const result = spawnSync(python, ['-c', code], { cwd: scripts, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  const output = JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
  assert.equal(output.ok, true)
  assert.equal(output.orientation, 270)
  assert.equal(output.unverified, true)
  assert.deepEqual(output.clicks, ['right'])
  assert.equal(output.verifies, 1)
})

test('自动放置接受修正来源并优先使用', () => {
  const script = source('src/assets/scripts/puzzle_auto_place.py')
  assert.match(script, /source_slots = config\.get\("sourceSlots"\)/)
  assert.match(script, /planned_sources = source_slots if isinstance\(source_slots, list\) and len\(source_slots\) == 9/)
  assert.match(script, /planned_source_valid\(inventory, source, target\)/)
})

test('自动放入从共享复制协议接收形状别名且运行时包含剪贴板模块', () => {
  const service = source('electron/modules/puzzle/service.js')
  const regions = source('electron/modules/priceCheck/chartRegions.js')
  const script = source('src/assets/scripts/puzzle_auto_place.py')
  assert.match(service, /copyTypeProtocol: chartFragmentCopyProtocol\(\)/)
  assert.match(service, /\['cv2', 'mss', 'numpy', 'pynput', 'pyperclip'\]/)
  assert.match(regions, /aliasesByType: chartShapeAliasesByPuzzleType\(\)/)
  assert.match(script, /aliases_by_type = protocol\.get\("aliasesByType"\)/)
  for (const duplicatedShapeLabel of ['端点', '结束', '角落', '直线', '节点', '交汇', '交叉', '岔路']) {
    assert.doesNotMatch(script, new RegExp(duplicatedShapeLabel))
  }
})

test('Python 来源复制解析遵守主进程传入的五类形状协议', { skip: !existsSync(python) }, () => {
  const protocol = {
    fields: { category: '物品类别', categoryValue: '海图', shape: '海图形状' },
    aliasesByType: {
      endpoint: ['端点', '结束'], corner: ['角落'], straight: ['直线'],
      tee: ['节点', '交汇'], cross: ['交叉', '岔路']
    }
  }
  const code = [
    `import json,sys;sys.path.insert(0,${JSON.stringify(scripts)})`,
    'from puzzle_auto_place import parse_copied_fragment_type',
    `protocol=json.loads(${JSON.stringify(JSON.stringify(protocol))})`,
    'samples=[("端点","endpoint"),("角落","corner"),("直线","straight"),("交汇","tee"),("岔路","cross")]',
    'parsed=[parse_copied_fragment_type(f"物品 类别： 海 图\\n海图 形状： {label}",protocol)["type"] for label,_expected in samples]',
    'unknown=parse_copied_fragment_type("物品类别: 海图\\n海图形状: 未知",protocol)',
    'non_chart=parse_copied_fragment_type("物品类别: 装备\\n海图形状: 角落",protocol)',
    'print(json.dumps({"parsed":parsed,"unknown":unknown,"nonChart":non_chart},ensure_ascii=False))'
  ].join('\n')
  const result = spawnSync(python, ['-c', code], { cwd: scripts, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), {
    parsed: ['endpoint', 'corner', 'straight', 'tee', 'cross'], unknown: null, nonChart: null
  })
})

test('九个计划来源各自只复制一次，复制失败或类型不符不产生危险点击', { skip: !existsSync(python) }, () => {
  const code = [
    `import json,sys;sys.path.insert(0,${JSON.stringify(scripts)})`,
    'import puzzle_auto_place as module',
    'protocol={"fields":{"category":"category","categoryValue":"chart","shape":"shape"},"aliasesByType":{"corner":["corner"],"tee":["tee"]}}',
    'class Clip:',
    '  def __init__(self): self.value="original"',
    '  def copy(self,value): self.value=value',
    '  def paste(self): return self.value',
    'clip=Clip(); events=[]; texts=iter(["category: chart\\nshape: corner"]*9)',
    'module.move_physical=lambda x,y: events.append(["move",x,y])',
    'module.click_physical=lambda *args: events.append(["dangerous-click"])',
    'module.time.sleep=lambda seconds: None',
    'def send(): events.append(["copy"]); clip.value=next(texts)',
    'results=[module.confirm_source_copy((i,i),"corner",protocol,200,50,clip,send) for i in range(9)]',
    'def mismatch_send(): events.append(["copy"]); clip.value="category: chart\\nshape: tee"',
    'mismatch=module.confirm_source_copy((10,10),"corner",protocol,200,50,clip,mismatch_send)',
    'def failed_send(): events.append(["copy"])',
    'failed=module.confirm_source_copy((11,11),"corner",protocol,200,50,clip,failed_send)',
    'print(json.dumps({"successes":sum(1 for item in results if item["success"]),"copies":sum(1 for item in events if item[0]=="copy"),"dangerous":sum(1 for item in events if item[0]=="dangerous-click"),"mismatch":mismatch["code"],"failed":failed["code"]}))'
  ].join('\n')
  const result = spawnSync(python, ['-c', code], { cwd: scripts, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), {
    successes: 9, copies: 11, dangerous: 0,
    mismatch: 'SOURCE_TYPE_MISMATCH', failed: 'SOURCE_TYPE_COPY_FAILED'
  })
})

test('来源方向识别与旋转验证始终携带复制确认类型', { skip: !existsSync(python) }, () => {
  const code = [
    `import json,sys;sys.path.insert(0,${JSON.stringify(scripts)})`,
    'import puzzle_auto_place as module',
    'source={"row":2,"column":3,"occupied":True,"type":"corner","orientation":90}',
    'captured=[]',
    'module.capture_analyze=lambda *args,**kwargs: captured.append(kwargs) or {"success":True,"slots":[{}]*15+[source]+[{}]*44}',
    'ok,actual=module.verify_source_rotation({}, {}, source, 90, 0.01)',
    'print(json.dumps({"ok":ok,"recognition":captured[0]["recognition"]}))'
  ].join('\n')
  const result = spawnSync(python, ['-c', code], { cwd: scripts, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1)), {
    ok: true, recognition: { typeHints: { '2:3': 'corner' } }
  })
})

test('自动放入在所有结束路径恢复剪贴板，紧急停止由主进程兜底', { skip: !existsSync(python) }, () => {
  const code = [
    `import json,sys;sys.path.insert(0,${JSON.stringify(scripts)})`,
    'import puzzle_auto_place as module',
    'class Clip:',
    '  def __init__(self): self.value="before"',
    '  def copy(self,value): self.value=value',
    '  def paste(self): return self.value',
    'clip=Clip()',
    'def success(config): clip.copy("during"); return 7',
    'normal=module.execute_with_preserved_clipboard({},success,clip); after_normal=clip.value',
    'def failure(config): clip.copy("during-error"); raise RuntimeError("boom")',
    'try: module.execute_with_preserved_clipboard({},failure,clip)',
    'except RuntimeError: pass',
    'print(json.dumps({"normal":normal,"afterNormal":after_normal,"afterFailure":clip.value}))'
  ].join('\n')
  const result = spawnSync(python, ['-c', code], { cwd: scripts, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), { normal: 7, afterNormal: 'before', afterFailure: 'before' })

  const service = source('electron/modules/puzzle/service.js')
  assert.match(service, /event\.event === 'completed'[\s\S]*restoreAutomationClipboard\(child\)/)
  assert.match(service, /event\.event === 'error'[\s\S]*restoreAutomationClipboard\(child\)/)
  assert.match(service, /stopAutoPlacement\(reason = 'user'\)[\s\S]*restoreAutomationClipboard\(child\)/)
  assert.match(service, /emergencyStop\(reason = 'shortcut'\)[\s\S]*stopAutoPlacement\(reason\)/)
})

test('切换仓库页签后移出并等待固定页签生效时序', { skip: !existsSync(python) }, () => {
  const code = [
    `import json,sys;sys.path.insert(0,${JSON.stringify(scripts)})`,
    'import puzzle_auto_place as module',
    'events=[]',
    'module.click_physical=lambda x,y,button,delay: events.append(["click",x,y,button])',
    'module.move_physical=lambda x,y: events.append(["move",x,y])',
    'module.time.sleep=lambda seconds: events.append(["sleep",round(seconds,3)])',
    'module.switch_inventory_page({"1":{"x":100,"y":200},"2":{"x":300,"y":200}},2,0.04)',
    'print(json.dumps(events))'
  ].join(';')
  const result = spawnSync(python, ['-c', code], { cwd: scripts, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), [['click', 300, 200, 'left'], ['move', 0, 0], ['sleep', 0.01]])
})

test('自动放入在截图和危险来源输入前切换并验证计划页', () => {
  const script = source('src/assets/scripts/puzzle_auto_place.py')
  const main = script.match(/def run_placement\(config: dict\[str, Any\]\)[\s\S]*?return 0/)?.[0] || ''
  assert.ok(main.indexOf('switch_inventory_page(') < main.indexOf('confirm_source_copy('))
  assert.ok(main.indexOf('confirm_source_copy(') < main.indexOf('inventory = capture_analyze('))
  assert.ok(main.indexOf('planned_source_valid(') < main.indexOf('rotate_source_to_target('))
  assert.ok(main.indexOf('confirm_source_copy(') < main.indexOf('rotate_source_to_target('))
  assert.ok(main.indexOf('confirm_source_copy(') < main.lastIndexOf('place_fragment('))
  assert.match(main, /source_page = int\(source\.get\("page", 1\)\)/)
  assert.match(main, /event\("source-page"/)
  assert.match(main, /SOURCE_TYPE_COPY_FAILED/)
  assert.match(main, /actualType=copy_check\.get\("actualType"\)/)
})

test('计划来源必须与实时库存占用一致，修正格可跳过类型校验', { skip: !existsSync(python) }, () => {
  const code = [
    `import json,sys;sys.path.insert(0,${JSON.stringify(scripts)})`,
    'from puzzle_auto_place import planned_source_valid',
    'slots=[{"occupied":False} for _ in range(60)]',
    'source={"row":0,"column":0,"type":"corner","corrected":False}',
    'target={"type":"corner"}',
    'empty=planned_source_valid({"success":True,"slots":slots},source,target)',
    'slots[0]={"occupied":True,"type":"corner","orientation":270}',
    'matched=planned_source_valid({"success":True,"slots":slots},source,target)',
    'slots[0]={"occupied":True,"type":"tee","orientation":0}',
    'mismatch=planned_source_valid({"success":True,"slots":slots},source,target)',
    'corrected=planned_source_valid({"success":True,"slots":slots},{**source,"corrected":True},target)',
    'print(json.dumps({"empty":empty,"matched":matched,"mismatch":mismatch,"corrected":corrected}))'
  ].join('\n')
  const result = spawnSync(python, ['-c', code], { cwd: scripts, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), { empty: false, matched: true, mismatch: false, corrected: true })
})

test('动态来源选择允许低置信度碎片并按置信度排序', { skip: !existsSync(python) }, () => {
  const code = [
    `import json,sys;sys.path.insert(0,${JSON.stringify(scripts)})`,
    'from puzzle_auto_place import available_sources',
    'slots=[{"row":0,"column":0,"occupied":True,"type":"tee","confidence":0.2,"uncertain":True},{"row":0,"column":1,"occupied":True,"type":"tee","confidence":0.8,"uncertain":False}]',
    'print(json.dumps([[s["column"],s["uncertain"]] for s in available_sources({"slots":slots},"tee")]))'
  ].join(';')
  const result = spawnSync(python, ['-c', code], { cwd: scripts, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), [[1, false], [0, true]])
})

test('低置信度海图格在类型和方向一致时仍通过放置验证', { skip: !existsSync(python) }, () => {
  const code = [
    `import json,sys;sys.path.insert(0,${JSON.stringify(scripts)})`,
    'from puzzle_auto_place import slot_matches',
    'slot={"occupied":True,"type":"corner","mask":6,"orientation":90,"uncertain":True,"confidence":0.2}',
    'target={"type":"corner","mask":6,"orientation":90}',
    'print(json.dumps(slot_matches(slot,target)))'
  ].join(';')
  const result = spawnSync(python, ['-c', code], { cwd: scripts, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(JSON.parse(result.stdout), true)
})

test('全新执行不恢复已有进度，只有明确继续执行才恢复已完成格', { skip: !existsSync(python) }, () => {
  const code = [
    `import json,sys;sys.path.insert(0,${JSON.stringify(scripts)})`,
    'from puzzle_auto_place import initial_completed_indices',
    'targets=[{"index":i,"row":i//3,"column":i%3,"type":"cross","mask":15} for i in range(9)]',
    'slots=[{"occupied":i<3,"type":"cross","mask":15,"uncertain":False} if i<3 else {"occupied":False} for i in range(9)]',
    'print(json.dumps({"fresh":sorted(initial_completed_indices(slots,targets,False)),"resume":sorted(initial_completed_indices(slots,targets,True))}))'
  ].join(';')
  const result = spawnSync(python, ['-c', code], { cwd: scripts, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), { fresh: [], resume: [0, 1, 2] })
})

test('全新执行发现海图残留时必须在任何点击前停止', { skip: !existsSync(python) }, () => {
  const code = [
    `import json,sys;sys.path.insert(0,${JSON.stringify(scripts)})`,
    'from puzzle_auto_place import occupied_atlas_indices',
    'slots=[{"occupied":False} for _ in range(9)]',
    'slots[0]={"occupied":True,"type":"corner","uncertain":True}',
    'slots[8]={"occupied":True,"type":"tee","uncertain":False}',
    'print(json.dumps({"occupied":occupied_atlas_indices({"success":True,"slots":slots}),"invalid":occupied_atlas_indices({"success":False})}))'
  ].join(';')
  const result = spawnSync(python, ['-c', code], { cwd: scripts, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), { occupied: [0, 8], invalid: [] })
  const script = source('src/assets/scripts/puzzle_auto_place.py')
  assert.ok(script.indexOf('ATLAS_NOT_EMPTY') < script.indexOf('event("started"'), '残留门禁必须早于执行开始和鼠标输入')
  assert.match(script, /清空面板/)
})

test('逐格验证只重读三次画面且不重放输入', () => {
  const script = source('src/assets/scripts/puzzle_auto_place.py')
  const verify = script.match(/def verify_target[\s\S]*?\r?\n\r?\ndef run_placement/)?.[0] || ''
  assert.match(verify, /range\(1, 4\)/)
  assert.match(verify, /capture_analyze/)
  assert.doesNotMatch(verify, /click_physical/)
  assert.ok(script.indexOf('event("capture-start"') < script.indexOf('capture_region(region, region_type)'))
  assert.ok(script.indexOf('event("capture-end"') > script.indexOf('capture_region(region, region_type)'))
  assert.ok(script.indexOf('rotate_source_to_target(') < script.lastIndexOf('place_fragment('), '必须先确认旋转再拿取碎片')
  assert.match(script, /SOURCE_ROTATION_MISMATCH/)
})

test('中断后保留库存和锁定来源并从未完成格继续', () => {
  const script = source('src/assets/scripts/puzzle_auto_place.py')
  const store = source('src/stores/puzzle.js')
  const view = source('src/domains/puzzle/PuzzleView.vue')
  assert.ok(script.indexOf('initial_atlas = capture_analyze') < script.indexOf('for position, target in enumerate(targets)'))
  assert.match(script, /completed_indices[\s\S]*slot_matches/)
  assert.match(script, /resume_pending[\s\S]*recoveredHeld=True/)
  assert.match(store, /currentSolution\.value\.sourceSlots\.slice\(resumeIndex\.value\)/)
  assert.doesNotMatch(store, /async function refreshInventoryAfterExecution/)
  assert.doesNotMatch(store, /response\?\.event === 'step-completed'[\s\S]*emptySlots/)
  assert.match(view, /继续自动放入（第 \$\{resumeIndex \+ 1\} 格）/)
  assert.doesNotMatch(view, /refreshInventoryAfterExecution/)
})

test('海图服务接入自动化锁、动态状态和遮罩截图显隐', () => {
  const service = source('electron/modules/puzzle/service.js')
  assert.match(service, /AUTOMATION_OWNER = '海图自动放置'/)
  assert.match(service, /automationLock\?\.acquire\(AUTOMATION_OWNER\)/)
  assert.match(service, /event\.event === 'capture-start'[\s\S]*overlay\?\.hide/)
  assert.match(service, /event\.event === 'capture-end'[\s\S]*overlay\?\.show/)
  assert.match(service, /capture-series-start'[\s\S]*overlay\?\.hide\?\.\(event\.regionType\)/)
  assert.match(service, /capture-series-end'[\s\S]*overlay\?\.show\?\.\(event\.regionType\)/)
  assert.match(service, /spawnOperationProcess\([\s\S]*stdin: 'ignore'/)
  assert.match(service, /displayBounds: atlasRegionMetadata\?\.displayPhysicalBounds \|\| null/)
  assert.match(service, /event\.event === 'source-rotation-verification'[\s\S]*slots:/)
  assert.match(service, /stopAutoPlacement\(reason = 'user'\)/)
  assert.match(service, /stderr = `\$\{stderr\}\$\{String\(chunk\)\}`\.slice\(-4000\)/)
  assert.match(service, /detail \|\| `海图自动放置进程异常退出/)
  const lock = new AutomationLock()
  assert.equal(lock.acquire('制作').success, true)
  assert.equal(lock.acquire('海图自动放置').success, false)
})

test('海图残留错误明确提示未发送放置点击', () => {
  const view = source('src/domains/puzzle/PuzzleView.vue')
  assert.match(view, /ATLAS_NOT_EMPTY[\s\S]*未发送任何放置点击/)
})

test('IPC、preload 和渲染 API 暴露完整自动放置协议', () => {
  const sources = [source('electron/modules/ipc/puzzle.js'), source('electron/preload.cjs'), source('src/api/electron.js')].join('\n')
  for (const token of [
    'puzzle-pick-atlas-region', 'puzzle-configuration', 'puzzle-auto-placement-start',
    'puzzle-auto-placement-stop', 'puzzle-auto-placement-status', 'puzzle-auto-placement-updated',
    'puzzle-pick-inventory-tab-point'
  ]) assert.match(sources, new RegExp(token))
})

test('双区域遮罩为置顶鼠标穿透窗口且拥有独立路由', () => {
  const overlay = source('electron/modules/puzzle/overlay.js')
  assert.match(overlay, /alwaysOnTop: true/)
  assert.match(overlay, /setIgnoreMouseEvents\(true/)
  assert.match(overlay, /screenToDipRect/)
  assert.doesNotMatch(overlay, /screenToDipPoint/)
  assert.match(overlay, /setBounds\(bounds/)
  assert.match(overlay, /inventoryRegion/)
  assert.match(overlay, /atlasRegion/)
  assert.match(overlay, /this\.windows\.get\(type\)/)
  assert.match(source('src/router/index.js'), /path: '\/puzzle-overlay'/)
})

test('资源清单包含分析与自动放置脚本', () => {
  const packageConfig = JSON.parse(source('package.json'))
  assert.ok(packageConfig.build.extraResources.some(entry => entry.to === 'puzzle_analyzer.py'))
  assert.ok(packageConfig.build.extraResources.some(entry => entry.to === 'puzzle_auto_place.py'))
})
})()

// === Merged from puzzleRecognizer.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const existsSync = _m1_existsSync
  const mkdtempSync = _m1_mkdtempSync
  const readFileSync = _m1_readFileSync
  const rmSync = _m1_rmSync
  const writeFileSync = _m1_writeFileSync
  const tmpdir = _m1_tmpdir
  const path = _m1_path
  const spawnSync = _m1_spawnSync
  const fileURLToPath = _m1_fileURLToPath
const workspace = fileURLToPath(new URL('..', import.meta.url))
const python = path.join(workspace, '.runtime', 'python-runtime', 'python.exe')
const analyzer = path.join(workspace, 'src', 'assets', 'scripts', 'puzzle_analyzer.py')
const templatesPath = path.join(workspace, 'electron', 'assets', 'puzzle', 'templates.json')
const screenshot = path.join(workspace, 'test', 'fixtures', 'puzzle', 'inventory-region.png')
const emptyScreenshot = path.join(workspace, 'test', 'fixtures', 'puzzle', 'empty-region.png')

function analyze({ region, imagePath = screenshot, imageIsRegion = false, regionType = 'inventory', recognition, calibrationSamples, allowEmpty = false } = {}) {
  const directory = mkdtempSync(path.join(tmpdir(), 'puzzle-recognizer-'))
  const configPath = path.join(directory, 'config.json')
  const config = {
    templatesPath,
    imagePath,
    imageIsRegion,
    regionType,
    requireGameForeground: false
  }
  if (allowEmpty) config.allowEmpty = true
  if (recognition) config.recognition = recognition
  if (calibrationSamples) config.calibrationSamples = calibrationSamples
  if (region) config.region = region
  writeFileSync(configPath, JSON.stringify(config))
  try {
    const process = spawnSync(python, [analyzer, '--config', configPath], {
      encoding: 'utf8',
      env: { ...globalThis.process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
    })
    const line = process.stdout.split(/\r?\n/).find(value => value.startsWith('RESULT '))
    assert.ok(line, process.stderr || process.stdout)
    return JSON.parse(line.slice(7))
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

function probeAnalyzer(body) {
  const code = [
    'import importlib.util, json',
    `spec = importlib.util.spec_from_file_location("puzzle_analyzer_probe", ${JSON.stringify(analyzer)})`,
    'module = importlib.util.module_from_spec(spec)',
    'spec.loader.exec_module(module)',
    body
  ].join('\n')
  const process = spawnSync(python, ['-c', code], {
    encoding: 'utf8',
    env: { ...globalThis.process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(process.status, 0, process.stderr || process.stdout)
  const line = process.stdout.split(/\r?\n/).filter(Boolean).at(-1)
  assert.ok(line, process.stderr || process.stdout)
  return JSON.parse(line)
}

function atlasTopologyFixture(directory) {
  const width = 600
  const height = 600
  const pixels = Buffer.alloc(width * height, 180)
  const fill = (left, top, right, bottom, value = 20) => {
    for (let y = top; y < bottom; y += 1) pixels.fill(value, y * width + left, y * width + right)
  }
  for (const edge of [199, 200, 399, 400]) {
    fill(edge, 0, edge + 1, height, 70)
    fill(0, edge, width, edge + 1, 70)
  }
  const drawRoute = (row, column, mask) => {
    const left = column * 200
    const top = row * 200
    const centerX = left + 100
    const centerY = top + 100
    fill(centerX - 4, centerY - 4, centerX + 5, centerY + 5)
    if (mask & 1) fill(centerX - 4, top + 10, centerX + 5, centerY + 1)
    if (mask & 2) fill(centerX, centerY - 4, left + 191, centerY + 5)
    if (mask & 4) fill(centerX - 4, centerY, centerX + 5, top + 191)
    if (mask & 8) fill(left + 10, centerY - 4, centerX + 1, centerY + 5)
  }
  drawRoute(0, 0, 15)
  drawRoute(0, 1, 1)
  drawRoute(0, 2, 10)
  drawRoute(1, 0, 6)
  drawRoute(1, 1, 7)
  // 模拟海图左下角的船只装饰，不能被误识别为碎片。
  fill(120, 525, 185, 570, 25)
  const imagePath = path.join(directory, 'atlas-topology.pgm')
  writeFileSync(imagePath, Buffer.concat([Buffer.from(`P5\n${width} ${height}\n255\n`), pixels]))
  return imagePath
}

function createDimmedScreenshot(directory) {
  const output = path.join(directory, 'dimmed.png')
  const code = [
    'import cv2, numpy as np',
    `src = cv2.imdecode(np.fromfile(${JSON.stringify(screenshot)}, np.uint8), cv2.IMREAD_COLOR)`,
    `dim = (src * 0.75).astype(np.uint8)`,
    `cv2.imencode('.png', dim)[1].tofile(${JSON.stringify(output)})`
  ].join(';')
  const result = spawnSync(python, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  return output
}

function createEmptyGridScreenshot(directory) {
  const width = 600
  const height = 1000
  const pixels = Buffer.alloc(width * height, 120)
  const fill = (left, top, right, bottom, value = 20) => {
    for (let y = top; y < bottom; y += 1) pixels.fill(value, y * width + left, y * width + right)
  }
  for (let column = 1; column < 6; column += 1) fill(column * 100 - 1, 0, column * 100 + 1, height)
  for (let row = 1; row < 10; row += 1) fill(0, row * 100 - 1, width, row * 100 + 1)
  const imagePath = path.join(directory, 'empty-grid.pgm')
  writeFileSync(imagePath, Buffer.concat([Buffer.from(`P5\n${width} ${height}\n255\n`), pixels]))
  return imagePath
}

function atlasBorderInterferenceFixture(directory) {
  const width = 600
  const height = 600
  const cellSize = 200
  const pixels = Buffer.alloc(width * height, 180)
  const fill = (left, top, right, bottom, value = 20) => {
    for (let y = top; y < bottom; y += 1) pixels.fill(value, y * width + left, y * width + right)
  }
  for (const edge of [199, 200, 399, 400]) {
    fill(edge, 0, edge + 1, height, 70)
    fill(0, edge, width, edge + 1, 70)
  }
  const drawRoute = (row, column, mask) => {
    const left = column * cellSize
    const top = row * cellSize
    const centerX = left + cellSize / 2
    const centerY = top + cellSize / 2
    fill(centerX - 4, centerY - 4, centerX + 5, centerY + 5)
    if (mask & 1) fill(centerX - 4, top + 10, centerX + 5, centerY + 1)
    if (mask & 2) fill(centerX, centerY - 4, left + 191, centerY + 5)
    if (mask & 4) fill(centerX - 4, centerY, centerX + 5, top + 191)
    if (mask & 8) fill(left + 10, centerY - 4, centerX + 1, centerY + 5)
  }
  const expectedMasks = [1, 10, 6, 15, 7, 8, 5, 12, 3]
  expectedMasks.forEach((mask, index) => drawRoute(Math.floor(index / 3), index % 3, mask))

  // 右下角的东向航线通过外框与角落装饰相连；装饰伸回中央方向探针时不能被当成南向航线。
  fill(588, 496, 596, 596)
  fill(496, 588, 596, 596)
  fill(496, 540, 505, 596)

  const imagePath = path.join(directory, 'atlas-border-interference.pgm')
  writeFileSync(imagePath, Buffer.concat([Buffer.from(`P5\n${width} ${height}\n255\n`), pixels]))
  return { imagePath, expectedMasks }
}

test('识别截图样本固定保存在仓库中', () => {
  assert.equal(existsSync(screenshot), true)
  assert.equal(existsSync(emptyScreenshot), true)
})

test('用户截图只产出视觉候选、空格证据和五类方向候选', { skip: !existsSync(python) }, () => {
  const result = analyze({ region: { left: 4, top: 4, right: 570, bottom: 954 } })
  assert.equal(result.success, true)
  assert.equal(result.slots.length, 60)
  assert.equal(result.candidateCount, 50)
  assert.equal(result.occupiedCount, 0)
  assert.deepEqual(result.counts, { endpoint: 0, straight: 0, corner: 0, tee: 0, cross: 0 })
  assert.equal(result.slots.find(slot => slot.row === 1 && slot.column === 2).candidate, true)
  assert.equal(result.slots.find(slot => slot.row === 6 && slot.column === 3).candidate, false)
  const candidates = result.slots.filter(slot => slot.candidate)
  assert.ok(candidates.every(slot => slot.type === null && slot.occupied === false && slot.mask === 0))
  assert.ok(candidates.every(slot => Object.keys(slot.directionCandidates).length === 5))
  assert.ok(candidates.every(slot => Object.values(slot.directionCandidates).every(direction =>
    Number.isInteger(direction.mask) && direction.mask > 0 && direction.mask < 16 &&
    [0, 90, 180, 270].includes(direction.orientation))))
})

test('真实仓库按每种复制类型分别返回正确合法方向', { skip: !existsSync(python) }, () => {
  const result = analyze({ region: { left: 4, top: 4, right: 570, bottom: 954 } })
  assert.equal(result.success, true)
  const expected = new Map([
    // 端点：上、右、下、左。
    ['1,4', ['endpoint', 1]], ['9,4', ['endpoint', 2]],
    ['2,4', ['endpoint', 4]], ['6,6', ['endpoint', 8]],
    // 直线：竖直、水平。
    ['1,2', ['straight', 5]], ['2,2', ['straight', 10]],
    // 拐角：东北、东南、西南、西北。
    ['4,3', ['corner', 3]], ['1,5', ['corner', 6]],
    ['3,5', ['corner', 12]], ['2,5', ['corner', 9]],
    // 三岔：缺下、缺左、缺上、缺右。
    ['2,6', ['tee', 11]], ['3,3', ['tee', 7]],
    ['10,6', ['tee', 14]], ['8,1', ['tee', 13]],
    ['1,1', ['cross', 15]],
  ])
  for (const slot of result.slots) {
    const truth = expected.get(`${slot.row + 1},${slot.column + 1}`)
    if (truth) {
      const [type, mask] = truth
      assert.equal(slot.directionCandidates[type].mask, mask, `第 ${slot.row + 1} 行第 ${slot.column + 1} 列方向错误`)
      assert.equal(slot.type, null)
    }
  }
})

test('外部确认类型只选择该类型的方向候选', { skip: !existsSync(python) }, () => {
  const result = analyze({
    imageIsRegion: true,
    recognition: { typeHints: { '0:3': 'endpoint', '0:1': 'straight' } }
  })
  const endpoint = result.slots.find(slot => slot.row === 0 && slot.column === 3)
  const straight = result.slots.find(slot => slot.row === 0 && slot.column === 1)
  assert.deepEqual([endpoint.occupied, endpoint.type, endpoint.mask, endpoint.typeSource], [true, 'endpoint', 1, 'hint'])
  assert.deepEqual([straight.occupied, straight.type, straight.mask, straight.typeSource], [true, 'straight', 5, 'hint'])
  assert.equal(result.slots.find(slot => slot.row === 0 && slot.column === 0).type, null)
})

test('低门槛绿色连通域进入疑似候选而不是扫描全部空格', { skip: !existsSync(python) }, () => {
  const result = probeAnalyzer([
    'cell = module.np.zeros((100, 100, 3), dtype=module.np.uint8)',
    'cell[8:13, 50:55] = (0, 255, 0)',
    'component = module.largest_green_component(cell, "inventory")',
    'empty = module.largest_green_component(module.np.zeros((100, 100, 3), dtype=module.np.uint8), "inventory")',
    'print(json.dumps({"state": component.get("candidateState") if component else None, "area": component.get("area") if component else 0, "empty": empty is None}))'
  ].join('\n'))
  assert.deepEqual(result, { state: 'suspect', area: 25, empty: true })
})

test('碎片候选与方向固定使用原颜色参数并移除图像类型分类门槛', () => {
  const source = readFileSync(analyzer, 'utf8')
  assert.match(source, /STANDARD_RECOGNITION\s*=\s*\{[\s\S]*"greenLower": \(35, 70, 80\)[\s\S]*"darkScale": 0\.85/)
  assert.match(source, /CALIBRATION_SIMILARITY\s*=\s*0\.965/)
  assert.doesNotMatch(source, /STRENGTH_PRESETS|"sensitive"|"strict"|confidenceThreshold|marginThreshold|def classify\(/)
})

test('分析主入口把本机校准素材传给 analyze_image', () => {
  const source = readFileSync(analyzer, 'utf8')
  assert.match(source, /config\.get\("calibrationSamples"\) or \[\]/)
})

test('实时仓库识别在截图前点击目标页签并等待稳定', () => {
  const source = readFileSync(analyzer, 'utf8')
  assert.match(source, /def click_inventory_tab\([\s\S]*SetCursorPos[\s\S]*mouse_event\(0x0002[\s\S]*mouse_event\(0x0004/)
  assert.match(source, /TAB_SWITCH_FAILED/)
  assert.match(source, /safe_hover_point\(config\["region"\], config\.get\("displayBounds"\)\)/)
  assert.doesNotMatch(source, /SetCursorPos\(0,\s*0\)/)
  const focusIndex = source.indexOf('if not is_game_foreground():')
  const clickIndex = source.indexOf('click_inventory_tab(tab_point')
  const captureIndex = source.indexOf('payload = capture_with_retries(config, templates, recognition)')
  assert.ok(focusIndex >= 0 && focusIndex < clickIndex && clickIndex < captureIndex)
  for (const candidate of [source, source.replace(/\r?\n/g, '\r\n')]) {
    const clickHelper = candidate.match(/def click_inventory_tab\([\s\S]*?\r?\n\r?\n/)?.[0] || ''
    assert.match(clickHelper, /mouse_event\(0x0004[\s\S]*SetCursorPos\(int\(hover_point\[0\]\), int\(hover_point\[1\]\)\)[\s\S]*time\.sleep/)
  }
  const main = source.match(/def main\(\)[\s\S]*?if __name__ == "__main__":/)?.[0] || ''
  assert.equal(main.match(/click_inventory_tab\(/g)?.length, 1)
})

test('安全悬停点留在当前显示器且避开识别区域和全局原点', { skip: !existsSync(python) }, () => {
  const result = probeAnalyzer([
    'single_region = {"left": 100, "top": 120, "right": 700, "bottom": 1120}',
    'single_bounds = {"x": 0, "y": 0, "width": 2560, "height": 1440}',
    'negative_region = {"left": -1850, "top": 100, "right": -1250, "bottom": 1100}',
    'negative_bounds = {"x": -1920, "y": 0, "width": 1920, "height": 1080}',
    'single = module.safe_hover_point(single_region, single_bounds)',
    'negative = module.safe_hover_point(negative_region, negative_bounds)',
    'blocked = ""',
    'try:',
    '    module.safe_hover_point({"left": 0, "top": 0, "right": 100, "bottom": 100}, {"x": 0, "y": 0, "width": 100, "height": 100})',
    'except ValueError as error:',
    '    blocked = str(error)',
    'print(json.dumps({"single": single, "negative": negative, "blocked": blocked}, ensure_ascii=False))'
  ].join('\n'))
  assert.notDeepEqual(result.single, [0, 0])
  assert.ok(result.single[0] >= 0 && result.single[0] <= 2560)
  assert.ok(result.single[1] >= 0 && result.single[1] <= 1440)
  assert.ok(result.single[0] < 100 || result.single[0] > 700 || result.single[1] < 120 || result.single[1] > 1120)
  assert.ok(result.negative[0] >= -1920 && result.negative[0] <= 0)
  assert.ok(result.negative[1] >= 0 && result.negative[1] <= 1080)
  assert.match(result.blocked, /找不到.*安全悬停点/)
})

test('切页识别只对低网格置信错误串行重读且最多三次', { skip: !existsSync(python) }, () => {
  const result = probeAnalyzer([
    'config = {"region": {"left": 0, "top": 0, "right": 600, "bottom": 1000}, "regionType": "inventory", "tabPoint": {"x": 10, "y": 10}}',
    'retryable = module.fail("EMPTY_GRID_UNCERTAIN", "retry")',
    'success = {"success": True, "occupiedCount": 5}',
    'captures = []',
    'sleeps = []',
    'def capture(region, region_type):',
    '    captures.append((region, region_type))',
    '    return len(captures)',
    'def recover(image, templates, region_type, recognition, calibration):',
    '    return retryable if image < 3 else success',
    'recovered = module.capture_with_retries(config, {}, {"allowEmpty": True}, capture, recover, sleeps.append)',
    'persistent_captures = []',
    'persistent_sleeps = []',
    'def persistent_capture(region, region_type):',
    '    persistent_captures.append(region_type)',
    '    return len(persistent_captures)',
    'persistent = module.capture_with_retries(config, {}, {"allowEmpty": True}, persistent_capture, lambda *args: retryable, persistent_sleeps.append)',
    'nonretry_captures = []',
    'def nonretry_capture(region, region_type):',
    '    nonretry_captures.append(region_type)',
    '    return 1',
    'nonretry = module.capture_with_retries(config, {}, {"allowEmpty": True}, nonretry_capture, lambda *args: module.fail("CAPTURE_EMPTY", "stop"), lambda delay: None)',
    'print(json.dumps({"recovered": recovered, "captures": len(captures), "sleeps": sleeps, "persistent": persistent, "persistentCaptures": len(persistent_captures), "persistentSleeps": persistent_sleeps, "nonretry": nonretry, "nonretryCaptures": len(nonretry_captures)}, ensure_ascii=False))'
  ].join('\n'))
  assert.equal(result.recovered.success, true)
  assert.equal(result.captures, 3)
  assert.deepEqual(result.sleeps, [0.25, 0.25])
  assert.equal(result.persistent.error.code, 'EMPTY_GRID_UNCERTAIN')
  assert.equal(result.persistentCaptures, 3)
  assert.deepEqual(result.persistentSleeps, [0.25, 0.25])
  assert.equal(result.nonretry.error.code, 'CAPTURE_EMPTY')
  assert.equal(result.nonretryCaptures, 1)
})

test('失败证据由同帧完整游戏窗口派生裁剪并记录逐次网格指标', { skip: !existsSync(python) }, () => {
  const result = probeAnalyzer([
    'import tempfile',
    'from pathlib import Path',
    'directory = tempfile.mkdtemp(prefix="puzzle-evidence-test-")',
    'config = {"region": {"left": 120, "top": 80, "right": 720, "bottom": 1080}, "displayBounds": {"x": 0, "y": 0, "width": 2560, "height": 1440}, "regionType": "inventory", "tabPoint": {"x": 10, "y": 10}, "page": 2, "evidenceId": "11111111-1111-4111-8111-111111111111", "evidenceDirectory": directory}',
    'frame_calls = []',
    'def frame_capture(_config):',
    '    frame_calls.append(1)',
    '    window = module.np.zeros((1200, 2000, 3), dtype=module.np.uint8)',
    '    crop = window[40:1040, 20:620]',
    '    return {"image": crop, "windowImage": window, "windowBounds": {"left": 100, "top": 40, "width": 2000, "height": 1200}, "monitorBounds": {"left": 0, "top": 0, "width": 2560, "height": 1440}, "actualCrop": {"left": 20, "top": 40, "width": 600, "height": 1000}}',
    'def analyzer(_image, *_args):',
    '    payload = module.fail("EMPTY_GRID_UNCERTAIN", "retry")',
    '    payload["_recognitionEvidenceMetrics"] = {"stage": "GRID_ANALYSIS", "grid": {"candidateVerticalLines": [100, 200], "candidateHorizontalLines": [80, 160], "spacing": {"x": 100, "y": 80}, "deviation": {"mean": 1, "max": 2}, "confidence": 0.4}, "occupiedCount": 0, "warningCodes": ["GRID_ALIGNMENT_LOW"]}',
    '    return payload',
    'payload = module.capture_with_retries(config, {}, {"allowEmpty": True}, analyzer=analyzer, sleeper=lambda _delay: None, frame_capture=frame_capture)',
    'evidence = payload["_failureEvidence"]',
    'headers = {item["kind"]: Path(directory, item["fileName"]).read_bytes()[:4].hex() for item in evidence["files"][:2]}',
    'print(json.dumps({"errorCode": payload["error"]["code"], "frameCalls": len(frame_calls), "attempts": evidence["attempts"], "files": evidence["files"], "headers": headers, "hasDirectory": "evidenceDirectory" in evidence}, ensure_ascii=False))'
  ].join('\n'))
  assert.equal(result.errorCode, 'EMPTY_GRID_UNCERTAIN')
  assert.equal(result.frameCalls, 3)
  assert.equal(result.attempts.length, 3)
  assert.deepEqual(result.attempts[0].actualCrop, { left: 20, top: 40, width: 600, height: 1000 })
  assert.equal(result.attempts[0].grid.confidence, 0.4)
  assert.equal(result.attempts[0].errorCode, 'EMPTY_GRID_UNCERTAIN')
  assert.equal(result.files.length, 6)
  assert.match(result.headers.window, /^ffd8ff/)
  assert.equal(result.headers.crop, '89504e47')
  assert.equal(result.hasDirectory, false)
})

test('窗口边界或图片编码不可用只降低证据完整性且不改变识别结果', { skip: !existsSync(python) }, () => {
  const result = probeAnalyzer([
    'import tempfile',
    'base = {"region": {"left": 0, "top": 0, "right": 600, "bottom": 1000}, "displayBounds": {"x": 0, "y": 0, "width": 1920, "height": 1080}, "regionType": "inventory", "tabPoint": {"x": 10, "y": 10}, "page": 1, "evidenceId": "11111111-1111-4111-8111-111111111111"}',
    'captures = []',
    'def capture(_region, _type):',
    '    captures.append(1)',
    '    return module.np.zeros((1000, 600, 3), dtype=module.np.uint8)',
    'def unavailable(_config): raise module.EvidenceCaptureUnavailable("WINDOW_BOUNDS_UNAVAILABLE")',
    'def failure(_image, *_args):',
    '    payload = module.fail("CAPTURE_EMPTY", "original")',
    '    payload["_recognitionEvidenceMetrics"] = {"stage": "CAPTURE", "grid": None, "occupiedCount": None, "warningCodes": []}',
    '    return payload',
    'first = module.capture_with_retries({**base, "evidenceDirectory": tempfile.mkdtemp()}, {}, {}, capture=capture, analyzer=failure, frame_capture=unavailable)',
    'def frame(_config):',
    '    image = module.np.zeros((1000, 600, 3), dtype=module.np.uint8)',
    '    return {"image": image, "windowImage": image, "windowBounds": {"left": 0, "top": 0, "width": 600, "height": 1000}, "monitorBounds": {"left": 0, "top": 0, "width": 1920, "height": 1080}, "actualCrop": {"left": 0, "top": 0, "width": 600, "height": 1000}}',
    'def broken_writer(*_args): raise RuntimeError("encoding")',
    'second = module.capture_with_retries({**base, "evidenceDirectory": tempfile.mkdtemp()}, {}, {}, capture=capture, analyzer=failure, frame_capture=frame, image_writer=broken_writer)',
    'print(json.dumps({"firstCode": first["error"]["code"], "firstReasons": first["_failureEvidence"]["completeness"]["reasons"], "firstStatuses": [item["status"] for item in first["_failureEvidence"]["files"]], "captures": len(captures), "secondCode": second["error"]["code"], "secondReasons": second["_failureEvidence"]["completeness"]["reasons"]}, ensure_ascii=False))'
  ].join('\n'))
  assert.equal(result.firstCode, 'CAPTURE_EMPTY')
  assert.deepEqual(result.firstReasons, ['WINDOW_BOUNDS_UNAVAILABLE'])
  assert.deepEqual(result.firstStatuses, ['missing', 'complete'])
  assert.equal(result.captures, 1)
  assert.equal(result.secondCode, 'CAPTURE_EMPTY')
  assert.deepEqual(result.secondReasons, ['IMAGE_ENCODING_FAILED'])
})

test('实时完整窗口截图严格绑定前台游戏客户区且不退化为桌面截图', () => {
  const source = readFileSync(analyzer, 'utf8').replace(/\r\n?/g, '\n')
  const capture = source.match(/def capture_game_window_frame\([\s\S]*?\n\n/)?.[0] || ''
  assert.match(capture, /GetForegroundWindow/)
  assert.match(capture, /window_matches_game/)
  assert.match(capture, /game_client_bounds/)
  assert.match(capture, /CROP_OUTSIDE_GAME_WINDOW/)
  assert.match(capture, /capture\.grab\(monitor\)/)
  assert.doesNotMatch(capture, /monitors\[0\]|capture_region/)
})

test('旧识别强度配置被静默忽略且仍能完成仓库识别', { skip: !existsSync(python) }, () => {
  const result = analyze({
    region: { left: 4, top: 4, right: 570, bottom: 954 },
    recognition: { strength: 'sensitive' }
  })
  assert.equal(result.success, true)
  assert.equal(result.candidateCount, 50)
  assert.equal(result.occupiedCount, 0)
})

test('固定基础识别可识别既有变暗样本', { skip: !existsSync(python) }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'puzzle-dimmed-'))
  try {
    const dimmed = createDimmedScreenshot(directory)
    const result = analyze({ imagePath: dimmed, imageIsRegion: true })
    assert.equal(result.success, true)
    assert.equal(result.candidateCount, 50)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('方向识别使用绿色图标质心作为探针中心', () => {
  const source = readFileSync(analyzer, 'utf8')
  assert.match(source, /cellCentroid/)
  assert.match(source, /def inventory_route_topology\([\s\S]*component:/)
})

test('高相似 v2 素材只校正同类型方向，空格素材只返回无文本证据', { skip: !existsSync(python) }, () => {
  const baseline = analyze({ imageIsRegion: true })
  const target = baseline.slots.find(slot => slot.row === 0 && slot.column === 3)
  const calibrated = analyze({ imageIsRegion: true, calibrationSamples: [
    { kind: 'fragment', type: 'endpoint', labelMask: 4, featureVersion: target.featureVersion, featureVector: target.calibrationFeature },
    { kind: 'fragment', type: 'straight', labelMask: 10, featureVersion: target.featureVersion, featureVector: target.calibrationFeature },
    { kind: 'empty', type: null, labelMask: 0, featureVersion: target.featureVersion, featureVector: target.calibrationFeature }
  ] })
  const result = calibrated.slots.find(slot => slot.row === target.row && slot.column === target.column)
  assert.deepEqual([result.type, result.occupied], [null, false])
  assert.deepEqual([result.directionCandidates.endpoint.calibrated, result.directionCandidates.endpoint.mask], [true, 4])
  assert.deepEqual([result.directionCandidates.straight.calibrated, result.directionCandidates.straight.mask], [true, 10])
  assert.deepEqual(result.emptyCalibration, { matched: true, similarity: 1 })
})

test('低相似、跨类型和同类型冲突素材不改变基础方向候选', { skip: !existsSync(python) }, () => {
  const baseline = analyze({ imageIsRegion: true })
  const target = baseline.slots.find(slot => slot.row === 0 && slot.column === 3)
  const baseMask = target.directionCandidates.endpoint.mask
  const low = analyze({ imageIsRegion: true, calibrationSamples: [
    { kind: 'fragment', type: 'endpoint', labelMask: 2, featureVersion: 2, featureVector: Array(128).fill(0) }
  ] })
  assert.equal(low.slots.find(slot => slot.row === target.row && slot.column === target.column).directionCandidates.endpoint.calibrated, false)
  const conflict = analyze({ imageIsRegion: true, calibrationSamples: [
    { kind: 'fragment', type: 'endpoint', labelMask: 1, featureVersion: 2, featureVector: target.calibrationFeature },
    { kind: 'fragment', type: 'endpoint', labelMask: 2, featureVersion: 2, featureVector: target.calibrationFeature },
    { kind: 'fragment', type: 'straight', labelMask: 10, featureVersion: 2, featureVector: target.calibrationFeature }
  ] })
  const result = conflict.slots.find(slot => slot.row === target.row && slot.column === target.column)
  assert.equal(result.directionCandidates.endpoint.calibrated, false)
  assert.equal(result.directionCandidates.endpoint.mask, baseMask)
})

test('区域轻微偏移后方向掩码保持稳定', { skip: !existsSync(python) }, () => {
  const result = analyze({ region: { left: 8, top: 4, right: 574, bottom: 954 } })
  assert.equal(result.success, true)
  assert.equal(result.candidateCount, 50)
  const expected = new Map([
    ['1,4', 1], ['9,4', 2], ['2,4', 4], ['6,6', 8],
    ['1,2', 5], ['2,2', 10],
    ['4,3', 3], ['1,5', 6], ['3,5', 12], ['2,5', 9],
    ['2,6', 11], ['3,3', 7], ['10,6', 14], ['8,1', 13],
    ['1,1', 15]
  ])
  for (const slot of result.slots) {
    const truth = expected.get(`${slot.row + 1},${slot.column + 1}`)
    if (truth) {
      const type = truth === 15 ? 'cross' : ([1, 2, 4, 8].includes(truth) ? 'endpoint'
        : ([5, 10].includes(truth) ? 'straight' : ([3, 6, 12, 9].includes(truth) ? 'corner' : 'tee')))
      assert.equal(slot.directionCandidates[type].mask, truth, `第 ${slot.row + 1} 行第 ${slot.column + 1} 列方向错误`)
    }
  }
})

test('网格置信度区分正常与偏移框选并给出低置信警告', { skip: !existsSync(python) }, () => {
  const aligned = analyze({ region: { left: 4, top: 4, right: 570, bottom: 954 } })
  const shifted = analyze({ region: { left: 8, top: 4, right: 574, bottom: 954 } })
  assert.equal(aligned.success, true)
  assert.equal(shifted.success, true)
  assert.ok(Number(aligned.gridConfidence) > Number(shifted.gridConfidence))
  assert.equal(shifted.gridAlignment, 'low')
  assert.ok(shifted.warnings.some(warning => /重新框选/.test(warning.message || warning)))
})

test('海图区使用 3×3 协议并允许空海图', { skip: !existsSync(python) }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'puzzle-atlas-'))
  const configPath = path.join(directory, 'config.json')
  writeFileSync(configPath, JSON.stringify({
    templatesPath, imagePath: emptyScreenshot, imageIsRegion: true,
    regionType: 'atlas', requireGameForeground: false
  }))
  try {
    const process = spawnSync(python, [analyzer, '--config', configPath], {
      encoding: 'utf8', env: { ...globalThis.process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
    })
    const line = process.stdout.split(/\r?\n/).find(value => value.startsWith('RESULT '))
    assert.ok(line, process.stderr || process.stdout)
    const result = JSON.parse(line.slice(7))
    assert.equal(result.success, true)
    assert.equal(result.slots.length, 9)
    assert.equal(result.regionType, 'atlas')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('海图区识别黑色航线拓扑并忽略格线和船只装饰', { skip: !existsSync(python) }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'puzzle-atlas-topology-'))
  try {
    const result = analyze({ imagePath: atlasTopologyFixture(directory), imageIsRegion: true, regionType: 'atlas' })
    assert.equal(result.success, true)
    assert.equal(result.occupiedCount, 5)
    assert.deepEqual(result.slots.slice(0, 5).map(slot => [slot.type, slot.mask]), [
      ['cross', 15], ['endpoint', 1], ['straight', 10], ['corner', 6], ['tee', 7]
    ])
    assert.equal(result.slots[6].occupied, false)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('海图区九格识别隔离右下角外框和角落装饰', { skip: !existsSync(python) }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'puzzle-atlas-border-'))
  try {
    const { imagePath, expectedMasks } = atlasBorderInterferenceFixture(directory)
    const result = analyze({ imagePath, imageIsRegion: true, regionType: 'atlas' })
    assert.equal(result.success, true)
    assert.equal(result.occupiedCount, 9)
    assert.deepEqual(result.slots.map(slot => slot.mask), expectedMasks)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('没有可信网格和绿色符号时返回框选不确定错误', { skip: !existsSync(python) }, () => {
  const result = analyze({ imagePath: emptyScreenshot, imageIsRegion: true })
  assert.equal(result.success, false)
  assert.equal(result.error.code, 'EMPTY_GRID_UNCERTAIN')
})

test('有效空网格未允许空页时返回无碎片错误', { skip: !existsSync(python) }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'puzzle-empty-grid-error-'))
  try {
    const result = analyze({ imagePath: createEmptyGridScreenshot(directory), imageIsRegion: true })
    assert.equal(result.success, false)
    assert.equal(result.error.code, 'NO_FRAGMENTS')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('允许空页时有效空网格返回零碎片结果', { skip: !existsSync(python) }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'puzzle-empty-grid-'))
  try {
    const result = analyze({ imagePath: createEmptyGridScreenshot(directory), imageIsRegion: true, allowEmpty: true })
    assert.equal(result.success, true)
    assert.equal(result.occupiedCount, 0)
    assert.equal(result.slots.length, 60)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('图像初扫保留全部候选且在复制前不伪造类型', { skip: !existsSync(python) }, () => {
  const result = analyze({ imageIsRegion: true })
  assert.equal(result.success, true)
  assert.equal(result.candidateCount, 50)
  assert.ok(result.slots.filter(slot => slot.candidate).every(slot => slot.uncertain && slot.type === null))
  assert.equal(result.warnings.length, 0)
})

test('识别模板包含五类多方向尺度基准', () => {
  const templates = JSON.parse(readFileSync(templatesPath, 'utf8'))
  assert.deepEqual(Object.keys(templates.types).sort(), ['corner', 'cross', 'endpoint', 'straight', 'tee'])
  for (const prototypes of Object.values(templates.types)) assert.ok(prototypes.length >= 2)
})

test('实时识别只校验标题与进程双重前台身份，确认后才截图', () => {
  const source = readFileSync(analyzer, 'utf8')
  assert.match(source, /GAME_WINDOW_TITLES = \("流放之路", "Path of Exile"\)/)
  assert.doesNotMatch(source, /def (?:find_game_window|focus_game_window)|SetForegroundWindow/)
  assert.match(source, /def window_matches_game\([\s\S]*window_process_name/)
  const focus = source.indexOf('if not is_game_foreground():')
  const capture = source.indexOf('payload = capture_with_retries(config, templates, recognition)')
  assert.ok(focus > 0 && capture > focus)
  assert.match(source, /def capture_with_retries\([\s\S]*image = capture\(config\["region"\], region_type\)/)
  assert.match(source, /GAME_NOT_FOREGROUND/)
})
})()

// === Merged from puzzleSolver.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const CONNECTED_INTERNAL_MASKS = _m2_CONNECTED_INTERNAL_MASKS
  const DIRECTIONS = _m2_DIRECTIONS
  const assignSourceSlots = _m2_assignSourceSlots
  const solvePuzzle = _m2_solvePuzzle
  const typeForMask = _m2_typeForMask
  const validateSolution = _m2_validateSolution
const abundant = { endpoint: 20, straight: 20, corner: 20, tee: 20, cross: 20 }

test('五种基础线型覆盖全部非空四位掩码', () => {
  const types = new Set(Array.from({ length: 15 }, (_, index) => typeForMask(index + 1)))
  assert.deepEqual([...types].sort(), ['corner', 'cross', 'endpoint', 'straight', 'tee'])
  assert.equal(typeForMask(DIRECTIONS.N | DIRECTIONS.S), 'straight')
  assert.equal(typeForMask(DIRECTIONS.N | DIRECTIONS.E), 'corner')
  assert.equal(CONNECTED_INTERNAL_MASKS.length, 431)
})

test('求解结果九格连通、内部无断口且出口达到12', () => {
  const result = solvePuzzle({ counts: abundant })
  assert.equal(result.score, 12)
  assert.ok(result.totalOptimalCount > 0)
  assert.ok(result.solutions.length <= 100)
  for (const solution of result.solutions) {
    assert.equal(validateSolution(solution), true)
    assert.equal(solution.cells.length, 9)
    assert.equal(Object.values(solution.usage).reduce((sum, value) => sum + value, 0), 9)
  }
})

test('库存不足与不可能的类型组合返回结构化无解', () => {
  assert.equal(solvePuzzle({ counts: { cross: 8 } }).error, 'INSUFFICIENT_FRAGMENTS')
  const impossible = solvePuzzle({ counts: { endpoint: 9 } })
  assert.equal(impossible.error, 'NO_SOLUTION')
  assert.equal(impossible.solutions.length, 0)
})

test('旧出口约束字段被忽略并继续返回无约束最优方案', () => {
  const result = solvePuzzle({
    counts: abundant,
    requiredExits: ['N0'],
    forbiddenExits: ['N0', 'E1'],
    solutionLimit: 8
  })
  assert.equal(result.score, 12)
  assert.equal(result.solutions.length, 8)
})

test('同分方案稳定截断且来源格按置信度和行列选择', () => {
  const first = solvePuzzle({ counts: abundant, solutionLimit: 2 })
  const second = solvePuzzle({ counts: abundant, solutionLimit: 2 })
  assert.equal(first.truncated, first.totalOptimalCount > 2)
  assert.deepEqual(first.solutions, second.solutions)
  const solution = { cells: [
    { index: 0, type: 'corner' },
    { index: 1, type: 'corner' }
  ] }
  const sources = assignSourceSlots(solution, [
    { row: 1, column: 1, occupied: true, type: 'corner', confidence: 0.9 },
    { row: 0, column: 2, occupied: true, type: 'corner', confidence: 0.9 },
    { row: 5, column: 5, occupied: true, type: 'corner', confidence: 0.2, corrected: true }
  ])
  assert.deepEqual(sources.map(slot => [slot.row, slot.column]), [[5, 5], [0, 2]])
})

test('双页相同行列是独立来源且页码参与稳定排序', () => {
  const solution = { cells: [{ index: 0, type: 'corner' }, { index: 1, type: 'corner' }] }
  const sources = assignSourceSlots(solution, [
    { page: 2, row: 0, column: 0, occupied: true, type: 'corner', confidence: 0.9 },
    { page: 1, row: 0, column: 0, occupied: true, type: 'corner', confidence: 0.9 }
  ])
  assert.deepEqual(sources.map(source => [source.page, source.row, source.column]), [[1, 0, 0], [2, 0, 0]])
})

test('图三式单边断口会被有效性检查拒绝', () => {
  const valid = solvePuzzle({ counts: abundant, solutionLimit: 1 }).solutions[0]
  assert.equal(validateSolution(valid), true)
  const broken = structuredClone(valid)
  broken.cells[4].mask ^= DIRECTIONS.E
  assert.equal(validateSolution(broken), false)
})

test('收益策略把相邻收益高的同型碎片放在覆盖格数更多的位置', () => {
  const solution = { cells: [
    { index: 0, type: 'corner' },
    { index: 4, type: 'corner' }
  ] }
  const sources = assignSourceSlots(solution, [
    { page: 1, row: 0, column: 0, occupied: true, type: 'corner', confidence: 1, mods: { status: 'matched', mod: { lines: ['相邻区域包含 3 个额外奥术师的保险箱'] } } },
    { page: 1, row: 0, column: 1, occupied: true, type: 'corner', confidence: 1, mods: { status: 'matched', mod: { lines: ['相邻区域中找到的物品稀有度提高 7%'] } } }
  ], { strategy: 'strongbox' })

  assert.equal(sources.find(source => source.cellIndex === 4).column, 0)
  assert.ok(sources.find(source => source.cellIndex === 4).rewardScore > 0)
})

test('边缘词缀按相邻格生效并能放大该格碎片词缀，不依赖外周出口', () => {
  const solution = { cells: [
    { index: 0, type: 'corner', mask: DIRECTIONS.E | DIRECTIONS.S },
    { index: 1, type: 'corner', mask: DIRECTIONS.E | DIRECTIONS.S }
  ] }
  const valuable = { status: 'matched', mod: { lines: ['相邻区域包含 3 个额外奥术师的保险箱'] } }
  const sources = assignSourceSlots(solution, [
    { page: 1, row: 0, column: 0, occupied: true, type: 'corner', confidence: 1, mods: valuable },
    { page: 1, row: 0, column: 1, occupied: true, type: 'corner', confidence: 1, mods: null }
  ], {
    strategy: 'strongbox',
    edges: { N0: { status: 'matched', mod: { lines: ['相邻区域的词缀数值提高 80%'] } } }
  })

  assert.equal(sources.find(source => source.cellIndex === 0).column, 0)
  assert.ok(!solution.cells[0].mask || !(solution.cells[0].mask & DIRECTIONS.N))
})

test('求解器返回策略相对收益并在无词缀时保留外周出口兜底', () => {
  const slots = Object.entries(abundant).flatMap(([type, count]) => Array.from({ length: count }, (_, index) => ({
    page: index < 10 ? 1 : 2,
    row: Math.floor((index % 10) / 6),
    column: index % 6,
    occupied: true,
    type,
    confidence: 1,
    mods: type === 'cross' && index === 0
      ? { status: 'matched', mod: { lines: ['所有航行区域中找到的亡者硫磺提高 25%'] } }
      : null
  })))
  const profitable = solvePuzzle({ slots, strategy: 'sulphur', solutionLimit: 2 })
  assert.equal(profitable.strategy, 'sulphur')
  assert.ok(profitable.rewardScore > 0)
  assert.ok(profitable.solutions.every(solution => solution.sourceSlots.length === 9))

  const fallback = solvePuzzle({ counts: abundant, strategy: 'balanced', solutionLimit: 2 })
  assert.equal(fallback.rewardDataAvailable, false)
  assert.equal(fallback.score, 12)

  const difficultyOnly = solvePuzzle({ slots: slots.map(slot => ({ ...slot, mods: { status: 'matched', mod: { lines: ['怪物伤害提高 50%'] } } })), solutionLimit: 1 })
  assert.equal(difficultyOnly.rewardDataAvailable, false)
})

test('自动收益选择显示分最高的策略', () => {
  const slots = Object.entries(abundant).flatMap(([type, count]) => Array.from({ length: count }, (_, index) => ({
    page: index < 10 ? 1 : 2,
    row: Math.floor((index % 10) / 6),
    column: index % 6,
    occupied: true,
    type,
    confidence: 1,
    mods: type === 'cross' && index === 0
      ? { status: 'matched', mod: { lines: ['相邻区域包含 3 个额外奥术师的保险箱'] } }
      : null
  })))
  const manual = ['balanced', 'strongbox', 'rare', 'magic', 'sulphur']
    .map(strategy => solvePuzzle({ slots, strategy, solutionLimit: 1 }))
  const highest = manual.reduce((best, result) => result.rewardScore > best.rewardScore ? result : best)
  const automatic = solvePuzzle({ slots, strategy: 'auto', solutionLimit: 1 })

  assert.equal(automatic.strategy, 'auto')
  assert.equal(automatic.effectiveStrategy, highest.strategy)
  assert.equal(automatic.rewardScore, highest.rewardScore)
})

test('自动收益同分时按策略顺序选择且无收益数据不冒充赢家', () => {
  const slots = Array.from({ length: 9 }, (_, index) => ({
    page: 1, row: Math.floor(index / 6), column: index % 6,
    occupied: true, type: 'cross', confidence: 1,
    mods: { status: 'matched', mod: { lines: ['相邻区域中找到的物品数量提高 10%'] } }
  }))
  const automatic = solvePuzzle({ slots, strategy: 'auto', solutionLimit: 1 })
  assert.equal(automatic.effectiveStrategy, 'balanced')

  const fallback = solvePuzzle({ counts: abundant, strategy: 'auto', solutionLimit: 1 })
  assert.equal(fallback.strategy, 'auto')
  assert.equal(fallback.effectiveStrategy, null)
  assert.equal(fallback.score, 12)
})
})()
