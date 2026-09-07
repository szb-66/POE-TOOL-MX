## ADDED Requirements

### Requirement: Use one stable application data directory
The application SHALL use the same `流放助手` user-data directory and current storage format in development and packaged execution.

#### Scenario: Launch development and packaged builds
- **WHEN** either build mode starts on the same Windows account
- **THEN** both modes resolve LocalStorage and application resources from the single `%APPDATA%/流放助手` directory

### Requirement: Keep the development storage origin stable
The development launcher SHALL always load the renderer from `http://localhost:3000` and MUST NOT silently select another port because LocalStorage is scoped to the renderer origin.

#### Scenario: Default development launch
- **WHEN** the development launcher starts and port 3000 is available
- **THEN** Vite and Electron both use `http://localhost:3000`

#### Scenario: Development port is occupied
- **WHEN** another process already listens on port 3000
- **THEN** the launcher exits with an actionable error instead of starting on another port with an empty LocalStorage origin

### Requirement: Do not load legacy storage formats
The application MUST NOT inspect, copy, parse, import, or merge data from legacy `Electron` directories, legacy LevelDB origins, migration snapshots, or migration markers.

#### Scenario: Legacy data exists beside the current directory
- **WHEN** the application starts and legacy directories or migration artifacts exist
- **THEN** the application ignores them and reads only the current data directory and current storage format

#### Scenario: Start with no current data
- **WHEN** the current data directory has not been created
- **THEN** Electron creates a clean current-format profile without attempting legacy recovery
