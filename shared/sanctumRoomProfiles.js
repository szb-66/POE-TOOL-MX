// Names checked against the matching cn/us Rooms rows, 2026-09-13.
// Simplified-client aliases additionally checked against test/fixtures/sanctum/
// ocr-{reward,purse,pact,fountain}.png: the titles list four floor equivalents.
// Community trap descriptions are presence evidence, never a complete inventory.
export const ROOM_PROFILE_SOURCES = Object.freeze([
  { label: '编年史房间目录', url: 'https://poedb.tw/cn/Sanctum_league#Rooms' },
  { label: '编年史英文目录', url: 'https://poedb.tw/us/Sanctum_league#Rooms' },
  { label: '编年史社区房型表', url: 'https://poedb.tw/cn/Sanctum_league#禁忌圣域' },
  { label: 'Exile-UI 房型速查', url: 'https://github.com/Lailloken/Exile-UI/blob/main/data/english/UI.txt' }
])

const floors = [
  [
    ['废弃图书馆', 'Abandoned Library', 'exit', ['ice-ring'], undefined, ['遗弃的图书馆']],
    ['圣殿编史', 'Templar Annals', 'arena', ['fire-trap']],
    ['铭文室', 'Chambers of Inscription', 'guards'],
    ['圣光试炼', 'Holy Trials', 'exit', ['lightning-floor'], 'trap'],
    ['墓影书坊', 'Scriptorium', 'miniboss', undefined, undefined, ['幕影书坊','破旧书库']],
    ['烛火礼拜堂', 'Candlelit Chapel', 'boss']
  ],
  [
    ['战地', 'Battleground', 'arena', ['fire-trap'], undefined, ['Battlegrounds']],
    ['老旧地窖', 'Decrepit Cellar', 'exit', ['ice-ring'], undefined, ['破旧的地窖']],
    ['弃坑', 'Derelict Caverns', 'guards', undefined, undefined, ['废弃的洞穴']],
    ['冒险', 'Gauntlet', 'exit', ['rolling-boulder'], 'trap'],
    ['圣物间', 'Reliquary', 'miniboss', undefined, undefined, ['圣物厅']],
    ['实验室', 'Experimentation Chamber', 'boss']
  ],
  [
    ['信奉厅堂', 'Halls of Worship', 'exit', ['ice-ring'], undefined, ['礼拜堂']],
    ['不洁巢穴', 'Unholy Lair', 'guards', undefined, undefined, ['邪恶巢穴']],
    ['炼狱', 'Infernum', 'arena', ['fire-trap']],
    ['酷刑', 'Crucible', 'exit', ['lightning-floor', 'fire-trap'], 'trap'],
    ['圣域战火', 'Sanctum Bellum', 'miniboss', undefined, undefined, ['禁域战场']],
    ['镜像幻厅', 'Hall of Mirrors', 'boss']
  ],
  [
    ['失落地下墓冢', 'Lost Catacombs', 'guards', undefined, undefined, ['失落的陵墓']],
    ['亵渎地窖', 'Desecrated Crypts', 'arena', ['fire-trap'], undefined, ['Desecrated Crypt']],
    ['教堂之窖', 'Undercroft', 'exit', ['ice-ring'], undefined, ['地下室']],
    // The source lists alternatives, not two guaranteed simultaneous traps.
    ['埋葬', 'Entombment', 'exit', ['lightning-or-boulder'], 'trap'],
    ['静缢陵墓', 'Mausoleum', 'miniboss', undefined, undefined, ['静谧陵墓','王陵']],
    ['极圣之所', 'Sanctum Sanctorum', 'boss']
  ]
]
export const SANCTUM_ROOM_PROFILES = Object.freeze(floors.flatMap((rows, floor) => rows.map(
  ([name, englishName, layout, traps, preference, aliases = []], index) => Object.freeze({
    id: `room-profile:${floor}:${index}`, floorId: `floor:${floor}`, name, englishName,
    aliases: Object.freeze([englishName, ...aliases]), layout,
    ...(traps ? { traps: Object.freeze(traps) } : {}), layoutPreferenceKey: preference || layout
  })
)))
export const trapLabels = Object.freeze({ 'ice-ring': '冰圈', 'lightning-floor': '电地板',
  'rolling-boulder': '滚球', 'fire-trap': '火焰陷阱', 'lightning-or-boulder': '电地板或滚球' })
export const normalizeRoomName = value => String(value).normalize('NFKC').replace(/[\s\p{P}]/gu, '').toLowerCase()
const matchesName = (entry, name) => [entry.name, ...entry.aliases].some(value => normalizeRoomName(value) === normalizeRoomName(name))
export const isRoomProfileTitle = text => String(text).split(/[、,，/／|]/u).every(name =>
  SANCTUM_ROOM_PROFILES.some(entry => matchesName(entry, name)))

export function recognizeRoomProfile(titles, floorId) {
  const nameCandidates = [...new Set(titles.flatMap(text => text.split(/[、,，/／|]/u)).map(x => x.trim()).filter(x => /\p{L}/u.test(x)))]
  const result = { nameCandidates }
  if (!nameCandidates.length) return result
  result.name = nameCandidates.join('、')
  // Real titles may list all four floor equivalents. Every candidate must be
  // verified and the current floor must be represented; use only common facts.
  const groups = nameCandidates.map(name => SANCTUM_ROOM_PROFILES.filter(entry => matchesName(entry, name)))
  if (groups.some(entries => !entries.length)) return result
  const entries = [...new Map(groups.flat().map(entry => [entry.id, entry])).values()]
  if (!entries.some(entry => entry.floorId === floorId)) return result
  if (entries.length === 1) result.name = entries[0].name
  for (const field of ['layout', 'traps', 'layoutPreferenceKey']) {
    const first = entries[0][field]
    if (first !== undefined && entries.every(entry => JSON.stringify(entry[field]) === JSON.stringify(first))) result[field] = structuredClone(first)
  }
  result.roomProfile = { version: 1, reviewedAt: '2026-09-13', entryIds: entries.map(entry => entry.id), sources: ROOM_PROFILE_SOURCES }
  return result
}

export function roomLayoutPreference(room, strategy) {
  if (!room.layout) return 0
  // A classified exit without a shared preference key is ambiguous (exit vs
  // gauntlet); do not silently give it the ordinary exit weight.
  if (room.knowledge?.layoutPreferenceKey && room.knowledge.layoutPreferenceKey !== 'known') return 0
  return Number.isFinite(strategy.layoutPreference?.[room.layoutPreferenceKey || room.layout])
    ? strategy.layoutPreference[room.layoutPreferenceKey || room.layout] : 0
}
