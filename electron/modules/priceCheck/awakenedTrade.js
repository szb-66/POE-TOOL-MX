/**
 * Query serialization adapted from Awakened PoE Trade.
 *
 * Source:
 * https://github.com/SnosMe/awakened-poe-trade/blob/18a401efce4683a274978e3f41ce08ac8948732b/renderer/src/web/price-check/trade/pathofexile-trade.ts
 *
 * Copyright (c) 2020 Alexander Drozdov
 * SPDX-License-Identifier: MIT
 *
 * Local adaptations are intentionally limited to plain JavaScript and the
 * smaller normalized item/filter model used by this application.
 */

function setProperty(object, path, value) {
  if (value === undefined) return
  const parts = path.split('.')
  let target = object
  for (const part of parts.slice(0, -1)) {
    target[part] ||= {}
    target = target[part]
  }
  target[parts.at(-1)] = value
}

function statToQuery(stat) {
  const displayMin = typeof stat.min === 'number' ? stat.min : undefined
  const displayMax = typeof stat.max === 'number' ? stat.max : undefined
  const negative = stat.valueMultiplier === -1
  return {
    id: stat.id,
    value: {
      min: negative && displayMax !== undefined ? -displayMax : (negative ? undefined : displayMin),
      max: negative && displayMin !== undefined ? -displayMin : (negative ? undefined : displayMax),
      option: stat.option
    },
    disabled: false
  }
}

export function createAwakenedTradeRequest(filters, stats, mercenarySkillGroups = []) {
  const body = {
    query: {
      status: {
        option: filters.trade.offline
          ? 'any'
          : (filters.trade.merchantOnly ? 'securable' : 'available')
      },
      stats: [
        { type: 'and', filters: [] }
      ],
      filters: {}
    },
    sort: {
      price: 'asc'
    }
  }
  const { query } = body
  if (filters.trade.currency) {
    setProperty(query.filters, 'trade_filters.filters.price.option', filters.trade.currency)
  }
  if (filters.trade.collapse) {
    setProperty(query.filters, 'trade_filters.filters.collapse.option', String(true))
  }
  if (filters.trade.listed) {
    setProperty(query.filters, 'trade_filters.filters.indexed.option', filters.trade.listed)
  }
  const identityToQuery = (value) => filters.discriminator
    ? { discriminator: filters.discriminator, option: value }
    : value
  if (filters.name) query.name = identityToQuery(filters.name)
  if (filters.baseType) query.type = identityToQuery(filters.baseType)
  if (filters.category) {
    setProperty(query.filters, 'type_filters.filters.category.option', filters.category)
  }

  if (filters.rarity) {
    setProperty(query.filters, 'type_filters.filters.rarity.option', filters.rarity)
  }
  for (const [key, value] of Object.entries(filters.stateFilters || {})) {
    if (value === 'any') continue
    setProperty(query.filters, `misc_filters.filters.${key}.option`, value)
  }
  const range = (path, value) => {
    if (!value) return
    setProperty(query.filters, `${path}.min`, value.min)
    setProperty(query.filters, `${path}.max`, value.max)
  }
  range('weapon_filters.filters.dps', filters.weapon?.dps)
  range('weapon_filters.filters.pdps', filters.weapon?.pdps)
  range('weapon_filters.filters.edps', filters.weapon?.edps)
  range('weapon_filters.filters.crit', filters.weapon?.crit)
  range('weapon_filters.filters.aps', filters.weapon?.aps)
  range('armour_filters.filters.ar', filters.armour?.armour)
  range('armour_filters.filters.ev', filters.armour?.evasion)
  range('armour_filters.filters.es', filters.armour?.energyShield)
  range('armour_filters.filters.base_defence_percentile', filters.armour?.baseDefencePercentile)
  range('armour_filters.filters.ward', filters.armour?.ward)
  range('armour_filters.filters.block', filters.armour?.block)
  range('misc_filters.filters.ilvl', filters.misc?.itemLevel)
  range('misc_filters.filters.quality', filters.misc?.quality)
  range('misc_filters.filters.gem_level', filters.misc?.gemLevel)
  range('misc_filters.filters.memory_level', filters.misc?.memoryLevel)
  range('socket_filters.filters.links', filters.socket?.links)
  range('map_filters.filters.map_tier', filters.map?.tier)
  range('map_filters.filters.map_iiq', filters.map?.iiq)
  range('map_filters.filters.map_iir', filters.map?.iir)
  range('map_filters.filters.map_packsize', filters.map?.packSize)
  range('map_filters.filters.area_level', filters.map?.areaLevel)
  range('map_filters.filters.chart_sulphur', filters.map?.sulphur)
  if (filters.map?.shape?.option) {
    setProperty(query.filters, 'map_filters.filters.chart_shape.option', String(filters.map.shape.option))
  }

  for (const stat of stats.filter((entry) => entry.enabled)) {
    const variants = Array.isArray(stat.queryVariants) ? stat.queryVariants : []
    if (variants.length > 1) {
      query.stats.push({
        type: 'count',
        value: { min: 1 },
        filters: variants.map((variant) => statToQuery({
          ...stat,
          id: variant.id,
          valueMultiplier: variant.valueMultiplier
        }))
      })
      continue
    }
    query.stats[0].filters.push(statToQuery(stat))
  }
  for (const group of mercenarySkillGroups) {
    if (!group?.enabled || !group.skill?.id) continue
    const ids = [
      group.skill.id,
      ...(group.supports || []).filter((support) => support.enabled).map((support) => support.id)
    ]
    query.stats.push({
      type: 'mercenary',
      value: { min: ids.length },
      filters: ids.map((id) => ({ id }))
    })
  }
  return body
}
