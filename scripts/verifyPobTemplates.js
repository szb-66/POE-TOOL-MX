// Called by the Python generator with candidate data on stdin; emits JSON only.
import { DATA } from 'cn-poe-utils/data/poe'
import { TranslatorFactory } from 'cn-poe-utils/translator/zh2en'
import { guardStatTemplates } from '../electron/modules/pobExport/templateSafety.js'

let input = ''
for await (const chunk of process.stdin) input += chunk
const { data, candidates } = JSON.parse(input)
for (const key of Object.keys(DATA)) DATA[key] = data[key]
const basic = guardStatTemplates(new TranslatorFactory().getBasicTranslator())
const render = text => text.replace(/\{(\d+)\}/g, (_, n) => String(17 + Number(n) * 12))
const normalize = text => text?.replace(/\s+/g, ' ').trim().replace(/\b(metre|second|time|Trap|Projectile|Use|Modifier|Enemy)\b/g, '$1s').replace(/Enemys/g, 'Enemies')
const failures = []
for (const stat of candidates) {
  if (stat.refs) continue // References are checked with real skill names in integration tests.
  const actual = basic.transMod(render(stat.zh))
  if (normalize(actual) !== normalize(render(stat.en))) failures.push({ zh: stat.zh, en: stat.en, actual: actual ?? null })
}
process.stdout.write(JSON.stringify(failures))
