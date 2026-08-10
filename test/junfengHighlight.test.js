import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { JunfengCalibrationRepository } from '../electron/modules/junfeng/calibrationRepository.js'
import {
  JUNFENG_GRID,
  normalizeJunfengRegion,
  normalizeJunfengSettings,
  validateJunfengSettings
} from '../src/utils/junfengConfig.js'
import { pythonPath, runPython } from './helpers/python.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pythonScript = path.join(projectRoot, 'src/assets/scripts/junfeng_highlight_pickup.py')
const pythonDir = path.dirname(pythonScript)

test('君锋镇配置固定 12×11 网格并保留显示器与 DPI 元数据', () => {
  const region = normalizeJunfengRegion({
    region: { left: 10, top: 20, right: 1210, bottom: 1120 },
    displayId: 7, scaleFactor: 1.5, displayPhysicalBounds: { left: 0, top: 0, width: 2560, height: 1440 }
  })
  assert.equal(region.displayId, '7')
  assert.equal(region.scaleFactor, 1.5)
  assert.deepEqual(normalizeJunfengSettings({ enabled: true, grid: { columns: 2, rows: 2 }, gridRegion: region }).grid, JUNFENG_GRID)
  assert.equal(validateJunfengSettings({ gridRegion: region }, {}), '请先框选君锋镇奖励标题')
  assert.equal(validateJunfengSettings({ gridRegion: region }, { junfengRewardTitle: 'reward.png' }), '')
})

test('负坐标显示器的鼠标停车点保持在奖励网格外', () => {
  const code = `
import importlib.util, json, sys
sys.path.insert(0, ${JSON.stringify(pythonDir)})
spec=importlib.util.spec_from_file_location("junfeng", ${JSON.stringify(pythonScript)})
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
region={"left":-100,"top":100,"right":100,"bottom":1200,
 "displayPhysicalBounds":{"left":-1920,"top":0,"width":1920,"height":1080}}
rect=m.region_rect(region)
position=m.park_cursor_position(region, rect)
inside=rect["left"] <= position[0] < rect["left"] + rect["width"] and rect["top"] <= position[1] < rect["top"] + rect["height"]
print(json.dumps([position,inside]))
`
  assert.deepEqual(runPython(code), [[-1908, 12], false])
})

test('任意行列切格、四邻域候选归并和本机近邻覆盖保持稳定', () => {
  const code = `
import json, sys, importlib.util, numpy as np
sys.path.insert(0, ${JSON.stringify(pythonDir)})
spec=importlib.util.spec_from_file_location("junfeng", ${JSON.stringify(pythonScript)})
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
image=np.zeros((110,120,3),dtype=np.uint8)
tiles=m.grid_tiles(image,12,11)
groups=m.group_candidates([
 {"column":0,"row":0,"probability":.999}, {"column":1,"row":0,"probability":.998},
 {"column":3,"row":3,"probability":.997}
])
prob=np.asarray([[.6,.3,.1],[.2,.7,.1]],dtype=np.float32)
emb=np.asarray([[1,0],[0,1]],dtype=np.float32)
samples=np.asarray([[1,0]],dtype=np.float32)
out, overridden=m.apply_calibration(prob,emb,(samples,np.asarray([2])),.97)
print(json.dumps([len(tiles),[len(g) for g in groups],out.tolist(),overridden.tolist()]))
`
  const result = runPython(code)
  assert.deepEqual(result[0], 132)
  assert.deepEqual(result[1], [2, 1])
  assert.deepEqual(result[2][0], [0, 0, 1])
  assert.deepEqual(result[3], [true, false])
})

test('君锋镇近似高亮纠正可覆盖临界低置信预测', () => {
  const code = `
import json, sys, importlib.util, numpy as np
sys.path.insert(0, ${JSON.stringify(pythonDir)})
spec=importlib.util.spec_from_file_location("junfeng", ${JSON.stringify(pythonScript)})
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
similarity=.969269
query=np.asarray([1.0,0.0],dtype=np.float32)
sample=np.asarray([similarity,np.sqrt(1.0-similarity**2)],dtype=np.float32)
class Model:
 version="test"
 def infer(self, _images):
  return np.asarray([[.838175,.12,.041825]],dtype=np.float32),np.asarray([query])
image=np.zeros((10,10,3),dtype=np.uint8)
cells,groups,uncertain=m.classify(image,{"grid":{"columns":1,"rows":1}},Model(),
 (np.asarray([sample]),np.asarray([0])))
print(json.dumps({"candidateCount":sum(map(len,groups)),"uncertainCount":len(uncertain),
 "calibrated":cells[0]["calibrated"]}))
`
  assert.deepEqual(runPython(code), { candidateCount: 1, uncertainCount: 0, calibrated: true })
})

