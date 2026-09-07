## MODIFIED Requirements

### Requirement: Use one stable application data directory
The application SHALL use the same `%APPDATA%/流放助手` durable application-data root in development, Electron compatibility, and Tauri execution. Durable product settings SHALL use a typed storage format independent of the renderer origin, while WebView caches and browser internals MAY use runtime-specific subdirectories.

#### Scenario: Launch development and packaged builds
- **WHEN** either Tauri build mode starts on the same Windows account
- **THEN** both modes resolve durable application resources and typed settings from the single `%APPDATA%/流放助手` root without depending on a shared browser LocalStorage origin

#### Scenario: Fall back to the frozen Electron version
- **WHEN** the user returns to the supported Electron baseline before Tauri cutover
- **THEN** existing Electron-compatible files remain present and were not destructively rewritten by an incomplete Tauri migration

### Requirement: Keep the development storage origin stable
The development launcher SHALL always load the renderer from `http://localhost:3000` and MUST NOT silently select another port, so development navigation, WebView permissions and migration tests use a deterministic origin even though durable settings no longer rely on LocalStorage.

#### Scenario: Default development launch
- **WHEN** the development launcher starts and port 3000 is available
- **THEN** Vite and Tauri both use `http://localhost:3000`

#### Scenario: Development port is occupied
- **WHEN** another process already listens on port 3000
- **THEN** the launcher exits with an actionable error instead of starting on another port with different WebView permissions or temporary state

### Requirement: Migrate the supported Electron storage format
On first Tauri execution, the application MUST inspect a stable snapshot of the current Electron profile, import only supported files and whitelisted LocalStorage settings, and record an idempotent migration result. It MUST NOT scan unrelated legacy directories or merge unknown storage formats.

#### Scenario: Supported Electron data exists
- **WHEN** the Tauri migration has not completed and the current `%APPDATA%/流放助手` Electron profile is readable
- **THEN** the application imports supported data through the defined migration contract while leaving the source unchanged

#### Scenario: Start with no current data
- **WHEN** neither supported Electron data nor current Tauri data exists
- **THEN** Tauri creates a clean current-format profile without searching unrelated historical directories

### Requirement: Keep personal overlay backgrounds outside the source repository
The application MUST persist imported overlay backgrounds and their personal selection state only below the stable user-data root, the typed settings repository, or system temporary storage, and MUST NOT write them into the source repository or WebView cache as the sole copy.

#### Scenario: Import a personal overlay background
- **WHEN** the user imports a local background in development or packaged execution
- **THEN** the copied file is stored below `%APPDATA%/流放助手/backgrounds`, its selection is available after Tauri restart, and no repository-tracked file is created or changed

