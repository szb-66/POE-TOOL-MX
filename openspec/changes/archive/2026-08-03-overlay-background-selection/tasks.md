## 1. Background State and Rendering

- [x] 1.1 Add background mode constants and normalization/migration helpers with unit tests
- [x] 1.2 Persist/reset explicit background mode and keep custom history behavior consistent
- [x] 1.3 Render built-in, none, and custom image/video backgrounds according to the normalized mode

## 2. Secure Background Import

- [x] 2.1 Add shared main-process validation/copy logic for chooser and drag imports
- [x] 2.2 Expose safe dropped-file path resolution and dedicated import IPC, removing the orphaned bridge API
- [x] 2.3 Add tests for supported files and invalid import cases

## 3. Settings Interaction

- [x] 3.1 Add the three-mode selector and a click/drop custom background area
- [x] 3.2 Handle drag highlighting, browser default prevention, errors, successful imports, and history selection

## 4. Verification

- [x] 4.1 Run OpenSpec validation, unit tests, and the non-packaging development build checks
- [x] 4.2 Audit tracked/staged files for personal paths, credentials, user backgrounds, and runtime configuration
