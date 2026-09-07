## 1. Lifecycle Controller

- [x] 1.1 Add failing unit tests for deferred, idempotent, failed, and timed-out shutdown
- [x] 1.2 Implement the reusable shutdown lifecycle controller

## 2. Electron Integration

- [x] 2.1 Make every main-window close request trigger complete application shutdown
- [x] 2.2 Centralize ordered service, process, shortcut, watcher, and auxiliary-window cleanup
- [x] 2.3 Ensure cleanup failure cannot prevent the final Electron quit

## 3. Verification

- [x] 3.1 Run focused lifecycle tests and the full Node test suite
- [x] 3.2 Build the renderer and validate the OpenSpec change
- [x] 3.3 Review the final diff and remove obsolete shutdown code
