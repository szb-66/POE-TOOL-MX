export function installExternalLinkPolicy(contents, openExternal) {
  const classify = (target) => {
    try {
      const current = new URL(contents.getURL())
      const candidate = new URL(target, current)
      const currentDocument = new URL(current)
      const candidateDocument = new URL(candidate)
      currentDocument.hash = ''
      candidateDocument.hash = ''

      if (candidateDocument.href === currentDocument.href) {
        return { kind: 'internal', url: candidate.toString() }
      }
      if (candidate.protocol === 'http:' || candidate.protocol === 'https:') {
        return { kind: 'external', url: candidate.toString() }
      }
    } catch {
      // 无法相对当前应用文档解析的地址采取安全默认值。
    }
    return { kind: 'blocked' }
  }

  contents.setWindowOpenHandler(({ url }) => {
    const navigation = classify(url)
    if (navigation.kind === 'external') void openExternal(navigation.url)
    return { action: 'deny' }
  })
  contents.on('will-navigate', (event, url) => {
    const navigation = classify(url)
    if (navigation.kind === 'internal') return

    event.preventDefault()
    if (navigation.kind === 'external') void openExternal(navigation.url)
  })
}
