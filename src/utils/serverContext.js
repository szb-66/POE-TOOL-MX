import { serverContext } from '../../shared/serverMode.js'
export const currentServer = globalThis.window?.electronAPI?.serverContext || serverContext()
export const canUseGameInput = feature => currentServer.id === 'cn' || currentServer.capabilities?.[feature]?.gameInputAvailable === true
