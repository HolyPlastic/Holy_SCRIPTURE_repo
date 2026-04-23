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

- **~~localStorage Volatility~~:** ~~localStorage is tied to the CEP extension environment. If the user clears their CEP cache or reinstalls their OS, all saved scripts are lost. (Fix planned via JSON Export/Import in ROADMAP.md).~~  Resolved — see Global Dev Log entry 3.
- **No Undo History in AE:** Scripts executed via this panel do not automatically group into a single undo step in After Effects unless the user explicitly writes app.beginUndoGroup() and app.endUndoGroup() in their script.

---

## Host Bridge

The communication layer between the CEP HTML panel (Chromium) and the After Effects host environment (ExtendScript).

**Files:** js/main.js → evalScript(), runScript() | jsx/hostscript.jsx → HS_runScript(), HS_getContext(), HS_saveData(), HS_loadData(), HS_exportScript(), HS_getDataDir()

- **Calling Convention:** The panel uses cs.evalScript() from CSInterface.js.
- **Execution Payload:** Code is passed as HS_runScript(${JSON.stringify(code)}). 
- **Return Format:** The ExtendScript side always returns a JSON string to the panel, which must be parsed. Format: { success: boolean, output: string, logs: array, error: object }.
- **Custom Logging:** hostscript.jsx overrides the global environment to inject a custom log() function. This allows user scripts to write console-like outputs directly to the panel's History tab without triggering AE alerts.
- **Holy Agent Macro Contract:** `HS_runMacro(macroId)` is consumed by Holy Agent through the existing Scripture bridge. It must return a JSON string in this exact shape: `{ "success": true, "steps": [ { "id": "script_id", "success": true, "output": "...", "logs": [] }, { "id": "script_id_2", "success": false, "error": "..." } ] }`. Do not rely on extra top-level fields, do not return nested error objects for steps, and do not use `/tmp/` writes or `#include` directives.

**âš ï¸ TRAP: ExtendScript ES3 Parse Failures**
When editing `.jsx` files, remember the cross-workspace ES3 traps from the root `AGENTS.md`: reserved words used as unquoted object keys and function declarations inside block statements can silently break the entire file. Use quoted keys where needed, and use function expressions inside `if`/`try`/loops instead of block-scoped function declarations.

---

## Storage Layout

The primary persistence engine relies on CEP's window.localStorage. Data is saved as stringified JSON arrays/objects.

**Keys:**
- hs_slots: Array of slot objects { id, name, code, libraryId, ... }.
- hs_library: Object containing { categories: [...], scripts: [...] }.
- hs_history: Array of execution logs, capped at 100 entries.
- hs_macros: Array of saved macro chains. ~~(Currently undeveloped)~~ ✅ Implemented — `executeMacro()`, `castMacro()` in `main.js`; `HS_runMacro()`, `HS_getMacros()` in `hostscript.jsx`. See `Docs/features/06-macro.md` and Global Dev Log entries 4–5.

**Lifecycle:**
Data is read synchronously on DOMContentLoaded via init(). It is written immediately whenever a user clicks a Save, Add, or Clear button. There is no auto-save for the current working state of the Editor.

**Dual-write layer:** All reads/writes now go through the `storage` abstraction in `main.js` (`storage.get`, `storage.set`, `storage.removeItem`). In CEP mode, every write also fires an async `cs.evalScript('HS_saveData(...)')` call to persist the same data as a `.json` file in the user's Holy Storage folder. Reads still come from `localStorage` (synchronous, available on DOMContentLoaded). In dev/browser mode, only `localStorage` is used — the file write is skipped silently.

---

## Global Dev Log

*Log here only when a cross-cutting system changes — not for feature-level work. Feature changes go in the relevant feature doc.*

