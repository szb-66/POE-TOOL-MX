import { FeedbackValidationError, MAX_ATTACHMENT_BYTES, MAX_TOTAL_BYTES, assertAttachmentSize } from './validation.js'

const MANIFEST_NAME = 'puzzle-recognition-evidence-manifest.json'

function imageItem(file) {
  return {
    name: file.fileName,
    safeName: file.fileName,
    mimeType: file.encoding === 'jpeg' ? 'image/jpeg' : 'image/png',
    size: file.body.length,
    body: file.body,
    diagnostic: true,
    systemKind: file.kind === 'crop' ? 'puzzle-evidence-crop' : 'puzzle-evidence-window',
    source: file
  }
}

function imageOrder(left, right) {
  return left.page - right.page || left.attempt - right.attempt || left.fileName.localeCompare(right.fileName)
}

function submissionManifest(manifest, selectedNames, capacityOmissions) {
  const omissions = [
    ...(manifest.omittedFiles || []),
    ...capacityOmissions.map(file => ({ attempt: file.attempt, page: file.page, kind: file.kind, fileName: file.fileName, reason: file.omissionReason }))
  ]
  const files = (manifest.files || []).map(file => ({
    ...file,
    submissionStatus: file.status === 'complete'
      ? selectedNames.has(file.fileName) ? 'included' : 'omitted'
      : 'unavailable',
    ...(!selectedNames.has(file.fileName) && file.status === 'complete'
      ? { submissionOmissionReason: capacityOmissions.find(item => item.fileName === file.fileName)?.omissionReason || 'NOT_SELECTED' }
      : {})
  }))
  return {
    ...manifest,
    completeness: {
      status: omissions.length || manifest.completeness?.status !== 'complete' ? 'partial' : 'complete',
      reasons: [...new Set([
        ...(manifest.completeness?.reasons || []),
        ...omissions.map(item => item.reason)
      ])].sort()
    },
    files,
    omittedFiles: omissions
  }
}

function manifestItem(manifest) {
  const body = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  assertAttachmentSize(body.length)
  return {
    name: MANIFEST_NAME,
    safeName: MANIFEST_NAME,
    mimeType: 'application/json',
    size: body.length,
    body,
    diagnostic: true,
    systemKind: 'puzzle-evidence-manifest'
  }
}

export function assemblePuzzleEvidenceAttachments({ diagnostics, evidence, manualBytes = 0 } = {}) {
  if (!diagnostics || !evidence?.manifest || !Array.isArray(evidence.files)) return diagnostics ? [diagnostics] : []
  assertAttachmentSize(diagnostics.size)
  const completeImages = evidence.files.filter(file => file?.status === 'complete').map(imageItem)
  const crops = completeImages.filter(item => item.source.kind === 'crop').sort((left, right) => imageOrder(left.source, right.source))
  const windows = completeImages.filter(item => item.source.kind === 'window').sort((left, right) => imageOrder(right.source, left.source))
  for (const crop of crops) {
    if (crop.size > MAX_ATTACHMENT_BYTES) {
      throw new FeedbackValidationError('FEEDBACK_ATTACHMENT_TOO_LARGE', '识别裁剪图超过单文件 10MB，请取消部分手动附件或重新复现')
    }
  }
  const budget = MAX_TOTAL_BYTES - Math.max(0, Number(manualBytes) || 0)
  const selected = [...crops]
  const selectedNames = new Set(crops.map(item => item.name))
  const capacityOmissions = windows.filter(item => item.size > MAX_ATTACHMENT_BYTES).map(item => ({ ...item.source, omissionReason: 'FILE_TOO_LARGE' }))
  const eligibleWindows = windows.filter(item => item.size <= MAX_ATTACHMENT_BYTES)

  const buildManifest = (additionalOmissions = []) => manifestItem(submissionManifest(
    evidence.manifest,
    selectedNames,
    [...capacityOmissions, ...additionalOmissions]
  ))
  let pendingWindows = [...eligibleWindows]
  let manifestAttachment = buildManifest(pendingWindows.map(item => ({ ...item.source, omissionReason: 'CAPACITY_LIMIT' })))
  const mandatoryBytes = diagnostics.size + selected.reduce((sum, item) => sum + item.size, 0) + manifestAttachment.size
  if (mandatoryBytes > budget) {
    throw new FeedbackValidationError('FEEDBACK_ATTACHMENT_TOTAL', '手动附件、诊断和全部识别裁剪图合计不能超过 30MB')
  }

  for (const window of eligibleWindows) {
    const remaining = pendingWindows.filter(item => item !== window)
    selectedNames.add(window.name)
    const candidateManifest = buildManifest(remaining.map(item => ({ ...item.source, omissionReason: 'CAPACITY_LIMIT' })))
    const candidateBytes = diagnostics.size + selected.reduce((sum, item) => sum + item.size, 0) + window.size + candidateManifest.size
    if (candidateBytes <= budget) {
      selected.push(window)
      pendingWindows = remaining
      manifestAttachment = candidateManifest
    } else {
      selectedNames.delete(window.name)
    }
  }
  manifestAttachment = buildManifest([
    ...pendingWindows.map(item => ({ ...item.source, omissionReason: 'CAPACITY_LIMIT' }))
  ])
  return [...selected, manifestAttachment, diagnostics]
}
