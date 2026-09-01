const list = (value) => Array.isArray(value) ? value : []

export function buildCraftingAffixPayload(itemInfo = {}) {
  return {
    explicitMods: list(itemInfo.explicitMods),
    implicitMods: list(itemInfo.implicitMods),
    detailedMods: list(itemInfo.detailedMods),
    modifiers: list(itemInfo.modifiers)
  }
}