test('检测结果显式区分最终候选、模糊格和普通分类', () => {
  const code = `
import json, sys, importlib.util, numpy as np
sys.path.insert(0, ${JSON.stringify(pythonDir)})
spec=importlib.util.spec_from_file_location("junfeng", ${JSON.stringify(pythonScript)})
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
class Model:
 version="test"
 def infer(self, _images):
  return np.asarray([[.999,.0005,.0005],[.8,.15,.05],[.1,.8,.1]],dtype=np.float32),np.eye(3,32,dtype=np.float32)
image=np.zeros((10,30,3),dtype=np.uint8)
cells,groups,uncertain=m.classify(image,{"grid":{"columns":3,"rows":1},"highlight_threshold":.995},Model(),None)
print(json.dumps({"decisions":[cell["decision"] for cell in cells],"candidates":sum(map(len,groups)),"uncertain":len(uncertain)}))
`
  assert.deepEqual(runPython(code), {
    decisions: ['candidate', 'uncertain', 'classified'], candidates: 1, uncertain: 1
  })
})

test('逐格复检必须继续满足高亮自动门槛', () => {
  const code = `
import importlib.util, json, numpy as np, sys
sys.path.insert(0, ${JSON.stringify(pythonDir)})
spec=importlib.util.spec_from_file_location("junfeng", ${JSON.stringify(pythonScript)})
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
class Model:
 def __init__(self, probability): self.probability=probability
 def infer(self, _images):
  p=self.probability
  return np.asarray([[p,1-p,0]],dtype=np.float32),np.zeros((1,32),dtype=np.float32)
image=np.zeros((10,10,3),dtype=np.uint8)
candidate={"column":0,"row":0}
config={"highlight_threshold":.995}
labels=[m.candidate_label(image,1,1,candidate,config,Model(value),None,True) for value in (.999,.99,.2)]
print(json.dumps(labels))
`
  assert.deepEqual(runPython(code), ['highlighted', 'uncertain', 'dimmed'])
})

test('转移确认忽略未清空的瞬时像素变化', () => {
  const code = `
import importlib.util, json, numpy as np, sys
sys.path.insert(0, ${JSON.stringify(pythonDir)})
spec=importlib.util.spec_from_file_location("junfeng", ${JSON.stringify(pythonScript)})
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
clock=[0.0]
m.time.monotonic=lambda: clock[0]
m.time.sleep=lambda seconds: clock.__setitem__(0,clock[0]+max(float(seconds),.001))
m.require_action_ready=lambda *_args: None
images=[np.full((10,10,3),40,dtype=np.uint8),np.zeros((10,10,3),dtype=np.uint8)]
m.capture=lambda *_args: images.pop(0) if images else np.zeros((10,10,3),dtype=np.uint8)
m.candidate_label=lambda image,*_args: "dimmed" if np.mean(image)>0 else "empty"
before=np.full((10,10,3),100,dtype=np.uint8)
result=m.wait_for_candidate_change(before,{"left":0,"top":0,"width":10,"height":10},1,1,
 {"column":0,"row":0},object(),.01,.1,{},object(),None)
print(json.dumps({"cleared":result is not None,"mean":float(np.mean(result))}))
`
  assert.deepEqual(runPython(code), { cleared: true, mean: 0 })
})

test('输入门禁按取件场景同步验证标题和背包', () => {
  const code = `
import importlib.util, json, sys
sys.path.insert(0, ${JSON.stringify(pythonDir)})
spec=importlib.util.spec_from_file_location("junfeng", ${JSON.stringify(pythonScript)})
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
m.require_game_foreground=lambda: None
class Matcher:
 def __init__(self,matches): self.matches=matches
 def check_interface(self): return self.matches,{}
out=[]
for mode,matches in (("reward",{"rewardMatched":True,"inventoryMatched":True}),
                     ("reward",{"rewardMatched":False,"inventoryMatched":True}),
                     ("stash",{"stashMatched":True}),
                     ("stash",{"stashMatched":False})):
 try: m.require_action_ready(Matcher(matches),mode); out.append("ready")
 except RuntimeError as error: out.append(str(error))
print(json.dumps(out))
`
  assert.deepEqual(runPython(code), ['ready', 'reward-interface-lost', 'ready', 'interface-lost'])
})

