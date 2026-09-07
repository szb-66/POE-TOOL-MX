## 1. Sorting Semantics

- [x] 1.1 Change the shared story reorder helper and store methods to use a final destination index.
- [x] 1.2 Add unit coverage for forward, backward, boundary, adjacent, no-op, invalid-ID, and object-identity behavior.

## 2. Live Drag Preview

- [x] 2.1 Replace the three duplicated drag-over states with a shared local preview controller.
- [x] 2.2 Render chapter, step, and skill-group cards in transient preview order and commit only on successful drop.
- [x] 2.3 Add card pointer feedback while preserving drag-handle and form-control cursor behavior.

## 3. Verification and Cleanup

- [x] 3.1 Add integration checks for midpoint preview, cancel cleanup, exact-index store calls, and removed legacy drag-over code.
- [x] 3.2 Run focused tests, the full test suite, production build, and inspect the final diff for obsolete failed-attempt code.
