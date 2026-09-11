import test from 'node:test'
import assert from 'node:assert/strict'
import { runPython } from './helpers/python.js'
import { parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'

test('加速掩膜相关与 OpenCV 原指标一致，空白不产生无穷分数', () => {
  const result = runPython(`
import sys,json,cv2,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_rewards import masked_correlation
rng=np.random.default_rng(42); errors=[]
for h,w in [(12,18),(30,22),(44,50)]:
 gray=rng.integers(10,220,(100,160),dtype=np.uint8).astype(np.float32)
 template=gray[20:20+h,30:30+w].copy();mask=np.float32(rng.random((h,w))>.3)
 a=cv2.matchTemplate(gray,template,cv2.TM_CCOEFF_NORMED,mask=mask)
 b=masked_correlation(gray,gray*gray,template,mask)
 errors.append(float(np.max(np.abs(a-b))))
 assert np.unravel_index(np.argmax(b),b.shape)==(20,30)
blank=np.full((100,160),35,np.float32)
out=masked_correlation(blank,blank*blank,template,mask)
print(json.dumps({'errors':errors,'blank':float(np.max(np.abs(out)))}))`)
  assert.ok(result.errors.every(error => error < .0001))
  assert.equal(result.blank, 0)
})

test('真实弹框图标与文字分开识别：确认混沌石，不把背景、说明或重复图标当数量', () => {
  const result = runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import load_image
from sanctum_rewards import recognize_currency_icons
im=load_image('test/fixtures/sanctum/archives-live-tooltip.png')
# The actual visible panel, independently annotated from the game screenshot.
icons=recognize_currency_icons(im[518:783,1281:2348])
blank=recognize_currency_icons(np.full((100,300,3),35,np.uint8))
print(json.dumps({'icons':icons,'blank':blank}))
`)
  // The original panel also contains chance orbs, absent from the old 13-art catalog.
  assert.deepEqual(result.icons.map(item => item.currency), ['机会石', '混沌石'])
  const icon = result.icons.find(item => item.currency === '混沌石')
  assert.ok(icon.region.x >= 550 && icon.region.x <= 590)
  assert.ok(icon.region.y >= 150 && icon.region.y <= 180)
  assert.deepEqual(result.blank, [])
  const parsed = parseSanctumRoomTexts(['完成后提供物品'], { entries: [] }, result.icons)
  assert.deepEqual(parsed.rewards.map(r => r.currency), ['机会石','混沌石'])
  assert.ok(parsed.rewards.every(r => r.quantity === null && r.quantityStatus === 'not-shown'))
  assert.equal(parsed.detailsStatus, 'matched')
  assert.equal(parsed.rewardEvidence.at(-1).currency, '混沌石')
  assert.equal(parsed.failureReason, null)
  assert.equal(parsed.rewardEvidence.at(-1).quantity, undefined)
})

test('低置信度图标不能确认为奖励；文字奖励保留原有种类数量时机', () => {
  const catalog = { entries: [{kind:'reward',name:'神圣石'}] }
  const unknown = parseSanctumRoomTexts([], catalog, [{currency:'混沌石',confidence:.89}])
  assert.deepEqual(unknown.rewardEvidence, [])
  const text = parseSanctumRoomTexts(['立即获得 2 神圣石'], catalog)
  assert.deepEqual(text.rewards, [{groupId:'offer',currency:'神圣石',quantity:2,timing:'immediate'}])
})

test('局部证据按20组轮换且不写整屏或日志上下文，旧弹框诊断不会残留', () => {
  const result = runPython(`
import sys,json,tempfile,numpy as np
from pathlib import Path
sys.path.insert(0,'src/assets/scripts')
import sanctum_diagnostics as d
from sanctum_recognition import load_image
with tempfile.TemporaryDirectory() as directory:
 d.tempfile.gettempdir=lambda:directory
 image=np.zeros((100,200,3),np.uint8)
 options={'mapRegion':{'x':20,'y':20,'width':50,'height':40},'log':'must-not-save'}
 for i in range(22):
  d.save_tooltip_evidence(i,image,image,{'status':'unknown','region':{'x':10,'y':10,'width':20,'height':20},'log':'must-not-save'},options)
 d.save_tooltip_evidence(0,image,image,{'status':'unknown'},options)
 root=Path(directory)/'poe-sanctum-diagnostics'
 print(json.dumps({'files':len(list(root.iterdir())),'shape':list(load_image(str(root/'tooltip-00-before.png')).shape),'oldPanel':(root/'tooltip-00-panel.png').exists(),'record':json.loads((root/'tooltip-00.json').read_text())}))
`)
  assert.equal(result.files, 79)
  assert.deepEqual(result.shape, [40,50,3])
  assert.equal(result.oldPanel, false)
  assert.equal(result.record.log, undefined)
})
