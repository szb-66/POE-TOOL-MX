import { deflateSync } from 'node:zlib'
import './compatibility.js'
import { TranslatorFactory } from 'cn-poe-utils/translator/zh2en'
import { transform } from 'cn-poe-utils/building'
import { PobExportError } from './errors.js'

const factory = new TranslatorFactory()
const hasChinese = value => /\p{Script=Han}/u.test(value || '')
const fail = (message, warnings = []) => { throw new PobExportError('CONVERSION_FAILED', message, { warnings }) }
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

function normalizeApiItem(item) {
  for (const [field, values] of Object.entries(item)) {
    if (!field.endsWith('Mods') || !Array.isArray(values)) continue
    item[field] = values.map(mod => {
      if (typeof mod === 'string') return mod
      if (typeof mod?.description === 'string') return mod.description
      fail('官网词缀数据格式无法识别，无法完整导出')
    })
  }
  for (const socketed of item.socketedItems || []) normalizeApiItem(socketed)
}

export function convertBuild(input) {
  const items = structuredClone(input.items)
  const passive = structuredClone(input.passiveSkills)
  validate(items, passive)
  for (const item of [...items.items, ...passive.items]) normalizeApiItem(item)
  const warnings = []
  const translator = factory.getJsonTranslator()
  const originalWarn = console.warn
  // The library is synchronous; capture warnings only during this conversion.
  console.warn = (...args) => warnings.push(`未识别数据：${args.map(String).join(' ')}`)
  try {
    translator.transItems(items)
    translator.transPassiveSkills(passive)
    for (const item of [...items.items, ...passive.items]) {
      if (!item.baseType || hasChinese(item.baseType)) fail('存在未识别的装备或珠宝底材，无法完整导出', warnings)
      if (item.socketedItems) {
        item.socketedItems.sort((a, b) => a.socket - b.socket)
        for (const gem of item.socketedItems) {
          if (!gem.baseType || hasChinese(gem.baseType)) fail('存在未识别的技能或深渊珠宝，无法完整导出', warnings)
          if (!gem.abyssJewel) {
            const level = gem.properties?.find(prop => prop.name === 'Level')?.values?.[0]?.[0]
            if (!Number.isInteger(gem.socket) || !item.sockets?.[gem.socket] || !Number.isFinite(parseInt(level))) {
              fail('技能等级或插槽数据不完整，无法完整导出', warnings)
            }
          }
        }
      }
      // These legacy modifiers are translated by upstream but omitted by its XML serializer.
      for (const field of ['utilityMods', 'scourgeMods']) {
        if (item[field]?.length) {
          item.explicitMods = [...(item.explicitMods || []), ...item[field]]
        }
      }
    }
    const building = transform(items, passive)
    building.config.enemyIsBoss = undefined
    if (!building.build.ascendClassName) building.build.ascendClassName = 'None'
    building.tree.spec.secondaryAscendClassId = passive.alternate_ascendancy ?? 0
    // The live realm and this project's game data are 3.29. Jewel-slot order was
    // checked against PoB 2.67.2 TreeData/3_29 (all 60 slots match the baseline).
    if (building.tree.spec.treeVersion === '3_28') building.tree.spec.treeVersion = '3_29'
    if (building.tree.spec.sockets.sockets.some(socket => !Number.isInteger(socket.nodeId))) {
      fail('当前转换数据无法识别部分珠宝插槽，无法完整导出', warnings)
    }
    if (building.tree.spec.treeVersion !== '3_29') warnings.push('该角色使用特殊天赋树，请在 PoB 中核对天赋版本。')
    if (passive.hashes_ex.length) warnings.push('星团珠宝节点由官网扩展节点换算，导入后请核对星团配置。')
    escapeStrings(building)
    const xml = building.toString()
    if (/\b(?:undefined|NaN)\b/.test(xml)) fail('构筑包含无法识别的数据，未生成导入码', warnings)
    return { code: deflateSync(Buffer.from(xml, 'utf8')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'), warnings: [...new Set(warnings)] }
  } catch (error) {
    if (error instanceof PobExportError) throw error
    fail('角色数据转换失败，可能包含当前版本不支持的装备、技能或天赋', warnings)
  } finally {
    console.warn = originalWarn
  }
}
