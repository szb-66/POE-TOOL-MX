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
  return {
    id: stat.id,
    value: {
      min: typeof stat.min === 'number' ? stat.min : undefined,
      max: typeof stat.max === 'number' ? stat.max : undefined,
      option: stat.option
    },
    disabled: false
  }
}

export function createAwakenedTradeRequest(filters, stats) {
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
  if (filters.name) query.name = filters.name
  if (filters.baseType) query.type = filters.baseType

  if (filters.rarity) {
    setProperty(query.filters, 'type_filters.filters.rarity.option', filters.rarity)
  }
  if (filters.corrupted != null) {
    setProperty(query.filters, 'misc_filters.filters.corrupted.option', String(filters.corrupted))
  }
  if (filters.unidentified != null) {
    setProperty(query.filters, 'misc_filters.filters.identified.option', String(!filters.unidentified))
  }
  if (filters.mirrored != null) {
    setProperty(query.filters, 'misc_filters.filters.mirrored.option', String(filters.mirrored))
  }
  if (filters.split != null) {
    setProperty(query.filters, 'misc_filters.filters.split.option', String(filters.split))
  }
  if (filters.fractured != null) {
    setProperty(query.filters, 'misc_filters.filters.fractured_item.option', String(filters.fractured))
  }
  if (filters.gemLevel != null) {
    setProperty(query.filters, 'misc_filters.filters.gem_level.min', filters.gemLevel)
  }
  if (filters.quality != null) {
    setProperty(query.filters, 'misc_filters.filters.quality.min', filters.quality)
  }
  if (filters.itemLevel != null) {
    setProperty(query.filters, 'misc_filters.filters.ilvl.min', filters.itemLevel)
    setProperty(query.filters, 'misc_filters.filters.ilvl.max', filters.itemLevelMax)
  }
  if (filters.linkedSockets != null) {
    setProperty(query.filters, 'socket_filters.filters.links.min', filters.linkedSockets)
  }
  if (filters.mapTier != null) {
    setProperty(query.filters, 'map_filters.filters.map_tier.min', filters.mapTier)
    setProperty(query.filters, 'map_filters.filters.map_tier.max', filters.mapTier)
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
  range('socket_filters.filters.links', filters.socket?.links)
  range('map_filters.filters.map_tier', filters.map?.tier)

  query.stats[0].filters.push(...stats.filter((stat) => stat.enabled).map(statToQuery))
  return body
}
