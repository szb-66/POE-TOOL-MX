import { ipcMain } from 'electron'
import { serializePobError } from '../pobExport/errors.js'

export function registerPobExportHandlers(service) {
  for (const [channel, method] of [['pob-export-list-characters', 'listCharacters'], ['pob-export-build', 'exportBuild']]) {
    ipcMain.handle(channel, async (_event, input) => {
      try { return { success: true, data: await service[method](input) } }
      catch (error) { return { success: false, error: serializePobError(error) } }
    })
  }
}
