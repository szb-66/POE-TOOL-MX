import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  normalizeStashPickupProfile,
  normalizeStashPickupSettings
} from '../src/utils/stashPickupConfig.js'
import {
  migrateStashGridCalibration,
  normalizeStashGridRegion
} from '../src/utils/stashGridCalibration.js'

const pythonScript = new URL('../src/assets/scripts/stash_pickup_template.py', import.meta.url)
const fixtureDir = new URL('./fixtures/stashPickup/', import.meta.url)
const pythonScriptPath = fileURLToPath(pythonScript)
const fixtureDirPath = fileURLToPath(fixtureDir)

function runPython(code) {
  const command = process.platform === 'win32' ? 'py' : 'python3'
  const args = process.platform === 'win32' ? ['-3.13', '-c', code] : ['-c', code]
  const result = spawnSync(command, args, { encoding: 'utf8' })
  if (result.status !== 0) throw new Error(result.stderr || result.stdout)
  return JSON.parse(result.stdout)
}

test('检测配置按普通与大型仓库保存独立默认值并限制参数范围', () => {
  const settings = normalizeStashPickupSettings()
  assert.equal(settings.profiles.normal.thresholds.variance, 1500)
  assert.equal(settings.profiles.quad.thresholds.variance, 3000)
  assert.equal(settings.profiles.normal.sampleRatio, 0.6)
  assert.deepEqual(
    normalizeStashPickupProfile({ method: 'brightness', brightnessThreshold: 999, sampleRatio: 0 }, 'normal'),
    { method: 'brightness', thresholds: { variance: 1500, brightness: 255, saturation: 50 }, sampleRatio: 0.1 }
  )
})

test('公共仓库校准保留物理元数据并只在公共值为空时迁移旧值', () => {
  const legacy = { normal: { left: 1, top: 2, right: 101, bottom: 102 }, folderQuad: { left: 3, top: 4, right: 103, bottom: 104 } }
  const current = { root: { region: { left: 10, top: 20, right: 210, bottom: 220 }, displayId: 7, scaleFactor: 1.5 } }
  const result = migrateStashGridCalibration(current, legacy)
  assert.equal(result.root.left, 10)
  assert.equal(result.root.displayId, '7')
  assert.equal(result.folder.left, 3)
  assert.equal(normalizeStashGridRegion({ left: 1, top: 1, right: 1, bottom: 2 }), null)
})

test('固定截图按网格周期识别布局并生成稳定候选格', () => {
  const code = `
import importlib.util, cv2, json, os, numpy as np
spec=importlib.util.spec_from_file_location("hp", ${JSON.stringify(pythonScriptPath)})
hp=importlib.util.module_from_spec(spec); spec.loader.exec_module(hp)
root=${JSON.stringify(fixtureDirPath)}
cases=[("normal-unsearched.jpg",12,1500),("normal-highlight.jpg",12,1500),("normal-no-match.jpg",12,1500),("quad-highlight.jpg",24,3000)]
out=[]
for name,columns,threshold in cases:
 image=cv2.imdecode(np.fromfile(os.path.join(root,name),dtype=np.uint8),cv2.IMREAD_COLOR)
 candidates=hp.detect_candidates(image,columns,{"method":"variance","thresholds":{"variance":threshold},"sampleRatio":.6})
 out.append([hp.detect_grid_layout(image)[0],round(hp.grid_confidence(image,12),2),round(hp.grid_confidence(image,24),2),len(candidates)])
print(json.dumps(out))
`
  assert.deepEqual(runPython(code), [
    [12, 3.38, 3.64, 28],
    [12, 5.54, 5.14, 10],
    [12, 4.91, 4.97, 0],
    [24, 1.29, 1.45, 21]
  ])
})

test('布局识别容忍校准边缘和起点偏移', () => {
  const code = `
import importlib.util, cv2, json, os, numpy as np
spec=importlib.util.spec_from_file_location("hp", ${JSON.stringify(pythonScriptPath)})
hp=importlib.util.module_from_spec(spec); spec.loader.exec_module(hp)
root=${JSON.stringify(fixtureDirPath)}

quad=cv2.imdecode(np.fromfile(os.path.join(root,"quad-highlight.jpg"),dtype=np.uint8),cv2.IMREAD_COLOR)
quad=cv2.copyMakeBorder(quad,4,4,4,4,cv2.BORDER_CONSTANT,value=(15,15,15))
normal=cv2.imdecode(np.fromfile(os.path.join(root,"normal-unsearched.jpg"),dtype=np.uint8),cv2.IMREAD_COLOR)
normal=normal[38:,38:]

class Grabber:
 def __init__(self,image): self.image=cv2.cvtColor(image,cv2.COLOR_BGR2BGRA)
 def grab(self,_rect): return self.image

def layout_for(image):
 layout=hp.choose_layout({"root":{"left":0,"top":0,"right":image.shape[1],"bottom":image.shape[0]}},Grabber(image),1.15)
 return [layout["columns"],round(layout["confidence"],2)]

print(json.dumps([layout_for(quad),layout_for(normal)]))
`
  const result = runPython(code)
  assert.equal(result[0][0], 24)
  assert.ok(result[0][1] >= 1.15)
  assert.equal(result[1][0], 12)
  assert.ok(result[1][1] >= 1.15)
})

