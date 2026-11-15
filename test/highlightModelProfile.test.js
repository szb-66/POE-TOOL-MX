import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { highlightModelPaths, resolveHighlightModelPaths } from '../electron/modules/junfeng/modelProfile.js'

const source = fs.readFileSync(new URL('../electron/modules/junfeng/manager.js', import.meta.url), 'utf8')
class Availability {
  dispose() {}
  invalidate() {}
  setEnabled() {}
}

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-highlight-profile-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const moduleDir = path.join(root, 'electron/modules/junfeng')
  const bundled = path.join(root, 'src/assets/models/junfeng-highlight')
  const profile = path.join(root, 'servers/international/highlight-model')
  const artifacts = path.join(root, 'servers/international/highlight-training')
  fs.mkdirSync(bundled, { recursive: true })
  fs.writeFileSync(path.join(bundled, 'model.onnx'), 'original-cn-model')
  fs.writeFileSync(path.join(bundled, 'manifest.json'), JSON.stringify({ modelVersion: 'cn', sha256: 'original', benchmark: { passed: false } }))
  fs.writeFileSync(path.join(bundled, 'split.json'), '{}')
  const Manager = new Function('app', 'fs', 'path', 'moduleDir', 'OPERATION_DELAY', 'ModelAvailability', 'highlightModelPaths', 'resolveHighlightModelPaths',
    `return ${source.slice(source.indexOf('export class JunfengHighlightManager')).replace('export class', 'class')}`)(
    { isPackaged: false }, fs, path, moduleDir, { default: 40 }, Availability, highlightModelPaths, resolveHighlightModelPaths)
  const manager = new Manager({ modelRoot: profile, trainingArtifactsRoot: artifacts,
    calibration: { trainingSummary: () => ({ samples: 0 }), root: path.join(root, 'calibration') } })
  return { root, bundled, profile, artifacts, manager }
}

test('国际服缺少独立模型时只读复用内置模型，部分独立文件损坏时显式失败', t => {
  const { bundled, profile, manager } = fixture(t)
  assert.deepEqual(manager.modelPaths(), highlightModelPaths(bundled))
  fs.mkdirSync(profile, { recursive: true })
  fs.writeFileSync(path.join(profile, 'manifest.json'), 'invalid')
  assert.deepEqual(manager.modelPaths(), highlightModelPaths(profile))
  assert.deepEqual(resolveHighlightModelPaths(bundled, null), highlightModelPaths(bundled))
})

test('国际服候选发布仅替换独立模型，国服模型与训练基础保持不变', t => {
  const { root, bundled, profile, artifacts, manager } = fixture(t)
  const candidate = highlightModelPaths(path.join(root, 'candidate'))
  fs.mkdirSync(path.dirname(candidate.model))
  fs.writeFileSync(candidate.model, 'en-model')
  fs.writeFileSync(candidate.manifest, '{"modelVersion":"en"}')
  candidate.split = path.join(path.dirname(candidate.model), 'split.json')
  fs.writeFileSync(candidate.split, '{"en":true}')
  manager.publishCandidateModel(candidate)
  assert.equal(fs.readFileSync(path.join(profile, 'model.onnx'), 'utf8'), 'en-model')
  assert.equal(fs.readFileSync(path.join(bundled, 'model.onnx'), 'utf8'), 'original-cn-model')
  assert.equal(JSON.parse(fs.readFileSync(path.join(bundled, 'manifest.json'))).modelVersion, 'cn')
  assert.equal(manager.trainingPaths().artifacts, artifacts)
  assert.equal(manager.trainingPaths().base, path.join(root, 'artifacts/junfeng/combined.npz'))
  assert.deepEqual(manager.modelPaths(), highlightModelPaths(profile))
})

test('候选文件缺失时不替换正在使用的国际服模型', t => {
  const { root, profile, manager } = fixture(t)
  fs.mkdirSync(profile, { recursive: true })
  fs.writeFileSync(path.join(profile, 'model.onnx'), 'current-en-model')
  fs.writeFileSync(path.join(profile, 'manifest.json'), '{}')
  assert.throws(() => manager.publishCandidateModel({ model: path.join(root, 'missing') }), /候选模型文件缺失/)
  assert.equal(fs.readFileSync(path.join(profile, 'model.onnx'), 'utf8'), 'current-en-model')
  assert.deepEqual(fs.readdirSync(profile).sort(), ['manifest.json', 'model.onnx'])
})

test('国际服评估复用内置模型时将结果写入独立报告', async t => {
  const { bundled, artifacts, manager } = fixture(t)
  fs.mkdirSync(artifacts, { recursive: true })
  fs.writeFileSync(manager.trainingPaths().merged, 'dataset')
  manager.runTrainingCommand = async (_python, args) => {
    assert.equal(args[args.indexOf('--partition') + 1], 'test')
    const reportPath = args[args.indexOf('--manifest') + 1]
    assert.equal(reportPath, path.join(artifacts, 'evaluation-manifest.json'))
    fs.writeFileSync(reportPath, JSON.stringify({ benchmark: { passed: false, zeroHighlightScenes: 0 } }))
  }
  const result = await manager.evaluateModel()
  assert.equal(result.report.passed, false)
  assert.equal(JSON.parse(fs.readFileSync(path.join(bundled, 'manifest.json'))).modelVersion, 'cn')
})

test('国际服候选未通过隔离测试时保留旧模型', async t => {
  const { root, profile, manager } = fixture(t)
  const paths = manager.trainingPaths()
  for (const file of [paths.python, paths.base]) {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, '')
  }
  fs.mkdirSync(profile, { recursive: true })
  fs.writeFileSync(path.join(profile, 'model.onnx'), 'current-en-model')
  fs.writeFileSync(path.join(profile, 'manifest.json'), '{}')
  let finalTest = false
  manager.runTrainingCommand = async (_python, args) => {
    if (args[0] === paths.benchmark) {
      finalTest = args[args.indexOf('--partition') + 1] === 'test'
      fs.writeFileSync(args[args.indexOf('--manifest') + 1], JSON.stringify({ benchmark: { passed: false } }))
    }
  }
  await assert.rejects(manager.trainModel(), /未通过独立测试/)
  assert.equal(finalTest, true)
  assert.equal(fs.readFileSync(path.join(profile, 'model.onnx'), 'utf8'), 'current-en-model')
  assert.equal(manager.getTrainingStatus().status, 'failed')
})
