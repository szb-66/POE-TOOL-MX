## 1. Position Resolution

- [x] 1.1 Add a pure crafting-overlay bounds resolver for valid saved coordinates, fixed sizing, multi-display validation, and primary-display fallback.
- [x] 1.2 Add unit tests for primary and negative-coordinate displays, invalid values, removed displays, and fixed-size defaults.

## 2. Window Lifecycle Persistence

- [x] 2.1 Restore `craftingOverlayBounds` when creating the crafting overlay and persist debounced move events through the existing merged window state.
- [x] 2.2 Flush the final crafting overlay position before close while preserving the existing drag, mouse passthrough, and IPC behavior.

## 3. Validation

- [x] 3.1 Run focused overlay tests and confirm persisted state does not replace unrelated window-state fields.
- [x] 3.2 Run the full test suite, Vite build, and strict OpenSpec validation without packaging.
