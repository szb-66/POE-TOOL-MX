export const pageLoaders = Object.freeze({
  '/': () => import('../domains/dashboard/DashboardView.vue'),
  '/items': () => import('../domains/items/ItemsView.vue'),
  '/bag': () => import('../domains/bag/BagView.vue'),
  '/map': () => import('../domains/map/MapView.vue'),
  '/combat': () => import('../domains/combat/CombatView.vue'),
  '/story': () => import('../domains/story/StoryView.vue'),
  '/shop': () => import('../domains/shop/ShopView.vue'),
  '/craft-planner': () => import('../domains/crafting/CraftPlannerView.vue'),
  '/price-check': () => import('../domains/priceCheck/PriceCheckView.vue'),
  '/puzzle': () => import('../domains/puzzle/PuzzleView.vue'),
  '/settings': () => import('../domains/settings/SettingsView.vue'),
  '/help': () => import('../views/Help.vue')
})

export function createPagePreloader(loaders = pageLoaders) {
  const preloadResults = new Map()

  return function preloadPage(path) {
    const loader = loaders[path]
    if (!loader) return Promise.resolve(false)

    if (!preloadResults.has(path)) {
      const result = Promise.resolve()
        .then(loader)
        .then(() => true)
        .catch(() => {
          preloadResults.delete(path)
          return false
        })
      preloadResults.set(path, result)
    }

    return preloadResults.get(path)
  }
}

export const preloadPage = createPagePreloader()
