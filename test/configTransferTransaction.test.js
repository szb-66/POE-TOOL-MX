import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createConfigImportRunner,
  createImportPreview
} from '../src/domains/settings/configTransfer/transaction.js'
import { ConfigTransferError } from '../src/domains/settings/configTransfer/core.js'

function parsedBundle(sectionIds = ['preset.item']) {
  return {
    bundle: {
      appVersion: '1.2.2', exportedAt: '2026-08-30T10:00:00.000Z', formatVersion: 1,
      sections: Object.fromEntries(sectionIds.map(id => [id, { schemaVersion: 1, data: { value: id } }]))
    },
    compatibleSectionIds: sectionIds,
    defaultSelectedSectionIds: sectionIds
  }
}

function descriptor(id, events, state, failures = {}) {
  return {
    planImport(data) {
      events.push(`${id}:plan`)
      return { candidate: data, summary: { added: 1 }, warnings: failures.warning ? ['地图坐标警告'] : [] }
    },
    validate() {
      events.push(`${id}:validate`)
      if (failures.validate) throw new Error('validate failed')
    },
    snapshot() {
      events.push(`${id}:snapshot`)
      return { value: state.value }
    },
    async persist(plan) {
      events.push(`${id}:persist`)
      state.value = plan.candidate.value
      if (failures.blocker) await failures.blocker
      if (failures.persist) throw new Error('persist failed')
    },
    rollback(snapshot) {
      events.push(`${id}:rollback`)
      if (failures.rollback) throw new Error('rollback failed')
      state.value = snapshot.value
    }
  }
}

test('import preview is side-effect free and reports only selected supported content', () => {
  const events = []
  const state = { value: 'local' }
  const descriptors = new Map([
    ['preset.item', descriptor('preset.item', events, state)],
    ['settings.toolSites', descriptor('settings.toolSites', events, state)]
  ])
  const preview = createImportPreview({
    parsed: parsedBundle(['preset.item', 'settings.toolSites']), descriptors,
    sectionOptions: { selectedSectionIds: ['settings.toolSites'] }
  })
  assert.equal(state.value, 'local')
  assert.deepEqual(events, ['settings.toolSites:plan'])
  assert.deepEqual(preview.selectedSectionIds, ['settings.toolSites'])
  assert.equal(Object.hasOwn(preview, 'requiresAutomationStop'), false)
})

test('successful transaction validates, snapshots and persists without runtime stages', async () => {
  const events = []
  const state = { value: 'local' }
  const descriptors = new Map([['preset.item', descriptor('preset.item', events, state)]])
  const preview = createImportPreview({ parsed: parsedBundle(), descriptors })
  const result = await createConfigImportRunner().execute(preview)
  assert.equal(result.success, true)
  assert.equal(state.value, 'preset.item')
  assert.deepEqual(events, ['preset.item:plan', 'preset.item:validate', 'preset.item:snapshot', 'preset.item:persist'])
  assert.deepEqual(result.sections[0], { id: 'preset.item', added: 1, skipped: 0, conflicts: 0 })
})

test('prevalidation failure performs zero writes', async () => {
  const events = []
  const state = { value: 'local' }
  const descriptors = new Map([['preset.item', descriptor('preset.item', events, state, { validate: true })]])
  const preview = createImportPreview({ parsed: parsedBundle(), descriptors })
  await assert.rejects(() => createConfigImportRunner().execute(preview), error => {
    assert.equal(error instanceof ConfigTransferError, true)
    assert.equal(error.code, 'IMPORT_PREVALIDATION_FAILED')
    return true
  })
  assert.equal(state.value, 'local')
  assert.equal(events.includes('preset.item:persist'), false)
})

test('persistence failure rolls back every touched section in reverse order', async () => {
  const events = []
  const stateA = { value: 'local-a' }
  const stateB = { value: 'local-b' }
  const descriptors = new Map([
    ['preset.item', descriptor('preset.item', events, stateA)],
    ['settings.toolSites', descriptor('settings.toolSites', events, stateB, { persist: true })]
  ])
  const preview = createImportPreview({ parsed: parsedBundle(['preset.item', 'settings.toolSites']), descriptors })
  await assert.rejects(() => createConfigImportRunner().execute(preview), error => error.code === 'IMPORT_PERSIST_FAILED')
  assert.equal(stateA.value, 'local-a')
  assert.equal(stateB.value, 'local-b')
  assert.deepEqual(events.slice(-2), ['settings.toolSites:rollback', 'preset.item:rollback'])
})

test('incomplete persistent rollback is reported explicitly without input side effects', async () => {
  const events = []
  const state = { value: 'local' }
  const descriptors = new Map([['preset.item', descriptor('preset.item', events, state, { persist: true, rollback: true })]])
  const preview = createImportPreview({ parsed: parsedBundle(), descriptors })
  await assert.rejects(() => createConfigImportRunner().execute(preview), error => {
    assert.equal(error.code, 'IMPORT_ROLLBACK_INCOMPLETE')
    assert.equal(error.details.causeCode, 'IMPORT_PERSIST_FAILED')
    assert.equal(error.details.rollbackErrors.length, 1)
    return true
  })
  assert.equal(events.some(event => event.includes('force-disable')), false)
})

test('global storage snapshot restores after a partial persistence failure', async () => {
  const events = []
  const state = { value: 'local' }
  let restored = false
  const descriptors = new Map([['preset.item', descriptor('preset.item', events, state, { persist: true })]])
  const preview = createImportPreview({ parsed: parsedBundle(), descriptors })
  const runner = createConfigImportRunner({
    stateController: {
      snapshot: () => ({ local: true }),
      rollback: snapshot => { restored = snapshot.local }
    }
  })
  await assert.rejects(() => runner.execute(preview), error => error.code === 'IMPORT_PERSIST_FAILED')
  assert.equal(restored, true)
})

test('concurrent submissions are rejected by the transaction gate', async () => {
  let release
  const blocker = new Promise(resolve => { release = resolve })
  const state = { value: 'local' }
  const events = []
  const descriptors = new Map([['preset.item', descriptor('preset.item', events, state, { blocker })]])
  const preview = createImportPreview({ parsed: parsedBundle(), descriptors })
  const runner = createConfigImportRunner()
  const first = runner.execute(preview)
  await Promise.resolve()
  await Promise.resolve()
  await assert.rejects(() => runner.execute(preview), error => error.code === 'IMPORT_BUSY')
  release()
  await first
})
