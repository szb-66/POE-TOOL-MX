export class PriceCheckOverlayPresentation {
  constructor(window) {
    this.window = window
    this.generation = 0
    this.primed = false
    this.interactive = false
    this.destroyed = false
  }

  prime() {
    if (this.destroyed || this.primed) return false
    this.window.setOpacity(0)
    this.window.setIgnoreMouseEvents(true)
    this.window.setFocusable(false)
    this.window.showInactive()
    this.primed = true
    return true
  }

  beginDisplay({ focus = true } = {}) {
    if (!focus) {
      this.window.setFocusable(false)
      this.window.setIgnoreMouseEvents(true)
      this.interactive = false
    }
    this.generation += 1
    return {
      generation: this.generation,
      needsReveal: !this.interactive
    }
  }

  reveal(generation, { focus = true } = {}) {
    if (this.destroyed || generation !== this.generation) return false
    if (this.interactive && focus) return true
    this.window.setFocusable(focus)
    this.window.setIgnoreMouseEvents(!focus)
    this.window.setOpacity(1)
    if (focus) this.window.focus()
    this.interactive = focus
    return true
  }

  park() {
    if (this.destroyed) return false
    this.generation += 1
    this.window.setOpacity(0)
    this.window.setIgnoreMouseEvents(true)
    this.window.setFocusable(false)
    this.interactive = false
    return true
  }

  isInteractive() {
    return this.interactive && !this.destroyed
  }

  destroy() {
    if (this.destroyed) return false
    this.generation += 1
    this.destroyed = true
    this.interactive = false
    this.window.destroy()
    return true
  }
}