test('密集重复物品纹理不会把12格仓库误判为24格', () => {
  const code = `
import importlib.util, base64, cv2, json, numpy as np
spec=importlib.util.spec_from_file_location("hp", ${JSON.stringify(pythonScriptPath)})
hp=importlib.util.module_from_spec(spec); spec.loader.exec_module(hp)
tile_data=base64.b64decode("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDACgcHiMeGSgjISMtKygwPGRBPDc3PHtYXUlkkYCZlo+AjIqgtObDoKrarYqMyP/L2u71////m8H////6/+b9//j/2wBDASstLTw1PHZBQXb4pYyl+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj/wAARCABkAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDMTc67BjHc0/ykHBfmkU7YGYdahJ56ZpWuMseVH/eNAijHRjVbPsKXPsKfKwuWSkZIO88UY65kz+FVt3sKM+wo5WFywY4yclyaPLj/AL5qHY+zf5Z2+uOKbn2FHKwuWPLj/vmjy4/75qvn2FGfYUuULljy4/75o8uP++ar7vYUbvYUcrC5Y8qP++aKr7vYUUcrC5Mv/Hu1QHrU6/8AHu1QHrTiDCiiiqEFXtPt1YmaZN0S8Y9TVJVLsFUZJOBW2irGUELKUjGGHTn1oYILlrhF4UJHnPqR7VnyRIw3g5z6EZq9cOzH5mUheSgPLVnO2SXI69aHboMa9s6oXUhkBxkHOKkt7IybXlYJGTj3P0FRrI0YO04B9Kvx3qZ3cO4AAYjGKaVxFK8tlhkPlFivowwRVatO4uvOJ3Dco6/SqU4h8wmEnYemetElyiIaKUqQaKQyZf8Aj3aoD1qdf+PdqgPWpiNhRRRVCLdhtzLnG/b8mf1q2Yg8RmkHJ6Y/nWZErvIqx/eJwK1lSQw7GIBRcOT2HrVK19QKRbIZeCR0YCmSglQzbQM44PWpXiMMbBnG9+i98VCyqI1O4Eg8pioY0rigKY+cZpqoI5VbAPPQ+tWJo0VGYZLlQyY6bfWqYJ3Kx555puVwJ5CN+4ADj5sd/anXV3FM3yW4UAEDnB+tKMFZoAMk4ZD/ADqqV4zjik3cErhuPrRQFoqR2JF/492qA9anH/Hu1QHrTiJhV20s94Dyg4PCr3als7OOWIyzMyjOFUD71PlZvPDMCrLx6ce1UImWNVnCxRKGB2deppm6SB5VYqVlG0sTwKheTJcnJCtnBPQ/1ps0/nqqZAHoKpWs7gTJG0pa6lJCE8EDNQNJu/12CD0OOaFlcQmLeQncdqjnnaTYpxhBgYFZX1NHGyJAxUmPn5ejegqF1Ybefl7ZpVbAyRxSNukbcf8A61DBK6JCzEjYcOORSSSl/nIweh+tMY4cEHGO/vTpj5gDBQC3UD1p2IvYhLEmikoqrCJ1/wCPdqZDGJJ1RjgE8n2p6/8AHu1NgcJcKxzgHtUxGzZjdFZlACBBhFPp61nXUvmT5zwO/pUk4EmX3BT1DdiPSqrgAevpV83u2EEjh2BXqByfWmoQXHmHCZ5K05PvDBA45oSFixUj7wyKkY9njkHzEpjgNj+dRrGN5IfcB3xSAlOOueMUrkLhF4IHJ9aSsnqU3daCsdsuNwaniQLwFG7tg8U2dYzJ+4BCY79c1H3HIPem9XoK9kMbJb5qmDiMFfTsPWmAb32gZJPFE+PNIByB3ppW1IZHRRRQMnX/AI92qxb7YrR5QFLk45GeKrr/AMe7VGrlD6ipRS8y3ZR+Zcxxy52SEkBTjsaiuUWG6miXO0NxmpNMIOpQ4OeTx+BqG7P+mzg9PMb+dOxLEQDfhu44NW1iVbU3VxvYbtiohx+ZqFVgFq/myOJR/qwBwR+VW7GUR2bfaRutpGwoIySe/wCFGysBBcRRJBDcxbwjEjYxyQR/+o08WMuRGxgWR/m2F/mP6Uup27KsTxMptcYTb/Dn/H1pmmAS3YeWXMifdDE5Y49aQFaYOGMTKVYH5h3qIjselWLwv9qlM3EpbkDoPSoSFXk4J7AdBQMVZjGSQo39A1RHk0Hk0VRIUUUUDJ1/492qA9aKKmI2W9K/5CUP1P8AI02VRJqro33WnIP/AH1RRTYhwgH2W4k3NmJwFHbrU1yAuk2zj7yyMo+hJ/woooAc7FdChx/HLz+Z/wAKhg/10K9hKv8AOiimtmJhrDFtRkB/hAA/L/69UqKKEMKKKKACiiigD//Z")
tile=cv2.imdecode(np.frombuffer(tile_data,dtype=np.uint8),cv2.IMREAD_COLOR)
image=np.tile(tile,(12,12,1))
print(json.dumps(hp.detect_grid_layout(image)[0]))
`
  assert.equal(runPython(code), 12)
})

