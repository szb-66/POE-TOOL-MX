const AREA_CATALOG_VERSION = 1

const AREAS = Object.freeze({
  '2_11_endgame_town': { name: '卡鲁海滩', type: 'town' },
  '1_1_town': { name: '狮眼守望', type: 'town' },
  '1_2_town': { name: '森林营地', type: 'town' },
  '1_3_town': { name: '萨恩营地', type: 'town' },
  '1_4_town': { name: '统治者之殿', type: 'town' },
  '1_5_town': { name: '狱卒之塔', type: 'town' },
  KalguuranSettlersLeague: { name: '君锋镇', type: 'town' },
  HeistHub: { name: '黄金港', type: 'town' },
  HideoutForest: { name: '苍翠藏身处', type: 'hideout' },
  HideoutForest_Claim: { name: '苍翠藏身处', type: 'hideout' },
  HeistHubEndless: { name: '黄金湾', type: 'town' },
  HeistHubSolo: { name: '黄金港', type: 'town' },
  DelveHub: { name: '矿坑营地', type: 'town' },
  Menagerie: { name: '兽园', type: 'town' },
  SanctumFoyer: { name: '禁忌圣域', type: 'side-area' },
  HallsOfTheDead: { name: '亡者之厅', type: 'town' },
  LabyrinthAirlock: { name: '志士之试炼', type: 'town' },
  '2_6_town': { name: '狮眼守望', type: 'town' },
  '2_7_town': { name: '桥头营地', type: 'town' },
  '2_8_town': { name: '萨恩营地', type: 'town' },
  '2_9_town': { name: '统治者之殿', type: 'town' },
  '2_10_town': { name: '奥瑞亚码头', type: 'town' },
  MapWorldsCemetery: { name: '晨曦墓地', type: 'map' },
  MapWorldsMuseum: { name: '博物馆', type: 'map' },
  MapWorldsBog: { name: '沼泽', type: 'map' },
  MapWorldsGraveTrough: { name: '墓穴地沟', type: 'map' },
  MavenHub: { name: '贤主之邀', type: 'boss' },
  Hideout: { name: '藏身处', type: 'hideout' },
  LioneyeWatch: { name: '狮眼守望', type: 'town' },
  AbyssLeague: { name: '深渊', type: 'side-area' },
  VaalSideArea: { name: '瓦尔附属区域', type: 'side-area' },
  LabyrinthTrial: { name: '升华试炼', type: 'side-area' }
})

// 简体中文名称参考：https://poedb.tw/cn/Hideout
const HIDEOUT_NAMES = Object.freeze({
  Lush: '苍翠藏身处', Trench: '劫匪的沟渠藏身处', Battlescarred: '战痕藏身处',
  Coastal: '海岸藏身处', Enlightened: '启迪藏身处', Overgrown: '密草藏身处',
  Immaculate: '洁净藏身处', Unearthed: '墓穴藏身处', Backstreet: '暗巷藏身处',
  Undercity: '地下城藏身处', Excavated: '考古藏身处', Stately: '宏伟藏身处',
  Coral: '珊瑚藏身处', Baleful: '罪孽藏身处', Desert: '荒漠藏身处',
  Skeletal: '钢骨藏身处', Luxurious: '奢华藏身处', Cartography: '制图师藏身处',
  Towering: '塔楼藏身处', Corrupted: '腐化藏身处', Innocent: '纯净藏身处',
  Shaper: '塑界藏身处', Furious: '狂怒藏身处', Champions: '勇士藏身处',
  Indomitable: '不屈藏身处', Morbid: '灾病藏身处', Eclipsed: '日蚀藏身处',
  Ravenous: '贪婪藏身处', SunkenCity: '沉陷藏身处', ShapersRealm: '众星藏身处',
  TwilightTemple: '分割藏身处', HighGardens: '树栖藏身处', Haunted: '鬼语藏身处',
  PrisonTower: '野蛮藏身处', CrimsonTemple: '血色藏身处', Iceberg: '冰川藏身处',
  Mountain: '实验藏身处', Void: '虚空藏身处'
})

