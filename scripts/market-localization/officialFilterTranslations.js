import fs from 'node:fs'
import { createHash } from 'node:crypto'
import * as OpenCC from 'opencc-js'

const bytes = fs.readFileSync(new URL('./official-filters.tw.json', import.meta.url))
export const officialFilterSource = JSON.parse(fs.readFileSync(new URL('./official-filters.source.json', import.meta.url), 'utf8'))
if (createHash('sha256').update(bytes).digest('hex') !== officialFilterSource.sha256) throw new Error('官方市集筛选来源指纹不匹配')
export const officialFilterSchema = JSON.parse(bytes.toString('utf8'))
const simplify = OpenCC.Converter({ from: 'tw', to: 'cn' })

// Reviewed against current game terms. API wording supplies identity coverage, not a reason to retain old mistranslations.
const reviewedFields = {
  damage: ['伤害', '傷害'], base_defence_percentile: ['基础防御百分位', '基礎防禦百分位'],
  class: ['角色职业', '角色職業'], fee: ['金币费用', '金幣費用'],
  gem_level: ['宝石等级', '寶石等級'], gem_level_progress: ['宝石经验 %', '寶石經驗 %'],
  gem_vaal: ['瓦尔宝石', '瓦爾寶石'], gem_imbued: ['灌注宝石', '注能寶石'],
  fractured_item: ['分裂之物', '破裂之物'], synthesised_item: ['忆境物品', '追憶之物'],
  searing_item: ['焚界者物品', '灼烙總督物品'], tangled_item: ['灭界者物品', '吞噬天地物品'],
  unidentified_tier: ['未鉴定阶级', '未鑑定階級'], twice_corrupted: ['双重腐化', '雙重腐化'],
  split: ['已分裂', '已分化'], crafted: ['已工艺', '已工藝'], veiled: ['影匿', '隱匿'],
  vestigial: ['退化', '殘存'], intangibility: ['虚化', '無形性'], stored_experience: ['储存经验', '儲存經驗'],
  foil_variation: ['闪耀样式', '閃耀樣式'], corpse_type: ['灵柩类型', '屍體類型'],
  scourge_tier: ['异度天灾阶级', '災魘階級'], crucible_item: ['古神熔炉物品', '熔火冥獄物品'],
  map_bonus: ['异界掉落', '輿圖掉落'], area_level: ['区域等级', '區域等級'],
  map_completion_reward: ['地图完成奖励', '完成地圖獎勵'],
  heist_wings: ['已揭露侧厅', '已揭露側廂'], heist_max_wings: ['侧厅总数', '總側廂'],
  heist_escape_routes: ['已揭露逃生路线', '已揭露逃脫路線'], heist_max_escape_routes: ['逃生路线总数', '總逃脫路線'],
  heist_reward_rooms: ['已揭露奖励室', '已揭露獎勵房'], heist_max_reward_rooms: ['奖励室总数', '總獎勵房'],
  heist_objective_value: ['契约目标价值', '契約書標的價值'],
  heist_lockpicking: ['解密术等级', '開鎖等級'], heist_brute_force: ['凶蛮之力等级', '蠻力等級'],
  heist_perception: ['洞察等级', '洞察力等級'], heist_demolition: ['爆破等级', '拆除等級'],
  heist_counter_thaumaturgy: ['逆向奇术等级', '解咒師等級'], heist_trap_disarmament: ['解除陷阱等级', '陷阱解除等級'],
  heist_agility: ['灵敏等级', '靈敏等級'], heist_deception: ['欺诈等级', '詐欺等級'], heist_engineering: ['工程学等级', '工程等級'],
  sanctum_resolve: ['坚毅', '決心'], sanctum_max_resolve: ['最大坚毅', '最大決心'],
  sanctum_inspiration: ['启迪', '啟發'], sanctum_gold: ['奥瑞厄斯金币', '奧瑞厄斯幣']
}
const reviewedCategories = {
  leaguestone: ['赛季石', '聯盟石'], memoryline: ['回忆', '記憶'],
  'monster.beast': ['已捕获野兽', '已捕獲野獸'], 'monster.yellowbeast': ['黄色野兽', '黃色野獸'], 'monster.redbeast': ['红色野兽', '紅色野獸'],
  heistequipment: ['赏金猎人装备（全部）', '劫盜裝備（全部）'],
  'heistequipment.heistweapon': ['赏金猎人装备', '劫盜裝備'], 'heistequipment.heisttool': ['赏金猎人工具', '劫盜工具'],
  'heistequipment.heistutility': ['赏金猎人披风', '劫盜披風'], 'heistequipment.heistreward': ['赏金猎人胸针', '劫盜胸針'],
  heistmission: ['夺宝奇兵任务（全部）', '劫盜任務（全部）'], 'heistmission.contract': ['契约', '契約書'], 'heistmission.blueprint': ['蓝图', '藍圖'],
  logbook: ['先祖秘藏日志', '探險日誌'], 'sanctum.research': ['禁域研究', '聖域研究'], 'sanctum.relic': ['遗物', '聖物'],
  tincture: ['酊剂', '萃取物'], corpse: ['灵柩', '屍體'], idol: ['雕像', '魔偶'],
  graft: ['移植物', '接肢'], wombgift: ['孕育赠礼', '胎贈'], enshrouded: ['雾隐物品', '壟罩物品'], chart: ['海图', '海圖'],
  viscera: ['脏器', '臟器'], 'viscera.head': ['头部脏器', '頭部臟器'], 'viscera.arm': ['手部脏器', '手部臟器'],
  'viscera.body': ['躯干脏器', '身體臟器'], 'viscera.leg': ['腿部脏器', '腿部臟器'],
  'currency.incubator': ['孕育石', '培育器'], 'currency.resonator': ['共振器', '鑄新儀'], 'currency.heistobjective': ['赏金目标', '劫盜目標']
}
const classes = {
  scion: ['贵族', '貴族'], marauder: ['野蛮人', '野蠻人'], ranger: ['游侠', '遊俠'], witch: ['女巫', '女巫'],
  duelist: ['决斗者', '決鬥者'], templar: ['圣堂武僧', '聖堂武僧'], shadow: ['暗影', '暗影刺客']
}
const indexed = {
  '1hour': ['最近1小时', '最近1小時'], '3hours': ['最近3小时', '最近3小時'], '12hours': ['最近12小时', '最近12小時'],
  '1day': ['最近1天', '最近1天'], '3days': ['最近3天', '最近3天'], '1week': ['最近1周', '最近1週'], '2weeks': ['最近2周', '最近2週'],
  '1month': ['最近1个月', '最近1個月'], '2months': ['最近2个月', '最近2個月']
}
const placeholder = { account: { source: 'Tapez le nom du compte...', cn: '输入账号名称...', tw: '輸入帳號名稱...' } }
const pair = (row, override) => override || [simplify(row.text ?? row.title), row.text ?? row.title]
const rulePair = ([cn, tw]) => ({ cn, tw })

