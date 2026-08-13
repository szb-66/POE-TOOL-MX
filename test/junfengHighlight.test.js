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
  validateJunfengGridEnvironment,
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

test('君锋镇奖励网格在显示器 ID 重枚举后按物理环境和区域安全恢复', () => {
  const region = {
    left: -1200, top: 100, right: -200, bottom: 1000,
    displayId: 'old-id', scaleFactor: 1.5,
    displayPhysicalBounds: { x: -1920, y: 0, width: 1920, height: 1080 }
  }
  const compatible = {
    id: 'new-id', scaleFactor: 1.505,
    physicalSize: { width: 1920, height: 1080 },
    physicalBounds: { x: -1920, y: 0, width: 1920, height: 1080 }
  }

  assert.deepEqual(validateJunfengGridEnvironment(region, [compatible]), { ready: true, reason: '' })
})

test('君锋镇奖励网格在显示器 ID 交换后选择包含原负坐标区域的兼容显示器', () => {
  const region = {
    left: -1200, top: 100, right: -200, bottom: 1000,
    displayId: '2', scaleFactor: 1.5,
    displayPhysicalBounds: { x: -1920, y: 0, width: 1920, height: 1080 }
  }
  const displays = [
    { id: '2', scaleFactor: 1.5, physicalSize: { width: 1920, height: 1080 }, physicalBounds: { x: 0, y: 0, width: 1920, height: 1080 } },
    { id: '3', scaleFactor: 1.5, physicalSize: { width: 1920, height: 1080 }, physicalBounds: { x: -1920, y: 0, width: 1920, height: 1080 } }
  ]

  assert.deepEqual(validateJunfengGridEnvironment(region, displays), { ready: true, reason: '' })
})

