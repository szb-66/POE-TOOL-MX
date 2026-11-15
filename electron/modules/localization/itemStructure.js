import { createHash } from 'node:crypto'

// String parameters occur only in these item metadata ClientStrings. They must
// never turn the ordinary numeric stat-template matcher into a free-text parser.
const fields = {
  ItemDisplayHeistContractLevel: ['Area Level','Area Level'],
  ItemDisplayHeistLockdownTimeIncrease: ['Time Before Lockdown','Time before Lockdown'],
  ItemDisplayHeistBlueprintWings: ['Wings Revealed','Wings Revealed'],
  ItemDisplayHeistBlueprintRewardRooms: ['Reward Rooms Revealed','Reward Rooms Revealed'],
  ItemDisplayHeistBlueprintEscapeRooms: ['Escape Routes Revealed','Escape Routes Revealed'],
  ItemDisplayHeistMaxReinforcements: ['Maximum Alive Reinforcements','Maximum Alive Reinforcements'],
  ItemDisplayHeistAlertLevelReduction: ['Alert Level Reduction','Alert Level Reduction'],
  ItemDisplayHeistClient: ['Client','Client']
}
const templates = {
  ItemDisplayHeistContractObjective: { en:'Heist Target: {0}', kinds:['text'], label:'Heist Target' },
  ItemDisplayHeistContractObjectiveWithValue: { en:'Heist Target: {0} ({1})', kinds:['text','text'], label:'Heist Target' },
  ItemDisplayHeistContractJob: { en:'Requires {1} (Level {0})', kinds:['number','text'] },
  ItemDisplayHeistJobRequirement: { en:'Level {0} in {1}', kinds:['number','text'], output:'Requires {1} (Level {0})' },
  ItemDisplayHeistContractNPC: { en:'Requires {0}', kinds:['text'] },
  ItemDisplayTinctureToxicity1Second: { en: 'Inflicts Mana Burn every {0} Second', kinds: ['decimal'], family: 'tincture', plural: { index: 0, singular: true } },
  ItemDisplayTinctureToxicityNSeconds: { en: 'Inflicts Mana Burn every {0} Seconds', kinds: ['decimal'], family: 'tincture', plural: { index: 0, singular: false } },
  ItemDisplayTinctureCooldown1Second: { en: '{0} Second Cooldown when Deactivated', kinds: ['decimal'], family: 'tincture', plural: { index: 0, singular: true } },
  ItemDisplayTinctureCooldownNSeconds: { en: '{0} Second Cooldown when Deactivated', kinds: ['decimal'], family: 'tincture', plural: { index: 0, singular: false } }
}
for (const [prefix, singular, plural, kinds, index] of [
  ['ItemDisplayFlaskLifeRecovery', 'Recovers {0} Life over {1} Second', 'Recovers {0} Life over {1} Seconds', ['decimal', 'decimal'], 1],
  ['ItemDisplayFlaskManaRecovery', 'Recovers {0} Mana over {1} Second', 'Recovers {0} Mana over {1} Seconds', ['decimal', 'decimal'], 1],
  ['ItemDisplayFlaskBuffDuration', 'Lasts {0} Second', 'Lasts {0} Seconds', ['decimal'], 0],
  ['ItemDisplayChargesConsumptionOnUse', 'Consumes {0} of {1} Charge on use', 'Consumes {0} of {1} Charges on use', ['decimal', 'decimal'], 1],
  ['ItemDisplayCharges', 'Currently has {0} Charge', 'Currently has {0} Charges', ['decimal'], 0],
  ['ItemDisplayChargesCurrentOfMax', 'Currently has {0} of {1} Charge', 'Currently has {0} of {1} Charges', ['decimal', 'decimal'], 1]
]) {
  const suffix = prefix.includes('CurrentOfMax') ? ['1', 'N'] : prefix.includes('Flask') ? ['1Second', 'NSeconds'] : ['1Charge', 'NCharges']
  for (const [position, en] of [singular, plural].entries()) templates[prefix + suffix[position]] = { en, kinds, family: 'flask', plural: { index, singular: position === 0 } }
}
const canonicalFields = new Set([...Object.values(fields).map(([,canonical])=>canonical),'Heist Target'])
const compact = text => String(text || '').replace(/\s+/g,' ').trim()
const key = text => compact(text).replace(/\s+/g,'').toLocaleLowerCase('en-US')
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')
const cjk = /[\u3400-\u9fff]/u

