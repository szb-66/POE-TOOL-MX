import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/items'
  },
  {
    path: '/items',
    name: 'Items',
    component: () => import('../domains/items/ItemsView.vue')
  },
  {
    path: '/bag',
    name: 'Bag',
    component: () => import('../domains/bag/BagView.vue')
  },
  {
    path: '/map',
    name: 'Map',
    component: () => import('../domains/map/MapView.vue')
  },
  {
    path: '/combat',
    name: 'Combat',
    component: () => import('../domains/combat/CombatView.vue')
  },
  {
    path: '/story',
    name: 'Story',
    component: () => import('../domains/story/StoryView.vue')
  },
  {
    path: '/shop',
    name: 'Shop',
    component: () => import('../domains/shop/ShopView.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../domains/settings/SettingsView.vue')
  },
  {
    path: '/help',
    name: 'Help',
    component: () => import('../views/Help.vue')
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
    path: '/coordinate-picker',
    name: 'CoordinatePicker',
    component: () => import('../domains/settings/CoordinatePickerView.vue'),
    meta: {
      noLayout: true
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