export function filterDisplayRows(schema = officialFilterSchema) {
  const rows = []
  for (const group of schema.result) {
    if (group.title) rows.push({ kind: 'title', path: group.id, field: 'title', id: group.id, text: group.title })
    for (const filter of group.filters) {
      const path = `${group.id}.${filter.id}`
      if (filter.text) rows.push({ kind: 'field', path, field: 'text', id: filter.id, text: filter.text })
      if (filter.input?.placeholder) rows.push({ kind: 'placeholder', path: `${path}.input`, scope: filter.id, field: 'placeholder', text: filter.input.placeholder })
      for (const option of filter.option?.options || []) if (option.text) rows.push({ kind: 'option', path: `${path}.option:${String(option.id)}`,
        scope: filter.id, field: 'text', id: option.id, text: option.text })
    }
  }
  return rows
}

export function createOfficialFilterRules(reviewed = [], schema = officialFilterSchema) {
  const old = new Map(reviewed.filter(rule => rule.id && !rule.scope && rule.section === 'filters').map(rule => [`${rule.field}\0${rule.id}`, [rule.cn, rule.tw]]))
  const rules = []
  for (const row of filterDisplayRows(schema)) {
    if (row.kind === 'placeholder') {
      const known = placeholder[row.scope]
      if (!known) throw new Error(`没有核实法语来源的占位符：${row.path}`)
      rules.push({ section: 'filters', field: 'placeholder', ...known })
    } else if (row.kind === 'option') {
      if (row.id === null) rules.push({ section: 'filters', field: 'text', scope: row.scope, defaultOption: true,
        ...rulePair(row.scope === 'collapse' ? ['否', '否'] : row.scope === 'indexed' ? ['任意时间', '任何時間']
          : row.scope === 'sale_type' ? ['一口价或定价', '直購價或定價'] : row.scope === 'price' ? ['与混沌石等值', '與混沌石等值'] : ['任意', '任何']) })
      else if (typeof row.id === 'string' && row.id) {
        let override = old.get(`text\0${row.id}`)
        if (row.id === 'any') override = ['任意', '任何']
        if (row.scope === 'category') override = reviewedCategories[row.id] || override
        if (row.scope === 'class') override = classes[row.id]
        if (row.scope === 'indexed') override = indexed[row.id]
        if (row.scope === 'foil_variation' && row.id === 'voidborn') override = ['虚空血脉（全部）', '虛誕（全部）']
        if (row.scope === 'foil_variation' && row.id === 'celestial') override = ['星空（全部）', '眾星（全部）']
        rules.push({ section: 'filters', field: 'text', scope: row.scope, id: row.id, ...rulePair(pair(row, override)) })
      } else throw new Error(`不能按全局ID猜译的选项：${row.path}`)
    } else {
      const override = row.kind === 'field' ? reviewedFields[row.id] || old.get(`${row.field}\0${row.id}`) : old.get(`${row.field}\0${row.id}`)
      rules.push({ section: 'filters', field: row.field, id: row.id, ...rulePair(pair(row, override)) })
    }
  }
  return rules
}

