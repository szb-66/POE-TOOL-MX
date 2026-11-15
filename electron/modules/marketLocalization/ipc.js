export function registerMarketLocalizationHandlers(service, getMainWindow, ipcMain) {
  const operations = { status: () => service.getStatus(), enable: () => service.enable(), disable: () => service.disable() }
  for (const [name, operation] of Object.entries(operations)) {
    ipcMain.handle(`localization:market-${name}`, async event => {
      const owner = getMainWindow()
      if (!owner || owner.isDestroyed() || event.sender !== owner.webContents || event.senderFrame !== owner.webContents.mainFrame)
        return { success: false, error: { code: 'LOCALIZATION_OWNER_REQUIRED', message: '仅允许主窗口操作市集翻译' } }
      try { service.requireInternational(); return { success: true, data: await operation() } }
      catch (error) { return { success: false, error: { code: error.code || 'MARKET_UNAVAILABLE', message: error.message } } }
    })
  }
  service.on('state', state => {
    const owner = getMainWindow()
    try {
      if (owner && !owner.isDestroyed() && !owner.webContents.isDestroyed?.()) owner.webContents.send('localization:market-state-changed', state)
    } catch { /* Closing a window cannot prevent native passthrough cleanup. */ }
  })
}
