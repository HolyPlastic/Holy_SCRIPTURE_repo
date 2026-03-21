# Holy Scripture — Plugin Specification

A Techno-Brutalist Adobe After Effects CEP panel designed for writing, storing, and executing ExtendScript on the fly. It serves as an integrated IDE and script library right inside the After Effects UI.

---

## 1. Execution Engine (Casting)

Takes code from the user interface, safely formats it, and executes it within the After Effects environment, capturing any resulting output or errors.

- Reads the raw string content from the active CodeMirror editor instance.
- Safely escapes the code and passes it across the CEP bridge.
- Wraps the code in an IIFE (Immediately Invoked Function Expression) inside AE to allow top-level `return` statements.
- Intercepts a custom `log()` command within the script to capture internal console logs.
- Returns a structured result (Success/Fail, Return Value, Logs, Error Trace) back to the UI to be logged in the History tab.

**Citations:** `js/main.js` → `runScript()` | `jsx/hostscript.jsx` → `HS_runScript()`

---

## 2. Persistence Engine

Maintains the user's library of saved scripts, quick-access slots, and execution history across sessions.

- Stores all data locally using the browser's `localStorage` API.
- Separates storage into four distinct buckets: Library, Slots, History, and Macros.
- **Note on State:** Currently, Slots and Library entries act as isolated clipboards. Saving to a slot duplicates the code; it does not create a live link to a Library entry. (This is a known architectural quirk flagged for roadmap updates).
- Caps the History log at 100 entries, pushing out the oldest entries when the limit is reached.

**Citations:** `js/main.js` → `saveToLibrary()`, `saveSlot()`, `recordHistory()`, `loadState()`

---

## 3. UI / Interaction Layer

The visual interface that manages code editing, modal popups, and navigation between feature tabs.

- **Editor:** Uses CodeMirror 5 with a custom "Obsidian Dark × Holy Plastic" CSS theme for syntax highlighting and line numbering.
- **Tab Navigation:** Hides and shows DOM sections based on the selected tab (Editor, Slots, Library, History, Macro).
- **Modals:** Uses custom HTML overlay modals (`#modal-overlay`) to handle user inputs (like naming a new saved script) without relying on native OS/App dialogs that block the host application.
- **Host Context Polling:** Intelligently polls After Effects every 2 seconds to fetch the active composition's details (Name, FPS, Layers, Timecode) and displays it in the top header.
- **Performance:** To prevent UI flicker and excessive bridge calls, the polling system automatically pauses when the CEP panel loses focus (`blur`), and resumes when it regains focus (`focus`).

**Citations:** `js/main.js` → `initTabs()`, `showModal()`, `initContextBar()`, `pollContext()`