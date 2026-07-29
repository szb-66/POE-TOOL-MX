export const DASHBOARD_MODULE_GROUPS = Object.freeze([
  Object.freeze({
    id: 'detection',
    title: '检测',
    moduleIds: Object.freeze(['bag', 'combat', 'shop'])
  }),
  Object.freeze({
    id: 'manufacturing',
    title: '制造',
    moduleIds: Object.freeze(['map', 'items'])
  }),
  Object.freeze({
    id: 'other',
    title: '其他',
    moduleIds: Object.freeze(['story', 'crafting'])
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
