## MODIFIED Requirements

### Requirement: Position the story overlay
The system SHALL initially place the story overlay at the top center, provide an always-visible three-dot drag handle as its only normal interactive drag region, allow it to be dragged, persist its last position, and keep the restored bounds within an available display.

#### Scenario: Discover and drag the overlay
- **WHEN** the story overlay is visible during gameplay
- **THEN** a visually distinct three-dot handle remains visible and dragging that handle moves the overlay while content outside the handle continues to pass mouse input through to the game

#### Scenario: Restore a valid saved position
- **WHEN** the overlay is reopened and its saved bounds remain on an active display
- **THEN** the overlay opens at the saved position

#### Scenario: Recover from display changes
- **WHEN** saved bounds are outside all active displays
- **THEN** the overlay returns to a visible top-center position on the primary display
