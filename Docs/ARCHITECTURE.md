# Architecture

Cross-cutting systems. Read this when touching storage, the host bridge, shared utilities, or anything that spans multiple features.

---

## How to Use This Document

**Critical Rules** are codebase-wide constraints that every agent must know before making any change. Added sparingly — only when a discovery is fundamental enough that ignoring it would cause real damage. If in doubt, it belongs in a feature doc or as a Trap instead.

**Traps** are silent failure modes — things that break with no error output.

**Known Limitations** are permanent or semi-permanent constraints — not bugs, just conditions we work within. When a limitation is resolved: apply ~~strikethrough~~ and log the fix in the Global Dev Log. Do not delete.

---

## Critical Rules

- **No Native Modals:** Never use native ExtendScript alert(), confirm(), or prompt(). They look off-brand and can lock up the After Effects UI. Always use the custom HTML/CSS modal system built into index.html.
- **Stringify Code Before Eval:** When passing user code to After Effects via evalScript, it must be wrapped in JSON.stringify(). Passing raw multi-line strings will cause silent parsing failures in the CEP bridge.
- **ExtendScript IIFE:** User code evaluated in AE is wrapped in an Immediately Invoked Function Expression (IIFE) so that return statements work naturally without throwing syntax errors.

---

## Traps

**⚠️ TRAP: CEP Storage Corruption**
If invalid JSON is written to localStorage, the entire persistence layer can crash on the next load, resulting in a blank UI or frozen state. Always wrap JSON.parse(localStorage.getItem(...)) in a try...catch block and fall back to a safe default.

Example of defensive pattern:
let data = [];
try {
    const raw = localStorage.getItem('hs_slots');
    if (raw) data = JSON.parse(raw);
} catch (e) {
    console.error('Storage corrupt, resetting slots', e);
    data = []; 
}

---

## Known Limitations

- **localStorage Volatility:** localStorage is tied to the CEP extension environment. If the user clears their CEP cache or reinstalls their OS, all saved scripts are lost. (Fix planned via JSON Export/Import in ROADMAP.md).
- **No Undo History in AE:** Scripts executed via this panel do not automatically group into a single undo step in After Effects unless the user explicitly writes app.beginUndoGroup() and app.endUndoGroup() in their script.

---

## Host Bridge

The communication layer between the CEP HTML panel (Chromium) and the After Effects host environment (ExtendScript).

**Files:** js/main.js → evalScript(), runScript() | jsx/hostscript.jsx → HS_runScript(), HS_getContext()

- **Calling Convention:** The panel uses cs.evalScript() from CSInterface.js.
- **Execution Payload:** Code is passed as HS_runScript(${JSON.stringify(code)}). 
- **Return Format:** The ExtendScript side always returns a JSON string to the panel, which must be parsed. Format: { success: boolean, output: string, logs: array, error: object }.
- **Custom Logging:** hostscript.jsx overrides the global environment to inject a custom log() function. This allows user scripts to write console-like outputs directly to the panel's History tab without triggering AE alerts.

---

## Storage Layout

The primary persistence engine relies on CEP's window.localStorage. Data is saved as stringified JSON arrays/objects.

**Keys:**
- hs_slots: Array of slot objects { id, name, code, ... }.
- hs_library: Object containing { categories: [...], scripts: [...] }.
- hs_history: Array of execution logs, capped at 100 entries.
- hs_macros: Array of saved macro chains (Currently undeveloped).

**Lifecycle:**
Data is read synchronously on DOMContentLoaded via init(). It is written immediately whenever a user clicks a Save, Add, or Clear button. There is no auto-save for the current working state of the Editor.

---

## Global Dev Log

*Log here only when a cross-cutting system changes — not for feature-level work. Feature changes go in the relevant feature doc.*

- 1: Initial architecture documented. Documented host bridge JSON execution flow and localStorage layout.
- 2: Fixed mouse-wheel scrolling in Slots, Library, and History tab panels. Root cause: `#slots-list`, `#library-list`, and `#history-list` lacked `min-height: 0` — without it, flex children cannot shrink below their content height, so `overflow-y: auto` never activates. Added `min-height: 0` to all three. The Editor tab was unaffected because `#editor-container` already carried `min-height: 0`.