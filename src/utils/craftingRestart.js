export async function restartCraftingWithLatestConfig({ presetStore, settingsStore, startCrafting }) {
  presetStore.loadPresets()
  settingsStore.loadSettings()
  return startCrafting()
}

export async function retryAutomationWithLatestConfig({
  mode,
  recovery = null,
  presetStore,
  settingsStore,
  startCrafting,
  startMapRolling
}) {
  presetStore.loadPresets()
  settingsStore.loadSettings()
  return mode === 'map'
    ? startMapRolling({ recovery })
    : startCrafting({ forceInitialCheck: true })
}
