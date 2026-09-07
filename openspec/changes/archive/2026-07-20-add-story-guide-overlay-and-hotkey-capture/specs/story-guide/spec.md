## ADDED Requirements

### Requirement: Manage chapter guides
The system SHALL provide a story management page where users can add, rename, select, and delete chapters and add, edit, select, and delete ordered steps within each chapter.

#### Scenario: Create and edit a chapter
- **WHEN** the user adds a chapter and enters its name and steps
- **THEN** the system persists the chapter and preserves the entered step order

#### Scenario: Reorder chapters
- **WHEN** the user drags a chapter to another position
- **THEN** the system persists the new chapter order and preserves the active progress identifiers

#### Scenario: Reorder steps
- **WHEN** the user drags a step to another position within its chapter
- **THEN** the system persists the new step order and immediately updates continuous navigation and the visible overlay

#### Scenario: Delete the active step
- **WHEN** the user deletes the currently selected step
- **THEN** the system selects the following navigable step, or the preceding step when no following step exists

#### Scenario: Delete a chapter
- **WHEN** the user confirms deletion of a chapter
- **THEN** the system removes its steps and skills and repairs the active progress to a neighboring navigable step

### Requirement: Navigate a continuous story flow
The system SHALL treat ordered steps from all chapters as one continuous navigation flow, skipping chapters without steps and stopping at the first and last available steps.

#### Scenario: Advance across a chapter boundary
- **WHEN** the current step is the last step of a chapter and the user invokes next step
- **THEN** the system selects the first step of the next non-empty chapter

#### Scenario: Move backward across a chapter boundary
- **WHEN** the current step is the first step of a chapter and the user invokes previous step
- **THEN** the system selects the last step of the previous non-empty chapter

#### Scenario: Navigate at a global boundary
- **WHEN** the user invokes previous at the first step or next at the last step
- **THEN** the current step remains unchanged and navigation does not wrap

#### Scenario: Select progress from the panel
- **WHEN** the user selects a step, or selects a chapter containing steps
- **THEN** the system sets the selected step, or that chapter's first step, as current progress

### Requirement: Persist story configuration and progress
The system SHALL persist normalized chapter data and the current chapter and step identifiers, while treating story overlay visibility as session-only state.

#### Scenario: Restore saved progress
- **WHEN** the application restarts with valid saved story data
- **THEN** the system restores the current chapter and step but leaves the story overlay hidden

#### Scenario: Load invalid saved references
- **WHEN** saved progress references a removed chapter or step
- **THEN** the system selects the first available step or an empty progress state without failing

### Requirement: Configure chapter-local skill groups
The system SHALL allow each chapter to independently contain an ordered collection of named skill groups, with addable and removable skills whose names are free text and whose colors are limited to red, green, or blue.

#### Scenario: Edit chapter skills
- **WHEN** the user adds, renames, recolors, or deletes skills in the selected chapter
- **THEN** the system persists the updated groups only on that chapter

#### Scenario: Reject invalid saved skill colors
- **WHEN** persisted data contains a skill color outside red, green, and blue
- **THEN** the system normalizes that skill to a supported default color

### Requirement: Display an independent story overlay
The system SHALL provide a story overlay independent of the existing crafting overlay and SHALL display the previous, current, and next steps with the current step at higher visual priority.

#### Scenario: Show the overlay
- **WHEN** the user enables the story overlay from the story page
- **THEN** an always-on-top overlay opens with the current chapter, three-step context, and chapter skills

#### Scenario: Update the overlay
- **WHEN** story content or current progress changes while the overlay is visible
- **THEN** the overlay updates immediately without closing or changing the crafting overlay

#### Scenario: Show chapter skills
- **WHEN** the current step belongs to a chapter with named skills
- **THEN** the overlay displays group names and red, green, or blue skill labels for that chapter

#### Scenario: Show empty story state
- **WHEN** no navigable step exists
- **THEN** the overlay displays a clear empty-state message rather than stale content

### Requirement: Position the story overlay
The system SHALL initially place the story overlay at the top center, allow it to be dragged, persist its last position, and keep the restored bounds within an available display.

#### Scenario: Restore a valid saved position
- **WHEN** the overlay is reopened and its saved bounds remain on an active display
- **THEN** the overlay opens at the saved position

#### Scenario: Recover from display changes
- **WHEN** saved bounds are outside all active displays
- **THEN** the overlay returns to a visible top-center position on the primary display
