# Slots

**Files:** `js/main.js`
**UI Section:** Slots Tab (`#tab-slots`)

Quick-access script slots intended for fast, repetitive execution without needing to load code into the Editor.

*For how data is saved to `localStorage`, see the Storage Layout section in `Docs/ARCHITECTURE.md`.*

---

## 2.1 Execution

Clicking a slot instantly passes its stored code string to the Host Bridge for execution. Like the Editor, the results are logged in the History tab.

> ⚠️ **TRAP: Disconnected State**
> Slots carry a `libraryId` field. When it is `null`, the slot is an isolated clipboard — updating the library entry will not update the slot. When `libraryId` is set (populated via library-link, not yet exposed in UI), `quickOverwrite()` syncs the slot's `code` and `name` whenever the library entry is overwritten. Agents must not assume sync occurs unless `libraryId` is non-null.

## 2.2 Adding Slots

New slots are added via the UI.
- They currently lack syntax highlighting.
- ~~The UI does not natively support drag-and-drop repositioning (flagged in `ROADMAP.md`).~~

---

## Open Bugs

- ~~**Slots vs. Library Tangle** — The UX and data flow between Slots and Library act as isolated clipboards rather than a unified system. (Resolution planned via synchronization task in `ROADMAP.md`).~~ ~~Partially resolved — see Dev Log entry 8. Full UI for linking a slot to a library entry not yet built.~~ Fully resolved — see Dev Log entry 9.

---

## Dev Log

- 1: Initial feature documentation. Explicitly noted the disconnected state between slots and library items.
- 2: Implemented native HTML5 drag-and-drop reordering for slot entries. Each `.slot-item` is now `draggable=true` and carries a `.slot-drag-handle` (⠿) as a visual affordance. Module-level `slotDragSrcId` tracks the dragged slot by ID. On `drop`, `state.slots` is spliced to the new position and immediately persisted via `saveSlots()`, then `renderSlots()` repaints. Interactive children (inputs, textareas, buttons) cancel `dragstart` via tag-name guard to prevent accidental drags during text editing. CSS: `.slot-item.drag-over` shows accent inset box-shadow + veil background; `.slot-item.dragging` fades to 40% opacity. `e.stopPropagation()` on `drop` prevents the body file-import handler from firing.
- 3: Upgraded `#slots-list` to a `display: flex; flex-wrap: wrap` grid. Each `.slot-item` is `flex: 1 1 50%; min-width: 160px` — guarantees at most two per row; a lone item grows to fill the full row width. Grid borders: `#slots-list` provides the left edge (`border-left`); each item provides right + bottom edges, creating a seamless grid with no double borders. Drag-and-drop works in 2D — the HTML5 API fires `dragover`/`drop` on whichever item is under the cursor regardless of axis, so the index-splice logic handles horizontal and vertical reordering identically. Also added mouse-wheel tab cycling: hovering `#tab-nav` and scrolling moves to the next/previous tab (wraps around), implemented in `initTabs()` via a non-passive `wheel` listener.
- 4: Replaced the `drag-over` box-shadow indicator with directional `insert-before` / `insert-after` CSS classes using `::before`/`::after` pseudo-elements. On `dragover`, `e.clientX` is compared against the midpoint of the target's bounding rect — left half sets `insert-before`, right half sets `insert-after`. Each class renders a 3 px accent-coloured bar with an 8 px glow (`box-shadow`) on the slot's left or right edge respectively, plus a subtle `var(--accent-veil)` background tint on the whole target. The drop splice now correctly adjusts the destination index when the source precedes the destination (`adjustedDst = dstIdx > srcIdx ? dstIdx - 1 : dstIdx`). `dragend` and `drop` both clear the zone classes and reset `slotDropBefore = true`.
- 5: Added per-slot `size` property (`'full'` | `'half'`, default `'full'`). Full slots use `flex: 0 0 100%; box-sizing: border-box` — they always occupy an entire row. Half slots use `.slot-half { flex: 1 0 50%; min-width: 160px }` — a lone half slot grows to fill its row; two adjacent half slots sit side-by-side at 50% each. A small `slot-size-btn` button is rendered in each slot header, labelled with the width it will switch TO (`50%` when full, `100%` when half). The button is accent-tinted when the slot is already half-width as a state indicator. Old slots loaded from `localStorage` without a `size` key default to `'full'` (falsy guard in `renderSlots`). `makeSlot()` now includes `size: 'full'` explicitly.
- 6: Replaced the directional insert-before/insert-after drag system with a gesture-based system where the drop gesture determines both insertion point and resulting slot size. Two drop types: **Preview Box** (cursor in slot body) and **Border** (cursor within 10 px of a row or column gap). Preview Box divides the hovered slot into thirds — left/right thirds show a half-width accent-outlined ghost placeholder (`.slot-drop-preview.slot-preview-half`) and coerce the target slot to half on drop; centre third shows a full-width ghost placeholder and always results in `size: 'full'`. Border drops show a glowing 3 px accent bar (`.slot-border-bar-h` horizontal between rows, `.slot-border-bar-v` vertical between two half slots); row borders produce `size: 'full'`, column borders produce `size: 'half'` and convert the displaced right-half slot to `size: 'full'`. Drag events are now delegated to `#slots-list` rather than bound per-item, eliminating flicker when the cursor crosses child elements. Ghost drag image suppressed via `dataTransfer.setDragImage` with a 1×1 transparent GIF. Cursor hidden during drag via `body.slot-dragging * { cursor: none !important }`. Module-level `slotDropBefore` removed; replaced by `slotDropInfo` object. `#slots-list` gained `position: relative` to anchor the absolutely-positioned border bar overlays.
- 7: Fixed three bugs introduced in entry 6. (a) `e.preventDefault()` in the `dragover` handler was placed after an early-return guard that checked for a `.slot-item` target — because the preview box div is not a `.slot-item`, hovering over it caused the handler to bail before calling `e.preventDefault()`, so the browser never fired `drop`, making all preview-box drops silently fail. Fixed by moving `e.preventDefault()` unconditionally before the item guard. (b) The `cursor: none` CSS rule applied to `body.slot-dragging *` could persist if `dragend` did not fire cleanly (OS-cancelled drags etc.), permanently hiding the cursor. Rule removed entirely along with the JS that added/removed the `slot-dragging` class. (c) Stripped the slot-index number (pink/red readout) and the slot-size-btn (50%/100% toggle) from the slot header HTML to reclaim width for the name input. Corresponding dead CSS blocks (`.slot-index`, `.slot-size-btn` and related state variants) removed. Shortcut button horizontal padding reduced (`1px 6px` → `1px 3px`). Del-icon given a scoped override (`.slot-header .del-icon`) with tighter padding and no min-width so it sits compact without shrinking the ✕ glyph.
- 8: Added `libraryId: null` field to the slot data model (`makeSlot()`). When non-null, `quickOverwrite()` in the editor syncs the matching slot's `code` and `name` automatically on overwrite. UI for setting `libraryId` on an existing slot not yet built — slots remain isolated clipboards by default.
- 9 (2026-04-13): Added Slot → Library Link UI (B.1). Each slot header now renders a compact `<select class="slot-lib-link">` dropdown populated from `state.library.scripts`. Selecting an entry sets `slot.libraryId`, immediately pulls the library entry's code and name into the slot, and renders a `⇌ LINKED` badge. The linked slot's textarea is set to `readonly` (visual indicator only — user can unlink at any time by choosing `— LINK LIBRARY —`). The `quickOverwrite()` sync-on-overwrite path that was already in place now has a corresponding UI entry point.