export function auditOfficialFilterCoverage(rules, schema = officialFilterSchema) {
  const rows = filterDisplayRows(schema), missing = []
  for (const row of rows) {
    const candidates = rules.filter(rule => rule.section === 'filters' && rule.field === row.field &&
      (row.kind === 'option' ? rule.scope === row.scope && (row.id === null ? rule.defaultOption === true && !rule.id : rule.id === row.id && !rule.defaultOption)
        : row.kind === 'placeholder' ? !rule.scope && rule.source === placeholder[row.scope]?.source
          : !rule.scope && rule.id === row.id))
    if (!candidates.some(rule => rule.cn && rule.tw)) missing.push({ path: row.path, id: row.id, field: row.field })
  }
  const filters = schema.result.flatMap(group => group.filters)
  return { groups: schema.result.length, fields: filters.length, displayRows: rows.length,
    titles: rows.filter(row => row.kind === 'title').length, fieldTexts: rows.filter(row => row.kind === 'field').length,
    placeholders: rows.filter(row => row.kind === 'placeholder').length, inlineSelectors: filters.filter(filter => filter.option?.options).length,
    inlineOptions: rows.filter(row => row.kind === 'option').length, defaultOptions: rows.filter(row => row.kind === 'option' && row.id === null).length,
    dynamicKnownItem: filters.filter(filter => filter.option?.knownItem).map(filter => ({ id: filter.id, ...filter.option.knownItem })),
    tipsExcluded: filters.filter(filter => filter.tip).length, missing }
}
