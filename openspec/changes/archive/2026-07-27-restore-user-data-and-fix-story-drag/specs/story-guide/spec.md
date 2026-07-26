## MODIFIED Requirements

### Requirement: Position the story overlay
The system SHALL initially place the story overlay at the top center, provide a separate always-visible native three-dot grip that can reliably receive mouse input while the content window remains click-through, move the content window as the grip is dragged, persist its last position, and keep the restored bounds within an available display.

#### Scenario: Drag through the native grip
- **WHEN** the user presses and drags the three-dot grip
- **THEN** the grip and story content move together while the remaining content area continues passing mouse input through to the game

#### Scenario: Preserve overlay size while dragging
- **WHEN** the user moves the story overlay repeatedly through the native grip
- **THEN** the content window keeps its configured width and measured height without cumulative resizing

#### Scenario: Restore a valid saved position
- **WHEN** the overlay is reopened and its saved bounds remain on an active display
- **THEN** the overlay and its grip open at the saved position

#### Scenario: Recover from display changes
- **WHEN** saved bounds are outside all active displays
- **THEN** the overlay and its grip return to a visible top-center position on the primary display

#### Scenario: Close the overlay
- **WHEN** the user hides or closes the story overlay
- **THEN** both the content window and the native grip window are closed without leaving an interactive invisible region
