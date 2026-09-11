import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { validateSanctumCalibration, bindSanctumCalibration } from '../shared/sanctumCalibration.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { listSanctumSamples, replaySanctumSample } from '../electron/modules/sanctum/replay.js'
import { runPython } from './helpers/python.js'

const sample = listSanctumSamples().find(item => item.id === 'vault-progress.png')
const imageSize = [sample.crop[2] - sample.crop[0], sample.crop[3] - sample.crop[1]]
const calibration = () => ({ version: 1, scope: 'sample', sampleId: sample.id, imageSize,
  region: [0, 0, ...imageSize], roomSize: null, pathHsv: [[12, 95, 42], [40, 255, 255]] })

test('校准参数严格校验边界，不能携带实机确认或伪造 DPI', () => {
  const value = validateSanctumCalibration({ ...calibration(), dpi: 144, liveValidated: true })
  assert.equal(value.dpi, null)
  assert.equal(value.liveValidated, false)
  for (const patch of [{ region: [1, 0, ...imageSize] }, { region: [0, 0, 0, 0] }, { roomSize: [1, 1] },
    { pathHsv: [[180, 0, 0], [255, 255, 255]] }, { pathHsv: [[30, 0, 0], [20, 255, 255]] },
    { scope: 'live' }, { imageSize: [NaN, 100] }, { sampleId: '../a.png' }]) {
    assert.throws(() => validateSanctumCalibration({ ...calibration(), ...patch }))
  }
  assert.throws(() => bindSanctumCalibration(calibration(), { ...sample, crop: [0, 0, 100, 100] }), /尺寸已变化/)
  assert.throws(() => bindSanctumCalibration(calibration(), { ...sample, id: 'other.png' }), /样本/)
})

test('校准保存、重启与清除贯穿回放服务，尺寸变化时不调用识别器', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sanctum-calibration-'))
  let service
  try {
    const repository = new SanctumRepository(root)
    const calls = []
    const options = { repository, samples: () => [sample], replay: async (_id, options) => { calls.push(options); return { rooms: [], edges: [] } } }
    service = new SanctumService(options)
    assert.throws(() => service.calibrate(calibration()), /未启用/)
    service.setEnabled(true)
    service.calibrate(calibration())
    await service.rescan(sample.id)
    assert.deepEqual(calls[0].calibration, validateSanctumCalibration(calibration()))
    assert.equal(service.getState().recommendation, null)
    await service.shutdown()
    service = new SanctumService(options)
    assert.equal(service.getState().running, false)
    assert.deepEqual(service.getState().calibration[sample.id], calls[0].calibration)
    service.setEnabled(true)
    service.samples = () => [{ ...sample, crop: [0, 0, 100, 100] }]
    await service.rescan(sample.id)
    assert.equal(calls.length, 1)
    assert.match(service.getState().reason, /尺寸已变化/)
    service.samples = options.samples
    service.clearCalibration(sample.id)
    await service.rescan(sample.id)
    assert.equal(calls[1].calibration, null)
    assert.deepEqual(repository.load().calibration, {})
  } finally {
    await service?.shutdown()
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('校准保存取消旧回放，迟到图像不能覆盖新参数状态', async () => {
  let resolve, signal
  const service = new SanctumService({ samples: () => [sample], replay: (_id, options) => {
    signal = options.signal; return new Promise(done => { resolve = done })
  } })
  service.setEnabled(true)
  const run = service.rescan(sample.id)
  service.calibrate(calibration())
  assert.equal(signal.aborted, true)
  resolve({ rooms: [{ id: 'late' }] })
  await run
  assert.equal(service.getState().floor, null)
  assert.equal(service.getState().running, false)
  await service.shutdown()
})

test('真实宝库样本默认校准保持识别结果，区域和房间尺寸实际参与识别，失配保持未知', () => {
  const results = runPython(`
import sys,json,copy
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import analyze_floor,load_image
image=load_image('test/fixtures/sanctum/vault-progress.png')
base=json.loads(${JSON.stringify(JSON.stringify(calibration()))})
automatic=analyze_floor(image)
default=analyze_floor(image,base)
room=copy.deepcopy(base); room['roomSize']=[automatic['rooms'][0]['width'],automatic['rooms'][0]['height']]
region=copy.deepcopy(base); region['region']=[0,0,100,100]
wrong_room=copy.deepcopy(base); wrong_room['roomSize']=[24,24]
wrong_size=copy.deepcopy(base); wrong_size['imageSize']=[100,100]
wrong_hsv=copy.deepcopy(base); wrong_hsv['pathHsv']=[[200,0,0],[255,255,255]]
no_gold=copy.deepcopy(base); no_gold['pathHsv']=[[90,255,255],[90,255,255]]
print(json.dumps([automatic,default,analyze_floor(image,room),analyze_floor(image,region),analyze_floor(image,wrong_room),analyze_floor(image,wrong_size),analyze_floor(image,wrong_hsv),analyze_floor(image,no_gold)]))
`)
  const [automatic, normal, room, region, wrongRoom, wrongSize, wrongHsv, noGold] = results
  assert.deepEqual(normal, automatic)
  assert.equal(room.rooms.length, 27)
  for (const value of [region, wrongRoom, wrongSize, wrongHsv]) {
    assert.equal(value.status, 'unknown')
    assert.deepEqual(value.rooms, [])
  }
  assert.ok(normal.edges.some(edge => edge.availability === 'gold'))
  assert.equal(noGold.edges.some(edge => edge.availability === 'gold'), true) // 校准不能排除基础金线证据
})

test('真实回放命令传递校准，并拒绝绑定其他样本', async () => {
  const result = await replaySanctumSample(sample.id, { calibration: { ...calibration(), region: [0, 0, 100, 100] } })
  assert.equal(result.status, 'unknown')
  assert.deepEqual(result.rooms, [])
  await assert.rejects(replaySanctumSample('vault-entry.png', { calibration: calibration() }), /样本或尺寸/)
})