test('根仓库区域无效时会选择文件夹内仓库校准', () => {
  const code = `
import importlib.util, json, numpy as np
spec=importlib.util.spec_from_file_location("hp", ${JSON.stringify(pythonScriptPath)})
hp=importlib.util.module_from_spec(spec); spec.loader.exec_module(hp)
root=np.zeros((120,120,4),dtype=np.uint8)
folder=np.zeros((120,120,4),dtype=np.uint8)
folder[:,:,3]=255
for index in range(1,12):
 folder[:,index*10-1:index*10+1,:3]=220
 folder[index*10-1:index*10+1,:,:3]=220
class Grabber:
 def grab(self, rect): return root if rect["left"] == 0 else folder
layout=hp.choose_layout({
 "root":{"left":0,"top":0,"right":120,"bottom":120},
 "folder":{"left":200,"top":0,"right":320,"bottom":120}
}, Grabber(), 1.15)
print(json.dumps([layout["calibration"],layout["columns"]]))
`
  assert.deepEqual(runPython(code), ['folder', 12])
})

test('文件夹内外都呈现周期时选择格线对齐的校准', () => {
  const code = `
import importlib.util, cv2, json, os, numpy as np
spec=importlib.util.spec_from_file_location("hp", ${JSON.stringify(pythonScriptPath)})
hp=importlib.util.module_from_spec(spec); spec.loader.exec_module(hp)
image=cv2.imdecode(np.fromfile(os.path.join(${JSON.stringify(fixtureDirPath)},"quad-highlight.jpg"),dtype=np.uint8),cv2.IMREAD_COLOR)
shifted=np.vstack([image[71:],np.zeros((71,image.shape[1],3),dtype=np.uint8)])
root=cv2.cvtColor(image,cv2.COLOR_BGR2BGRA)
folder=cv2.cvtColor(shifted,cv2.COLOR_BGR2BGRA)
class Grabber:
 def grab(self,rect): return root if rect["top"] == 0 else folder
layout=hp.choose_layout({
 "root":{"left":0,"top":0,"right":image.shape[1],"bottom":image.shape[0]},
 "folder":{"left":0,"top":71,"right":image.shape[1],"bottom":image.shape[0]+71}
},Grabber(),1.15)
print(json.dumps([layout["calibration"],layout["columns"]]))
`
  assert.deepEqual(runPython(code), ['root', 24])
})

test('密集大型仓库优先选择结构格线更对齐的文件夹校准', () => {
  const code = `
import importlib.util, cv2, json, os, numpy as np
spec=importlib.util.spec_from_file_location("hp", ${JSON.stringify(pythonScriptPath)})
hp=importlib.util.module_from_spec(spec); spec.loader.exec_module(hp)
image=cv2.imdecode(np.fromfile(os.path.join(${JSON.stringify(fixtureDirPath)},"quad-highlight.jpg"),dtype=np.uint8),cv2.IMREAD_COLOR)
height,width=image.shape[:2]
root=np.vstack([np.zeros((45,width,3),dtype=np.uint8),image[:-45]])
folder=np.vstack([np.zeros((6,width,3),dtype=np.uint8),image[:-6]])
root=cv2.cvtColor(root,cv2.COLOR_BGR2BGRA)
folder=cv2.cvtColor(folder,cv2.COLOR_BGR2BGRA)
class Grabber:
 def grab(self,rect): return root if rect["top"] == 0 else folder
layout=hp.choose_layout({
 "root":{"left":0,"top":0,"right":width,"bottom":height},
 "folder":{"left":0,"top":100,"right":width,"bottom":height+100}
},Grabber(),1.15)
print(json.dumps([layout["calibration"],layout["columns"]]))
`
  assert.deepEqual(runPython(code), ['folder', 24])
})

