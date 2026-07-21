import { clipboard, ipcMain } from 'electron'
import { writeClipboardText } from '../clipboardWriter.js'

export function registerClipboardHandlers() {
  ipcMain.handle('clipboard-write-text', (_event, text) => writeClipboardText(text, clipboard))
}
