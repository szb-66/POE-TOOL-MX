import { readFile, mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { inventory, runtimeFilter, copyRuntime, assertRuntimeDistribution, assertNoFrontendPackages } from './distribution.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const config = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
const locks = [process.argv[2], path.join(root, 'package-lock.json')]
if (!locks[0]) throw new Error('请提供改动前 package-lock.json 的路径')
const lockData = await Promise.all(locks.map(async file => JSON.parse(await readFile(file, 'utf8'))))
if (lockData.some(lock => lock.version !== config.version) ||
    Object.entries(lockData[0].packages).some(([name, info]) => name && lockData[1].packages[name]?.version !== info.version) ||
    Object.keys(lockData[1].packages).some(name => !Object.hasOwn(lockData[0].packages, name))) {
  throw new Error('体积对照要求应用版本及依赖版本完全一致')
}
const output = path.join(root, '.cache/installer-size')
await mkdir(output, { recursive: true })
const source = path.join(root, '.runtime/python-runtime')
const before = await inventory(source)
const after = await inventory(source, runtimeFilter(source, config))
const destination = await mkdtemp(path.join(output, 'runtime-'))
await copyRuntime(source, destination, config)
await assertRuntimeDistribution(source, destination, config)
const total = files => files.reduce((sum, file) => sum + file.bytes, 0)
const nodeFiles = []
for (const lock of lockData) {
  const packages = Object.entries(lock.packages).filter(([name, info]) => name && !info.dev && !info.link)
  const files = []
  for (const [name] of packages) {
    for (const file of await inventory(path.join(root, name), (absolute, info) => !(info.isDirectory() && path.basename(absolute) === 'node_modules'))) {
      files.push({ path: `${name}/${file.path}`, bytes: file.bytes })
    }
  }
  nodeFiles.push(files)
}
assertNoFrontendPackages(nodeFiles[1].map(file => file.path))
const summary = {
  version: config.version,
  measurement: '未压缩源文件；Node 部分为生产依赖闭包原始文件，未模拟 builder 默认文件排除，不等同于安装包压缩收益',
  runtime: { before: total(before), after: total(after), saved: total(before) - total(after) },
  productionDependencies: { before: total(nodeFiles[0]), after: total(nodeFiles[1]), saved: total(nodeFiles[0]) - total(nodeFiles[1]) },
  runtimeCopy: path.relative(root, destination).replaceAll('\\', '/')
}
await writeFile(path.join(output, 'before.json'), JSON.stringify({ runtime: before, productionDependencies: nodeFiles[0] }, null, 2))
await writeFile(path.join(output, 'after.json'), JSON.stringify({ runtime: after, productionDependencies: nodeFiles[1] }, null, 2))
await writeFile(path.join(output, 'summary.json'), JSON.stringify(summary, null, 2))
console.log(JSON.stringify(summary, null, 2))