function expression(text,definition) {
  const parts=[],tokens=[]
  let cursor=0
  const literal = value => [...value].map(character=>/[：:]/.test(character)?'[：:]':/[（(]/.test(character)?'[（(]':/[）)]/.test(character)?'[）)]':/\s/.test(character)?'\\s*':escape(character)).join('')
  for (const match of text.matchAll(/\{(\d+)\}/g)) {
    const parameter=Number(match[1]), kind=definition.kinds[parameter]
    if (!kind || tokens.includes(parameter)) return null
    const numeric = kind === 'decimal' ? '(\\d+(?:\\.\\d+)?(?:\\s*[（(](?:augmented|增幅)[）)])?)'
      : '(\\d{1,3}(?:\\s*[（(](?:unmet|未满足|未滿足)[）)])?)'
    parts.push(literal(text.slice(cursor,match.index)),kind==='text'?'([^\\r\\n]{1,512}?)':numeric)
    tokens.push(parameter);cursor=match.index+match[0].length
  }
  if (tokens.length!==definition.kinds.length || /[{}]/.test(text.replace(/\{\d+\}/g,''))) return null
  parts.push(literal(text.slice(cursor)))
  return {expression:new RegExp(`^${parts.join('')}$`,'u'),tokens,definition,specificity:text.replace(/\{\d+\}/g,'').length}
}

export function createItemStructureResolver(entries,{visibleText,translate,failure}) {
  const aliases=new Map(), patterns=[]
  for (const definition of Object.values(templates).filter(definition => !definition.family || definition.family === 'heist')) patterns.push(expression(definition.en,definition))
  const addLabel=(alias,canonical)=>{
    const normalized=key(alias)
    if (!normalized) return
    if (!aliases.has(normalized)) aliases.set(normalized,new Map())
    aliases.get(normalized).set(canonical,compact(alias))
  }
  for (const canonical of canonicalFields) addLabel(canonical,canonical)
  for (const [id,definition] of Object.entries({...fields,...templates})) {
    const english=Array.isArray(definition)?definition[0]:definition.en
    const candidates=entries.filter(entry=>entry.kind==='dat' && /^clientstrings(?:\.datc?64)?$/i.test(entry.table) && entry.id===id && entry.field==='Text')
    if (candidates.length!==1 || candidates[0].en!==english || candidates[0].sourceHash!==createHash('sha256').update(english).digest('hex')) continue
    const source=candidates[0]
    for (const text of [source.en,source.cn,source.tw].filter(value=>typeof value==='string' && value.length<=2048).map(visibleText)) {
      if (Array.isArray(definition)) addLabel(text,definition[1])
      else {
        const pattern=expression(text,definition)
        if (pattern) {
          patterns.push(pattern)
          if (definition.label) {
            const prefix=text.slice(0,text.indexOf('{')).replace(/[：:]\s*$/,'').trim()
            if (prefix) addLabel(prefix,definition.label)
          }
        }
      }
    }
  }
  function translateText(value) {
    const raw=compact(value)
    let translated=translate(raw)
    if (cjk.test(translated)) {
      const quote=raw.match(/^(["'])(.*)\1$/u)
      if (quote) translated=quote[1]+translate(quote[2])+quote[1]
    }
    if (cjk.test(translated)) throw failure('LOCALIZATION_UNRESOLVED','物品结构中的名称未匹配当前汉化资源',[raw])
    return translated
  }
  return {
    canonicalFields:[...canonicalFields],
    isCanonical:value=>canonicalFields.has(value),
    aliasesFor(canonical) {
      return [...new Set([...aliases.values()].filter(values=>values.size===1 && values.has(canonical)).map(values=>values.get(canonical)))]
    },
    label(value) {
      const candidates=aliases.get(key(value))
      if (candidates?.size>1) throw failure('LOCALIZATION_AMBIGUOUS','物品结构标签存在多个候选',[value])
      return candidates?.keys().next().value || null
    },
    resolveLine(line, { family = 'heist' } = {}) {
      const matches=patterns.filter(pattern => (pattern.definition.family || 'heist') === family)
        .map(pattern=>({...pattern,match:pattern.expression.exec(line)})).filter(pattern=>pattern.match)
      if (!matches.length) return null
      const specificity=Math.max(...matches.map(pattern=>pattern.specificity)),results=new Set()
      for (const pattern of matches.filter(pattern=>pattern.specificity===specificity)) {
        const values=new Map(pattern.tokens.map((parameter,index)=>[parameter,pattern.definition.kinds[parameter]!=='text'?pattern.match[index+1].replace(/未满足|未滿足/g,'unmet').replace(/增幅/g,'augmented').replace(/（/g,'(').replace(/）/g,')'):translateText(pattern.match[index+1])]))
        const plural = pattern.definition.plural
        if (plural && (Number.parseFloat(values.get(plural.index)) === 1) !== plural.singular) continue
        results.add((pattern.definition.output || pattern.definition.en).replace(/\{(\d+)\}/g,(_,parameter)=>values.get(Number(parameter))))
      }
      if (!results.size) return null
      if (results.size!==1) throw failure('LOCALIZATION_AMBIGUOUS','物品结构文本存在多个候选',[line])
      return results.values().next().value
    }
  }
}
