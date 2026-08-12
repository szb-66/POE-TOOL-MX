import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runPython } from './helpers/python.js'
import {
  normalizeStashPickupProfile,
  normalizeStashPickupSettings
} from '../src/utils/stashPickupConfig.js'
import {
  migrateStashGridCalibration,
  normalizeStashGridRegion
} from '../src/utils/stashGridCalibration.js'

const pythonScript = new URL('../src/assets/scripts/stash_pickup_template.py', import.meta.url)
const managerScript = new URL('../electron/modules/stashPickup/manager.js', import.meta.url)
const fixtureDir = new URL('./fixtures/stashPickup/', import.meta.url)
const pythonScriptPath = fileURLToPath(pythonScript)
const fixtureDirPath = fileURLToPath(fixtureDir)

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

test('取件启动异常会撤销前台切换宽限状态', () => {
  const source = readFileSync(managerScript, 'utf8')
  assert.match(
    source,
    /catch \(error\) \{\s*this\.allowingFocusTransition = false\s*this\.automationLock\?\.release\(OWNER\)/
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

test('固定截图按网格周期识别布局', () => {
  const code = `
import importlib.util, cv2, json, os, numpy as np
spec=importlib.util.spec_from_file_location("hp", ${JSON.stringify(pythonScriptPath)})
hp=importlib.util.module_from_spec(spec); spec.loader.exec_module(hp)
root=${JSON.stringify(fixtureDirPath)}
cases=[("normal-unsearched.jpg",12),("normal-highlight.jpg",12),("normal-no-match.jpg",12),("quad-highlight.jpg",24)]
out=[]
for name,columns in cases:
 image=cv2.imdecode(np.fromfile(os.path.join(root,name),dtype=np.uint8),cv2.IMREAD_COLOR)
 out.append([hp.detect_grid_layout(image)[0],round(hp.grid_confidence(image,12),2),round(hp.grid_confidence(image,24),2)])
print(json.dumps(out))
`
  assert.deepEqual(runPython(code), [
    [12, 3.38, 3.64],
    [12, 5.54, 5.14],
    [12, 4.91, 4.97],
    [24, 1.29, 1.45]
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
tile_data=base64.b64decode("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")
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

test('取件脚本不再包含画面变化确认代码', () => {
  const source = readFileSync(pythonScript, 'utf8')
  assert.doesNotMatch(source, /wait_for_patch_change|patch_changed|changed_item_cells|detect_candidates|def run\(|emit_with/)
  assert.doesNotMatch(source, /clipboard|pyperclip|copy_item/i)
  assert.match(source, /def choose_layout\(/)
  assert.match(source, /def capture\(/)
})