const MAP_NAMES = Object.freeze({
  Beach: '沙滩', Strand: '滨海山丘', Dunes: '暮色沙丘', Desert: '荒漠',
  DesertSpring: '荒漠绿洲', JungleValley: '丛林山谷', TropicalIsland: '热带岛屿',
  Atoll: '环礁', Island: '海岛', Mesa: '平顶荒漠', Canyon: '峡谷',
  CitySquare: '危城广场', CrimsonTemple: '玫红神殿', DefiledCathedral: '污染教堂',
  BurialChambers: '幽闭墓领', UndergroundSea: '滨海幽穴', UndergroundRiver: '地底之河',
  DriedLake: '干涸湖岸', Plateau: '高原', Glacier: '冰川', FrozenCabins: '冰封小屋',
  City: '城市', Park: '园林', Gardens: '花园', Palace: '神域之殿',
  Tower: '高塔', Courtyard: '奇迹之墙', Promenade: '长廊', Colonnade: '柱廊',
  Arcade: '拱廊', Arsenal: '军械库', Armoury: '武器库', Dungeon: '地牢',
  Cells: '禁魂炎狱', Crypt: '墓穴', Catacombs: '地下墓穴', Graveyard: '墓园',
  SpiderForest: '蜘蛛森林', SpiderLair: '蜘蛛巢穴', ArachnidNest: '蛛网巢穴',
  ArachnidTomb: '蛛网墓穴', AshenWood: '灰烬森林', Woods: '森林',
  Orchard: '果园', Terrace: '露台', Villa: '别墅', Residence: '宅邸',
  Lighthouse: '灯塔', Shore: '海岸', Pier: '码头', Port: '港口',
  Shipyard: '造船厂', Wharf: '货运码头', Reef: '珊瑚遗迹', Grotto: '岩洞',
  Waterways: '水道', WastePool: '废水池', Sewer: '下水道', Marshes: '湿地',
  Estuary: '河口', Silo: '筒仓', Factory: '工厂', Foundry: '铸造厂',
  Laboratory: '实验室', LavaLake: '熔岩湖', Volcano: '火山', Caldera: '火山口',
  Summit: '山顶', Coves: '海湾', VaalPyramid: '瓦尔金字塔', VaalTemple: '瓦尔神殿'
})

function readableAreaId(areaId) {
  return String(areaId || '')
    .replace(/^(?:MapWorlds|Map|Area)/, '')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim() || '未知区域'
}

export function classifyArea(areaId) {
  const id = String(areaId || '').trim().replace(/^([12]) (\d+) (.+)$/, (_, part, act, rest) => `${part}_${act}_${rest.replace(/ /g, '_')}`)
  const compactId = id.replace(/\s+/g, '')
  const known = AREAS[id] || AREAS[compactId]
  if (known) return { version: AREA_CATALOG_VERSION, areaId: id, areaName: known.name, type: known.type, supported: true }
  if (/Hideout/i.test(compactId)) {
    const name = HIDEOUT_NAMES[compactId.replace(/Hideout/ig, '')]
    if (name) return { version: AREA_CATALOG_VERSION, areaId: id, areaName: name, type: 'hideout', supported: true }
  }
  const mapName = MAP_NAMES[id.replace(/^MapWorlds/, '')]
  if (mapName) return { version: AREA_CATALOG_VERSION, areaId: id, areaName: mapName, type: 'map', supported: true }
  const type = /^MapWorlds/i.test(id) ? 'map'
    : /(?:Hideout)/i.test(id) ? 'hideout'
      : /(?:Town|Lioneye|Encampment|Oriath|KaruiShores)/i.test(id) ? 'town'
        : /(?:Abyss|VaalSide|LabyrinthTrial)/i.test(id) ? 'side-area' : 'unknown'
  const areaName = type === 'hideout' ? '藏身处' : type === 'town' ? '城镇' : readableAreaId(id)
  return { version: AREA_CATALOG_VERSION, areaId: id, areaName, type, supported: type !== 'unknown' }
}

export { AREA_CATALOG_VERSION }
