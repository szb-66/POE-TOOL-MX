import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const outputRoot = path.join(projectRoot, 'dist-electron')
const packageConfig = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'))
const expectedName = `PoE-CN-Helper-${packageConfig.version}-win-x64-setup.exe`
const assets = await readdir(outputRoot)
if (!assets.includes(expectedName)) throw new Error(`未找到预期安装包: ${expectedName}`)

const hash = createHash('sha256')
await new Promise((resolve, reject) => {
  createReadStream(path.join(outputRoot, expectedName))
    .on('data', (chunk) => hash.update(chunk))
    .on('error', reject)
    .on('end', resolve)
})
const line = `${hash.digest('hex')}  ${expectedName}\n`
await writeFile(path.join(outputRoot, 'SHA256SUMS.txt'), line)
process.stdout.write(line)
