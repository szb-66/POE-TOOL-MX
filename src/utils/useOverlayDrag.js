export function createOverlayDrag(moveWindow, { finalCoordinates = false } = {}) {
  let active = false
  let pointerId
  let target

  function pointerDown(event) {
    if (event.button !== 0 || active) return
    active = true
    pointerId = event.pointerId
    target = event.currentTarget
    moveWindow({ phase: 'start', screenX: event.screenX, screenY: event.screenY })
    event.currentTarget?.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }

  function pointerMove(event) {
    if (!active || event.pointerId !== pointerId) return
    moveWindow({ phase: 'move', screenX: event.screenX, screenY: event.screenY })
  }

  function pointerUp(event) {
    if (!active || (event && event.pointerId !== pointerId)) return
    active = false
    const end = { phase: 'end' }
    if (finalCoordinates && event?.type === 'pointerup' &&
        Number.isFinite(event.screenX) && Number.isFinite(event.screenY)) {
      end.screenX = event.screenX
      end.screenY = event.screenY
    }
    moveWindow(end)
    if (target?.hasPointerCapture?.(pointerId)) target.releasePointerCapture(pointerId)
    target = null
    pointerId = undefined
  }

  return { pointerDown, pointerMove, pointerUp, dispose: () => pointerUp() }
}
