const list = (value) => Array.isArray(value) ? value : []

export function buildCraftingAffixPayload(itemInfo = {}) {
  return {
    displayName: itemInfo.displayName || itemInfo.name,
    displayBaseName: itemInfo.displayBaseName || itemInfo.baseName,
    displayExplicitMods: list(itemInfo.displayExplicitMods).length ? itemInfo.displayExplicitMods : list(itemInfo.explicitMods),
    displayImplicitMods: list(itemInfo.displayImplicitMods).length ? itemInfo.displayImplicitMods : list(itemInfo.implicitMods),
    explicitMods: list(itemInfo.explicitMods),
    implicitMods: list(itemInfo.implicitMods),
    detailedMods: list(itemInfo.detailedMods),
    modifiers: list(itemInfo.modifiers)
  }
}
