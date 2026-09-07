## MODIFIED Requirements

### Requirement: Custom background history
The application SHALL store only successfully imported custom files in background history and SHALL show that history only while custom background mode is selected and at least one history item exists.

#### Scenario: Select a history item
- **WHEN** the user selects an existing custom background history item
- **THEN** the application switches to custom mode and renders that item

#### Scenario: Select a non-custom mode
- **WHEN** the user selects default or no-background mode
- **THEN** existing custom history remains stored, no non-custom entry is added, and the history area is hidden

#### Scenario: Select custom mode with history
- **WHEN** the user selects custom background mode and at least one custom background history item exists
- **THEN** the application displays the custom background history area

#### Scenario: Select custom mode without history
- **WHEN** the user selects custom background mode and no custom background history item exists
- **THEN** the application does not display an empty custom background history area
