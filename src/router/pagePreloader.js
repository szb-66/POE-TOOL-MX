export function createPagePreloader(loaders) {
  const preloadResults = new Map()

  return function preloadPage(path) {
    const loader = loaders[path]
    if (!loader) return Promise.resolve(false)

    if (!preloadResults.has(path)) {
      const result = Promise.resolve()
        .then(loader)
        .then(() => true)
        .catch(() => {
          preloadResults.delete(path)
          return false
        })
      preloadResults.set(path, result)
    }

    return preloadResults.get(path)
  }
}
