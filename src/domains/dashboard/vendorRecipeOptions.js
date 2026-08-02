import {
  VENDOR_RECIPE_CATALOG,
  VENDOR_RECIPE_IDS
} from '../../../electron/modules/chaosRecipe/engine.js'

export function vendorRecipeAvailableCount(snapshot, recipeId) {
  const definition = VENDOR_RECIPE_CATALOG[recipeId]
  if (!definition) return 0
  const recipe = snapshot?.recipes?.[recipeId] || (recipeId === 'chaos' ? snapshot : null)
  const rawCount = definition.kind === 'set' ? recipe?.fullSetCount : recipe?.candidateCount
  return Math.max(0, Number(rawCount) || 0)
}

export function buildVendorRecipeOptions(snapshot) {
  return VENDOR_RECIPE_IDS.map((id) => ({
    value: id,
    label: `${VENDOR_RECIPE_CATALOG[id].label}(${vendorRecipeAvailableCount(snapshot, id)})`
  }))
}
