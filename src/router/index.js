import { createRouter, createWebHashHistory } from 'vue-router'
import { pageLoaders } from './pageLoaders'
import { routeTransition } from './transitionState'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: pageLoaders['/']
  },
  {
    path: '/items',
    name: 'Items',
    component: pageLoaders['/items']
  },
  {
    path: '/bag',
    name: 'Bag',
    component: pageLoaders['/bag']
  },
  {
    path: '/map',
    name: 'Map',
    component: pageLoaders['/map']
  },
  {
    path: '/combat',
    name: 'Combat',
    component: pageLoaders['/combat']
  },
  {
    path: '/story',
    name: 'Story',
    component: pageLoaders['/story']
  },
  {
    path: '/shop',
    name: 'Shop',
    component: pageLoaders['/shop']
  },
  {
    path: '/craft-planner',
    name: 'CraftPlanner',
    component: pageLoaders['/craft-planner']
  },
  {
    path: '/price-check',
    name: 'PriceCheck',
    component: pageLoaders['/price-check']
  },
  {
    path: '/puzzle',
    name: 'Puzzle',
    component: pageLoaders['/puzzle']
  },
  {
    path: '/tools',
    name: 'Tools',
    component: pageLoaders['/tools']
  },
  {
    path: '/puzzle-overlay',
    name: 'PuzzleOverlay',
    component: () => import('../domains/puzzle/PuzzleOverlayView.vue'),
    meta: { noLayout: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: pageLoaders['/settings']
  },
  {
    path: '/help',
    name: 'Help',
    component: pageLoaders['/help']
  },
  {
    path: '/overlay',
    name: 'Overlay',
    component: () => import('../domains/overlay/OverlayView.vue'),
    meta: {
      noLayout: true
    }
  },
  {
    path: '/debug-overlay',
    name: 'DebugOverlay',
    component: () => import('../domains/overlay/DebugOverlay.vue'),
    meta: {
      noLayout: true
    }
  },
  {
    path: '/story-overlay',
    name: 'StoryOverlay',
    component: () => import('../domains/story/StoryOverlayView.vue'),
    meta: {
      noLayout: true
    }
  },
  {
    path: '/bag-stash-overlay',
    name: 'BagStashOverlay',
    component: () => import('../domains/bag/BagStashOverlayView.vue'),
    meta: {
      noLayout: true
    }
  },
  {
    path: '/chaos-recipe-overlay',
    name: 'ChaosRecipeOverlay',
    component: () => import('../domains/shop/ChaosRecipeOverlayView.vue'),
    meta: {
      noLayout: true
    }
  },
  {
    path: '/chaos-recipe-control-overlay',
    name: 'ChaosRecipeControlOverlay',
    component: () => import('../domains/shop/ChaosRecipeControlOverlayView.vue'),
    meta: {
      noLayout: true
    }
  },
  {
    path: '/coordinate-picker',
    name: 'CoordinatePicker',
    component: () => import('../domains/settings/CoordinatePickerView.vue'),
    meta: {
      noLayout: true
    }
  },
  {
    path: '/price-check-overlay',
    name: 'PriceCheckOverlay',
    component: () => import('../domains/priceCheck/PriceCheckOverlayView.vue'),
    meta: {
      noLayout: true
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const navigationTokens = new WeakMap()

router.beforeEach((to, from) => {
  if (to.meta.noLayout || to.fullPath === from.fullPath) return true
  navigationTokens.set(to, routeTransition.start())
  return true
})

function finishNavigation(to) {
  const token = navigationTokens.get(to)
  if (token !== undefined) routeTransition.finish(token)
}

router.afterEach((to) => finishNavigation(to))
router.onError((_error, to) => finishNavigation(to))

export default router
