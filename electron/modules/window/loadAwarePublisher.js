function isLoading(contents) {
  if (typeof contents?.isLoadingMainFrame === 'function') return contents.isLoadingMainFrame()
  return typeof contents?.isLoading === 'function' && contents.isLoading()
}

export function createLoadAwarePublisher() {
  let pending = null

  const removeRecord = (record) => {
    if (!record) return
    record.contents.removeListener?.('did-finish-load', record.handleLoaded)
    record.contents.removeListener?.('destroyed', record.handleDestroyed)
  }

  const clear = () => {
    const record = pending
    pending = null
    removeRecord(record)
  }

  const publish = (contents, send) => {
    if (!contents || contents.isDestroyed?.() || typeof send !== 'function') return false
    if (!isLoading(contents)) {
      clear()
      send()
      return true
    }
    if (pending?.contents === contents) {
      pending.send = send
      return false
    }

    clear()
    const record = { contents, send, handleLoaded: null, handleDestroyed: null }
    record.handleLoaded = () => {
      if (pending !== record) return
      pending = null
      removeRecord(record)
      if (!contents.isDestroyed?.()) record.send()
    }
    record.handleDestroyed = () => {
      if (pending === record) pending = null
      removeRecord(record)
    }
    pending = record
    contents.once('did-finish-load', record.handleLoaded)
    contents.once('destroyed', record.handleDestroyed)
    return false
  }

  return { publish, dispose: clear }
}
