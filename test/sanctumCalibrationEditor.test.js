import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { SanctumCalibrationEditor } from '../electron/modules/sanctum/calibration.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { InterfaceTitleRegistry } from '../electron/modules/interfaceDetection/titleRegistry.js'
import { mergeSanctumTextScan } from '../electron/modules/sanctum/relicScan.js'
import { footprintUsable } from '../shared/sanctumLive.js'
import { runPython } from './helpers/python.js'

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='
const env = { width: 1920, height: 1080, dpi: 144 }
function fixture() {
  const service = new SanctumService({})
  service.setEnabled(true)
  let cancel = false, fail = false, changed = false, reads = 0, options, rect = { left: -1800, top: 100, right: -1300, bottom: 500 }
  service.liveDriver = { inspectEnvironment: async () => ({ environment: { ...env, dpi: changed && ++reads > 1 ? 96 : 144 }, clientBounds: { x: -1920, y: 0, width: 1920, height: 1080 } }) }
  const titles = {}, crops = []
  const nativeImage = { createFromBuffer: () => ({ getSize: () => ({ width: 500, height: 400 }), crop: r => { crops.push(r); return { toPNG: () => Buffer.from(png, 'base64'), toBitmap: () => Buffer.from([30, 120, 200, 255]) } } }) }
  const editor = new SanctumCalibrationEditor({ service, nativeImage, withHidden: action => action(),
    detection: { getTitleConfig: () => ({ templates: titles, threshold: .8 }), setTitle: async (key, value) => { if (value) titles[key] = value; else delete titles[key] } },
    picker: async input => { options = input; await input.beforeCapture(); await input.afterCapture();
      if (cancel) return { canceled: true }
      if (fail) return { success: false }
      return { success: true, selectedRegion: rect, png: Buffer.from(png, 'base64'), displayId: 'left', scaleFactor: 1.5, displayPhysicalBounds: { x: -1920, y: 0, width: 1920, height: 1080 } }
    } })
  service.calibrationEditor = editor
  return { service, editor, titles, crops, get options() { return options }, cancel: () => { cancel = true }, fail: () => { fail = true }, change: () => { changed = true; reads = 0 }, rect: value => { rect = value } }
}

test('独立框选使用真实负坐标客户区和 DPI，取消与失败保持旧配置', async () => {
  for (const failure of ['cancel', 'fail', 'change']) {
    const f = fixture()
    await f.editor.capture('mapRegion')
    assert.equal(f.service.state.liveCalibration.mapRegion.x, 120)
    assert.equal(f.service.state.liveCalibration.environment.dpi, 144)
    await f.editor.capture('effectIconsRegion')
    const before = structuredClone(f.service.state.liveCalibration)
    f[failure]()
    if (failure === 'cancel') await f.editor.capture('mapRegion')
    else await assert.rejects(f.editor.capture('mapRegion'))
    assert.deepEqual(f.service.state.liveCalibration, before)
    await f.editor.clear('effectIconsRegion')
    assert.ok(f.service.state.liveCalibration.captures.mapRegion)
    assert.equal(f.service.state.liveCalibration.captures.effectIconsRegion, undefined)
  }
})

test('公共标题独立保存和清除，不复制进圣所区域配置', async () => {
  const f = fixture()
  await f.editor.capture('sanctum-map'); await f.editor.capture('sanctum-locker'); await f.editor.capture('sanctum-altar')
  assert.equal(Object.keys(f.titles).length, 3)
  assert.equal(f.service.state.liveCalibration, null)
  await f.editor.clear('sanctum-map')
  assert.ok(f.titles['sanctum-locker'])
  assert.ok(f.titles['sanctum-altar'])
})

test('网格三态、样本点击独立，编辑保留历史并撤销确认；重框重置', async () => {
  const f = fixture()
  await f.editor.capture('altar', { columns: 5, rows: 4 })
  assert.equal(f.options.grid.columns, 5)
  const p = () => f.service.state.relicCalibrations.altar
  assert.ok(p().cellStates.every(x => x === 'usable'))
  f.service.state.inventory = [{ id: 'old', regionId: 'altar', x: 0, y: 0, width: 1, height: 2, rawText: '保留原文', status: 'matched' }]
  f.service.state.altar.confirmed = true; f.service.state.loadouts = {}; f.service.highlight = {}
  for (const state of ['locked', 'ignored', 'usable']) {
    const cells = [...p().cellStates]; cells[0] = state
    f.editor.saveCells('altar', cells)
    assert.equal(p().cellStates[0], state)
    assert.equal(f.service.state.inventory[0].id, 'old')
    assert.equal(f.service.state.inventory[0].rawText, '保留原文')
    assert.equal(f.service.state.altar.confirmed, false)
    assert.equal(f.service.state.loadouts, null)
    assert.equal(f.service.highlight, null)
  }
  f.editor.sample('altar', 'empty', 6)
  assert.deepEqual(f.crops[0], { x: 103, y: 103, width: 94, height: 94 })
  assert.equal(p().cellStates[6], 'usable')
  assert.ok(p().templates.empty)
  const cells = [...p().cellStates]; cells[1] = 'ignored'; f.editor.saveCells('altar', cells)
  assert.equal(footprintUsable(p(), { x: 0, y: 0, width: 2, height: 1 }), false)
  await f.editor.capture('altar', { columns: 5, rows: 4 })
  assert.deepEqual(p().templates, {})
  assert.ok(p().cellStates.every(x => x === 'usable'))
  await assert.rejects(f.editor.capture('altar', { columns: 4, rows: 4 }), /固定/)
  await f.editor.capture('locker', { columns: 3, rows: 2 })
  f.editor.sample('locker', 'locked', 0)
  await f.editor.capture('locker', { columns: 6, rows: 4 })
  assert.equal(f.service.state.relicCalibrations.locker.cellStates.length, 24)
  assert.deepEqual(f.service.state.relicCalibrations.locker.templates, {})
})

