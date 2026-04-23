# Drag and Drop

**Files:** `js/main.js` → `initDragDrop()`
**UI Section:** Global Overlay (`#drag-overlay`)

Allows users to drag external code files directly into the panel to load them into the Editor.

~~> ⚠️ **LIMITATION: UNFINISHED MODULE**
> This feature is currently TBC / To Be Installed. The visual overlay elements exist in HTML/CSS, but the file reader and drop zone logic are disconnected or missing.~~

---

## 8.1 Current State

~~- A visual overlay (`DROP .JSX / .TXT HERE`) exists but is currently inert.
- See `ROADMAP.md` for the implementation plan.~~

**Fully implemented.** `initDragDrop()` at `main.js:2363–2434`. Handles `dragenter`, `dragover`, `dragleave`, and `drop` events on `document.body`. Accepts `.jsx`, `.js`, and `.txt` files via `FileReader`. If the Library tab is active, opens the save modal pre-filled with the filename; otherwise loads into the editor and switches to the editor tab.

---

## Open Bugs

*None.*

---

## Dev Log

- 1: Initial feature documentation. Flagged as TBC.

### Entry 2 — Full implementation confirmed (2026-04-12)
Doc-cleanup pass: the UNFINISHED MODULE banner was stale. `initDragDrop()` is fully implemented at `main.js:2363–2434` with `FileReader` for file content, `dragenter`/`dragover`/`dragleave`/`drop` handlers on `document.body`, and a `drag-active` CSS class for the overlay. Accepts `.jsx`, `.js`, `.txt`; routes to save modal (library tab) or editor (other tabs). Banner and "inert" status line struck through above.