import { runWithConfigurationGuide } from './configurationGuideStore.js'
import { configurationIssuesFromFailure } from './configurationFailures.js'

export function openConfigurationCorrectionGuide({
  moduleId,
  actionId,
  title = '重新配置自动化',
  actionLabel = '完成配置',
  collect,
  execute,
  failure
} = {}) {
  const issues = configurationIssuesFromFailure({ moduleId, actionId, ...failure })
  if (!issues.length) return { success: false, configurationRequired: false, ignored: true }
  return runWithConfigurationGuide({
    moduleId,
    actionId,
    title,
    actionLabel,
    focusIssueId: issues[0].id,
    forcedIssues: issues,
    collect,
    execute: typeof execute === 'function' ? execute : () => ({ success: true, retried: false })
  })
}
