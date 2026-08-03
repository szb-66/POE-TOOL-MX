import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { synchronizeRawSnapshot } from './craftingRawSnapshot.js'
import { buildSkillGemCatalog } from './skillGemCatalog.js'
import { SEASON_BASELINE, S30_SKILL_SENTINELS } from '../shared/seasonBaseline.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const patch = process.env.POE_PATCH || SEASON_BASELINE.patch
const rawSnapshotRoot = path.join(projectRoot, 'electron', 'assets', 'skill-raw')
const outputFile = path.join(projectRoot, 'src', 'domains', 'story', 'skillCatalog.json')

export const SKILL_GEM_SOURCES = Object.freeze([
  { id: 'gem:active', page: 'Skill_Gems', category: 'active', url: 'https://poedb.tw/cn/Skill_Gems' },
  { id: 'gem:support', page: 'Support_Gems', category: 'support', url: 'https://poedb.tw/cn/Support_Gems' }
])

function parseMode(argv) {
  if (argv.includes('--live')) return 'full'
  if (argv.includes('--fetch-missing')) return 'missing'
  return 'offline'
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; exile-helper-snapshot/1.0)',
      'accept-language': 'zh-CN,zh;q=0.9'
    }
  })
  return { status: response.status, text: await response.text() }
}

function assertCatalog(catalog) {
  const activeCount = catalog.skills.filter(skill => skill.kind === 'active').length
  const supportCount = catalog.skills.filter(skill => skill.kind === 'support').length
  if (activeCount < 100 || supportCount < 50) {
    throw new Error(`技能目录数量异常：主动 ${activeCount}，辅助 ${supportCount}`)
  }
  const cleave = catalog.skills.find(skill => skill.name === '劈砍' && skill.kind === 'active')
  if (!cleave || cleave.requiredLevel !== 1 || cleave.color !== 'red') {
    throw new Error('技能目录缺少“劈砍 / 1 / 红色”哨兵')
  }
  const support = catalog.skills.find(skill => skill.name.includes('无情') && skill.kind === 'support')
  if (!support) throw new Error('技能目录缺少“无情”辅助宝石哨兵')
  const convocation = catalog.skills.find(skill => skill.name === '号召' && skill.kind === 'active')
  if (!convocation || convocation.requiredLevel !== 24 || convocation.color !== 'white') {
    throw new Error('技能目录缺少“号召 / 24 / 白色”哨兵')
  }
  if (patch === SEASON_BASELINE.patch) {
    const missing = S30_SKILL_SENTINELS.filter((sourcePath) => !catalog.skills.some((skill) => skill.sourcePath === sourcePath))
    if (missing.length) throw new Error(`技能目录缺少 S30 哨兵：${missing.join('、')}`)
  }
}

async function main() {
  const mode = parseMode(process.argv.slice(2))
  const raw = await synchronizeRawSnapshot({
    root: rawSnapshotRoot,
    patch,
    sources: SKILL_GEM_SOURCES,
    mode,
    fetcher: fetchText,
    onFetch: source => console.log(`抓取 ${source.url}`)
  })
  const generatedAt = raw.manifest.sources.reduce(
    (latest, source) => source.fetchedAt > latest ? source.fetchedAt : latest,
    ''
  )
  const catalog = buildSkillGemCatalog({
    activeHtml: raw.texts.get('gem:active'),
    supportHtml: raw.texts.get('gem:support'),
    patch,
    generatedAt,
    sources: raw.manifest.sources.map(({ id, url, fetchedAt, sha256 }) => ({ id, url, fetchedAt, sha256 }))
  })
  assertCatalog(catalog)
  await mkdir(path.dirname(outputFile), { recursive: true })
  await writeFile(outputFile, `${JSON.stringify(catalog, null, 2)}\n`)
  console.log(`已生成 ${catalog.skills.length} 条技能目录：${path.relative(projectRoot, outputFile)}`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
