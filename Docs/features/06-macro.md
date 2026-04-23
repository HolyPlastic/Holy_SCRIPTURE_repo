# Macro

**Files:** `js/main.js` -> `initMacro()`, `executeMacro()` | `jsx/hostscript.jsx` -> `HS_runMacro()`
**UI Section:** Macro Tab (`#tab-macro`)

An interface for chaining multiple saved library scripts together so they run sequentially as a single action.

---

## 6.1 Current Behaviour

The macro system has been reshaped (2026-04-13): the builder tab is removed and replaced with a lightweight "Manage Macros" dialog. New macros are created by Holy Agent; users manage existing ones via the MACROS button in the tab nav.

**Execution layer (unchanged):**
- `executeMacro(config, onComplete)` — runs a macro config object sequentially in JS.
- `castMacro(sourceMacro)` — convenience wrapper that calls `getMacroConfig()` then `executeMacro()`.
- `getMacroConfig(macro)` — builds a normalized config from a saved macro object.
- `normalizeMacroStep()` / `cloneMacroSteps()` — step normalization and deep clone.
- `getMacroHistoryCode(steps)` — builds the history label string for a macro run.
- `setStepStatus(stepId, status)` — sets CSS class on a `.macro-step` element (safely no-ops if element is absent).
- `ON ERROR` behaviour: `abort` halts on first failure; `continue` runs all steps.

**Bridge layer (unchanged in hostscript.jsx):**
- `HS_runMacro(macroId)` — loads macro from Holy Storage, executes steps via `HS_runScript`, returns the Holy Agent contract: `{ "success": true, "steps": [ { "id": "script_id", "success": true, "output": "...", "logs": [] }, ... ] }`.
- `HS_getMacros()` — returns metadata list for Holy Agent discovery.

**Manage Macros dialog:**
- Accessible via MACROS button in the tab nav bar.
- Lists all saved macros with name, step count, run (▶) and delete (✕) buttons.
- No build UI — macro creation is Holy Agent's responsibility.

**Pro tip toast:**
- One-time hint shown on panel load if `state.macros` has entries: "Ask Holy Agent to chain scripts and save as a macro."
- Dismissed via ✕ button; dismissed state persisted in `localStorage` as `hs_macro_tip_dismissed`.

---

## Open Bugs

*None currently logged.*

---

## Dev Log

- ~~1: Initial feature documentation. Flagged as dormant/undeveloped.~~ ✅ Fully implemented — see entries 2–5.
- 2: Implemented the macro execution layer. `main.js` now normalizes macro steps, preserves saved `onError` mode when casting stored macros, and captures per-step results during sequential execution. Added `HS_runMacro(macroId)` to `hostscript.jsx` so Holy Agent can trigger saved macros through the existing Scripture bridge once Agent-side wiring begins.
- 3: Locked the Agent-facing `HS_runMacro(macroId)` return shape to the exact `{ success, steps[] }` contract Holy Agent expects. Successful steps return `id`, `success`, `output`, and `logs`; failed steps return `id`, `success`, and a string `error`.
- 4: Added `HS_getMacros()` to `hostscript.jsx` for Holy Agent to discover saved macros. Returns `{ success, macros: [{ id, name, stepCount, onError, created }] }`.
- 5 (2026-03-26): Holy Agent bridge method `getMacroList()` added to `js/holy-agent-scripture.js` in the Holy Agent repo — `HS_getMacros` is now fully wired end-to-end. No Scripture-side changes required. Macro list is injected into the Holy Agent system prompt when macro intent is detected, allowing the AI to surface real macro names and IDs from the user's saved macro library rather than guessing from context.
- 6 (2026-04-13): Macros reshaped per work plan Section B.3. Builder UI stripped (`#tab-macro` panel, step picker, drag-reorder, save-builder controls, CAST MACRO button, builder CSS). Execution layer fully preserved: `executeMacro`, `normalizeMacroStep`, `cloneMacroSteps`, `getMacroHistoryCode`, `getMacroConfig`, `castMacro`, `setStepStatus`, `deleteMacro` all untouched. `HS_runMacro` and `HS_getMacros` in `hostscript.jsx` untouched. `state.macros` and `hs_macros` storage untouched. Added "Manage Macros" modal (`#modal-manage-macros`) accessible via MACROS button in tab nav — lists saved macros with run/delete. Added one-time pro tip toast (`#macro-pro-tip`). Holy Agent's `HolyAgent.Scripture.runMacro(id)` path is unaffected.
