import { reportStartupEvent } from '../utils/startupReporter.js'

// Let Chromium paint the themed startup placeholder while Vite loads the UI graph.
void import('../main.js').catch(error => {
  window.__bootstrapError = String(error?.message || error)
  reportStartupEvent('renderer-bootstrap-failed', error)
})
