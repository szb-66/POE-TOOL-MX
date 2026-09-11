import { load } from 'cheerio'
import { uniqueItemImageId } from '../electron/modules/priceCheck/uniqueItemSnapshot.js'

const cleanText = value => String(value || '').replace(/\s+/g, ' ').trim()
const identityKey = (name, baseType) => `${cleanText(name)}\u0000${cleanText(baseType)}`

export function parsePoedbUniqueItems(html) {
  const $ = load(String(html || ''))
  const records = []
  $('a.UniqueItem').each((_, anchor) => {
    const node = $(anchor)
    const name = cleanText(node.find('.uniqueName').first().text())
    const baseType = cleanText(node.find('.uniqueTypeLine').first().text())
    if (!name && !baseType) return
    const column = node.closest('.col')
    const imageUrl = cleanText(column.find('a.UniqueItems img, a.UniqueItem img').first().attr('src'))
    const modifierMatchers = []
    column.find('.explicitMod').each((_, modifierNode) => {
      const modifier = $(modifierNode)
      if (modifier.find('.item_description').length) return
      const normalized = modifier.clone()
      normalized.find('.mod-value').replaceWith('#')
      const matcher = cleanText(normalized.text())
      if (matcher && !modifierMatchers.includes(matcher)) modifierMatchers.push(matcher)
    })
    records.push({
      key: identityKey(name, baseType),
      name,
      baseType,
      modifierMatchers,
      imageId: imageUrl ? uniqueItemImageId(imageUrl) : '',
      imageUrl
    })
  })
  return records
}

