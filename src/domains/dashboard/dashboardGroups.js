export const DASHBOARD_MODULE_GROUPS = Object.freeze([
  Object.freeze({
    id: 'detection',
    title: '检测',
    moduleIds: Object.freeze(['bag', 'combat', 'shop', 'priceCheck'])
  }),
  Object.freeze({
    id: 'manufacturing',
    title: '制造',
    moduleIds: Object.freeze(['map', 'items'])
  })
])

export function groupDashboardModules(modules = []) {
  const modulesById = new Map(modules.map(module => [module.id, module]))

  return DASHBOARD_MODULE_GROUPS.map(group => ({
    ...group,
    modules: group.moduleIds
      .map(moduleId => modulesById.get(moduleId))
      .filter(Boolean)
  }))
}
