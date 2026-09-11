import { CAPTURE_KEYS, liveEnvironment, liveProfile, relicProfile, gridDimensions, cellStates, region } from '../../../shared/sanctumLive.js'
import { TITLE_KEYS } from '../interfaceDetection/titleRegistry.js'

const labels = { resourcesRegion:'实际资源数值范围', rewardPanelRegion:'奖励列表范围', mapRegion: '地图范围', effectIconsRegion: '独立状态栏效果图标', mapEffectIconsRegion: '地图内状态栏效果图标', roomSize: '房间内框', pathColor: '路径颜色样本' }
const sameEnvironment = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// Only the main process supplies captures, client metadata and sample pixels.
export class SanctumCalibrationEditor {
  constructor({ service, picker, cancelPicker, detection, nativeImage, withHidden }) {
    Object.assign(this, { service, picker, cancelPicker, detection, nativeImage, withHidden })
    this.picking = false
  }
  cancel() {
    if (!this.captureController) return
    this.captureController.abort()
    if (this.pickerActive) this.cancelPicker?.()
  }
  assertEditable() {
    this.service.assertEnabled()
    if (this.picking || this.service.state.running || this.service.state.solving || this.service.liveTask || this.service.captureTask) throw new Error('运行中不能修改校准，请先停止')
  }
  invalidate(regionId) {
    const s = this.service
    s.stop()
    s.liveDriver?.resetEffects?.()
    s.relicEvidence.clear()
    s.state.loadouts = null
    s.state.altar.confirmed = false
    s.state.altar.unlocked = []
    s.state.inventory = s.state.inventory.map(item => !regionId || item.regionId === regionId
      ? { ...item, status: 'unknown', reason: '校准已修改，请重新扫描确认位置' } : item)
    s.recalculate()
  }
  commit(previous, regionId) {
    try { this.invalidate(regionId); return this.service.persist() }
    catch (error) { this.service.state = previous; this.service.publish(); throw error }
  }
  async capture(key, dimensions) {
    this.assertEditable()
    const title = TITLE_KEYS.includes(key), grid = ['altar', 'locker'].includes(key) ? gridDimensions({ ...dimensions, regionId: key }) : null
    if (!title && !grid && !CAPTURE_KEYS.includes(key)) throw new Error('未知校准项')
    this.picking = true
    const controller = new AbortController()
    this.captureController = controller
    const generation = this.service.generation
    let before, previous, oldTitle, titleChanged = false
    const read = async () => {
      controller.signal.throwIfAborted()
      const value = await this.service.liveDriver.inspectEnvironment(controller.signal)
      controller.signal.throwIfAborted()
      return value
    }
    try {
      const capture = await this.withHidden(() => {
        controller.signal.throwIfAborted()
        this.pickerActive = true
        return this.picker({ purpose: 'sanctum',
        title: grid ? `框选完整 ${grid.columns}×${grid.rows} ${key === 'altar' ? '祭坛' : '圣物仓库'}` : `框选${title ? '公共标题' : labels[key]}`,
        hint: '贴近目标边框拖动，Enter 确认，Esc 取消', grid,
        minimumSize: grid ? { width: grid.columns * 16, height: grid.rows * 16 } : { width: 20, height: 10 },
        beforeCapture: async () => { before = await read() },
        afterCapture: async () => { if (!sameEnvironment(before, await read())) throw new Error('截图期间窗口或 DPI 已变化') }
      }) })
      this.pickerActive = false
      if (controller.signal.aborted) return this.service.getState()
      if (capture.canceled) return this.service.getState()
      if (!capture.success) throw new Error(capture.error || '截图失败，旧配置已保留')
      if (generation !== this.service.generation || !this.service.enabled) return this.service.getState()
      const r = capture.selectedRegion, bounds = before.clientBounds
      const environment = liveEnvironment(before.environment)
      const selected = region({ x: r.left - bounds.x, y: r.top - bounds.y, width: r.right - r.left, height: r.bottom - r.top }, environment)
      const value = { environment, region: selected, png: Buffer.from(capture.png).toString('base64'),
        clientBounds: bounds, displayId: capture.displayId, scaleFactor: capture.scaleFactor, displayPhysicalBounds: capture.displayPhysicalBounds }
      previous = structuredClone(this.service.state)
      if (title) { oldTitle = this.detection.getTitleConfig().templates[key]; await this.detection.setTitle(key, value); titleChanged = true }
      else if (grid) this.service.state.relicCalibrations[key] = relicProfile({ version: 2, environment, ...grid, mapRegion: selected, preview: value })
      else {
        const previous = this.service.state.liveCalibration || { version: 2, environment, captures: {} }
        const next = { ...previous, environment, captures: { ...previous.captures, [key]: value } }
        if (key.endsWith('Region')) next[key] = selected
        const room = next.captures.roomSize?.region
        if (room) next.calibration = { ...next.calibration, roomSize: [room.width, room.height] }
        this.service.state.liveCalibration = liveProfile(next)
      }
      if (generation !== this.service.generation) { if (titleChanged) await this.detection.setTitle(key, oldTitle); return this.service.getState() }
      return this.commit(previous, grid?.regionId)
    } catch (error) {
      if (titleChanged) await this.detection.setTitle(key, oldTitle)
      if (controller.signal.aborted) return this.service.getState()
      throw error
    } finally { this.picking = false; this.pickerActive = false; this.captureController = null }
  }
  async clear(key) {
    this.assertEditable()
    const generation = this.service.generation
    const previous = structuredClone(this.service.state), title = TITLE_KEYS.includes(key)
    const oldTitle = title ? this.detection.getTitleConfig().templates[key] : null
    this.picking = true
    try {
      if (title) {
        await this.detection.setTitle(key, null)
        if (generation !== this.service.generation) {
          await this.detection.setTitle(key, oldTitle)
          return this.service.getState()
        }
      }
      else if (['altar', 'locker'].includes(key)) delete this.service.state.relicCalibrations[key]
      else if (CAPTURE_KEYS.includes(key)) {
        const p = this.service.state.liveCalibration
        if (p) {
          delete p.captures[key]; delete p[key]
          if (key === 'roomSize' && p.calibration) delete p.calibration.roomSize
          if (key === 'pathColor' && p.calibration) delete p.calibration.pathHsv
        }
      } else throw new Error('未知校准项')
      return this.commit(previous, ['altar', 'locker'].includes(key) ? key : undefined)
    } catch (error) {
      if (title) await this.detection.setTitle(key, oldTitle)
      throw error
    } finally { this.picking = false }
  }
  saveCells(id, values) {
    this.assertEditable()
    const previous = structuredClone(this.service.state)
    const p = this.service.state.relicCalibrations[id]
    if (!p?.preview) throw new Error('请先框选网格截图')
    p.cellStates = cellStates(values, p.columns * p.rows)
    return this.commit(previous, id)
  }
  sample(id, kind, index) {
    this.assertEditable()
    const previous = structuredClone(this.service.state)
    const p = this.service.state.relicCalibrations[id]
    if (!p?.preview || !['empty', 'locked'].includes(kind) || !Number.isInteger(index) || index < 0 || index >= p.columns * p.rows) throw new Error('样本格无效')
    const image = this.nativeImage.createFromBuffer(Buffer.from(p.preview.png, 'base64'))
    const size = image.getSize(), x = index % p.columns, y = Math.floor(index / p.columns)
    const left = Math.round(x * size.width / p.columns) + 3, top = Math.round(y * size.height / p.rows) + 3
    const png = image.crop({ x: left, y: top, width: Math.round((x + 1) * size.width / p.columns) - 3 - left,
      height: Math.round((y + 1) * size.height / p.rows) - 3 - top }).toPNG().toString('base64')
    p.templates[kind] = png
    return this.commit(previous, id)
  }
  pathColor(point) {
    this.assertEditable()
    const previous = structuredClone(this.service.state)
    const p = this.service.state.liveCalibration, capture = p?.captures.pathColor
    if (!capture) throw new Error('请先框选路径颜色样本')
    let pathHsv = point?.pathHsv
    if (!pathHsv) {
      if (!Number.isInteger(point?.x) || !Number.isInteger(point?.y) || point.x < 0 || point.y < 0 || point.x >= capture.region.width || point.y >= capture.region.height) throw new Error('取色位置无效')
      const image = this.nativeImage.createFromBuffer(Buffer.from(capture.png, 'base64'))
      const [b, g, r] = image.crop({ x: point.x, y: point.y, width: 1, height: 1 }).toBitmap()
      const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min
      let h = delta === 0 ? 0 : max === r ? ((g - b) / delta + 6) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4
      h = Math.round(h * 30)
      const s = max ? Math.round(delta / max * 255) : 0
      pathHsv = [[Math.max(0, h - 8), Math.max(0, s - 45), Math.max(0, max - 50)], [Math.min(179, h + 8), Math.min(255, s + 45), Math.min(255, max + 50)]]
    }
    const next = liveProfile({ ...p, calibration: { ...p.calibration, pathHsv } })
    if (!next.mapRegion) throw new Error('请先框选地图范围')
    this.service.state.liveCalibration = next
    return this.commit(previous)
  }
}
