# stable-user-data Specification

## Purpose

定义开发版与正式版在同一 Windows 账户下共享稳定用户数据目录和当前存储格式、固定开发服务器来源，并明确禁止读取、迁移或合并任何旧版存储数据的完整行为边界。

## Requirements

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

### Requirement: Keep personal overlay backgrounds outside the source repository
The application MUST persist imported overlay backgrounds and their personal selection state only in the stable user-data profile, LocalStorage, or system temporary storage, and MUST NOT write them into the source repository.

#### Scenario: Import a personal overlay background
- **WHEN** the user imports a local background in development or packaged execution
- **THEN** the copied file is stored below `%APPDATA%/流放助手/backgrounds` and no repository-tracked file is created or changed by the import
