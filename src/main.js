import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import 'element-plus/es/components/message/style/css'
import './styles/index.less'

let rendererMounted = false

function startupErrorMessage(value) {
  if (value == null || value === '') return ''
  if (value instanceof Error) return value.stack || value.message
  if (value?.reason instanceof Error) return value.reason.stack || value.reason.message
  return String(value?.message || value?.reason || value)
}

function reportStartupEvent(type, value = '') {
  try {
    window.electronAPI?.reportStartupEvent?.({ type, message: startupErrorMessage(value).slice(0, 1024) })
  } catch {
    // 启动诊断不可反向阻断页面挂载。
  }
}

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

