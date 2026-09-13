import { DATA } from 'cn-poe-utils/data/poe'
import compatibility from '../../assets/pob-export/compatibility.json' with { type: 'json' }

// Reuse upstream's translator and template engine with current game-text data.
// Keep the pinned baseline first, so its disambiguations continue to take priority.
DATA.gemSkills.push(...compatibility.skills)
DATA.stats.push(...compatibility.stats)
DATA.properties.push({ zh: '[Intangibility|虚化]', en: 'Intangibility' })

// Current CN API wording differs from the corresponding PoeCharm display text.
// Keep the source template's signed resistance value (e.g. -12) unchanged.
DATA.stats.push(
  { zh: '击中时施加冰霜曝露，使冰霜抗性降低 {0}%', en: 'Inflict Cold Exposure on Hit, applying {0}% to Cold Resistance' },
  { zh: '获得范围内所有未配置小天赋的全部加成', en: 'Grants all bonuses of Unallocated Small Passive Skills in Radius' }
)

// PoeCharm's display template repeats {0} for two different reference types.
// cn-poe-utils requires distinct indices plus the existing support-name resolver.
DATA.stats.push({
  zh: '你头盔中镶嵌的技能由 {0} 级的{1}辅助',
  en: 'Skills Socketed in your Helmet are Supported by level {0} {1}',
  refs: { 1: 'display_indexable_support' }
})
