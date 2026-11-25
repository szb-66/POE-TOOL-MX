// The CN client formats several API strings differently from the fixed data:
// reference markup ("配置 [block_notable_2934|稳若泰山]"), full-width support
// suffixes ("赋予（辅）" vs "赋予(辅)"), support references inside modifiers, and
// cluster-jewel small passives that keep an English payload after a Chinese
// prefix. These are display-format differences, retried as variants before a
// value is reported as unknown.
const REFERENCE = /\[[^[\]|]*\|([^[\]]*)\]/gu

export const stripClientReferences = value => typeof value === 'string' ? value.replace(REFERENCE, '$1') : value

export function withGemNameVariants(translate) {
  return name => {
    if (typeof name !== 'string') return undefined
    const direct = translate(name)
    if (direct) return direct
    const halfWidth = name.replaceAll('（', '(').replaceAll('）', ')')
    if (halfWidth !== name) {
      const result = translate(halfWidth)
      if (result) return result
    }
    const fullWidth = name.replaceAll('(', '（').replaceAll(')', '）')
    return fullWidth === name ? undefined : translate(fullWidth)
  }
}

// Some translated templates keep the client markup themselves, so the original
// text is always tried first and only an unmatched modifier is retried without it.
export function withReferenceFallback(translate) {
  return text => {
    const direct = translate(text)
    if (direct !== undefined) return direct
    if (typeof text !== 'string' || !text.includes('[') || !text.includes('|')) return undefined
    const stripped = stripClientReferences(text)
    return stripped === text ? undefined : translate(stripped)
  }
}

// Support references inside modifiers carry the localized gift suffix, while the
// reference table only stores the bare name ("法术图腾" rather than "法术图腾（辅）").
const GIFT_SUFFIX = /\s*[（(【](?:辅|强辅)】?[）)】]\s*$|\s*辅助$/u

export function withSupportNameVariants(translate) {
  return name => {
    if (typeof name !== 'string') return undefined
    const direct = translate(name)
    if (direct) return direct
    const cleaned = stripClientReferences(name)
    if (cleaned !== name) {
      const result = translate(cleaned)
      if (result) return result
    }
    const bare = cleaned.replace(GIFT_SUFFIX, '')
    return bare === cleaned ? undefined : translate(bare)
  }
}

// Cluster jewels show the small-passive bonus as a Chinese prefix followed by the
// untranslated English stat; PoB expects the English "Added Small Passive Skills
// grant:" prefix instead of the Chinese one.
const SMALL_PASSIVE = /^增加的小天赋获得：(.+)$/u

export function clientModFallback(text) {
  const match = typeof text === 'string' ? SMALL_PASSIVE.exec(text) : null
  return match && !/\p{Script=Han}/u.test(match[1]) ? `Added Small Passive Skills grant: ${match[1]}` : undefined
}
