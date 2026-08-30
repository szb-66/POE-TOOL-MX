import { runWithConfigurationGuide } from './configurationGuideStore.js'
import { configurationIssueFromFailure } from './configurationFailures.js'

export function openConfigurationCorrectionGuide({
  moduleId,
  actionId,
  title = '重新配置自动化',
  collect,
  failure
} = {}) {
  const issue = configurationIssueFromFailure({ moduleId, actionId, ...failure })
  if (!issue) return { success: false, configurationRequired: false, ignored: true }
  return runWithConfigurationGuide({
    moduleId,
    actionId,
    title,
    actionLabel: '完成配置',
    focusIssueId: issue.id,
    forcedIssues: [issue],
    collect,
    execute: () => ({ success: true, retried: false })
  })
}
