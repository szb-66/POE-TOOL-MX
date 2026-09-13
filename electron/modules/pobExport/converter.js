import { deflateSync } from 'node:zlib'
import { pobIdentities } from './compatibility.js'
import { TranslatorFactory } from 'cn-poe-utils/translator/zh2en'
import { transform } from 'cn-poe-utils/building'
import { PobExportError } from './errors.js'
import { resolveItemIdentity, normalizeAndInspect, checkTranslatedGem, preserveExtraMods, inspectBuilding, hasChinese } from './integrity.js'
import { guardStatTemplates } from './templateSafety.js'

const factory = new TranslatorFactory()
guardStatTemplates(factory.getBasicTranslator())
for (const [category, method] of [['anointed', 'transAnointed'], ['ascendant', 'transAscendant'], ['keystones', 'transKeystone']]) {
  const ambiguous = new Set(pobIdentities.passiveConflicts[category])
  const basic = factory.getBasicTranslator()
  const original = basic[method].bind(basic)
  basic[method] = name => ambiguous.has(name) ? undefined : original(name)
}
const basicTranslator = factory.getBasicTranslator()
const translateMod = basicTranslator.transMod.bind(basicTranslator)
basicTranslator.transMod = text => {
  // Some upstream allocation templates embed the passive name literally, so
  // they bypass transAnointed and require the same ambiguity check here.
  const allocation = text.match(/^(?:配置|分配)\s*(.+)$/u)
  if (allocation && pobIdentities.passiveConflicts.anointed.includes(allocation[1])) return undefined
  return translateMod(text)
}
const fail = (message, warnings = []) => { throw new PobExportError('CONVERSION_FAILED', message, { warnings: [...new Set(warnings)] }) }
const escapeXml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

function escapeStrings(object, seen = new Set()) {
  if (!object || typeof object !== 'object' || seen.has(object)) return
  seen.add(object)
  for (const key of Object.keys(object)) {
    if (typeof object[key] === 'string') object[key] = escapeXml(object[key])
    else escapeStrings(object[key], seen)
  }
}

function validate(items, passive) {
  if (!Array.isArray(items?.items) || !Number.isInteger(items?.character?.level) || items.character.level < 1 || items.character.level > 100 ||
      !Array.isArray(passive?.items) || !Array.isArray(passive?.hashes) || !Array.isArray(passive?.hashes_ex) ||
      !Number.isInteger(passive?.character) || passive.character < 0 || passive.character > 6 ||
      !Number.isInteger(passive?.ascendancy) || !passive.mastery_effects || !passive.skill_overrides || !passive.jewel_data) {
    fail('角色装备或天赋数据不完整，无法生成可靠的导入码')
  }
  if (![...passive.hashes, ...passive.hashes_ex].every(Number.isInteger)) fail('天赋节点数据无效')
}

export function convertBuild(input) {
  const items = structuredClone(input.items)
  const passive = structuredClone(input.passiveSkills)
  validate(items, passive)
  const issues = []
  normalizeAndInspect(items, passive, issues)
  const expectedNodes = [...passive.hashes]
  const warnings = []
  const translator = factory.getJsonTranslator()
  const basic = factory.getBasicTranslator()
  const transItem = translator.transItem.bind(translator)
  translator.transItem = item => {
    const identity = resolveItemIdentity(item, basic)
    if (identity.error) issues.push(identity.error)
    // Scope identity resolution to this item; recursive abyss jewels restore the
    // parent resolver on return. The factory and template engine remain reusable.
    const original = basic.transNameAndBaseType
    basic.transNameAndBaseType = identity.error ? original : () => identity
    try { transItem(item) } finally { basic.transNameAndBaseType = original }
  }
  const originalWarn = console.warn
  // The library is synchronous; capture warnings only during this conversion.
  console.warn = (...args) => warnings.push(`未识别数据：${args.map(String).join(' ')}`)
  try {
    translator.transItems(items)
    translator.transPassiveSkills(passive)
    for (const item of [...items.items, ...passive.items]) {
      if (!item.baseType || hasChinese(item.baseType)) issues.push(`未识别的装备或珠宝底材：${item.baseType || '缺失'}`)
      if (item.socketedItems) {
        item.socketedItems.sort((a, b) => a.socket - b.socket)
        for (const gem of item.socketedItems) {
          if (!gem.abyssJewel) checkTranslatedGem(gem, issues)
        }
      }
      preserveExtraMods(item, warnings)
    }
    for (const [id, override] of Object.entries(passive.skill_overrides)) {
      if (!override.name || hasChinese(override.name)) issues.push(`未识别的天赋覆盖：${id} / ${override.name || '缺失名称'}`)
    }
    const ascendancies = pobIdentities.classes[passive.character]?.ascendancies
    if (passive.ascendancy < 0 || passive.ascendancy > ascendancies.length) issues.push('升华职业数据无效')
    if (issues.length) fail('角色存在未识别或不完整数据，无法完整导出', [...issues, ...warnings])
    const building = transform(items, passive)
    // Upstream creates an empty skill group when an abyss jewel precedes a gem.
    building.skills.skillSet.skills = building.skills.skillSet.skills.filter(group => group.gems.length)
    building.config.enemyIsBoss = undefined
    if (!building.build.ascendClassName) building.build.ascendClassName = 'None'
    building.tree.spec.secondaryAscendClassId = passive.alternate_ascendancy ?? 0
    // The live realm and this project's game data are 3.29. Jewel-slot order was
    // checked against PoB 2.67.2 TreeData/3_29 (all 60 slots match the baseline).
    if (building.tree.spec.treeVersion === '3_28') building.tree.spec.treeVersion = '3_29'
    inspectBuilding(building, items, passive, expectedNodes, issues)
    if (issues.length) fail('构筑转换后数据不完整，未生成导入码', [...issues, ...warnings])
    if (building.tree.spec.treeVersion !== '3_29') warnings.push('该角色使用特殊天赋树，请在 PoB 中核对天赋版本。')
    if (passive.hashes_ex.length) warnings.push('星团珠宝节点由官网扩展节点换算，导入后请核对星团配置。')
    if (warnings.some(w => /untranslated|未识别词缀/.test(w))) warnings.push('未识别词缀已保留原文，可能影响 PoB 计算，请在导入后核对。')
    escapeStrings(building)
    const xml = building.toString()
    if (/\b(?:undefined|NaN)\b/.test(xml)) fail('构筑包含无法识别的数据，未生成导入码', warnings)
    return { code: deflateSync(Buffer.from(xml, 'utf8')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'), warnings: [...new Set(warnings)] }
  } catch (error) {
    if (error instanceof PobExportError) throw error
    fail('角色数据转换失败，可能包含当前版本不支持的装备、技能或天赋', [...issues, ...warnings])
  } finally {
    console.warn = originalWarn
  }
}
