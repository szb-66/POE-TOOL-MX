export function paginateList(items, page, pageSize = 10) {
  const source = Array.isArray(items) ? items : []
  const normalizedPageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 10
  const totalPages = Math.max(1, Math.ceil(source.length / normalizedPageSize))
  const normalizedPage = Math.min(totalPages, Math.max(1, Number.isInteger(page) ? page : 1))
  const start = (normalizedPage - 1) * normalizedPageSize
  return {
    items: source.slice(start, start + normalizedPageSize),
    page: normalizedPage,
    pageSize: normalizedPageSize,
    totalPages
  }
}
