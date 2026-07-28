export function createOverlayDrag(moveWindow) {
  let active = false

  function pointerDown(event) {
    if (event.button !== 0) return
    active = true
    moveWindow({ phase: 'start', screenX: event.screenX, screenY: event.screenY })
    event.currentTarget?.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }

  function pointerMove(event) {
    if (!active) return
    moveWindow({ phase: 'move', screenX: event.screenX, screenY: event.screenY })
  }

  function pointerUp(event) {
    if (!active) return
    active = false
    moveWindow({ phase: 'end' })
    event.currentTarget?.releasePointerCapture?.(event.pointerId)
  }

  return { pointerDown, pointerMove, pointerUp }
}
