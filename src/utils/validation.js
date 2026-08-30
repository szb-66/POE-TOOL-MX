/**
 * Purpose: 自动化启动配置兼容校验。
 * Inputs: 制作或地图运行配置。
 * Outputs: { isValid, ok, errors, issues }，旧调用可继续读取 isValid/errors。
 * Safety: 所有问题均在脚本生成和键鼠输入前返回。
 */
import {
  collectCraftingConfigurationIssues,
  collectMapConfigurationIssues
} from '../domains/configurationGuide/configurationIssues.js'
import { getActiveMapRollingConfig } from './mapPresetMigration.js'

export const validateCraftingConfig = (config = {}) => collectCraftingConfigurationIssues({
  itemPosition: config.itemPosition,
  currencyPositions: config.currencyPositions,
  preset: config.preset,
  stashTabSelection: config.stashTabSelection
})

export const validateMapRollingConfig = (config = {}) => collectMapConfigurationIssues({
  inventory: config.inventory,
  currencyPositions: config.currencyPositions,
  mapConfig: config.mapConfig ? getActiveMapRollingConfig(config.mapConfig) : null,
  stashTabSelection: config.stashTabSelection
})
