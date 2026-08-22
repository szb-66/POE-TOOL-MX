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

  beginDisplay() {
    this.generation += 1
    return {
      generation: this.generation,
      needsReveal: !this.interactive
    }
  }

  reveal(generation) {
    if (this.destroyed || generation !== this.generation) return false
    if (this.interactive) return true
    this.window.setFocusable(true)
    this.window.setIgnoreMouseEvents(false)
    this.window.setOpacity(1)
    this.window.focus()
    this.interactive = true
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