test('君锋镇奖励网格对多屏歧义和真实显示环境变化保持阻断', () => {
  const region = {
    left: 100, top: 100, right: 1100, bottom: 1000,
    displayId: 'old-id', scaleFactor: 1.5,
    displayPhysicalBounds: { x: 0, y: 0, width: 1920, height: 1080 }
  }
  const withoutBounds = { scaleFactor: 1.5, physicalSize: { width: 1920, height: 1080 } }
  assert.match(validateJunfengGridEnvironment(region, [
    { id: '3', ...withoutBounds }, { id: '4', ...withoutBounds }
  ]).reason, /显示器已变化/)

  assert.match(validateJunfengGridEnvironment(region, [{
    id: 'old-id', scaleFactor: 1.25,
    physicalSize: { width: 1920, height: 1080 }, physicalBounds: { x: 0, y: 0, width: 1920, height: 1080 }
  }]).reason, /DPI 已变化/)

  assert.match(validateJunfengGridEnvironment(region, [{
    id: 'old-id', scaleFactor: 1.5,
    physicalSize: { width: 2560, height: 1440 }, physicalBounds: { x: 1920, y: 0, width: 2560, height: 1440 }
  }]).reason, /分辨率或位置已变化/)

  assert.match(validateJunfengGridEnvironment(region, [{
    id: 'old-id', scaleFactor: 1.5,
    physicalSize: { width: 1920, height: 1080 }, physicalBounds: { x: 10, y: 0, width: 1920, height: 1080 }
  }]).reason, /分辨率或位置已变化/)
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

test('普通仓库视觉只生成候选，取件后复制确认并跳过多格占位', () => {
  const code = `
import importlib.util, json, numpy as np, sys
sys.path.insert(0, ${JSON.stringify(pythonDir)})
import stash_pickup_template as shared
spec=importlib.util.spec_from_file_location("junfeng", ${JSON.stringify(pythonScript)})
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
clock=[0.0]
m.time.monotonic=lambda: clock[0]
m.time.sleep=lambda seconds: clock.__setitem__(0,clock[0]+max(float(seconds),.001))
m.focus_game_window=lambda: True
m.require_game_foreground=lambda: None
shared.is_game_foreground=lambda: True
m.validate_model=lambda _config: (type("Model", (), {"version":"test"})(), "")
candidates=[
 {"column":column,"row":row,"probability":1.0 if (column,row)==(1,2) else 0.9}
 for row in range(3) for column in range(2)
]
m.classify=lambda *_args: (candidates, [[candidates[-1],*candidates[:-1]]], [])
m.load_calibration=lambda *_args: None
state={"removed":False,"clicks":0,"copies":0,"releases":0,"moves":[]}
item="Item Class: Body Armour\\nRarity: Rare\\nStorm Shell\\nAstral Plate\\n--------"

class Grabber:
 def __enter__(self): return self
 def __exit__(self,*_args): return False
m.mss.MSS=lambda: Grabber()
class Keyboard:
 def press(self,_key): pass
 def release(self,_key): pass
class Mouse:
 def __init__(self): self.position=(0,0)
 def press(self,_button):
  state["clicks"] += 1
  state["removed"] = True
 def release(self,_button): pass
mouse=Mouse()
class ClipboardController:
 def __init__(self,_config): self.mouse=mouse
 def move(self,x,y): mouse.position=(x,y); state["moves"].append([x,y]); return True
 def begin_ctrl(self): return True
 def copy_item_text(self, ctrl_held=False, empty_on_no_response=True, clear_first=False):
  state["copies"] += 1
  if not state["removed"]: return "copied",item
  return "empty",""
 def click_with_ctrl(self):
  state["clicks"] += 1
  state["removed"] = True
  return True
 def release_all(self): state["releases"] += 1
m.InputController=ClipboardController

def image():
 if not state["removed"]: return np.full((10,10,3),100,dtype=np.uint8)
 return np.full((10,10,3),40,dtype=np.uint8)
m.capture=lambda *_args: image()
import pynput.keyboard, pynput.mouse
pynput.keyboard.Controller=Keyboard
pynput.keyboard.Key=type("Key",(),{"ctrl":"ctrl"})
pynput.mouse.Controller=lambda: mouse
pynput.mouse.Button=type("Button",(),{"left":"left"})
events=[]
m.emit=lambda event, **payload: events.append({"event":event, **payload})
config={"grid_region":{"left":0,"top":0,"right":20,"bottom":30},
 "grid":{"columns":2,"rows":3},"operation_delay_ms":20,"timing_mode":"fixed",
 "item_footprints":{"schemaVersion":1,"items":{},
  "categories":{"body armour":{"width":2,"height":3}}},
 "fixed_timing":{"patch_verify_ms":80}}
result=m.run(config)
print(json.dumps({"result":result,"clicks":state["clicks"],"copies":state["copies"],
 "lastEvent":events[-1]["event"],"reason":events[-1].get("reason"),
 "pickedItems":events[-1].get("pickedItems"),"moves":state["moves"],"releases":state["releases"]}))
`
  assert.deepEqual(runPython(code), {
    result: 0, clicks: 1, copies: 2, lastEvent: 'completed', reason: 'completed', pickedItems: 1,
    moves: [[5, 5]], releases: 2
  })
})

test('24×24 仓库只对完整且未越界的已知 2×4 占位执行整块跳过', () => {
  const code = `
import importlib.util, json, sys
sys.path.insert(0, ${JSON.stringify(pythonDir)})
spec=importlib.util.spec_from_file_location("junfeng", ${JSON.stringify(pythonScript)})
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
full=[{"column":column,"row":row,"probability":1.0}
      for row in range(7,11) for column in range(4,6)]
ordered=m.ordered_candidates([[full[-1],*full[:-1]]])
keys={(entry["column"],entry["row"]) for entry in full}
footprint={"width":2,"height":4}
resolved=m.resolved_footprint_slots(ordered[0],footprint,full,set())
incomplete=m.resolved_footprint_slots(
 ordered[0],footprint,[entry for entry in full if (entry["column"],entry["row"])!=(5,10)],set())
overflow=m.resolved_footprint_slots(
 {"column":23,"row":21},footprint,[{"column":23,"row":21}],set())
unknown=m.resolved_footprint_slots(ordered[0],None,full,set())
print(json.dumps({"first":[ordered[0]["column"],ordered[0]["row"]],
 "resolved":sorted([list(value) for value in resolved]),
 "incomplete":len(incomplete),"overflow":len(overflow),"unknown":len(unknown)}))
`
  assert.deepEqual(runPython(code), {
    first: [4, 7],
    resolved: [[4, 7], [4, 8], [4, 9], [4, 10], [5, 7], [5, 8], [5, 9], [5, 10]],
    incomplete: 0,
    overflow: 0,
    unknown: 0
  })
})

test('24×24 仓库的已知 2×4 物品只移动和点击一次', () => {
  const code = `
import importlib.util, json, numpy as np, sys
sys.path.insert(0, ${JSON.stringify(pythonDir)})
import stash_pickup_template as shared
spec=importlib.util.spec_from_file_location("junfeng", ${JSON.stringify(pythonScript)})
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
m.focus_game_window=lambda: True
m.require_game_foreground=lambda: None
shared.is_game_foreground=lambda: True
m.validate_model=lambda _config: (type("Model", (), {"version":"test"})(), "")
candidates=[{"column":column,"row":row,"probability":1.0}
            for row in range(7,11) for column in range(4,6)]
m.classify=lambda *_args: (candidates, [[candidates[-1],*candidates[:-1]]], [])
m.capture=lambda *_args: np.zeros((240,240,3),dtype=np.uint8)
state={"removed":False,"clicks":0,"copies":0,"moves":[]}
class Grabber:
 def __enter__(self): return self
 def __exit__(self,*_args): return False
m.mss.MSS=lambda: Grabber()
class Mouse:
 def __init__(self): self.position=(0,0)
mouse=Mouse()
item="Item Class: Two Hand Sword\\nRarity: Rare\\nStorm Edge\\nEzomyte Blade\\n--------"
class ClipboardController:
 def __init__(self,_config): self.mouse=mouse
 def move(self,x,y): self.mouse.position=(x,y); state["moves"].append([x,y]); return True
 def begin_ctrl(self): return True
 def copy_item_text(self, ctrl_held=False, empty_on_no_response=True, clear_first=False):
  state["copies"] += 1
  return ("empty","") if state["removed"] else ("copied",item)
 def click_with_ctrl(self): state["clicks"] += 1; state["removed"]=True; return True
 def release_all(self): pass
m.InputController=ClipboardController
import pynput.mouse
pynput.mouse.Controller=lambda: mouse
events=[]
m.emit=lambda event, **payload: events.append({"event":event, **payload})
config={"grid_region":{"left":0,"top":0,"right":240,"bottom":240},
 "grid":{"columns":24,"rows":24},"operation_delay_ms":20,
 "item_footprints":{"schemaVersion":1,"items":{},
  "categories":{"two hand sword":{"width":2,"height":4}}}}
result=m.run(config)
print(json.dumps({"result":result,"clicks":state["clicks"],"copies":state["copies"],
 "moves":state["moves"],"pickedItems":events[-1].get("pickedItems")}))
`
  assert.deepEqual(runPython(code), {
    result: 0, clicks: 1, copies: 2, moves: [[45, 75]], pickedItems: 1
  })
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
m.capture=lambda *_args: np.zeros((10,20,3),dtype=np.uint8)
m.InterfaceMatcher=lambda _config: (_ for _ in ()).throw(RuntimeError("reward-action-must-not-match-title"))
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
item="Item Class: Currency\\nRarity: Currency\\nChaos Orb\\n--------"
class ClipboardController:
 def __init__(self,_config): self.mouse=mouse
 def move(self,x,y): self.mouse.position=(x,y); return True
 def begin_ctrl(self): return True
 def copy_item_text(self, ctrl_held=False, empty_on_no_response=True, clear_first=False): return ("copied",item) if self.mouse.clicks == 0 else ("empty","")
 def click_with_ctrl(self): self.mouse.clicks += 1; return True
 def release_all(self): pass
m.InputController=ClipboardController
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

test('君锋镇存在模糊格时只取出高置信候选并保留模糊格统计', () => {
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
m.capture=lambda *_args: np.zeros((10,20,3),dtype=np.uint8)
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
item="Item Class: Currency\\nRarity: Currency\\nChaos Orb\\n--------"
class ClipboardController:
 def __init__(self,_config): self.mouse=mouse
 def move(self,x,y): self.mouse.position=(x,y); return True
 def begin_ctrl(self): return True
 def copy_item_text(self, ctrl_held=False, empty_on_no_response=True, clear_first=False): return ("copied",item) if self.mouse.clicks == 0 else ("empty","")
 def click_with_ctrl(self): self.mouse.clicks += 1; return True
 def release_all(self): pass
m.InputController=ClipboardController
import pynput.keyboard, pynput.mouse
pynput.keyboard.Controller=Keyboard
pynput.keyboard.Key=type("Key",(),{"ctrl":"ctrl"})
pynput.mouse.Controller=lambda: mouse
pynput.mouse.Button=type("Button",(),{"left":"left"})
events=[]
m.emit=lambda event, **payload: events.append({"event":event, **payload})
result=m.run({"grid_region":{"left":0,"top":0,"right":20,"bottom":10},
 "grid":{"columns":2,"rows":1},"templates":{"junfeng_reward_title":"title.png"},
 "interface_mode":"reward","abort_on_uncertain":False,
 "operation_delay_ms":20})
print(json.dumps({"result":result,"clicks":mouse.clicks,"lastEvent":events[-1]["event"],
 "uncertainCells":events[-1]["uncertainCells"],"pickedItems":events[-1].get("pickedItems")}))
`
  assert.deepEqual(runPython(code), {
    result: 0, clicks: 1, lastEvent: 'completed', uncertainCells: 1, pickedItems: 1
  })
})

test('相邻高亮物品逐件复制确认且互不干扰', () => {
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
mouse=Mouse()
item="Item Class: Currency\\nRarity: Currency\\nChaos Orb\\n--------"
class ClipboardController:
 def __init__(self,_config): self.mouse=mouse
 def move(self,x,y): self.mouse.position=(x,y); return True
 def begin_ctrl(self): return True
 def copy_item_text(self, ctrl_held=False, empty_on_no_response=True, clear_first=False):
  column=0 if self.mouse.position[0] < 10 else 1
  return ("empty","") if column in state["removed"] else ("copied",item)
 def click_with_ctrl(self):
  state["clicks"] += 1
  state["removed"].add(0 if self.mouse.position[0] < 10 else 1)
  return True
 def release_all(self): pass
m.InputController=ClipboardController
pynput.mouse.Controller=lambda: mouse
pynput.mouse.Button=type("Button", (), {"left":"left"})
m.InterfaceMatcher=lambda _config: (_ for _ in ()).throw(RuntimeError("stash-action-must-not-match-title"))
events=[]
m.emit=lambda event, **payload: events.append({"event":event, **payload})
result=m.run({"grid_region":{"left":0,"top":0,"right":20,"bottom":10},
 "grid":{"columns":2,"rows":1},"templates":{"stash_title":"title.png"},"operation_delay_ms":20})
print(json.dumps({"result":result,"clicks":state["clicks"],"removed":sorted(state["removed"]),
 "pickedItems":events[-1].get("pickedItems"),"lastEvent":events[-1]["event"]}))
`
  assert.deepEqual(runPython(code), {
    result: 0, clicks: 2, removed: [0, 1], pickedItems: 2, lastEvent: 'completed'
  })
})

test('两件相邻的 2×2 物品各只移动和点击一次', () => {
  const code = `
import importlib.util, json, numpy as np, sys
sys.path.insert(0, ${JSON.stringify(pythonDir)})
import stash_pickup_template as shared
spec=importlib.util.spec_from_file_location("junfeng", ${JSON.stringify(pythonScript)})
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
m.focus_game_window=lambda: True
m.require_game_foreground=lambda: None
shared.is_game_foreground=lambda: True
m.validate_model=lambda _config: (type("Model", (), {"version":"test"})(), "")
candidates=[{"column":column,"row":row,"probability":1.0}
            for row in range(2) for column in range(4)]
m.classify=lambda *_args: (candidates, [candidates], [])
m.capture=lambda *_args: np.zeros((20,40,3),dtype=np.uint8)
state={"removed":set(),"clicks":0,"moves":[]}
class Grabber:
 def __enter__(self): return self
 def __exit__(self,*_args): return False
m.mss.MSS=lambda: Grabber()
class Mouse:
 def __init__(self): self.position=(0,0)
mouse=Mouse()
item="Item Class: Helmet\\nRarity: Rare\\nStorm Crown\\nEzomyte Burgonet\\n--------"
class ClipboardController:
 def __init__(self,_config): self.mouse=mouse
 def move(self,x,y): self.mouse.position=(x,y); state["moves"].append([x,y]); return True
 def begin_ctrl(self): return True
 def copy_item_text(self, ctrl_held=False, empty_on_no_response=True, clear_first=False):
  identity=0 if self.mouse.position[0] < 20 else 1
  return ("empty","") if identity in state["removed"] else ("copied",item)
 def click_with_ctrl(self):
  identity=0 if self.mouse.position[0] < 20 else 1
  state["clicks"] += 1; state["removed"].add(identity); return True
 def release_all(self): pass
m.InputController=ClipboardController
import pynput.mouse
pynput.mouse.Controller=lambda: mouse
events=[]
m.emit=lambda event, **payload: events.append({"event":event, **payload})
config={"grid_region":{"left":0,"top":0,"right":40,"bottom":20},
 "grid":{"columns":4,"rows":2},"operation_delay_ms":20,
 "item_footprints":{"schemaVersion":1,"items":{},
  "categories":{"helmet":{"width":2,"height":2}}}}
result=m.run(config)
print(json.dumps({"result":result,"clicks":state["clicks"],"moves":state["moves"],
 "removed":sorted(state["removed"]),"pickedItems":events[-1].get("pickedItems")}))
`
  assert.deepEqual(runPython(code), {
    result: 0, clicks: 2, moves: [[5, 5], [25, 5]], removed: [0, 1], pickedItems: 2
  })
})

test('未知尺寸多格物品保守逐格移动判空且不会再次点击', () => {
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
candidates=[{"column":0,"row":0,"probability":1.0},{"column":1,"row":0,"probability":1.0}]
m.classify=lambda *_args: (candidates, [candidates], [])
state={"removed":False,"clicks":0,"moves":[],"copies":0}
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
mouse=Mouse()
pynput.mouse.Controller=lambda: mouse
pynput.mouse.Button=type("Button", (), {"left":"left"})
item="Item Class: Currency\\nRarity: Currency\\nChaos Orb\\n--------"
class ClipboardController:
 def __init__(self,_config): self.mouse=mouse
 def move(self,x,y): self.mouse.position=(x,y); state["moves"].append([x,y]); return True
 def begin_ctrl(self): return True
 def copy_item_text(self, ctrl_held=False, empty_on_no_response=True, clear_first=False):
  state["copies"] += 1
  return ("empty","") if state["removed"] else ("copied",item)
 def click_with_ctrl(self): state["clicks"] += 1; state["removed"]=True; return True
 def release_all(self): pass
m.InputController=ClipboardController
events=[]
m.emit=lambda event, **payload: events.append({"event":event, **payload})
result=m.run({"grid_region":{"left":0,"top":0,"right":20,"bottom":10},
 "grid":{"columns":2,"rows":1},"operation_delay_ms":20})
print(json.dumps({"result":result,"clicks":state["clicks"],"copies":state["copies"],
 "moves":state["moves"],"pickedItems":events[-1].get("pickedItems"),"lastEvent":events[-1]["event"]}))
`
  assert.deepEqual(runPython(code), {
    result: 0, clicks: 1, copies: 3, moves: [[5, 5], [15, 5]],
    pickedItems: 1, lastEvent: 'completed'
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