- 1: Initial architecture documented. Documented host bridge JSON execution flow and localStorage layout.
- 2: Fixed mouse-wheel scrolling in Slots, Library, and History tab panels. Root cause: `#slots-list`, `#library-list`, and `#history-list` lacked `min-height: 0` — without it, flex children cannot shrink below their content height, so `overflow-y: auto` never activates. Added `min-height: 0` to all three. The Editor tab was unaffected because `#editor-container` already carried `min-height: 0`.
- 3: Storage migration. All `localStorage` calls replaced with a `storage` abstraction in `main.js`. In CEP mode every write dual-writes to `%APPDATA%\Roaming\Holy Storage\Holy_Scripture\<key>.json` via `HS_saveData()` in `hostscript.jsx`. Added `HS_loadData()`, `HS_exportScript()`, and `HS_getDataDir()` to the host bridge. `HS_getDataDir()` uses `Folder.userData` (no hardcoded paths) and creates the folder chain on first use. `HS_exportScript()` writes named `.jsx` files to the same folder. localStorage Volatility limitation resolved.
- 4: Added macro bridge support. `hostscript.jsx` now exposes `HS_runMacro(macroId)`, which loads `hs_macros` and `hs_library` from Holy Storage, resolves each step to the latest saved script when possible, executes the chain through `HS_runScript()`, and returns structured per-step results for downstream callers such as Holy Agent.
- 5: Locked the `HS_runMacro(macroId)` return shape to Holy Agent's bridge contract. Documented the exact JSON payload in the Host Bridge section and simplified step failures to string `error` values so Agent-side consumption requires no retrofit.
- 6: Phase 9 Agent Library toggle stub added. `#btn-agent-library` added to `index.html` as a direct child of `#app` (after `#tab-content`). Absolutely positioned bottom-right of the panel (5px/5px), 8px mono font, opacity 0.35 — intentionally low-visibility, not hidden. `switchTab()` in `main.js` drives `display` so the button only appears when the Library tab is active. CSS block added to `style.css` above the `/* ── LIBRARY TAB */` section. No click handler yet — stub is wired ready for Phase 9 Agent Library view toggle to be implemented in a future session.
- 7: Phase 9 core Agent Library implementation. Added `hs_agent_library` as a separate seeded storage payload and introduced `js/seed-agent-library.js` with the first 8 adapted agent scripts. `main.js` now tracks `libraryMode`, renders a read-only Agent Library view inside the existing Library tab, hides import in agent mode, and uses the bottom-right toggle to switch views. `hostscript.jsx` now exposes `HS_getAgentScripts()` and `HS_runAgentScript(id, argsJson)` for metadata discovery and id-based execution against the curated store.
- 8: Holy Scripture now re-evaluates `jsx/hostscript.jsx` on every panel load via `$.evalFile(...)` during startup. This fixes the CEP behavior where panel HTML/JS reloads do not automatically refresh newly added JSX bridge functions, which was preventing Phase 9 Agent Library APIs from existing at runtime until a full AE restart.
- 9: Agent Library seed migration added. The initial curated payload format was incompatible with `HS_runScript()` because it double-wrapped scripts in an IIFE. `js/seed-agent-library.js` now stores plain script bodies instead, exposes a `version` field, and `main.js` reseeds `hs_agent_library` automatically when the stored version is older than the bundled seed.
- 10 (2026-04-13): Three features added per work plan Section B. (1) Slot → Library Link UI: slot header gains a `slot-lib-link` select dropdown populated from `state.library.scripts`; selecting an entry sets `slot.libraryId`, syncs code/name immediately, shows `⇌ LINKED` badge, and marks the textarea readonly. (2) Agent Library args UI: `renderAgentLibrary()` now exposes an expandable `agent-args-panel` per script using `argsSchema` — enum fields become `<select>`, booleans become checkboxes, numbers become number inputs; args are passed to `runAgentLibraryScript()` on run. (3) Macros reshape: `#tab-macro` panel and builder controls removed; execution layer (`executeMacro`, `normalizeMacroStep`, `cloneMacroSteps`, `getMacroHistoryCode`, `getMacroConfig`, `castMacro`, `setStepStatus`, `deleteMacro`) fully preserved; `HS_runMacro`/`HS_getMacros` in `hostscript.jsx` untouched; replaced with `#modal-manage-macros` dialog (MACROS button in tab nav) and pro tip toast.
