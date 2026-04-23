# # Library

**Files:** `js/main.js`
**UI Section:** Library Tab (`#tab-library`)

The persistent storage area for saved scripts and categories. Acts as a script manager where users can organize their snippets, load them into the Editor, or execute them directly.

*For how data is saved to `localStorage`, see the Storage Layout section in `Docs/ARCHITECTURE.md`.*

---

## 3.1 Organization

Scripts are stored as an object containing arrays for `categories` and `scripts` (`hs_library` in `localStorage`).
- Users can create new categories via the Save modal in the Editor.
- The Library UI groups scripts visually by these categories.

## 3.2 Loading vs. Executing

The Library provides two distinct actions for every saved script:
- **Load:** Calls `loadLibraryScriptToEditor()`, which sets `state.activeScript`, clears `state.isDirty`, restores any saved params, and switches to the Editor tab. If the editor has unsaved changes (`state.isDirty`), a custom HTML confirmation modal is shown first.
- **Execute:** Sends the code directly to the Host Bridge without changing the Editor's content.

---

## Open Bugs

- ~~**No Unsaved Changes Warning** — Loading a script from the library instantly overwrites the Editor, permanently deleting any unsaved work in the active CodeMirror instance.~~ Resolved — see Dev Log entry 2.

---

## Dev Log

- 1: Initial feature documentation.
- 2: Load path now routes through `loadLibraryScriptToEditor()`. Sets `state.activeScript` and `state.isDirty = false` on load. Unsaved-changes guard fires a custom HTML modal (`#modal-unsaved`) if `state.isDirty` is true when loading — no native `confirm()`. `renderLibrary()` now calls `rebuildScriptDropdown()` after every render so the editor header dropdown stays in sync.
- 3: Agent Library toggle button stub added (`#btn-agent-library`). Appears only when Library tab is active — `switchTab()` sets `display: inline-block` / `none`. Sits absolute bottom-right of `#app` at 8px mono, opacity 0.35. Intentionally low-visibility: not hidden, not promoted, not labelled as a feature. No click handler implemented yet — waiting on Phase 9 Agent Library view. See ARCHITECTURE.md entry 6.
- 4: Library tab now supports two modes. User Library remains the editable `hs_library` view; Agent Library is a separate read-only view backed by `hs_agent_library`. The same toolbar is reused, but import is hidden in agent mode and list rendering switches to curated metadata with run-only actions.