test('仓库模式自动选择校准区域和 12×12 或 24×24 布局后使用高亮模型', () => {
  const code = `
import importlib.util, json, numpy as np, sys
sys.path.insert(0, ${JSON.stringify(pythonDir)})
spec=importlib.util.spec_from_file_location("junfeng", ${JSON.stringify(pythonScript)})
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
m.focus_game_window=lambda: True
m.require_game_foreground=lambda: None
m.validate_model=lambda _config: (type("Model", (), {"version":"shared-v1"})(), "")
m.choose_layout=lambda *_args: {
 "columns":24,"calibration":"folder","confidence":1.8,
 "rect":{"left":20,"top":30,"width":240,"height":240},
 "image":np.zeros((240,240,3),dtype=np.uint8)
}
m.classify=lambda image, config, *_args: ([], [], [])
class Mouse:
 def __init__(self): self.position=(0,0)
class Grabber:
 def __enter__(self): return self
 def __exit__(self,*_args): return False
 def grab(self,_rect): return np.zeros((240,240,4),dtype=np.uint8)
m.mss.MSS=lambda: Grabber()
import pynput.mouse
pynput.mouse.Controller=Mouse
events=[]
m.emit=lambda event, **payload: events.append({"event":event, **payload})
result=m.run({"calibration":{"folder":{"left":20,"top":30,"right":260,"bottom":270}},
 "model_path":"model.onnx","manifest_path":"manifest.json"}, True)
print(json.dumps({"result":result,"event":events[-1]["event"],"layout":events[-1]["layout"],
 "calibration":events[-1]["calibration"],"modelVersion":events[-1]["modelVersion"]}))
`
  assert.deepEqual(runPython(code), {
    result: 0, event: 'preview', layout: 24, calibration: 'folder', modelVersion: 'shared-v1'
  })
})

test('普通仓库存在模糊格时跳过模糊格并继续处理高置信候选', () => {
  const code = `
import importlib.util, json, numpy as np, sys
sys.path.insert(0, ${JSON.stringify(pythonDir)})
import stash_pickup_template as shared
spec=importlib.util.spec_from_file_location("junfeng", ${JSON.stringify(pythonScript)})
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
m.focus_game_window=lambda: True
m.require_game_foreground=lambda: None
shared.is_game_foreground=lambda: True
m.validate_model=lambda _config: (type("Model", (), {"version":"shared-v1"})(), "")
candidate={"column":0,"row":0,"probability":1.0}
m.classify=lambda *_args: ([candidate], [[candidate]], [{"column":1,"row":0}])
m.load_calibration=lambda *_args: None
m.candidate_label=lambda *_args: "highlighted"
m.capture=lambda *_args: np.zeros((10,20,3),dtype=np.uint8)
m.wait_for_candidate_change=lambda *_args: np.ones((10,20,3),dtype=np.uint8)
class Grabber:
 def __enter__(self): return self
 def __exit__(self,*_args): return False
m.mss.MSS=lambda: Grabber()
class Keyboard:
 def press(self,_key): pass
 def release(self,_key): pass
class Mouse:
 def __init__(self): self.position=(0,0); self.clicks=0
 def press(self,_button): self.clicks += 1
 def release(self,_button): pass
mouse=Mouse()
import pynput.keyboard, pynput.mouse
pynput.keyboard.Controller=Keyboard
pynput.keyboard.Key=type("Key",(),{"ctrl":"ctrl"})
pynput.mouse.Controller=lambda: mouse
pynput.mouse.Button=type("Button",(),{"left":"left"})
events=[]
m.emit=lambda event, **payload: events.append({"event":event, **payload})
result=m.run({"grid_region":{"left":0,"top":0,"right":20,"bottom":10},
 "grid":{"columns":2,"rows":1},"abort_on_uncertain":False,"operation_delay_ms":20})
print(json.dumps({"result":result,"clicks":mouse.clicks,"lastEvent":events[-1]["event"],
 "uncertainCells":events[-1]["uncertainCells"],"pickedItems":events[-1].get("pickedItems")}))
`
  assert.deepEqual(runPython(code), {
    result: 0, clicks: 1, lastEvent: 'completed', uncertainCells: 1, pickedItems: 1
  })
})

