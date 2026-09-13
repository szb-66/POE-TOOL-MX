export const observationKey = floor => JSON.stringify([floor?.sanctumRunId || floor?.runId, floor?.floorId, floor?.mapKey || null, floor?.currentRoomId || (floor?.initialSelection ? '__entry__' : null)])

export function currentRunObservation(observation, floor) {
  return floor?.identityConfirmed && observation?.key === observationKey(floor) && observation.status === 'confirmed' ? observation : null
}

export function validateRunResources(input, floor, source = 'manual') {
  if (!floor?.identityConfirmed || !floor.currentRoomId && !floor.initialSelection) throw new Error('请先确认当前位置')
  const result = { key: observationKey(floor), status: 'confirmed', source }
  for (const key of ['resolve','maxResolve','inspiration','coins']) {
    const value = input?.[key]
    if (value !== null && value !== undefined && (!Number.isInteger(value) || value < 0 || value > 1e9)) throw new Error('实际资源数值无效')
    result[key] = value ?? null
  }
  if (result.resolve !== null && result.maxResolve !== null && result.resolve > result.maxResolve) throw new Error('坚毅不能超过最大坚毅')
  return result
}

// Labels follow the values as the HUD changes layout; bare HUD counters are not resources.
export function parseResourceRegions(reads, floor) {
  const input = {}, issues = []
  const compact = text => text.replace(/\s/g, '').replaceAll('啟迪','启迪')
  const numeric = value => Number(value.replace(/[,，]/g, ''))
  const unique = values => values.length && values.every(v => JSON.stringify(v) === JSON.stringify(values[0])) ? values[0] : null
  for (const key of ['coinsRegion','mapResourcesRegion','hudResourcesRegion']) {
    const read = reads?.[key]
    if (!read || read.reason || read.status && read.status !== 'located') {
      if (read?.reason) issues.push(read.reason)
      continue
    }
    const lines = read.ocrLines?.length ? read.ocrLines : (read.texts || []).map(text => ({text}))
    if (key !== 'coinsRegion') {
      const resolveLines = lines.filter(line => /坚毅/.test(line.text))
      const values = resolveLines.map(line => /^坚毅[:：]?(\d+)\/(\d+)$/.exec(compact(line.text)))
      const resolved = values.length && values.every(Boolean) ? unique(values.map(m=>[Number(m[1]),Number(m[2])])) : null
      if (resolved && resolved[0] <= resolved[1] && resolved[1] <= 1e9) [input.resolve,input.maxResolve] = resolved
      const inspirationLines = lines.filter(line => /启|啟/.test(line.text))
      const inspiration = inspirationLines.map(line => /^启迪[:：]?(\d+)$/.exec(compact(line.text)))
      const inspired = inspiration.length && inspiration.every(Boolean) ? unique(inspiration.map(m=>Number(m[1]))) : null
      if (inspired !== null && inspired <= 1e9) input.inspiration = inspired
      else if (!inspirationLines.length && resolved && input.resolve !== undefined && read.resourceEvidence?.noInspiration === true) input.inspiration = 0
    }
    if (key === 'mapResourcesRegion') continue
    const icon = read.resourceEvidence?.coinRegion
    if (!icon) continue
    // Use blocks to isolate the coin row even when OCR grouped distant labels together.
    const blocks = (read.ocrBlocks?.length ? read.ocrBlocks : lines).filter(line => {
      const r = line.region
      return r && r.x >= icon.x + icon.width*.75 && r.x < icon.x+icon.width*14
        && Math.abs(r.y+r.height/2-(icon.y+icon.height/2)) < Math.max(r.height,icon.height)*.55
    }).sort((a,b)=>a.region.x-b.region.x)
    if (blocks.some(b=>/\d\s+\d/.test(b.text)) || blocks.filter(b=>/^\d+$/.test(compact(b.text))).length > 1
      || blocks.some((b,i)=>i && b.region.x-(blocks[i-1].region.x+blocks[i-1].region.width)>b.region.height)) continue
    const text = compact(blocks.map(b=>b.text).join(''))
    const match = /^(?:耀金币[:：]?)?(\d+|\d{1,3}(?:[,，]\d{3})+)(?:[（(][+＋-]?\d+[）)])?$/.exec(text)
    if (match && numeric(match[1]) <= 1e9) input.coins = numeric(match[1])
  }
  const result = validateRunResources(input, floor, 'observed')
  const missing = ['coins','resolve','maxResolve','inspiration'].filter(key => result[key] === null)
  return {...result, ...(issues.length || missing.length ? {reason:[...new Set(issues), ...(missing.length ? ['部分资源未配置或未能可靠识别'] : [])].join('；')} : {})}
}
