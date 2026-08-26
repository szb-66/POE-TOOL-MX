export async function runApplicationUpdateEntryAction({ state, update, confirm }) {
  const snapshot = { ...state }
  const { status, availableVersion } = snapshot
  if (!['available', 'downloaded'].includes(status)) return null

  if (!update.isVersionConfirmed(availableVersion)) {
    if (!await confirm(snapshot)) return { success: false, cancelled: true }
    if (!update.confirmVersion(availableVersion)) return { success: false, stale: true }
  }

  const current = { ...(update.state || snapshot) }
  if (String(current.availableVersion || '') !== String(availableVersion || '')) {
    return { success: false, stale: true }
  }
  if (current.status === 'available') return update.download()
  if (current.status === 'downloaded') return update.install()
  return { success: false, busy: ['checking', 'downloading', 'installing'].includes(current.status) }
}
