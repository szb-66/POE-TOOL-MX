import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const testDir = path.resolve('test')
const mode = process.argv[2] || 'unit'

if (!['unit', 'slow', 'all', 'list'].includes(mode)) {
  console.error('Usage: node scripts/runTests.js <unit|slow|all|list>')
  process.exit(2)
}

const ALWAYS_SLOW_FILES = new Set([
  'viteSmoke.test.js',
  'priceCheckGems.test.js',
  'priceCheckCatalogCoverage.test.js',
  'internationalPseudoRules.test.js',
  'chartModsProbe.test.js',
  'faustusAutomation.test.js',
  'faustusInternational.test.js',
  'junfengHighlight.test.js',
  'puzzleRecognizer.test.js',
  'puzzleAutoPlacement.test.js',
  'bagAutoStash.test.js',
  'craftingParseSynchronization.test.js',
  'craftingIntegration.test.js',
  'localizationNative.test.js',
  'puzzleSolver.test.js'
])

function isSlowTestFile(filename, content) {
  if (ALWAYS_SLOW_FILES.has(filename)) return true
  if (/Slow(?:\.\d+)?\.suite\.test\.js$/.test(filename)) return true
  // Tests spinning up a Vite dev server
  if (/from\s+['"]vite['"]|import\(['"]vite['"]\)/.test(content)) return true
  // Tests spawning Python runtimes or running real PNG/OCR screenshot fixtures
  if (/helpers\/python\.js|execFileSync?\([^)]*python|spawnSync?\([^)]*python|chart_mods_probe_checks|stash_tab_selector_checks/.test(content)) return true
  if (/test\/fixtures\/(?:sanctum|puzzle|junfeng|faustus|mapTracker)/.test(content) && /\.png/i.test(content)) return true
  return false
}

const allFiles = readdirSync(testDir)
  .filter((name) => name.endsWith('.test.js') || name.endsWith('.test.cjs'))
  .sort()

const unitFiles = []
const slowFiles = []
for (const name of allFiles) {
  const fullPath = path.join(testDir, name)
  const content = readFileSync(fullPath, 'utf8')
  if (isSlowTestFile(name, content)) slowFiles.push(fullPath)
  else unitFiles.push(fullPath)
}

if (mode === 'list') {
  console.log(JSON.stringify({
    total: allFiles.length,
    unit: unitFiles.length,
    slow: slowFiles.length,
    slowFiles: slowFiles.map((f) => path.basename(f))
  }, null, 2))
  process.exit(0)
}

const selected = mode === 'all' ? allFiles.map((name) => path.join(testDir, name)) : (mode === 'slow' ? slowFiles : unitFiles)
console.log(`[test:${mode}] Running ${selected.length} / ${allFiles.length} test files...`)

const result = spawnSync(process.execPath, ['--test', '--test-concurrency=4', ...selected], {
  stdio: 'inherit'
})
process.exit(result.status ?? 1)
