import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { reportStartupEvent } from './utils/startupReporter'
import 'element-plus/es/components/message/style/css'
import './styles/index.less'

let rendererMounted = false

window.addEventListener('error', (event) => {
  if (!rendererMounted) reportStartupEvent('renderer-error', event.error || event)
})

window.addEventListener('unhandledrejection', (event) => {
  if (!rendererMounted) reportStartupEvent('renderer-unhandled-rejection', event.reason || event)
})

const bootstrap = async () => {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)
  await router.isReady()
  app.mount('#app')
  reportStartupEvent('renderer-mounted')
  rendererMounted = true
}

void bootstrap().catch((error) => {
  reportStartupEvent('renderer-bootstrap-failed', error)
})

