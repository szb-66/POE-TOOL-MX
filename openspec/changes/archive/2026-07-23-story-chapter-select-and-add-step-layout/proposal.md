## Why

The story page's selected chapter uses the same subtle `.active` treatment as a selected step (border + light background), so the active chapter barely stands out from its siblings. At the same time, the only "add step" entry point is pinned in the steps panel header, forcing the eye up to the title bar whenever the user wants to append another step — away from the step list they're actually working in.

## What Changes

- Strengthen the selected chapter's visual state so it is clearly distinguishable from unselected chapters (deeper background, left accent bar, bolder name), reusing the existing `.chapter-item.active` class rather than introducing new selection state.
- Move the "add step" control out of the steps panel header and place it as a full-width action row at the bottom of the step list (after the last step, after the empty-state hint), visible in both empty and non-empty chapter states.
- Remove the "add step" button from the steps panel header (`StoryView.vue:48`); the chapter name input remains the header's only content.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `story-guide`: The "Manage chapter guides" requirement gains presentational rules — the selected chapter SHALL be visually prominent relative to unselected chapters, and the add-step control SHALL appear at the end of the step list rather than in a fixed header position.

## Impact

- `src/domains/story/StoryView.vue` — template: relocate the add-step button from the `steps-panel` header to a trailing row inside the panel body; styles: strengthen `.chapter-item.active` and add styling for the trailing add-step row.
- `src/stores/story.js` — no changes (selection state `currentChapterId` already exists and drives `.active`).
- No data model, persistence, or navigation-flow changes; existing scenarios in `story-guide` remain valid.
- No new dependencies; Element Plus + scoped Less only.