test('锁定和忽略不作为空格删除历史，忽略和未知不能确认祭坛', () => {
  const old = [{ id: 'old', regionId: 'altar', x: 0, y: 0, width: 1, height: 2, status: 'matched', rawText: '原文' }]
  for (const status of ['disabled', 'ignored', 'locked', 'unknown']) {
    const result = mergeSanctumTextScan(old, { regionId: 'altar', width: 1, height: 2, observations: [{ x: 0, y: 0, status }, { x: 0, y: 1, status: 'empty' }] }, { entries: [] })
    assert.equal(result.complete, false)
    assert.equal(result.inventory[0].id, 'old')
    assert.equal(result.inventory[0].status, 'unknown')
  }
  const result = mergeSanctumTextScan([], { regionId: 'altar', width: 2, height: 1, observations: [{ x: 0, y: 0, status: 'disabled' }, { x: 1, y: 0, status: 'empty' }] }, { entries: [] })
  assert.equal(result.complete, true)
  assert.deepEqual(result.unlocked, [1])
  assert.deepEqual(result.inventory, [])
})

test('运行中拒绝校准；紧急停止使迟到截图不保存', async () => {
  const f = fixture()
  f.service.state.running = true
  await assert.rejects(f.editor.capture('mapRegion'), /运行中/)
  assert.throws(() => f.editor.saveCells('altar', []), /运行中/)
  f.service.state.running = false
  const original = f.editor.picker
  f.editor.picker = async options => { const result = await original(options); f.service.emergencyStop(); return result }
  await f.editor.capture('mapRegion')
  assert.equal(f.service.state.liveCalibration, null)
})

test('截图及格子配置恢复，重启不确认祭坛；旧锚点不迁移为标题', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sanctum-editor-'))
  try {
    const f = fixture(), repo = new SanctumRepository(dir)
    await f.editor.capture('mapRegion'); await f.editor.capture('locker', { columns: 3, rows: 2 })
    f.editor.saveCells('locker', ['locked', 'ignored', 'usable', 'usable', 'usable', 'usable'])
    repo.save(f.service.state)
    const saved = repo.load()
    assert.deepEqual(saved.liveCalibration, f.service.state.liveCalibration)
    assert.deepEqual(saved.relicCalibrations, f.service.state.relicCalibrations)
    const raw = JSON.parse(fs.readFileSync(repo.file, 'utf8')); raw.liveCalibration.version = 1; raw.liveCalibration.anchor = { png }; delete raw.liveCalibration.captures
    fs.writeFileSync(repo.file, JSON.stringify(raw))
    assert.deepEqual(repo.load().liveCalibration.captures, {})
    assert.ok(repo.load().liveCalibration.mapRegion)
    const registry = new InterfaceTitleRegistry(path.join(dir, 'titles.json'))
    registry.set('sanctum-map', { png, environment: env })
    assert.ok(new InterfaceTitleRegistry(registry.file).templates['sanctum-map'])
    assert.throws(() => registry.set('unknown', { png, environment: env }))
  } finally { fs.rmSync(dir, { recursive: true, force: true }) }
})

