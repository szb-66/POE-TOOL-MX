export async function restartCraftingWithLatestConfig({ presetStore, settingsStore, startCrafting, craftingKind = null }) {
  presetStore.loadPresets()
  settingsStore.loadSettings()
  return startCrafting({ craftingKind: craftingKind || presetStore.itemCraftingKind || 'general' })
}

export async function retryAutomationWithLatestConfig({
  mode,
  recovery = null,
  batchRecovery = null,
  craftingKind = null,
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
        craftingKind: 'general',
        forceInitialCheck: true,
        usageSessionId: batchRecovery.usageSessionId || usageSessionId,
        continueCurrencyUsage: true,
        configurationGuideBypass: true,
        batchRecovery
      } : {
        craftingKind: craftingKind || presetStore.itemCraftingKind || 'general',
        forceInitialCheck: true,
        usageSessionId,
        continueCurrencyUsage: true,
        configurationGuideBypass: true,
        singleItemOnly: true
      })
}
