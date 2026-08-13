import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { AutomationLock } from '../electron/modules/automation/lock.js'

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
    ['mouse', 0x0002], ['sleep', 0.02], ['mouse', 0x0004], ['sleep', 0.02]
  ])
  assert.deepEqual(output.interrupted, [
    ['move', 30, 40], ['sleep', 0.5], ['foreground'],
    ['mouse', 0x0008], ['sleep', 0.02], ['mouse', 0x0010], ['sleep', 0.02]
  ])
})

test('放置后移出目标格再等待游戏稳定验证', { skip: !existsSync(python) }, () => {
  const code = [
    `import json,sys;sys.path.insert(0,${JSON.stringify(scripts)})`,
    'import puzzle_auto_place as module',
    'events=[]',
    'module.timing_mode="fixed"',
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
  assert.equal(events[1][1], 0.55, '来源左键后使用画面验证等待配置')
  assert.deepEqual(events[3], ['move', 50, 60], '目标点击后必须移出海图区再验证，避免悬停高亮改变拓扑')
  assert.equal(events.at(-1)[1], 0.55, '目标左键后使用画面验证等待配置')
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
    'module.capture_analyze=lambda *args: events.append(["capture"]) or next(captures)',
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
    'module.capture_analyze=lambda *args: events.append(["capture"]) or next(captures)',
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

test('切换仓库页签先点击标定点并等待页面稳定', { skip: !existsSync(python) }, () => {
  const code = [
    `import json,sys;sys.path.insert(0,${JSON.stringify(scripts)})`,
    'import puzzle_auto_place as module',
    'events=[]',
    'module.timing_mode="fixed"',
    'module.click_physical=lambda x,y,button,delay: events.append(["click",x,y,button])',
    'module.move_physical=lambda x,y: events.append(["move",x,y])',
    'module.time.sleep=lambda seconds: events.append(["sleep",round(seconds,3)])',
    'module.switch_inventory_page({"1":{"x":100,"y":200},"2":{"x":300,"y":200}},2,0.04)',
    'print(json.dumps(events))'
  ].join(';')
  const result = spawnSync(python, ['-c', code], { cwd: scripts, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), [['click', 300, 200, 'left'], ['move', 0, 0], ['sleep', 0.25]])
})

test('自动放入在截图和危险来源输入前切换并验证计划页', () => {
  const script = source('src/assets/scripts/puzzle_auto_place.py')
  const main = script.match(/def main\(\)[\s\S]*?return 0/)?.[0] || ''
  assert.ok(main.indexOf('switch_inventory_page(') < main.indexOf('inventory = capture_analyze('))
  assert.ok(main.indexOf('planned_source_valid(') < main.indexOf('rotate_source_to_target('))
  assert.match(main, /source_page = int\(source\.get\("page", 1\)\)/)
  assert.match(main, /event\("source-page"/)
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
  const verify = script.match(/def verify_target[\s\S]*?\r?\n\r?\ndef main/)?.[0] || ''
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
  assert.match(service, /stdio: \['ignore', 'pipe', 'pipe'\]/)
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
