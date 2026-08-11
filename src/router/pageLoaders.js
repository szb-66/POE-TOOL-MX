import { createPagePreloader } from './pagePreloader'

export const pageLoaders = Object.freeze({
  '/': () => import('../domains/dashboard/DashboardRouteView.vue'),
  '/items': () => import('../domains/items/ItemsView.vue'),
  '/bag': () => import('../domains/bag/BagView.vue'),
  ...(import.meta.env.DEV ? {
    '/highlight-model-training': () => import('../domains/bag/HighlightModelTrainingView.vue')
  } : {}),
  '/map': () => import('../domains/map/MapView.vue'),
  '/combat': () => import('../domains/combat/CombatView.vue'),
  '/story': () => import('../domains/story/StoryView.vue'),
  '/shop': () => import('../domains/shop/ShopView.vue'),
  '/craft-planner': () => import('../domains/crafting/CraftPlannerView.vue'),
  '/price-check': () => import('../domains/priceCheck/PriceCheckView.vue'),
  '/puzzle': () => import('../domains/puzzle/PuzzleView.vue'),
  '/tools': () => import('../domains/tools/ToolsView.vue'),
  '/settings': () => import('../domains/settings/SettingsView.vue'),
  '/help': () => import('../views/Help.vue')
})

export const preloadPage = createPagePreloader(pageLoaders)
