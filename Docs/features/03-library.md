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
- **Load:** Injects the script's raw code directly into the Editor's CodeMirror instance, replacing whatever is currently there. (Note: Currently no warning is shown for unsaved Editor changes — this is flagged in `ROADMAP.md`).
- **Execute:** Sends the code directly to the Host Bridge without changing the Editor's content.

---

## Open Bugs

- **No Unsaved Changes Warning** — Loading a script from the library instantly overwrites the Editor, permanently deleting any unsaved work in the active CodeMirror instance.

---

## Dev Log

- 1: Initial feature documentation.