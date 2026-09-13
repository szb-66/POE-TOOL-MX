// Synthetic, non-account data for export compatibility checks.
export function buildFixture() {
  const character = { name: '测试角色', league: '测试赛季', level: 90, class: 'Witch' }
  const item = { id: 'fixture-weapon', name: '', baseType: '朽木法杖', typeLine: '朽木法杖', frameType: 0, ilvl: 80,
    inventoryId: 'Weapon', x: 0, explicitMods: ['+10 最大魔力'],
    sockets: [{ group: 0, sColour: 'B' }, { group: 0, sColour: 'B' }, { group: 1, sColour: 'B' }],
    socketedItems: [
      { baseType: '火球', typeLine: '火球', socket: 0, properties: [{ name: '等级', values: [['19', 0]] }, { name: '品质', values: [['+20%', 0]] }] },
      { baseType: '附加闪电伤害(辅)', typeLine: '附加闪电伤害(辅)', socket: 1, properties: [{ name: '等级', values: [['18', 0]] }] },
      { baseType: '冰霜新星', typeLine: '冰霜新星', socket: 2, properties: [{ name: '等级', values: [['17', 0]] }] }
    ] }
  return { items: { character, items: [item] }, passiveSkills: { character: 3, ascendancy: 1, alternate_ascendancy: 0,
    hashes: [11455, 1734], hashes_ex: [], mastery_effects: { 11455: 1 }, skill_overrides: {}, jewel_data: {},
    items: [{ id: 'fixture-jewel', name: '', baseType: '钴蓝珠宝', typeLine: '钴蓝珠宝', frameType: 0, ilvl: 80, x: 0, explicitMods: ['+10 最大魔力'] }] } }
}
