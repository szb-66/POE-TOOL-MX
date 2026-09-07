## 1. Strengthen selected chapter visual

- [x] 1.1 In `src/domains/story/StoryView.vue`, split the shared `.chapter-item.active, .step-item.active` rule at `:221` so chapters get a dedicated, more prominent `.chapter-item.active` rule (left accent bar via `border-left`, deeper background, bolder `.chapter-name`), keeping the existing `.step-item.active` rule for steps unchanged.
- [x] 1.2 Verify the strengthened selected treatment only applies to the current chapter (driven by the existing `chapter.id === story.currentChapterId` binding at `StoryView.vue:30`) and that unselected chapters render with their default appearance.

## 2. Move add-step control to end of step list

- [x] 2.1 In `src/domains/story/StoryView.vue`, remove the add-step `el-button` from the `steps-panel` `#header` slot (`:48`), leaving the chapter name input as the header's only content.
- [x] 2.2 Add a trailing `<div class="add-step-row">` with a full-width `el-button` (labeled "添加步骤", `:icon="Plus"`, `@click="story.addStep(story.currentChapter.id)"`) as the last element inside the `steps-panel` card body, after both the `el-empty` and `step-list` blocks so it renders in empty and non-empty states.
- [x] 2.3 Add scoped Less for `.add-step-row` (full-width row, top margin separating it from the last step, button stretched or centered per existing panel conventions).

## 3. Verify

- [x] 3.1 Run lint/typecheck (project script) and confirm no errors in `StoryView.vue`.
- [x] 3.2 Manually verify: selecting different chapters shows the prominent selected state and clears it on the previously selected one; adding a step from the new bottom row appends a step and selects it; the empty-chapter state shows the `el-empty` hint followed by the add-step row; no add-step control remains in the steps panel header.
