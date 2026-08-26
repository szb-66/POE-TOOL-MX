export async function restartCraftingWithLatestConfig({ presetStore, settingsStore, startCrafting }) {
  presetStore.loadPresets()
  settingsStore.loadSettings()
  return startCrafting()
}

export async function retryAutomationWithLatestConfig({
  mode,
  recovery = null,
  usageSessionId = null,
  presetStore,
  settingsStore,
  startCrafting,
  startMapRolling
}) {
  presetStore.loadPresets()
  settingsStore.loadSettings()
  return mode === 'map'
    ? startMapRolling({ recovery, usageSessionId, continueCurrencyUsage: true })
    : startCrafting({ forceInitialCheck: true, usageSessionId, continueCurrencyUsage: true })
}
