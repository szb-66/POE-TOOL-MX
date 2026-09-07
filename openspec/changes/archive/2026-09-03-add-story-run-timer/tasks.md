## 1. Timer state and settings

- [x] 1.1 Add tested timer domain helpers for persistence, elapsed time, status transitions, formatting, and bounded history.
- [x] 1.2 Add the story timer Pinia store with foreground pause/resume, restart recovery, preset binding, reset, and individual history deletion.
- [x] 1.3 Add persistent story, skills, and timer overlay module settings plus the story timer shortcut configuration.

## 2. Story page and shortcut integration

- [x] 2.1 Add module switches, the timer control card, foreground guidance, and the individual-delete history dialog to the story page.
- [x] 2.2 Dispatch the configured timer shortcut through the existing shortcut service with timer policy enforcement.

## 3. Overlay integration

- [x] 3.1 Extend the story overlay snapshot with module and timer state and close the overlay when all modules are disabled.
- [x] 3.2 Render dynamic story, skills, and timer regions while preserving divider behavior and stable geometry reporting.
- [x] 3.3 Update Electron story overlay sizing so timer width is additive and timer-only mode is compact.

## 4. Verification

- [x] 4.1 Add focused tests for timer behavior, settings migration, shortcut dispatch, module combinations, history deletion, and overlay geometry.
- [x] 4.2 Run focused tests, Vite development build validation, full test suite, and strict OpenSpec validation; fix regressions without packaging.

## 5. Background interaction revision

- [x] 5.1 Default background pause to enabled and let the page button queue or cancel a foreground start without weakening shortcut gating.
- [x] 5.2 Add regression coverage and repeat focused, full-suite, Vite, and strict OpenSpec validation without packaging.

## 6. Timer presentation polish

- [x] 6.1 Remove the redundant overlay timer title, enlarge the timer digits, hide the running label, and prevent the history delete action from showing an overflow ellipsis.
- [x] 6.2 Add presentation regression coverage and repeat focused, Vite, and strict OpenSpec validation without packaging.
