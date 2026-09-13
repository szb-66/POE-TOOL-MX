export const PHASES = { checking: '查询版本', downloading: '下载', verifying: '校验', extracting: '解压',
  installing: '备份和替换', recovering: '恢复', cleaning: '清理', idle: '操作' }

export function errorMessage(error) {
  if (error?.name === 'TimeoutError' || /fetch|network|timeout/i.test(error?.message || '')) return '网络连接失败或超时，请稍后重试'
  if (error?.code && /^E[A-Z]+$/.test(error.code)) return `文件操作失败（${error.code}），请检查目录权限或文件占用`
  return String(error?.message || error || '未知错误')
    .replace(/[A-Za-z]:[\\/][^\r\n]*/g, '[本机路径]')
    .replace(/(?:Authorization|Cookie|POESESSID)\s*[:=].*/gi, '[敏感信息已隐藏]')
}

export function diagnostic(error, context) {
  return { time: new Date().toISOString(), ...context, message: errorMessage(error),
    code: typeof error?.code === 'string' ? error.code : '',
    // Retain call-site names without disk locations, arguments or personal paths.
    stack: String(error?.stack || '').split('\n').slice(1).map(line =>
      line.match(/^\s*at ([\w.$<>]+)(?:\s|$)/)?.[1]).filter(Boolean) }
}