test('相邻高亮物品逐件确认，单件变化不会被合并区域平均值稀释', () => {
  const code = `
import importlib.util, json, numpy as np, sys
sys.path.insert(0, ${JSON.stringify(pythonDir)})
import stash_pickup_template as shared
spec=importlib.util.spec_from_file_location("junfeng", ${JSON.stringify(pythonScript)})
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

clock=[0.0]
m.time.monotonic=lambda: clock[0]
m.time.sleep=lambda seconds: clock.__setitem__(0, clock[0] + max(float(seconds), 0.001))
m.focus_game_window=lambda: True
m.require_game_foreground=lambda: None
shared.is_game_foreground=lambda: True
m.validate_model=lambda _config: (type("Model", (), {"version":"test"})(), "")
m.candidate_label=lambda current, columns, rows, candidate, *_args: (
 "empty" if np.mean(m.candidate_patch(current, columns, rows, candidate)) < 99 else "highlighted")

candidates=[
 {"column":0,"row":0,"probability":1.0},
 {"column":1,"row":0,"probability":1.0}
]
m.classify=lambda *_args: (candidates, [candidates], [])
state={"removed":set(),"clicks":0}
def image():
 output=np.full((10,20,3),100,dtype=np.uint8)
 for column in state["removed"]:
  output[:,column*10:(column+1)*10]=90
 return output
m.capture=lambda *_args: image()

class Grabber:
 def __enter__(self): return self
 def __exit__(self, *_args): return False
m.mss.MSS=lambda: Grabber()
class Keyboard:
 def press(self, _key): pass
 def release(self, _key): pass
class Mouse:
 def __init__(self): self.position=(0,0)
 def press(self, _button):
  state["clicks"] += 1
  state["removed"].add(0 if self.position[0] < 10 else 1)
 def release(self, _button): pass

import pynput.keyboard, pynput.mouse
pynput.keyboard.Controller=Keyboard
pynput.keyboard.Key=type("Key", (), {"ctrl":"ctrl"})
pynput.mouse.Controller=Mouse
pynput.mouse.Button=type("Button", (), {"left":"left"})
events=[]
m.emit=lambda event, **payload: events.append({"event":event, **payload})
result=m.run({"grid_region":{"left":0,"top":0,"right":20,"bottom":10},
 "grid":{"columns":2,"rows":1},"operation_delay_ms":20})
print(json.dumps({"result":result,"clicks":state["clicks"],"removed":sorted(state["removed"]),
 "pickedItems":events[-1].get("pickedItems"),"lastEvent":events[-1]["event"]}))
`
  assert.deepEqual(runPython(code), {
    result: 0, clicks: 2, removed: [0, 1], pickedItems: 2, lastEvent: 'completed'
  })
})

test('多格物品的弱变化占格会重新识别为空，不会在取走后再次空点击', () => {
  const code = `
import importlib.util, json, numpy as np, sys
sys.path.insert(0, ${JSON.stringify(pythonDir)})
import stash_pickup_template as shared
spec=importlib.util.spec_from_file_location("junfeng", ${JSON.stringify(pythonScript)})
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
clock=[0.0]
m.time.monotonic=lambda: clock[0]
m.time.sleep=lambda seconds: clock.__setitem__(0, clock[0] + max(float(seconds), 0.001))
m.focus_game_window=lambda: True
m.require_game_foreground=lambda: None
shared.is_game_foreground=lambda: True
m.validate_model=lambda _config: (type("Model", (), {"version":"test"})(), "")
m.candidate_label=lambda current, columns, rows, candidate, *_args: (
 "empty" if np.mean(m.candidate_patch(current, columns, rows, candidate)) < 99 else "highlighted")
candidates=[{"column":0,"row":0,"probability":1.0},{"column":1,"row":0,"probability":1.0}]
m.classify=lambda *_args: (candidates, [candidates], [])
state={"removed":False,"clicks":0}
def image():
 output=np.full((10,20,3),100,dtype=np.uint8)
 if state["removed"]:
  output[:,:10]=90
  output[:,10:]=97
 return output
m.capture=lambda *_args: image()
class Grabber:
 def __enter__(self): return self
 def __exit__(self, *_args): return False
m.mss.MSS=lambda: Grabber()
class Keyboard:
 def press(self, _key): pass
 def release(self, _key): pass
class Mouse:
 def __init__(self): self.position=(0,0)
 def press(self, _button):
  state["clicks"] += 1
  state["removed"]=True
 def release(self, _button): pass
import pynput.keyboard, pynput.mouse
pynput.keyboard.Controller=Keyboard
pynput.keyboard.Key=type("Key", (), {"ctrl":"ctrl"})
pynput.mouse.Controller=Mouse
pynput.mouse.Button=type("Button", (), {"left":"left"})
events=[]
m.emit=lambda event, **payload: events.append({"event":event, **payload})
result=m.run({"grid_region":{"left":0,"top":0,"right":20,"bottom":10},
 "grid":{"columns":2,"rows":1},"operation_delay_ms":20})
print(json.dumps({"result":result,"clicks":state["clicks"],"pickedItems":events[-1].get("pickedItems"),
 "lastEvent":events[-1]["event"]}))
`
  assert.deepEqual(runPython(code), {
    result: 0, clicks: 1, pickedItems: 1, lastEvent: 'completed'
  })
})

