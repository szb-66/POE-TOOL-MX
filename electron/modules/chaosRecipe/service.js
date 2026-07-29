import {
  calculateVendorRecipes,
  createPickingPlan,
  summarizeChaosItemPipeline
} from './engine.js'
import { enrichPlanCoordinates } from './coordinates.js'
import { CHAOS_ERROR_CODES, ChaosRecipeError } from './errors.js'

export function applyManualFolderState(tab, inFolder = false) {
  if (!tab) return tab
  return {
    ...tab,
    parent: '',
    folder: '',
    inFolder: Boolean(inFolder)
  }
}

export class ChaosRecipeService {
  constructor({ auth, stashClient, automation = null, overlay = null }) {
    this.auth = auth
    this.stashClient = stashClient
    this.automation = automation
    this.overlay = overlay
    this.snapshot = null
    this.latestRequest = null
  }

  clear() {
    this.snapshot = null
    this.latestRequest = null
    this.stashClient.clearCache()
    this.overlay?.close?.()
    this.control?.sync?.()
  }

  getAuthStatus() { return this.auth.getStatus() }
  async restoreAuth() { const result = await this.auth.restore(); this.control?.sync?.(); return result }
  openWebLogin() { return this.auth.openWebLogin() }
  async completeWebLogin() { const result = await this.auth.completeWebLogin(); this.control?.sync?.(); return result }
  async setSessionToken(token) { const result = await this.auth.setSessionToken(token); this.control?.sync?.(); return result }
  async logout() { this.clear(); const result = await this.auth.logout(); this.control?.sync?.(); return result }
  async expireSession() { this.clear(); const result = await this.auth.logout(); this.control?.sync?.(); return result }
  listLeagues() { return this.stashClient.listLeagues() }
  listTabs(league) { return this.stashClient.listTabs(league) }

  applyFolderStates(results, folderStates = {}) {
    return results.map((result) => {
      const tab = applyManualFolderState(result.tab, folderStates[result.tab.id])
      return {
        ...result,
        tab,
        items: result.items.map((item) => ({
          ...item,
          tabName: tab.name,
          inFolder: tab.inFolder
        }))
      }
    })
  }

  setSnapshot({ league, results, availableTabs, includeIdentified, source = 'network' }) {
    const items = results.flatMap((result) => result.items)
    const recipe = calculateVendorRecipes(items, { includeIdentified })
    const pipeline = summarizeChaosItemPipeline(items, { includeIdentified })
    const selectedTabIds = results.map((result) => result.tab.id)
    this.latestRequest = { league, selectedTabIds, includeIdentified }
    this.snapshot = {
      fetchedAt: new Date().toISOString(),
      league,
      source,
      availableTabs,
      tabs: results.map((result) => result.tab),
      diagnostics: {
        sourceArrayItemCount: results.reduce(
          (sum, result) => sum + Number(result.diagnostics?.sourceArrayLength || 0),
          0
        ),
        ...pipeline,
        tabs: results.map((result) => ({
          tabId: result.tab.id,
          tabName: result.tab.name,
          ...result.diagnostics
        }))
      },
      ...recipe
    }
    this.control?.sync?.()
    return this.snapshot
  }

  async refresh({ league, selectedTabIds, includeIdentified = false, tabFolderStates = {} }) {
    const rawResults = await this.stashClient.fetchTabs(league, selectedTabIds)
    const results = this.applyFolderStates(rawResults, tabFolderStates)
    const availableTabs = this.stashClient.getTabsSnapshot(league)
      .map((tab) => applyManualFolderState(tab, tabFolderStates[tab.id]))
    return this.setSnapshot({ league, results, availableTabs, includeIdentified })
  }

  getSnapshot() {
    if (!this.snapshot) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '请先刷新仓库数据')
    }
    return this.snapshot
  }

  consumeItem(itemId) {
    if (!this.snapshot || !itemId) return
    const remaining = this.snapshot.items.filter((item) => item.id !== itemId)
    const recipe = calculateVendorRecipes(remaining, {
      includeIdentified: this.latestRequest?.includeIdentified
    })
    this.snapshot = {
      ...this.snapshot,
      ...recipe,
      locallyUpdatedAt: new Date().toISOString()
    }
    this.control?.sync?.()
  }

  createPlan(request = 1, legacyCalibration) {
    const normalized = typeof request === 'number'
      ? { recipeId: 'chaos', setCount: request, calibration: legacyCalibration }
      : { recipeId: 'chaos', ...(request || {}) }
    const plan = createPickingPlan(this.getSnapshot(), normalized)
    if (!plan.itemCount) {
      throw new ChaosRecipeError(
        CHAOS_ERROR_CODES.INVALID_REQUEST,
        plan.kind === 'single' ? `没有选中可取出的${plan.recipeLabel}物品` : `没有可取出的${plan.recipeLabel}完整套装`
      )
    }
    return enrichPlanCoordinates(plan, normalized.calibration)
  }
}
