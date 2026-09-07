## ADDED Requirements

### Requirement: Keep personal overlay backgrounds outside the source repository
The application MUST persist imported overlay backgrounds and their personal selection state only in the stable user-data profile, LocalStorage, or system temporary storage, and MUST NOT write them into the source repository.

#### Scenario: Import a personal overlay background
- **WHEN** the user imports a local background in development or packaged execution
- **THEN** the copied file is stored below `%APPDATA%/流放助手/backgrounds` and no repository-tracked file is created or changed by the import
