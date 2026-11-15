export const ATLAS_MAP_BANDS = Object.freeze(['Low', 'Mid', 'Top', 'Uber'])

// All four current map classes use the same crafting flow and capability.
const names = ['Maps', '地图', '地圖', '异界地图', '異界地圖']
export const ATLAS_MAP_CLASS_ALIASES = Object.freeze(Object.fromEntries(names.flatMap(name => [name,
  ...ATLAS_MAP_BANDS.flatMap(band => [`${name}(${band})`, `${name} (${band})`, `${name}（${band}）`, `${name} （${band}）`, ...(name === 'Maps' ? [`Maps ${band}`, `Maps${band}`] : [])])
]).map(name => [name, 'Maps'])))

const lookup = new Map(Object.entries(ATLAS_MAP_CLASS_ALIASES).map(([alias, canonical]) => [alias.toLowerCase(), canonical]))
export const canonicalAtlasMapClass = value => lookup.get(String(value || '').trim().toLowerCase()) || null