test('检测预览会先激活游戏再识别仓库布局', () => {
  const code = `
import importlib.util, json, numpy as np
spec=importlib.util.spec_from_file_location("hp", ${JSON.stringify(pythonScriptPath)})
hp=importlib.util.module_from_spec(spec); spec.loader.exec_module(hp)
events=[]
hp.focus_game_window=lambda: events.append("focus") or True
class Grabber:
 def __enter__(self): return self
 def __exit__(self, *_): return False
hp.mss.mss=lambda: Grabber()
hp.choose_layout=lambda *_: events.append("layout") or {
 "columns":12, "calibration":"folder", "confidence":2,
 "rect":{"left":0,"top":0,"width":120,"height":120},
 "image":np.zeros((120,120,3),dtype=np.uint8)
}
hp.detect_candidates=lambda *_: []
hp.emit=lambda *_args, **_kwargs: None
result=hp.run({
 "calibration":{"folder":{"left":0,"top":0,"right":120,"bottom":120}},
 "profiles":{"normal":{"method":"variance","thresholds":{"variance":1},"sampleRatio":0.6}}
}, True)
print(json.dumps([result,events]))
`
  assert.deepEqual(runPython(code), [0, ['focus', 'layout']])
})

test('局部图像无变化判定未转移，明显变化判定成功', () => {
  const code = `
import importlib.util, numpy as np, json
spec=importlib.util.spec_from_file_location("hp", ${JSON.stringify(pythonScriptPath)})
hp=importlib.util.module_from_spec(spec); spec.loader.exec_module(hp)
a=np.zeros((10,10,3),dtype=np.uint8); b=a.copy(); c=np.full((10,10,3),20,dtype=np.uint8)
print(json.dumps([hp.patch_changed(a,b),hp.patch_changed(a,c)]))
`
  assert.deepEqual(runPython(code), [false, true])
})

test('运行事件的动态剩余格数可覆盖公共载荷且不会重复关键字崩溃', () => {
  const code = `
import importlib.util, json
spec=importlib.util.spec_from_file_location("hp", ${JSON.stringify(pythonScriptPath)})
hp=importlib.util.module_from_spec(spec); spec.loader.exec_module(hp)
events=[]
hp.emit=lambda event, **payload: events.append({"event":event, **payload})
hp.emit_with("progress", {"candidateCells":27, "remainingCells":27}, remainingCells=26, pickedItems=1)
print(json.dumps(events))
`
  assert.deepEqual(runPython(code), [
    { event: 'progress', candidateCells: 27, remainingCells: 26, pickedItems: 1 }
  ])
})

test('第二件首次点击未生效时会重试而不是误报背包已满', () => {
  const code = `
import importlib.util, json, numpy as np
spec=importlib.util.spec_from_file_location("hp", ${JSON.stringify(pythonScriptPath)})
hp=importlib.util.module_from_spec(spec); spec.loader.exec_module(hp)

clock=[0.0]
hp.time.monotonic=lambda: clock[0]
hp.time.sleep=lambda seconds: clock.__setitem__(0, clock[0] + max(float(seconds), 0.001))

class Grabber:
 def __enter__(self): return self
 def __exit__(self, *_): return False
hp.mss.mss=lambda: Grabber()
hp.focus_game_window=lambda: True

state={"clicks":0, "visual":0}
class Keyboard:
 def press(self, _): pass
 def release(self, _): pass
class Mouse:
 def __init__(self): self.position=(0, 0)
 def click(self, _button, _count):
  state["clicks"] += 1
  if state["clicks"] == 1 or state["clicks"] == 3:
   state["visual"] += 20

hp.choose_layout=lambda *_: {
 "columns":12, "calibration":"root", "confidence":2,
 "rect":{"left":0, "top":0, "width":120, "height":120},
 "image":np.zeros((1,1,3), dtype=np.uint8)
}
hp.detect_candidates=lambda *_: [
 {"column":0, "row":0, "score":10},
 {"column":3, "row":0, "score":10}
]
hp.capture=lambda *_: np.full((1,1,3), state["visual"], dtype=np.uint8)
hp.cell_score=lambda *_: 10
hp.local_patch=lambda image, *_: image.copy()
events=[]
hp.emit=lambda event, **payload: events.append({"event":event, **payload})

import pynput.keyboard, pynput.mouse
pynput.keyboard.Controller=Keyboard
pynput.keyboard.Key=type("Key", (), {"ctrl":"ctrl"})
pynput.mouse.Controller=Mouse
pynput.mouse.Button=type("Button", (), {"left":"left"})

result=hp.run({
 "calibration":{"root":{"left":0,"top":0,"right":120,"bottom":120}},
 "profiles":{"normal":{"method":"variance","thresholds":{"variance":1},"sampleRatio":0.6}},
 "operationDelayMs":20
})
print(json.dumps({
 "result":result,
 "clicks":state["clicks"],
 "pickedItems":events[-1].get("pickedItems"),
 "lastEvent":events[-1]["event"],
 "reasons":[event.get("reason") for event in events if event.get("reason")]
}))
`
  assert.deepEqual(runPython(code), {
    result: 0,
    clicks: 3,
    pickedItems: 2,
    lastEvent: 'completed',
    reasons: ['completed']
  })
})

