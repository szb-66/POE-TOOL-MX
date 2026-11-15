import { createHash } from 'node:crypto'

// Minimal verbatim stat records and signed condition metadata from the 3.30.0b export.
const table = 'metadata/statdescriptions/stat_descriptions.csd'
function variants(id, records, conditions, handlers = records.map(() => '')) {
  const stats = { ids: [id], variants: records.map((record, index) => ({ condition: conditions[index], handlers: handlers[index], placeholders: record.en.match(/\{\d+(?::[^}]+)?\}|%/g)?.sort() || [] })) }
  return records.map((record, index) => ({ table, id, field: `variant:${index}`, kind: 'stat', ...record, stats,
    sourceHash: createHash('sha256').update(record.en).digest('hex') }))
}
export const mapStatVariants = [
  ...variants('map_rare_monster_num_additional_modifiers', [
    { en: 'Rare Monsters each have {0} additional Modifier', cn: '每个稀有怪物额外具有 {0} 个词缀', tw: '每個稀有怪物有 {0} 個額外詞綴' },
    { en: 'Rare Monsters each have {0} additional Modifiers', cn: '每个稀有怪物额外具有 {0} 个词缀', tw: '每個稀有怪物有 {0} 個額外詞綴' }
  ], ['1', '#']),
  ...variants('map_monster_add_x_grasping_vines_on_hit', [
    { en: 'Monsters inflict {0} Grasping Vine on Hit', cn: '怪物击中时施加 {0} 缓速藤蔓', tw: '怪物擊中時造成 {0} 層緩速藤蔓' },
    { en: 'Monsters inflict {0} Grasping Vines on Hit', cn: '怪物击中时施加 {0} 缓速藤蔓', tw: '怪物擊中時造成 {0} 層緩速藤蔓' }
  ], ['1', '#'], ['reminderstring ReminderTextGraspingVines', 'reminderstring ReminderTextGraspingVines']),
  ...variants('attack_speed_+%', [
    { en: '{0}% increased Attack Speed', cn: '攻击速度加快 {0}%', tw: '增加 {0}% 攻擊速度' },
    { en: '{0}% reduced Attack Speed', cn: '攻击速度减慢 {0}%', tw: '減少 {0}% 攻擊速度' }
  ], ['1|#', '#|-1'], ['', 'negate 1']),
  ...variants('map_monsters_reflect_%_physical_damage', [
    { en: 'Monsters reflect {0}% of Physical Damage', cn: '怪物会反射 {0}% 物理伤害', tw: '怪物反射 {0}% 物理傷害' }
  ], ['#'])
]