test('公共模板移动定位、独立界面及 DPI 失配使用同套匹配规则', () => {
  const result = runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
from interface_titles import match_titles
from sanctum_grid import png
env={'width':200,'height':100,'dpi':144}
rng=np.random.default_rng(42)
t=rng.integers(0,255,(10,25,3),dtype=np.uint8)
u=rng.integers(0,255,(10,25,3),dtype=np.uint8)
image=np.zeros((100,200,3),dtype=np.uint8); image[20:30,70:95]=t
templates={'sanctum-map':{'png':png(t),'environment':env},'sanctum-altar':{'png':png(u),'environment':env}}
found=match_titles(image,templates,env,.95)
print(json.dumps({'found':found,'wrong':match_titles(image,templates,{**env,'dpi':96},.95),'missing':match_titles(np.zeros_like(image),templates,env,.95)}))
`)
  assert.equal(result.found['sanctum-map'].templateId, 'sanctum-map')
  assert.deepEqual(result.found['sanctum-map'].region, { x: 70, y: 20, width: 25, height: 10 })
  assert.equal(result.found['sanctum-altar'], undefined)
  assert.deepEqual(result.wrong, {})
  assert.deepEqual(result.missing, {})
})

test('持久化失败恢复原校准和格子属性，不留下半份配置', async () => {
  const f = fixture()
  await f.editor.capture('mapRegion')
  await f.editor.capture('altar', { columns: 5, rows: 4 })
  await f.editor.capture('sanctum-map')
  const previous = structuredClone(f.service.state), oldTitle = structuredClone(f.titles['sanctum-map'])
  f.service.repository = { save: () => { throw new Error('disk failure') } }
  f.rect({ left: -1700, top: 100, right: -1200, bottom: 500 })
  await assert.rejects(f.editor.capture('mapRegion'), /disk failure/)
  assert.deepEqual(f.service.state, previous)
  await assert.rejects(f.editor.capture('sanctum-map'), /disk failure/)
  assert.deepEqual(f.titles['sanctum-map'], oldTitle)
  assert.throws(() => f.editor.saveCells('altar', Array(20).fill('locked')), /disk failure/)
  assert.deepEqual(f.service.state, previous)
  await assert.rejects(f.editor.clear('sanctum-map'), /disk failure/)
  assert.deepEqual(f.titles['sanctum-map'], oldTitle)
})

test('截图取色生成 HSV，微调校验失败不会改变之前的颜色', async () => {
  const f = fixture()
  await f.editor.capture('mapRegion')
  await f.editor.capture('pathColor')
  f.editor.pathColor({ x: 5, y: 6 })
  const previous = structuredClone(f.service.state.liveCalibration)
  assert.equal(previous.calibration.pathHsv.length, 2)
  assert.throws(() => f.editor.pathColor({ pathHsv: [[180, 0, 0], [179, 255, 255]] }), /路径颜色/)
  assert.deepEqual(f.service.state.liveCalibration, previous)
})

test('单一地图标题优先新键，否则迁移首个有效旧键，保存清理旧键', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sanctum-title-migration-'))
  const file = path.join(dir, 'titles.json')
  try {
    const old = { png, environment: env, marker: 'old' }
    const fresh = { ...old, marker: 'new' }
    for (const [input, marker] of [
      [{ 'sanctum-map': fresh, 'sanctum-map-1': old }, 'new'],
      [{ 'sanctum-map': { png: 'invalid' }, 'sanctum-map-1': { png: 'invalid' }, 'sanctum-map-2': old, 'sanctum-map-3': fresh }, 'old'],
      [{ 'sanctum-map-4': old, 'sanctum-map-2': fresh }, 'new']
    ]) {
      fs.writeFileSync(file, JSON.stringify({ ...input, 'sanctum-altar': old }))
      const registry = new InterfaceTitleRegistry(file)
      assert.equal(registry.templates['sanctum-map'].marker, marker)
      assert.ok(registry.templates['sanctum-altar'])
      registry.set('sanctum-locker', old)
      const saved = JSON.parse(fs.readFileSync(file, 'utf8'))
      assert.deepEqual(Object.keys(saved).sort(), ['sanctum-altar', 'sanctum-locker', 'sanctum-map'])
      assert.equal(new InterfaceTitleRegistry(file).templates['sanctum-map'].marker, marker)
    }
  } finally { fs.rmSync(dir, { recursive: true, force: true }) }
})

test('旧等级校准即使无效也被移除，其余校准可恢复与保存', async () => {
  const f = fixture(), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sanctum-level-migration-'))
  try {
    await f.editor.capture('mapRegion')
    const repo = new SanctumRepository(dir)
    repo.save(f.service.state)
    const raw = JSON.parse(fs.readFileSync(repo.file, 'utf8'))
    raw.liveCalibration.areaLevelRegion = { x: -100 }
    raw.liveCalibration.captures.areaLevelRegion = { png: 'invalid', environment: {} }
    fs.writeFileSync(repo.file, JSON.stringify(raw))
    const loaded = repo.load()
    assert.ok(loaded.liveCalibration.mapRegion)
    assert.equal(loaded.liveCalibration.areaLevelRegion, undefined)
    assert.equal(loaded.liveCalibration.captures.areaLevelRegion, undefined)
    repo.save(loaded)
    assert.equal(fs.readFileSync(repo.file, 'utf8').includes('areaLevelRegion'), false)
    await assert.rejects(f.editor.capture('areaLevelRegion'), /未知校准/)
  } finally { fs.rmSync(dir, { recursive: true, force: true }) }
})
