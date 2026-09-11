import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { matchRoomText, recognizeRoomTexts, normalizeRoomText } from '../electron/modules/sanctum/textRecognition.js'
import { parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'
import { runPython } from './helpers/python.js'
const entry = (id, name, descriptions = []) => ({ id, name, descriptions, kind:'affliction', applicability:'unverified' })
const catalog = { entries: [entry('a','封闭之墙',['不能恢复坚毅']), entry('b','脆弱',['受到的伤害提高 50%'])] }

test('错字、漏字、全半角、低分和同分始终采用最高候选，数字和否定词保留', () => {
  assert.equal(matchRoomText('不能恢復坚毅',catalog).entryId,'a')
  assert.equal(matchRoomText('不能恢坚毅',catalog).entryId,'a')
  assert.equal(matchRoomText('受到的伤害提高５０％',catalog).similarity,1)
  assert.equal(matchRoomText('xyz',catalog).entryId,'a')
  assert.equal(matchRoomText('xyz',catalog).similarity,0)
  assert.equal(matchRoomText('xyz',{entries:[...catalog.entries].reverse()}).entryId,'a')
  assert.notEqual(normalizeRoomText('能恢复坚毅'),normalizeRoomText('不能恢复坚毅'))
  const value=matchRoomText('受到的伤害提高 15%',catalog)
  assert.equal(value.entryId,'b'); assert.equal(value.numericCompatible,false)
  assert.equal(value.rawText,'受到的伤害提高 15%')
})

test('换行描述合并、独立词缀分别匹配，空OCR和空词库不生成结果', () => {
  const value=recognizeRoomTexts(['不能恢复','坚毅','脆弱'],catalog)
  assert.deepEqual(value.matches.map(m=>[m.entryId,m.lineCount]),[['a',2],['b',1]])
  assert.equal(recognizeRoomTexts([],catalog).status,'empty')
  assert.equal(recognizeRoomTexts(['文字'],{entries:[]}).status,'no-catalog')
  assert.equal(recognizeRoomTexts(['不能恢复坚毅','脆弱'],catalog).matches.length,2)
})

test('真实未核验恩赐和痛苦能识别身份，计算支持独立；原文重复不丢失', () => {
  const data=JSON.parse(fs.readFileSync(new URL('../electron/assets/sanctum/catalog.json',import.meta.url)))
  for(const kind of ['boon','affliction']) {
    const item=data.entries.find(e=>e.kind===kind)
    item.applicability='unverified';item.reviewedPatch=null
    const value=parseSanctumRoomTexts([item.name,item.name],data)
    assert.equal(value.recognition.status,'matched')
    assert.equal(value.recognition.matches[0].name,item.name)
    assert.equal(value.recognition.matches[0].versionStatus,'unverified')
    assert.equal(value.recognition.matches[0].calculationStatus,'unsupported')
    assert.equal(value.rawText,`${item.name}\n${item.name}`)
    assert.equal(value.detailsStatus,'matched')
  }
})

test('原生OCR保留低置信度输出和真实框，按行组织而不抛弃文字', () => {
  const value=runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_ocr import read_room_ocr
def box(x,y,w,h):return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]]
engine=lambda image:[[box(30,0,20,10),'坚毅',.2],[box(0,0,30,10),'不能恢复',.99],[box(0,20,30,10),'脆弱',.7]]
print(json.dumps(read_room_ocr(engine,np.zeros((50,80,3),np.uint8))))
`)
  assert.deepEqual(value.texts,['不能恢复坚毅','脆弱'])
  assert.equal(value.ocrBlocks.length,3)
  assert.equal(value.ocrBlocks[1].confidence,.2)
  assert.deepEqual(value.ocrLines[0].region,{x:0,y:0,width:50,height:10})
})
