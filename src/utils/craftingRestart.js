export async function restartCraftingWithLatestConfig({ presetStore, settingsStore, startCrafting }) {
  presetStore.loadPresets()
  settingsStore.loadSettings()
  return startCrafting()
}

export async function retryAutomationWithLatestConfig({
  mode,
  recovery = null,
  batchRecovery = null,
  usageSessionId = null,
  presetStore,
  settingsStore,
  startCrafting,
  startMapRolling
}) {
  presetStore.loadPresets()
  settingsStore.loadSettings()
  return mode === 'map'
    ? startMapRolling({ recovery, usageSessionId, continueCurrencyUsage: true, configurationGuideBypass: true })
    : startCrafting(batchRecovery ? {
        forceInitialCheck: true,
        usageSessionId: batchRecovery.usageSessionId || usageSessionId,
        continueCurrencyUsage: true,
        configurationGuideBypass: true,
        batchRecovery
      } : {
        forceInitialCheck: true,
        usageSessionId,
        continueCurrencyUsage: true,
        configurationGuideBypass: true,
        singleItemOnly: true
      })
}
