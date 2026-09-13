import { DATA } from 'cn-poe-utils/data/poe'
import { DATA as POB_DATA } from 'cn-poe-utils/data/pob'
import compatibility from '../../assets/pob-export/compatibility.json' with { type: 'json' }

// Merge before constructing any translator or serializer indices. Base records
// include their unique associations; replacing that same identity avoids duplicates.
for (const [category, entries] of Object.entries(compatibility.data)) {
  const index = new Map(DATA[category].map((entry, i) => [`${entry.zh}\0${entry.en}`, i]))
  for (const entry of entries) {
    const i = index.get(`${entry.zh}\0${entry.en}`)
    if (i === undefined) DATA[category].push(entry)
    else DATA[category][i] = entry
  }
}
POB_DATA.tree.classes = compatibility.pob.classes
POB_DATA.tree.jewelSlots = compatibility.pob.jewelSlots
// Slot names and relic rarities follow PoB 2.67.2 Classes/ImportTab.lua.
Object.assign(POB_DATA.slotMap, { Ring3: 'Ring 3', BrequelGrafts: 'Graft 1', BrequelGrafts2: 'Graft 2' })
Object.assign(POB_DATA.rarityMap, { 9: 'RELIC', 10: 'RELIC' })

export const pobIdentities = compatibility.pob
