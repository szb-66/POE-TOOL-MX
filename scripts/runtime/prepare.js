import { createWriteStream, existsSync } from 'node:fs'
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import extract from 'extract-zip'
import {
  assertInsideGeneratedRoot,
  assertProjectFiles,
  cacheRoot,
  loadManifest,
  manifestPath,
  runtimeRoot,
  sha256
} from './shared.js'

async function downloadVerified(asset) {
  const destination = path.join(cacheRoot, asset.filename)
  if (existsSync(destination) && await sha256(destination) === asset.sha256) return destination

  const response = await fetch(asset.url, { redirect: 'follow' })
  if (!response.ok || !response.body) {
    throw new Error(`下载失败 (${response.status}): ${asset.url}`)
  }
  const temporary = `${destination}.download`
  await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary))
  const digest = await sha256(temporary)
  if (digest !== asset.sha256) {
    await rm(temporary, { force: true })
    throw new Error(`${asset.filename} SHA-256 不匹配: ${digest}`)
  }
  await rm(destination, { force: true })
  await copyFile(temporary, destination)
  await rm(temporary, { force: true })
  return destination
}

async function enableSitePackages(root) {
  const pthPath = path.join(root, 'python313._pth')
  const original = await readFile(pthPath, 'utf8')
  const lines = original.split(/\r?\n/)
    .filter((line) => line.trim() !== 'Lib/site-packages')
    .map((line) => line.trim() === '#import site' ? 'import site' : line)
  const zipIndex = lines.findIndex((line) => line.trim() === 'python313.zip')
  lines.splice(zipIndex >= 0 ? zipIndex + 1 : 0, 0, 'Lib/site-packages')
  await writeFile(pthPath, `${lines.filter((line, index, all) => index < all.length - 1 || line).join('\r\n')}\r\n`)
}

async function main() {
  if (process.platform !== 'win32') throw new Error('内置运行时仅支持在 Windows 上准备')
  const manifest = await loadManifest()
  assertProjectFiles(manifest)
  assertInsideGeneratedRoot(runtimeRoot)
  await mkdir(cacheRoot, { recursive: true })

  const assets = [manifest.python, ...manifest.packages]
  const downloaded = new Map()
  for (const asset of assets) {
    process.stdout.write(`准备 ${asset.filename}\n`)
    downloaded.set(asset.filename, await downloadVerified(asset))
  }

  await rm(runtimeRoot, { recursive: true, force: true })
  await mkdir(runtimeRoot, { recursive: true })
  await extract(downloaded.get(manifest.python.filename), { dir: runtimeRoot })
  const sitePackages = path.join(runtimeRoot, 'Lib', 'site-packages')
  await mkdir(sitePackages, { recursive: true })
  for (const packageInfo of manifest.packages) {
    await extract(downloaded.get(packageInfo.filename), { dir: sitePackages })
  }
  await enableSitePackages(runtimeRoot)
  await copyFile(manifestPath, path.join(runtimeRoot, 'runtime-manifest.json'))
  await writeFile(path.join(runtimeRoot, 'runtime-build.json'), `${JSON.stringify({
    schemaVersion: 1,
    python: manifest.python.version,
    arch: manifest.arch,
    packages: Object.fromEntries(manifest.packages.map((entry) => [entry.name, entry.version]))
  }, null, 2)}\n`)
  process.stdout.write(`内置运行时已准备: ${runtimeRoot}\n`)
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`)
  process.exitCode = 1
})
