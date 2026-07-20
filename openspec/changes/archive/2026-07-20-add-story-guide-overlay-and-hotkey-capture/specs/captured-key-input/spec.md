## ADDED Requirements

### Requirement: Capture global shortcuts from keyboard input
The system SHALL configure every global shortcut through a focused keyboard-capture control instead of editable text.

#### Scenario: Capture a keyboard combination
- **WHEN** the focused control receives supported modifiers followed by a supported non-modifier key
- **THEN** it displays and submits one normalized Electron accelerator

#### Scenario: Capture an already registered combination
- **WHEN** the user starts capture and presses a combination such as Alt+1 that is currently registered globally
- **THEN** the system temporarily suspends global shortcut interception and captures the complete combination before restoring registrations

#### Scenario: Press only a modifier
- **WHEN** the focused control receives only Ctrl, Alt, Shift, or Meta
- **THEN** it remains in capture mode without submitting a value

#### Scenario: Cancel or clear capture
- **WHEN** the user presses Escape, or presses Backspace/Delete while capturing
- **THEN** the system cancels without changing the value, or clears the value respectively

#### Scenario: Prevent captured input propagation
- **WHEN** the control is in capture mode
- **THEN** captured keyboard events do not trigger page actions or other shortcut handlers

### Requirement: Validate the complete global shortcut set
The system SHALL validate shortcuts after normalization across every feature and SHALL reject duplicates, unsupported accelerators, F12, and Ctrl+Shift+I.

#### Scenario: Detect a cross-feature conflict
- **WHEN** a proposed shortcut matches another configured shortcut regardless of case or display alias
- **THEN** the system rejects the proposal and preserves the previous value

#### Scenario: Accept supported navigation keys
- **WHEN** the user captures PageUp or PageDown
- **THEN** the system stores and registers the corresponding valid Electron accelerator

### Requirement: Register and dispatch shortcuts centrally
The system SHALL register the complete shortcut collection at application scope and SHALL dispatch each trigger by its feature identifier through one renderer listener.

#### Scenario: Register shortcuts on startup
- **WHEN** the application main renderer is ready
- **THEN** item, map, stop, bag, combat, portal, and story shortcuts are registered without requiring their pages to be opened

#### Scenario: Update one shortcut
- **WHEN** the user successfully changes one shortcut
- **THEN** all configured shortcuts remain registered and each trigger continues to invoke exactly one action

#### Scenario: Registration fails
- **WHEN** Electron cannot register any shortcut in a proposed collection
- **THEN** the system restores the previous successfully registered collection and reports the failing accelerator

### Requirement: Migrate the legacy bag shortcut
The system SHALL use the unified global settings as the source of truth for the bag shortcut and SHALL migrate the legacy bag setting only when the unified value is absent.

#### Scenario: Migrate an existing bag shortcut
- **WHEN** unified settings lack `stashStart` and legacy bag settings contain a shortcut
- **THEN** the system copies the legacy value into the unified shortcut collection

#### Scenario: Preserve a new bag shortcut
- **WHEN** unified settings already contain `stashStart`
- **THEN** a differing legacy value does not overwrite it

### Requirement: Capture game action keys
The system SHALL use capture controls for single game action keys and an ordered tag editor for multi-key potion sequences.

#### Scenario: Capture a single action key
- **WHEN** the user captures the portal action key
- **THEN** the system stores one supported non-modifier key for the existing game-input workflow

#### Scenario: Build a potion key sequence
- **WHEN** the user captures multiple potion keys one at a time
- **THEN** the system appends each key as a removable tag and sends the sequence in displayed order

#### Scenario: Reorder a potion key sequence
- **WHEN** the user drags a potion key tag to a new position
- **THEN** the persisted sequence and runtime send order match the new tag order