test('多格物品移除后跳过全部已清空占位格并继续取下一件', () => {
  const code = `
import importlib.util, json, numpy as np
spec=importlib.util.spec_from_file_location("hp", ${JSON.stringify(pythonScriptPath)})
hp=importlib.util.module_from_spec(spec); spec.loader.exec_module(hp)

clock=[0.0]
hp.time.monotonic=lambda: clock[0]
hp.time.sleep=lambda seconds: clock.__setitem__(0, clock[0] + max(float(seconds), 0.001))
class Grabber:
 def __enter__(self): return self
 def __exit__(self, *_): return False
hp.mss.mss=lambda: Grabber()
hp.focus_game_window=lambda: True

state={"firstRemoved":False,"secondRemoved":False,"clicks":0}
def image():
 output=np.zeros((120,120,3),dtype=np.uint8)
 if not state["firstRemoved"]:
  output[0:10,0:20]=40
 if not state["secondRemoved"]:
  output[0:10,20:30]=60
 return output

class Keyboard:
 def press(self, _): pass
 def release(self, _): pass
class Mouse:
 def __init__(self): self.position=(0,0)
 def click(self, _button, _count):
  state["clicks"] += 1
  column=int(self.position[0] // 10)
  if column == 0: state["firstRemoved"]=True
  if column == 2: state["secondRemoved"]=True

hp.choose_layout=lambda *_: {
 "columns":12, "calibration":"folder", "confidence":2,
 "rect":{"left":0,"top":0,"width":120,"height":120},
 "image":image()
}
hp.detect_candidates=lambda *_: [
 {"column":0,"row":0,"score":10},
 {"column":1,"row":0,"score":10},
 {"column":2,"row":0,"score":10}
]
hp.capture=lambda *_: image()
hp.cell_score=lambda _image,_columns,column,row,_method,_ratio: 10 if (column,row) in ((0,0),(1,0),(2,0)) else 0
events=[]
hp.emit=lambda event, **payload: events.append({"event":event, **payload})

import pynput.keyboard, pynput.mouse
pynput.keyboard.Controller=Keyboard
pynput.keyboard.Key=type("Key", (), {"ctrl":"ctrl"})
pynput.mouse.Controller=Mouse
pynput.mouse.Button=type("Button", (), {"left":"left"})

result=hp.run({
 "calibration":{"folder":{"left":0,"top":0,"right":120,"bottom":120}},
 "profiles":{"normal":{"method":"variance","thresholds":{"variance":1},"sampleRatio":0.6}},
 "operationDelayMs":20
})
print(json.dumps({
 "result":result,
 "clicks":state["clicks"],
 "pickedItems":events[-1].get("pickedItems"),
 "lastEvent":events[-1]["event"],
 "calibration":events[-1].get("calibration")
}))
`
  assert.deepEqual(runPython(code), {
    result: 0,
    clicks: 2,
    pickedItems: 2,
    lastEvent: 'completed',
    calibration: 'folder'
  })
})

test('运行脚本不包含剪贴板并在未变化时发出背包已满', () => {
  const source = readFileSync(pythonScript, 'utf8')
  assert.doesNotMatch(source, /clipboard|pyperclip|copy_item/i)
  assert.match(source, /reason="inventory-full"/)
  assert.match(source, /keyboard\.release\(Key\.ctrl\)/)
})
