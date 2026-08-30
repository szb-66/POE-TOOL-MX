import {
  CONFIG_SECTION_DEFINITION_MAP,
  ConfigTransferError,
  cloneTransferValue,
  toConfigTransferError
} from './core.js'

function stageError(error, stage, fallbackCode) {
  const normalized = toConfigTransferError(error, fallbackCode)
  normalized.details = { ...normalized.details, stage }
  return normalized
}

export function createImportPreview({ parsed, sectionOptions = {}, descriptors }) {
  if (!parsed?.bundle?.sections || !(descriptors instanceof Map)) {
    throw new ConfigTransferError('PREVIEW_INPUT_INVALID', '导入预览输入无效')
  }
  const compatible = new Set(parsed.compatibleSectionIds || [])
  const requested = Array.isArray(sectionOptions.selectedSectionIds)
    ? sectionOptions.selectedSectionIds
    : parsed.defaultSelectedSectionIds || []
  const selected = [...new Set(requested)]
  const plans = []
  const warnings = []
  for (const sectionId of selected) {
    if (!compatible.has(sectionId)) {
      throw new ConfigTransferError('SECTION_NOT_SELECTABLE', `配置区块不可导入：${sectionId}`, { sectionId })
    }
    const descriptor = descriptors.get(sectionId)
    if (!descriptor || typeof descriptor.planImport !== 'function') {
      throw new ConfigTransferError('SECTION_DESCRIPTOR_MISSING', `配置区块暂不可导入：${sectionId}`, { sectionId })
    }
    const options = sectionOptions.bySection?.[sectionId] || {}
    const plan = descriptor.planImport(parsed.bundle.sections[sectionId].data, options)
    plans.push({
      ...plan,
      id: sectionId,
      descriptor,
      definition: CONFIG_SECTION_DEFINITION_MAP[sectionId]
    })
    if (Array.isArray(plan.warnings)) warnings.push(...plan.warnings.map(message => ({ sectionId, message })))
  }
  return {
    source: {
      appVersion: String(parsed.bundle.appVersion || ''),
      exportedAt: String(parsed.bundle.exportedAt || ''),
      formatVersion: Number(parsed.bundle.formatVersion)
    },
    plans,
    selectedSectionIds: plans.map(plan => plan.id),
    presetCount: plans
      .filter(plan => plan.definition?.group === 'preset')
      .reduce((sum, plan) => sum + Number(plan.summary?.added || 0), 0),
    conflicts: plans.reduce((sum, plan) => sum + Number(plan.summary?.conflicts || 0), 0),
    warnings
  }
}

export function createConfigImportRunner({ stateController = null } = {}) {
  let running = false

  async function execute(preview, { onProgress = () => {} } = {}) {
    if (running) throw new ConfigTransferError('IMPORT_BUSY', '已有配置导入任务正在执行')
    running = true
    const snapshots = new Map()
    const touched = []
    let globalSnapshot = null
    try {
      const plans = Array.isArray(preview?.plans) ? preview.plans : []
      if (!plans.length) throw new ConfigTransferError('NO_SECTIONS_SELECTED', '请至少选择一个配置区块')

      onProgress({ stage: 'validate', completed: 0, total: plans.length })
      for (let index = 0; index < plans.length; index += 1) {
        const plan = plans[index]
        try {
          await plan.descriptor.validate?.(plan)
          snapshots.set(plan.id, cloneTransferValue(await plan.descriptor.snapshot(plan)))
        } catch (error) {
          throw stageError(error, 'validate', 'IMPORT_PREVALIDATION_FAILED')
        }
        onProgress({ stage: 'validate', completed: index + 1, total: plans.length, sectionId: plan.id })
      }
      if (stateController?.snapshot) {
        try {
          globalSnapshot = cloneTransferValue(await stateController.snapshot())
        } catch (error) {
          throw stageError(error, 'validate', 'IMPORT_PREVALIDATION_FAILED')
        }
      }

      onProgress({ stage: 'persist', completed: 0, total: plans.length })
      for (let index = 0; index < plans.length; index += 1) {
        const plan = plans[index]
        touched.push(plan)
        try {
          await plan.descriptor.persist(plan, snapshots.get(plan.id))
        } catch (error) {
          throw stageError(error, 'persist', 'IMPORT_PERSIST_FAILED')
        }
        onProgress({ stage: 'persist', completed: index + 1, total: plans.length, sectionId: plan.id })
      }

      return {
        success: true,
        sections: plans.map(plan => ({
          id: plan.id,
          added: Number(plan.summary?.added || 0),
          skipped: Number(plan.summary?.skipped || 0),
          conflicts: Number(plan.summary?.conflicts || 0)
        }))
      }
    } catch (error) {
      const original = toConfigTransferError(error, 'IMPORT_FAILED')
      const rollbackErrors = []
      onProgress({ stage: 'rollback', completed: 0, total: touched.length })
      for (let index = touched.length - 1; index >= 0; index -= 1) {
        const plan = touched[index]
        try {
          await plan.descriptor.rollback?.(snapshots.get(plan.id), plan)
        } catch (rollbackError) {
          rollbackErrors.push({ sectionId: plan.id, message: rollbackError?.message || String(rollbackError) })
        }
        onProgress({ stage: 'rollback', completed: touched.length - index, total: touched.length, sectionId: plan.id })
      }
      if (touched.length && stateController?.rollback) {
        try {
          await stateController.rollback(globalSnapshot)
        } catch (rollbackError) {
          rollbackErrors.push({ sectionId: 'state.localStorage', message: rollbackError?.message || String(rollbackError) })
        }
      }
      if (rollbackErrors.length) {
        throw new ConfigTransferError('IMPORT_ROLLBACK_INCOMPLETE', '导入失败且配置回滚不完整，请重启应用后检查本地预设与工具站点', {
          causeCode: original.code,
          rollbackErrors
        })
      }
      throw original
    } finally {
      running = false
    }
  }

  return {
    execute,
    get busy() { return running }
  }
}
