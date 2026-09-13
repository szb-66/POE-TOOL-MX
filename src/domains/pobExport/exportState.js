export const newExportState = () => ({ forumId: '', characters: [], league: '', character: '', busy: '', loaded: false, result: null, error: '', warnings: [] })

function unwrap(response) {
  if (response?.success) return response.data
  const error = new Error(response?.error?.message || 'PoB 导出操作失败，请重试')
  error.warnings = response?.error?.details?.warnings || []
  throw error
}

export function createExportController(state, { api, source, preferredLeague = () => '' }) {
  let revision = 0
  let disposed = false
  function invalidate(clearCharacters = false) {
    revision++
    Object.assign(state, { busy: '', result: null, error: '', warnings: [] })
    if (clearCharacters) Object.assign(state, { characters: [], league: '', character: '', loaded: false })
  }
  function setForumId(value) { invalidate(true); state.forumId = value }
  function setLeague(value) { invalidate(); state.league = value; state.character = '' }
  function setCharacter(value) { invalidate(); state.character = value }
  async function run(kind, operation, apply) {
    if (disposed || state.busy) return
    invalidate(kind === 'load')
    const request = revision
    state.busy = kind
    try {
      const data = unwrap(await operation())
      if (!disposed && request === revision) apply(data)
    } catch (error) {
      if (!disposed && request === revision) {
        state.error = error.message
        state.warnings = error.warnings || []
      }
    } finally {
      if (!disposed && request === revision) state.busy = ''
    }
  }
  function identity() { return { source, ...(source === 'other' ? { forumId: state.forumId.trim() } : {}) } }
  function load() {
    return run('load', () => api.listCharacters(identity()), characters => {
      state.characters = characters
      state.loaded = true
      const preferred = preferredLeague()
      state.league = characters.some(c => c.league === preferred) ? preferred : (characters[0]?.league || '')
    })
  }
  function exportBuild() {
    if (!state.characters.some(c => c.name === state.character && c.league === state.league)) return
    const input = { ...identity(), league: state.league, character: state.character }
    return run('export', () => api.exportBuild(input), result => { state.result = result; state.warnings = result.warnings || [] })
  }
  return { invalidate, setForumId, setLeague, setCharacter, load, exportBuild, dispose: () => { disposed = true; invalidate(true) } }
}
