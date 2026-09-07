## MODIFIED Requirements

### Requirement: Manage chapter guides
The system SHALL provide a story management page where users can add, rename, select, and delete chapters and add, edit, select, and delete ordered steps within each chapter. The selected chapter SHALL be visually prominent relative to unselected chapters, and the add-step control SHALL appear at the end of the step list rather than in a fixed header position.

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

#### Scenario: Highlight the selected chapter
- **WHEN** a chapter is the current chapter and the chapter list renders more than one chapter
- **THEN** the system renders that chapter with a visually prominent selected treatment (a left accent bar, a deeper background, and bolder name text) that is distinct from the treatment of unselected chapters

#### Scenario: Place the add-step control at the end of the step list
- **WHEN** the steps panel renders for the current chapter, whether the chapter has steps or is empty
- **THEN** the system renders the add-step control as the last element of the step list area, below the last step or below the empty-state hint, and does not render an add-step control in the steps panel header
