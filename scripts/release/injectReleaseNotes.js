import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function normalizeText(value) {
  return String(value || '').replace(/\r\n?/g, '\n')
}
function metadataVersion(metadata) {
  return normalizeText(metadata).match(/^version:\s*['"]?([^'"\s]+)['"]?\s*$/m)?.[1] || ''
}

function withoutTopLevelReleaseNotes(metadata) {
  const lines = normalizeText(metadata).split('\n')
  const start = lines.findIndex(line => /^releaseNotes:\s*/.test(line))
  if (start < 0) return lines.join('\n').replace(/\n+$/, '')
  let end = start + 1
  while (end < lines.length && (lines[end] === '' || /^\s/.test(lines[end]))) end += 1
  lines.splice(start, end - start)
  return lines.join('\n').replace(/\n+$/, '')
}

export function injectReleaseNotesText(metadata, releaseNotes, expectedVersion) {
  const notes = normalizeText(releaseNotes).trim()
  if (!notes) throw new Error('发布说明为空')
  const actualVersion = metadataVersion(metadata)
  if (!actualVersion || actualVersion !== String(expectedVersion || '').trim()) {
    throw new Error(`latest.yml 版本不匹配：期望 ${expectedVersion}，实际 ${actualVersion || '缺失'}`)
  }
  const base = withoutTopLevelReleaseNotes(metadata)
  const yamlNotes = notes.split('\n').map(line => `  ${line}`).join('\n')
  return `${base}\nreleaseNotes: |-\n${yamlNotes}\n`
}

export async function injectReleaseNotes({ metadataPath, notesPath, expectedVersion, fileSystem = fs }) {
  const [metadata, releaseNotes] = await Promise.all([
    fileSystem.readFile(metadataPath, 'utf8'),
    fileSystem.readFile(notesPath, 'utf8')
  ])
  const output = injectReleaseNotesText(metadata, releaseNotes, expectedVersion)
  await fileSystem.writeFile(metadataPath, output, 'utf8')
  return output
}

async function main() {
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
  const packageJson = JSON.parse(await fs.readFile(path.join(repositoryRoot, 'package.json'), 'utf8'))
  const version = String(packageJson.version || '').trim()
  await injectReleaseNotes({
    expectedVersion: version,
    metadataPath: path.join(repositoryRoot, 'dist-electron', 'latest.yml'),
    notesPath: path.join(repositoryRoot, 'docs', 'release-notes', `v${version}.md`)
  })
  process.stdout.write(`Injected release notes for v${version}\n`)
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (entryPath === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write(`${error?.message || error}\n`)
    process.exitCode = 1
  })
}
