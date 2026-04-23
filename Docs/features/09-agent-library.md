# Agent Library

**Files:** `js/seed-agent-library.js`, `js/main.js`, `jsx/hostscript.jsx`, `index.html`
**UI Section:** Library Tab (`#tab-library`) via the bottom-right `#btn-agent-library` toggle

A permanent, read-only library of pre-seeded ExtendScript utilities for Holy Agent and other orchestration callers. Stored separately from the user library under `hs_agent_library` so curated scripts never mix with user-authored scriptures.

See also: `Docs/ARCHITECTURE.md` Host Bridge and Storage Layout.

---

## 9.1 Storage

The agent library persists under the dedicated `hs_agent_library` key. `js/seed-agent-library.js` seeds the first payload if the key is missing, and `main.js` relies on the existing `storage` abstraction so CEP writes also land in Holy Storage JSON files.

Initial seed includes 8 adapted scripts:

- `agent_null_from_layers`
- `agent_batch_rename`
- `agent_layer_stagger`
- `agent_smart_precompose`
- `agent_fit_to_comp`
- `agent_trim_comp`
- `agent_project_overview`
- `agent_label_layers`

Each seeded script has had the adobe-agent-skills source adapted to avoid `#include`, `/tmp/`, and file-based argument passing.

## 9.2 UI

The Agent Library shares the existing Library tab rather than introducing a new top-level tab. The small bottom-right toggle flips between:

- User Library (`hs_library`)
- Agent Library (`hs_agent_library`)

Agent mode is intentionally read-only:

- no load-to-editor action
- no delete action
- no import button
- run only

This keeps the curated library separate from the user's editable scripture collection.

## 9.3 Host Bridge

`hostscript.jsx` now exposes:

- `HS_getAgentScripts()` -> metadata only, for discovery
- `HS_runAgentScript(id, argsJson)` -> executes a seeded script by id

`HS_runAgentScript()` injects parsed args through `$.global.__holyScriptureAgentArgs`, runs the stored code through `HS_runScript()`, then unwraps the inner JSON payload so callers still receive the normal `{ success, output, logs, error }` shape plus parsed `data`.

---

## Open Bugs

- ~~Agent Library scripts currently run with empty args from the panel UI. The bridge accepts `argsJson`, but there is no argument-entry UI for curated scripts yet.~~ FIXED — see Dev Log entry 5.

---

## Dev Log

- 1: Phase 9 initial implementation. Added `hs_agent_library` seeding via `js/seed-agent-library.js` with the first 8 adapted scripts from `External Resources/adobe-agent-skills-main`. Library tab can now switch between user scripts and a read-only Agent Library view using the low-visibility bottom-right toggle.
- 2: Added host bridge discovery/execution APIs. `HS_getAgentScripts()` returns metadata only; `HS_runAgentScript(id, argsJson)` resolves the stored code by id, injects args via a temporary global, executes through `HS_runScript()`, and unwraps the inner payload into the standard bridge result shape for downstream callers such as Holy Agent.
- 3: Fixed JSX bridge reload behavior. Holy Scripture now calls `$.evalFile()` on `jsx/hostscript.jsx` during panel startup so newly added Agent Library bridge methods actually exist after a panel reload, without requiring a full After Effects restart.
- 4: Fixed the seeded script format. The initial Agent Library payload stored each script as a self-invoking function, but `HS_runScript()` already wraps incoming code in its own IIFE, so successful runs were returning `undefined` output and hiding real results. Seeded scripts are now stored as plain script bodies with top-level `return JSON.stringify(...)`, and the seed version was bumped so existing `hs_agent_library` payloads auto-refresh on next load.
- 5 (2026-04-13): Added Agent Library args UI (B.2). Each agent script item in the library view now has a ⚙ button (shown only when `argsSchema` has keys) that expands an inline `agent-args-panel`. The panel renders one input per schema key — `<select>` for enum strings (values separated by `|`), `<input type="checkbox">` for booleans, `<input type="number">` for numbers, `<input type="text">` for everything else. Defaults are drawn from the schema value. On ▶ run, the panel reads current field values into an `argsObj` and passes it to `runAgentLibraryScript(id, name, argsObj)`. The `runAgentLibraryScript` function already JSON-stringifies and passes args to `HS_runAgentScript`. Scripts without `argsSchema` keys are unchanged — run button runs with empty `{}` as before.
