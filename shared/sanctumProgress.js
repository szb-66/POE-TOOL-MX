export function sanctumPhaseLabel(progress = {}) {
  const count = Number.isFinite(progress.current) && Number.isFinite(progress.total) ? ` ${progress.current}/${progress.total}` : ''
  return ({map:'读取地图',rooms:`截图房间${count}`,effects:progress.total === null ? '检测状态栏' : `截图状态栏${count}`,
    recognizing:`分析中${count}`,completing:'正在完成',complete:'分析完成·再次采集',partial:'部分完成·再次采集',
    stopped:'已停止·再次采集',timeout:'采集超时·重试'})[progress.stage] || '正在准备'
}

export function sanctumProgressText(progress) {
  if (!progress) return ''
  if (progress.analysis) return [sanctumPhaseLabel(progress),progress.analysis.failed ? `${progress.analysis.failed}项未完整识别` : '',progress.reason].filter(Boolean).join(' · ')
  const labels = { preparing:'正在准备', completing:'正在完成', recovering:'恢复采集上下文', map:'地图已识别', rooms:'读取房间', recognizing:'识别已截图内容', effects:'读取状态栏', complete:'本次可见信息已处理',
    'closing-map':'关闭地图并确认状态栏', 'opening-map':'重新打开并确认地图', 'scanning-effects':'扫描状态栏图标',
    'capturing-effect':'读取状态栏', 'checking-interface':'确认状态栏布局', 'reading-resources':'读取当前资源',
    verifying:'核验目标', moving:'移动到目标', 'waiting-tooltip':'等待弹框', locating:'定位弹框', ocr:'读取文字', queued:'截图已完成，后台识别中', parsing:'解析内容', stopped:'采集已停止', partial:'本轮结束，部分信息未识别', timeout:'本轮超时，已保留结果' }
  return [labels[progress.step] || labels[progress.stage] || '采集中', progress.targetId,
    Number.isFinite(progress.total) ? `${progress.current}/${progress.total}` : '',
    progress.attempt > 1 ? `第 ${progress.attempt} 次尝试` : '', progress.reason].filter(Boolean).join(' · ')
}
