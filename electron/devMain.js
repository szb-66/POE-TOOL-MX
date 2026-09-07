import { createDevelopmentStartupTrace } from '../shared/developmentStartupTrace.js'

const trace = createDevelopmentStartupTrace()
trace.record('electron-entry')
await trace.measure('main-import', () => import('./main.js'))
