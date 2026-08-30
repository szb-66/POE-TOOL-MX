import { dialog, ipcMain } from 'electron'
import {
  openConfigTransferFile,
  saveConfigTransferFile
} from '../configTransfer/fileService.js'

export function registerConfigTransferHandlers({ getMainWindow } = {}) {
  ipcMain.handle('config-transfer:open', event => openConfigTransferFile({
    event,
    getMainWindow,
    showOpenDialog: (owner, options) => dialog.showOpenDialog(owner, options)
  }))
  ipcMain.handle('config-transfer:save', (event, payload) => saveConfigTransferFile({
    event,
    getMainWindow,
    payload,
    showSaveDialog: (owner, options) => dialog.showSaveDialog(owner, options)
  }))
}
