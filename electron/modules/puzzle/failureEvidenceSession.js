export function splitPuzzleFailureEvidence(result) {
  if (!result || typeof result !== 'object') return { publicResult: result, evidence: null }
  const { _failureEvidence: evidence = null, ...publicResult } = result
  return { publicResult, evidence }
}

export function mergePuzzleFailureEvidence(workspace, parts) {
  const evidenceParts = parts.filter(Boolean)
  if (!workspace || !evidenceParts.length) return null
  const reasons = [...new Set(evidenceParts.flatMap(item => item.completeness?.reasons || []).filter(Boolean))].sort()
  return {
    schemaVersion: 1,
    evidenceId: workspace.evidenceId,
    occurredAt: evidenceParts.map(item => item.occurredAt).filter(Boolean).sort()[0] || new Date().toISOString(),
    completeness: { status: reasons.length || evidenceParts.some(item => item.completeness?.status !== 'complete') ? 'partial' : 'complete', reasons },
    attempts: evidenceParts.flatMap(item => item.attempts || []),
    files: evidenceParts.flatMap(item => item.files || []),
    omittedFiles: evidenceParts.flatMap(item => item.omittedFiles || [])
  }
}

export class PuzzleFailureEvidenceSession {
  constructor(repository, logger = console) {
    this.repository = repository
    this.logger = logger
    this.workspace = null
    this.parts = []
    this.finalized = false
  }

  async start() {
    if (!this.repository?.createWorkspace) return null
    try {
      this.workspace = await this.repository.createWorkspace()
      return this.workspace
    } catch (error) {
      this.logger.warn?.('[海图识别证据] 暂存目录不可用', { reasonCode: String(error?.code || 'EVIDENCE_WORKSPACE_FAILED') })
      return null
    }
  }

  consume(result) {
    const { publicResult, evidence } = splitPuzzleFailureEvidence(result)
    if (evidence) this.parts.push(evidence)
    return publicResult
  }

  async commitFailure() {
    if (this.finalized) return { success: false, errorCode: 'PUZZLE_EVIDENCE_ALREADY_FINALIZED' }
    const manifest = mergePuzzleFailureEvidence(this.workspace, this.parts)
    if (!manifest) {
      await this.discard()
      return { success: false, errorCode: 'PUZZLE_EVIDENCE_EMPTY' }
    }
    this.finalized = true
    try { return await this.repository.commit(this.workspace, manifest) } catch (error) {
      try { await this.repository?.discardWorkspace?.(this.workspace) } catch {}
      this.logger.warn?.('[海图识别证据] 提交失败', { reasonCode: String(error?.code || 'EVIDENCE_COMMIT_FAILED') })
      return { success: false, errorCode: 'PUZZLE_EVIDENCE_COMMIT_FAILED' }
    }
  }

  async discard() {
    if (this.finalized) return { success: true, discarded: false }
    this.finalized = true
    if (!this.workspace) return { success: true, discarded: false }
    try {
      await this.repository?.discardWorkspace?.(this.workspace)
      return { success: true, discarded: true }
    } catch (error) {
      this.logger.warn?.('[海图识别证据] 暂存清理失败', { reasonCode: String(error?.code || 'EVIDENCE_DISCARD_FAILED') })
      return { success: false, errorCode: 'PUZZLE_EVIDENCE_DISCARD_FAILED' }
    }
  }
}
