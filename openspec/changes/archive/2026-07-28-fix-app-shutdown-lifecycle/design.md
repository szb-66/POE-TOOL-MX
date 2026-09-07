## Context

Electron currently calls `app.quit()` only from `window-all-closed`. The application owns multiple auxiliary `BrowserWindow` instances, so closing the main window can leave the application alive. Its asynchronous `before-quit` listener does not call `preventDefault()`, and Electron does not await returned promises, so cleanup ordering is not guaranteed.

The working tree also contains active development of additional overlays and automation services. The shutdown design therefore must not depend on a hard-coded list of only the original overlay types.

## Goals / Non-Goals

**Goals:**

- Make closing the main window reliably exit the entire application.
- Execute asynchronous cleanup once and allow it to settle before the final quit.
- Continue cleanup and exit when one component fails.
- Bound shutdown time so a stuck child process cannot hold the terminal forever.
- Cover lifecycle state transitions with deterministic unit tests.

**Non-Goals:**

- Add minimize-to-tray behavior.
- Change normal overlay visibility behavior while the main window is open.
- Terminate unrelated operating-system processes.

## Decisions

1. Introduce a small lifecycle controller with explicit `idle`, `cleaning`, and `ready` states. The first `before-quit` event is prevented, cleanup is started once, and a second `app.quit()` is issued only after cleanup settles. A pure controller is preferred over source-text-only tests because its state transitions can be exercised without launching Electron.

2. Attach a close listener to every main window that calls `app.quit()` while the controller is idle. This avoids relying on `window-all-closed`, which includes auxiliary windows. The existing `window-all-closed` handler remains a fallback for platforms where all windows are independently closed.

3. Run cleanup in ordered phases. Service/automation cleanup happens before tracked child-process cleanup, followed by window cleanup. Within each phase, operations settle independently so one rejection does not skip later work.

4. Close all remaining auxiliary `BrowserWindow` instances generically after module-specific cleanup. This covers current and future overlays, login windows, debug windows, and picker windows without requiring every new window type to update the root lifecycle.

5. Apply a finite timeout around the complete cleanup sequence. On rejection or timeout, report the error and resume normal `app.quit()` rather than calling `process.exit()`, preserving Electron's final lifecycle handling.

## Risks / Trade-offs

- [A cleanup task continues after the timeout] → The process is exiting, so no new work should be scheduled; cleanup functions remain idempotent.
- [An auxiliary window blocks its close event] → Use `destroy()` during final shutdown because these are application-owned transient windows.
- [A newly added service is omitted from cleanup] → Generic window cleanup prevents UI residency; lifecycle tests and a centralized cleanup function make service registration visible.
- [User work overlaps the same lifecycle files] → Keep changes localized and preserve all existing service initialization and cleanup calls.

## Migration Plan

No data migration is required. Deploy the lifecycle module, main-process integration, and tests together. Rollback consists of reverting those scoped files.

## Open Questions

None.
