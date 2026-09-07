## Context

The story page (`src/domains/story/StoryView.vue`) renders a chapters column, a steps panel, and a skill-groups panel. Selection state already lives in the Pinia store (`src/stores/story.js`) as `currentChapterId` / `currentStepId` and is already bound to an `.active` class on both chapter and step items (`StoryView.vue:30`, `:57`). The steps panel header (`StoryView.vue:44-50`) currently holds both the chapter name input and the "add step" button (`StoryView.vue:48`, `@click="story.addStep(...)`). Tech stack: Vue 3 `<script setup>`, Element Plus, scoped Less; no router-level selection.

## Goals / Non-Goals

**Goals:**
- Make the selected chapter visually distinct from unselected siblings without touching store state.
- Move the "add step" entry point to a full-width action row at the bottom of the step list, visible in both empty and non-empty states, and remove it from the steps panel header.

**Non-Goals:**
- No new selection state, no store changes, no data-model or persistence changes.
- No changes to step rendering, drag-and-drop, navigation flow, or the story overlay.
- No new dependencies or design tokens; reuse existing CSS variables (`--primary-color`, `--primary-light-9`, etc.) and the `.active` class convention already used on `.step-item`.

## Decisions

**D1 — Reuse `.chapter-item.active` rather than adding new state.**
The selection mechanism and class already exist (`StoryView.vue:30`, styled at `:221`). Adding a parallel "selected" concept would duplicate state. The change is purely visual: strengthen the existing `.active` rule for chapters (separate it from the shared rule with steps) with a deeper background, a left accent bar via `border-left`, and bolder chapter name text. Alternatives considered: a new `selectedChapterId` ref (rejected — duplicates `currentChapterId`); reusing the more prominent `SettingsView` `.active` style (rejected — different visual language from the rest of the story page).

**D2 — Move the add-step button to a trailing row inside the steps panel body.**
The button is currently in the `#header` slot of `el-card.steps-panel`. Move it to a `<div class="add-step-row">` rendered after the `el-empty` / `step-list` block, still inside the card body so it scrolls with the list. It remains a single `el-button` calling `story.addStep(story.currentChapter.id)`. Alternatives considered: keep the header button AND add a bottom button (rejected — user chose single entry point); render the button as the last item inside `step-list` `v-for` (rejected — couples control to data loop and breaks when chapter is empty); make it a floating sticky footer (rejected — user explicitly asked to not fix it to a bar).

**D3 — Keep the empty-state hint.**
The `el-empty` "添加本章的第一个步骤" hint (`StoryView.vue:51`) stays for the empty-chapter case; the trailing add-step row renders below it so the empty state still guides the user and the button is always reachable.

## Risks / Trade-offs

- [Visual prominence is subjective] → Mitigation: use existing `--primary-color` / `--primary-light-9` tokens so the strengthened state stays consistent with the rest of the app; confirm via the existing story page during implementation.
- [Trailing add-step row adds vertical scroll when many steps] → Mitigation: it lives inside the card body and scrolls with the list, so it does not steal screen real estate from a fixed bar; acceptable trade-off vs. the requested UX.
- [Removing the header button could surprise users who knew its old location] → Mitigation: the new row is labeled "添加步骤" and sits where focus already is (after the last step); no behavioral change to `addStep`.
