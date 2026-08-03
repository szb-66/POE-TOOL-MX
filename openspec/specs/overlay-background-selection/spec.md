# overlay-background-selection Specification

## Purpose

让用户能够明确选择覆盖层的默认、无背景或自定义背景状态，并通过一致且安全的选择或拖拽流程导入个人图片与视频。

## Requirements

### Requirement: Explicit background modes
The application SHALL expose `default`, `none`, and `custom` overlay background modes and persist the selected mode.

#### Scenario: Select the built-in default
- **WHEN** the user selects the default background mode
- **THEN** the overlay renders the bundled default background

#### Scenario: Select no background
- **WHEN** the user selects the no-background mode
- **THEN** the overlay renders no image or video while continuing to apply the configured mask opacity

#### Scenario: Select a custom background
- **WHEN** the user imports or selects a valid custom background
- **THEN** the overlay renders that file and persists custom mode

### Requirement: Migrate legacy background settings
The application SHALL derive an explicit mode when loading settings that predate the background-mode field.

#### Scenario: Legacy custom path exists
- **WHEN** legacy settings contain a non-empty background path and no mode
- **THEN** the application loads custom mode with that path

#### Scenario: Legacy custom path is empty
- **WHEN** legacy settings contain no background mode and an empty or missing path
- **THEN** the application loads default mode

### Requirement: Import backgrounds by selection or drag and drop
The application SHALL accept exactly one local jpg, jpeg, png, gif, webp, mp4, webm, ogg, or mov file through either the file chooser or drag and drop, using the same validation and storage behavior.

#### Scenario: Import a supported file
- **WHEN** the user chooses or drops one supported local file
- **THEN** the application copies it to the background user-data directory, switches to custom mode, and adds it to custom background history

#### Scenario: Reject an invalid drop
- **WHEN** the user drops multiple files, a directory, a file without a local path, or an unsupported format
- **THEN** the application displays an actionable error and leaves the selected background unchanged

### Requirement: Custom background history
The application SHALL store only successfully imported custom files in background history.

#### Scenario: Select a history item
- **WHEN** the user selects an existing custom background history item
- **THEN** the application switches to custom mode and renders that item

#### Scenario: Select a non-custom mode
- **WHEN** the user selects default or no-background mode
- **THEN** existing custom history remains available and no non-custom entry is added
