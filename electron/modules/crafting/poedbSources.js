export const POEDB_BASE_PAGES = [
  ['Claws', '单手武器'], ['Daggers', '单手武器'], ['Rune_Daggers', '单手武器'], ['Wands', '单手武器'], ['One_Hand_Swords', '单手武器'],
  ['Thrusting_One_Hand_Swords', '单手武器'], ['One_Hand_Axes', '单手武器'], ['One_Hand_Maces', '单手武器'], ['Sceptres', '单手武器'],
  ['Bows', '双手武器'], ['Staves', '双手武器'], ['Warstaves', '双手武器'], ['Two_Hand_Swords', '双手武器'], ['Two_Hand_Axes', '双手武器'],
  ['Two_Hand_Maces', '双手武器'], ['Quivers', '副手'], ['Shields', '副手'], ['Gloves', '护甲'], ['Boots', '护甲'], ['Body_Armours', '护甲'],
  ['Helmets', '护甲'], ['Amulets', '首饰'], ['Rings', '首饰'], ['Belts', '首饰'], ['Jewels', '珠宝'], ['Abyss_Jewels', '珠宝']
]

export const SPECIAL_MODIFIER_PROFILES = [
  { page: 'Unset_Ring', sourceIds: ['Unset_Ring'], categoryPath: ['特殊', '潜能之戒'] },
  { page: 'Bone_Ring', sourceIds: ['Bone_Ring'], categoryPath: ['特殊', '骨环'] },
  { page: 'Convoking_Wand', sourceIds: ['Convening_Wand', 'Convoking_Wand'], categoryPath: ['特殊', '召集法杖'] },
  { page: 'Bone_Spirit_Shield', sourceIds: ['Bone_Spirit_Shield'], categoryPath: ['特殊', '骨制魔盾'] },
  { page: 'Runic_Crown', sourceIds: ['Runic_Crown'], categoryPath: ['特殊', '符文王冠'] },
  { page: 'Runic_Sabatons', sourceIds: ['Runic_Sabatons'], categoryPath: ['特殊', '符文战靴'] },
  { page: 'Runic_Gauntlets', sourceIds: ['Runic_Gauntlets'], categoryPath: ['特殊', '符文手甲'] }
]

const ARMOUR_VARIANTS = {
  Gloves: ['str', 'dex', 'int', 'str_dex', 'str_int', 'dex_int'],
  Boots: ['str', 'dex', 'int', 'str_dex', 'str_int', 'dex_int'],
  Body_Armours: ['str', 'dex', 'int', 'str_dex', 'str_int', 'dex_int', 'str_dex_int'],
  Helmets: ['str', 'dex', 'int', 'str_dex', 'str_int', 'dex_int'],
  Shields: ['str', 'dex', 'int', 'str_dex', 'str_int', 'dex_int']
}

const DIRECT_MODIFIER_PAGES = POEDB_BASE_PAGES.slice(0, 16).map(([page]) => page).concat(['Amulets', 'Rings', 'Belts'])
const JEWEL_MODIFIER_PAGES = [
  'Crimson_Jewel', 'Viridian_Jewel', 'Cobalt_Jewel', 'Prismatic_Jewel',
  'Murderous_Eye_Jewel', 'Searching_Eye_Jewel', 'Hypnotic_Eye_Jewel', 'Ghastly_Eye_Jewel',
  'Large_Cluster_Jewel', 'Medium_Cluster_Jewel', 'Small_Cluster_Jewel'
]

export const FLASK_MODIFIER_PAGES = [
  'Life_Flasks', 'Mana_Flasks', 'Hybrid_Flasks', 'Utility_Flasks'
]

export const POEDB_MODIFIER_PAGES = [
  ...DIRECT_MODIFIER_PAGES,
  ...Object.entries(ARMOUR_VARIANTS).flatMap(([page, variants]) => variants.map((variant) => `${page}_${variant}`)),
  ...JEWEL_MODIFIER_PAGES,
  ...FLASK_MODIFIER_PAGES,
  ...SPECIAL_MODIFIER_PROFILES.map((profile) => profile.page)
]