test('本机校准保存原始图块和特征，支持删除、损坏降级与模型升级重嵌入', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'junfeng-calibration-'))
  try {
    const repository = new JunfengCalibrationRepository(root)
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
    const saved = repository.save({ tileDataUrl: png, label: 'highlighted', column: 2, row: 3,
      modelVersion: 'v1', previewId: 'preview-1', embedding: Array.from({ length: 32 }, (_, index) => index / 32) })
    assert.equal(saved.previewId, 'preview-1')
    assert.equal(saved.domain, 'junfeng')
    assert.equal(saved.columns, 12)
    assert.equal(saved.rows, 11)
    assert.equal(repository.list()[0].featureVector.length, 32)
    assert.equal(repository.markForReembed('v2')[0].featureVector.length, 0)
    await writeFile(repository.indexPath, '{broken', 'utf8')
    assert.deepEqual(repository.list(), [])
    repository.save({ tileDataUrl: png, label: 'dimmed', column: 2, row: 3,
      domain: 'large-stash', columns: 24, rows: 24 })
    const index = JSON.parse(await readFile(repository.indexPath, 'utf8'))
    assert.equal(index.samples.length, 1)
    assert.equal(repository.list()[0].domain, 'large-stash')
    assert.equal(repository.list()[0].columns, 24)
    delete index.samples[0].domain
    delete index.samples[0].columns
    delete index.samples[0].rows
    await writeFile(repository.indexPath, JSON.stringify(index), 'utf8')
    assert.deepEqual(repository.list().map(sample => [sample.domain, sample.columns, sample.rows]), [['junfeng', 12, 11]])
    assert.equal(repository.remove(index.samples[0].id), true)
    assert.deepEqual(repository.list(), [])
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('通用训练仓库按来源和预览会话保存整张已核对网格', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'highlight-training-'))
  try {
    const repository = new JunfengCalibrationRepository(root)
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
    const summary = repository.saveTrainingSession({ previewId: 'stash-preview-1', domain: 'large-stash', columns: 2, rows: 1,
      partition: 'test', rawImageDataUrl: png,
      cells: [{ tileDataUrl: png, label: 'highlighted', column: 0, row: 0 },
        { tileDataUrl: png, label: 'dimmed', column: 1, row: 0 }] })
    assert.deepEqual(summary, { samples: 2, sessions: 1, domains: { 'large-stash': 2 },
      labels: { highlighted: 1, dimmed: 1 }, partitions: { test: 2 } })
    assert.equal(repository.listTrainingSamples()[0].columns, 2)
    assert.equal(repository.listTrainingSessions()[0].locked, true)
    assert.match(repository.getTrainingSession('stash-preview-1').imageDataUrl, /^data:image\/png;base64,/)
    repository.updateTrainingSession({ id: 'stash-preview-1', labels: { '1:0': 'empty' }, partition: 'validation' })
    assert.deepEqual(repository.getTrainingSession('stash-preview-1').labels, { highlighted: 1, empty: 1 })
    assert.equal(repository.listTrainingSessions()[0].revision, 2)
    assert.deepEqual(repository.deleteTrainingSession('stash-preview-1'), {
      samples: 0, sessions: 0, domains: {}, labels: {}, partitions: {}
    })
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('当前模型保留质量报告且运行只依赖兼容契约和文件完整性', async () => {
  const manifest = JSON.parse(await readFile(path.join(projectRoot, 'src/assets/models/junfeng-highlight/manifest.json'), 'utf8'))
  assert.equal(manifest.architectureVersion, 1)
  assert.deepEqual(manifest.classes, ['highlighted', 'dimmed', 'empty'])
  assert.equal(manifest.benchmark.passed, false)
  assert.equal('automationEnabled' in manifest, false)
  const script = await readFile(pythonScript, 'utf8')
  assert.doesNotMatch(script, /model-not-approved|require_approved/)
  assert.match(script, /model-checksum-mismatch/)
  assert.match(script, /with mss\.MSS\(\) as grabber:/)
  assert.doesNotMatch(script, /mss\.mss\(/)
})

test('内置隔离 Python 可从脚本同目录加载仓库取件公共函数', () => {
  const result = spawnSync(pythonPath, [pythonScript, '--help'], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.match(result.stdout, /--config/)
})
