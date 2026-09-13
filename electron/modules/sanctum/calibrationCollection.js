import { randomUUID } from 'node:crypto'
import { SanctumNativeClient } from './nativeClient.js'
import { COLLECTION_KEYS, compatibleCalibrationEnvironment, savedCollection } from '../../../shared/sanctumCalibrationCollection.js'
import { liveEnvironment, liveProfile, region, calibrationPng } from '../../../shared/sanctumLive.js'

export class SanctumCalibrationCollection {
  constructor(editor, { makeClient = () => new SanctumNativeClient() } = {}) {
    Object.assign(this, { editor, makeClient })
    this.draft = null
  }
  get service() { return this.editor.service }
  titles() { return this.editor.detection.getTitleConfig().templates || {} }
  baseline() { return JSON.stringify([this.service.state.liveCalibration, this.titles()]) }
  view() {
    return structuredClone(this.draft ? { ...this.draft, baseline: undefined } : {
      id: null, items: savedCollection(this.service.state.liveCalibration, this.titles()), current: null, dirty: false
    })
  }
  assertDraft(id) {
    this.editor.assertEditable()
    if (!this.draft || id !== this.draft.id) throw new Error('校准草稿已变化，请重新打开')
    if (this.baseline() !== this.draft.baseline) throw new Error('已保存校准发生变化，请丢弃草稿后重新收集')
    return this.draft
  }
  async capture() {
    this.editor.assertEditable()
    if (this.draft) this.assertDraft(this.draft.id)
    const controller = new AbortController(), signal = controller.signal
    const generation = this.service.generation
    this.editor.picking = true
    this.editor.captureController = controller
    const client = this.makeClient()
    try {
      // Resolve and start Python while the assistant is still visible. Configure
      // does not require the game to be foreground and has a bounded deadline.
      await client.request('configure', {}, { signal, timeoutMs: 20000 })
      signal.throwIfAborted()
      const frame = await (this.editor.withScreenshotHidden || this.editor.withHidden)(async () => {
        signal.throwIfAborted()
        await client.request('environment', {}, { signal })
        return client.request('captureCalibrationFrame', {}, { signal, timeoutMs: 15000 })
      })
      signal.throwIfAborted()
      const environment = { ...frame.environment, ...liveEnvironment(frame.environment) }
      calibrationPng(frame.png)
      if (this.draft?.environment && !compatibleCalibrationEnvironment(this.draft.environment, environment)) {
        throw new Error('窗口、尺寸或 DPI 不一致，请丢弃草稿并按当前环境重新收集')
      }
      let analysis
      try { analysis = await client.request('analyzeCalibrationFrame', {}, { signal, timeoutMs: 60000 }) }
      catch (error) {
        signal.throwIfAborted()
        analysis = { candidates: [], message: `自动分析失败：${String(error.message || '分析进程不可用').slice(0,160)}。可在当前截图手动补框，或重新截图。` }
      }
      signal.throwIfAborted()
      if (generation !== this.service.generation || !this.service.enabled) throw new Error('校准采集已取消')
      if (!this.draft) this.draft = { id: randomUUID(), baseline: this.baseline(), environment,
        items: savedCollection(this.service.state.liveCalibration, this.titles(), environment), dirty: false }
      this.draft.current = { id: randomUUID(), png: frame.png, environment, clientBounds: frame.clientBounds,
        candidates: (analysis.candidates || []).filter(item => COLLECTION_KEYS.includes(item.key)).map(item => ({
          ...item, region: region(item.region, environment)
        })), message: (!compatibleCalibrationEnvironment(this.service.state.liveCalibration?.environment, environment) && this.service.state.liveCalibration
          ? '当前环境与旧配置不同，旧配置仍保留；保存后将使用当前环境收集的元素。' : '') + (analysis.message || '') }
      return this.view()
    } finally {
      await client.shutdown()
      this.editor.picking = false; this.editor.captureController = null
    }
  }
  confirm({ id, frameId, selections }) {
    const draft = this.assertDraft(id), frame = draft.current
    if (!frame || frameId !== frame.id) throw new Error('截图已更新，请核对当前截图')
    if (!Array.isArray(selections) || !selections.length || selections.length > COLLECTION_KEYS.length
      || new Set(selections.map(item => item.key)).size !== selections.length) throw new Error('请选择要确认的元素')
    const image = this.editor.nativeImage.createFromBuffer(Buffer.from(frame.png, 'base64'))
    const size = image.getSize()
    if (size.width !== frame.environment.width || size.height !== frame.environment.height) throw new Error('截图与客户区尺寸不一致')
    const next = { ...draft.items }
    for (const item of selections) {
      if (!COLLECTION_KEYS.includes(item.key)) throw new Error('未知校准元素')
      if (next[item.key] && item.replace !== true) continue
      const r = region(item.region, frame.environment)
      if (item.key === 'roomSize' && [r.width,r.height].some(value => value < 24 || value > 1000)) throw new Error('房间内框尺寸须为 24–1000 像素，请调整选框')
      const value = { region: r, environment: frame.environment, clientBounds: frame.clientBounds,
        png: image.crop(r).toPNG().toString('base64'), sourceId: frame.id }
      calibrationPng(value.png)
      if (item.key.startsWith('sanctum-') && value.png.length > 1400000) throw new Error('标题区域过大，请贴近标题框选')
      if (item.key === 'pathColor') {
        const data = image.crop(r).toBitmap()
        const hues = []
        for (let offset = 0; offset < data.length; offset += 4) {
          const [b,g,r] = data.subarray(offset,offset+3), max = Math.max(r,g,b), min = Math.min(r,g,b), delta = max-min
          if (!delta || max < 42 || delta/max*255 < 95) continue
          const h = (max === r ? ((g-b)/delta+6)%6 : max === g ? (b-r)/delta+2 : (r-g)/delta+4)*30
          if (h >= 12 && h <= 40) hues.push(h)
        }
        if (!hues.length) throw new Error('路径选区未找到金色路径，请重新框选')
        hues.sort((a,b)=>a-b)
        const h = Math.round(hues[Math.floor(hues.length/2)])
        value.pathHsv = [[Math.max(0,h-8),95,42],[Math.min(179,h+8),255,255]]
      }
      next[item.key] = value
    }
    draft.items = next; draft.dirty = true; draft.current = null
    return this.view()
  }
  discard({ id, all = false } = {}) {
    this.editor.assertEditable()
    if (id && this.draft?.id !== id) throw new Error('校准草稿已变化')
    if (all) this.draft = null
    else if (this.draft) this.draft.current = null
    return this.view()
  }
  async save({ id }) {
    const draft = this.assertDraft(id)
    if (!draft.dirty || !Object.keys(draft.items).length) throw new Error('没有已确认的新元素')
    const oldState = structuredClone(this.service.state), oldTitles = structuredClone(this.titles())
    const generation = this.service.generation, changed = []
    this.editor.picking = true
    try {
      const previous = compatibleCalibrationEnvironment(oldState.liveCalibration?.environment, draft.environment) ? oldState.liveCalibration : null
      const captures = {}, next = { ...previous, version: 6, environment: liveEnvironment(draft.environment), captures }
      for (const [key, value] of Object.entries(draft.items)) {
        if (!compatibleCalibrationEnvironment(value.environment, draft.environment)) throw new Error('校准环境不一致')
        if (key.startsWith('sanctum-')) continue
        captures[key] = { ...value, environment: liveEnvironment(value.environment) }
        delete captures[key].saved
        if (key.endsWith('Region')) next[key] = value.region
      }
      next.calibration = { roomSize: captures.roomSize ? [captures.roomSize.region.width, captures.roomSize.region.height] : previous?.calibration?.roomSize ?? null,
        pathHsv: draft.items.pathColor?.pathHsv || previous?.calibration?.pathHsv }
      const profile = liveProfile(next)
      for (const key of COLLECTION_KEYS.filter(key => key.startsWith('sanctum-'))) {
        const value = draft.items[key]
        if (value?.saved) continue
        if (value || oldTitles[key] && !compatibleCalibrationEnvironment(oldTitles[key].environment, draft.environment)) {
          changed.push(key)
          await this.editor.detection.setTitle(key, value ? { ...value, environment: liveEnvironment(value.environment) } : null)
          if (generation !== this.service.generation || !this.service.enabled) throw new Error('校准保存已取消')
        }
      }
      this.service.state.liveCalibration = profile
      this.editor.commit(oldState)
      this.draft = null
      return this.view()
    } catch (error) {
      this.service.state = oldState
      const failures = []
      for (const key of changed.reverse()) {
        try { await this.editor.detection.setTitle(key, oldTitles[key] || null) } catch { failures.push(key) }
      }
      this.service.publish()
      if (failures.length) throw new Error('保存失败，部分标题回滚失败，请检查存储后重新校准')
      throw error
    } finally { this.editor.picking = false }
  }
}
