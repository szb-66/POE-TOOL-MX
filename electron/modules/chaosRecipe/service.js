import {
  calculateChaosRecipe,
  createPickingPlan,
  summarizeChaosItemPipeline
} from './engine.js'
import { enrichPlanCoordinates } from './coordinates.js'
import { CHAOS_ERROR_CODES, ChaosRecipeError } from './errors.js'

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

  async refresh({ league, selectedTabIds, includeIdentified = false }) {
    const results = await this.stashClient.fetchTabs(league, selectedTabIds)
    const items = results.flatMap((result) => result.items)
    const recipe = calculateChaosRecipe(items, { includeIdentified })
    const pipeline = summarizeChaosItemPipeline(items, { includeIdentified })
    this.latestRequest = { league, selectedTabIds: [...selectedTabIds], includeIdentified }
    this.snapshot = {
      fetchedAt: new Date().toISOString(),
      league,
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

  getSnapshot() {
    if (!this.snapshot) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '请先刷新仓库数据')
    }
    return this.snapshot
  }

  consumeItem(itemId) {
    if (!this.snapshot || !itemId) return
    const remaining = this.snapshot.candidates.filter((item) => item.id !== itemId)
    const recipe = calculateChaosRecipe(remaining, {
      includeIdentified: this.latestRequest?.includeIdentified
    })
    this.snapshot = {
      ...this.snapshot,
      ...recipe,
      locallyUpdatedAt: new Date().toISOString()
    }
    this.control?.sync?.()
  }

  createPlan(setCount, calibration) {
    const plan = createPickingPlan(this.getSnapshot(), setCount)
    if (!plan.setCount) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '没有可取出的完整混沌配方')
    }
    return enrichPlanCoordinates(plan, calibration)
  }
}
