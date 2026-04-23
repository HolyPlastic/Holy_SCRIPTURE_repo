# Roadmap

Unimplemented features from the original design intent. Not bugs — planned work.

> **Canonical source of truth.** Each Holy plugin's own `Docs/ROADMAP.md` is the single source going forward. The workspace-level `HOLY REPOS COLLATED/Roadmap Collation.md` was deprecated 2026-04-13 (see `Roadmap Collation DEPRECATED.md`) — do not reinstate a cross-plugin summary.

*Before implementing anything new, check this file. Items here have design intent attached. Don't implement them differently without flagging the deviation.*

---

## ~~Library & Slots Synchronization~~ ✓

~~Untangling the UX and data flow between the Editor, Slots, and Library so they act as a unified system rather than isolated clipboards.~~

- ~~Link the editor to the library: Display the active library entry name prominently directly above the editor. if it's not a saved entry then just say "Unsaved".~~
- ~~Synchronize script names across the editor, slots, and library panels. If changed in one, it updates in all three.~~
- ~~Add a dropdown selector in the Editor header to quickly switch between library entries.~~
- ~~Unsaved changes warning: If swapping library entries without saving, show a styled panel popup (not a native AE modal) warning the user.~~

**Implemented.** Active script tracked in `state.activeScript`. Dirty flag in `state.isDirty`. Script identity bar above editor. Dropdown selector in header. Unsaved-changes modal on load. Slot sync via `libraryId` on overwrite. ~~**Open gap:** UI for assigning `libraryId` to an existing slot not yet built — slots default to isolated clipboard mode.~~ ✅ **Slot → Library Link UI shipped 2026-04-13.** Each slot header now renders a compact `<select class="slot-lib-link">` dropdown populated from `state.library.scripts`. Selecting an entry sets `slot.libraryId`, immediately pulls the library entry's code and name into the slot, and renders a `⇌ LINKED` badge. Textarea becomes `readonly` (visual indicator; user can unlink via `— LINK LIBRARY —`). The `quickOverwrite()` sync-on-overwrite path now has a corresponding UI entry point. See `Docs/features/02-slots.md` Dev Log entry 9.

## ~~SAVING~~ ✓

~~Currently all info/scripts etc is saved to the cep cache created by AE, it should instead be saved to a local user folder "/Holy Storage/Holy_Scripture"...~~

**Implemented.** All persistence now routes through the `storage` abstraction in `main.js`. In CEP mode every write dual-writes to `%APPDATA%\Roaming\Holy Storage\Holy_Scripture\<key>.json` via `HS_saveData()`. Folder created automatically via `HS_getDataDir()` using `Folder.userData` (no hardcoded paths). `HS_exportScript()` exports named `.jsx` files to the same folder. See ARCHITECTURE.md Global Dev Log entry 3.

---

## ~~Editor Save & Header Reorganization~~ ✓

~~Improving the save flow and reorganizing the top bar for better hierarchy.~~

- ~~The Save button should always offer three explicit choices: Overwrite (if loaded from library), Save As New, and Export to Local File.~~
- ~~Add a prominent "Quick Overwrite" button near the library name display for existing library entries.~~
- ~~Move comp info (name, fps, layers, timecode) to the very top row next to the branding.~~
- ~~Replace the current comp name display in the Editor tab with the active Library Script name.~~

**Implemented.** Save button opens a three-choice modal. Quick Overwrite button in the script identity bar. Context bar moved into `#header` row inline with branding. Script identity bar replaces comp name in the editor area. Export writes to Holy Storage folder. See `01-editor.md.md` Dev Log entry 2.


---

## ~~Drag and Drop File Import~~ ✅

~~Allow users to drag `.jsx`, `.js`, and `.txt` files directly into the panel to load them into the Editor.~~

~~- Display a visual overlay reading `DROP .JSX / .TXT HERE` when dragging files over the panel.~~
~~- Parse the dropped file and load its contents into CodeMirror.~~

~~**Why:** Faster workflow for users migrating existing scripts into the Holy Scripture library.~~
~~**Notes:** The visual overlay code currently exists in a dormant state (`hlm-dragdrop.js` / style elements), but the file reader and drop zone logic need hooking up.~~

✅ **Implemented** — `initDragDrop()` at `main.js:2363–2434`. See `Docs/features/08-drag-drop.md` Entry 2.

---

## ~~General UI Polish~~

- ~~**Mouse scroll in tab panels:** Enable mouse wheel scrolling across all tab content areas (editor, slots, library, history).~~
- ~~**Draggable Slot Entries:** Make slot entries draggable so users can resize/reposition them to fit their panel arrangement.~~
- ~~Currently the slot entries are just a vertical layout, but it would be nice to be able to stack them next to each other as well, horizontally, if the user chooses to. So idea in an ideal world they could drag one above or below a different slot or to the right or left of an existing slot. And stack them any way they like.~~

~~**Why:** Desktop-class interactions are expected in a professional AE tool.~~

---

## ~~Phase 7 & 8: Params and Macros~~ ✅

~~Fleshing out the undeveloped tabs visible in the UI.~~

~~- **Params:** Allow users to define user-facing variables at the top of a script that can be tweaked via UI inputs before casting, without editing the raw code.~~
~~- **Macros:** Allow users to chain multiple saved library scripts together to run sequentially as a single action.~~

~~**Why:** Elevates the plugin from a simple code executor to a visual script builder.~~
~~**Notes:** The UI structure for these exists in `index.html` and `style.css`, but the logic in `main.js` is currently a placeholder.~~

✅ **Both implemented** — Params: `buildParamPreamble()` at `main.js:258–270`, injected in `runScript()` at `main.js:382–384`. See `Docs/features/05-params.md` Entry 2. Macros: `executeMacro()`, `castMacro()`, `HS_runMacro()`, `HS_getMacros()` all live. See `Docs/features/06-macro.md` entries 2–5.

**2026-04-13 design shift — Macros builder UI removed.** The in-panel macro builder (`#tab-macro` panel, step picker, drag-reorder, CAST MACRO button, save-builder controls) was removed per work plan Section B.3. Macro creation is now Holy Agent's responsibility; users manage existing saved macros through the lightweight **Manage Macros** dialog accessible via the MACROS button in the tab nav. One-time pro-tip toast surfaces when saved macros exist. The execution layer (`executeMacro`, `castMacro`, `HS_runMacro`, `HS_getMacros`, `state.macros`, `hs_macros` storage) is fully preserved — Holy Agent's `HolyAgent.Scripture.runMacro(id)` call path is unaffected. See `Docs/features/06-macro.md` Dev Log entry 6.

---


## Local JSON Export/Import

Escaping the constraints of CEP `localStorage`.

- Integrate local JSON file export/import.
- Allow users to backup and restore their entire Library, Slots, History, and Macros data.

**Why:** `localStorage` is volatile. If the user clears their CEP cache or moves to a new machine, they lose their scripts. They need a hard backup mechanism.
**Notes:** Use native OS file-save/browse dialogs (via ExtendScript `File` object or CEP `window.cep.fs`) to pick the destination folder.

**Status:** Not started. No `exportAll` / `importAll` / `btn-backup` / `btn-restore` identifiers anywhere in `main.js`. `importJsx()` (`main.js:1869`) handles only a single `.jsx` into the editor. The dual-write to Holy Storage JSON files per key (ARCHITECTURE.md) is a per-session mirror, not a user-facing backup. Needs combined-JSON assembly function, UI button, CEP file-save wiring. No blockers.

---

## CodeMirror — Local Bundle for Distribution

Currently `index.html` loads all CodeMirror assets from `cdnjs.cloudflare.com` (lines 13–19, 314–319). In a CEP panel deployed without internet connectivity, the editor silently breaks — no CodeMirror, no syntax highlighting, no panel is functional.

**What to do:** Download CodeMirror 5 + JS mode + required addons to local `js/lib/`, update the `<link>` / `<script>` tags to reference the local copies. Ensure the bundled addon set matches what's currently in use (mode/javascript, matchbrackets, etc. — check the existing CDN refs).

**Why:** Offline resilience for distribution. Ship the plugin self-contained.

**Status:** Not started. Pure frontend work, no JSX changes required.

---

## Phase 9: Agent Library (Built-in Script Suite)

Bundle a curated set of pre-built, agent-callable ExtendScript utilities into Holy Scripture as a permanent, user-invisible-by-default backend library. These ship with the plugin, are not stored in the user's `localStorage`, and are not user-editable.

**Source material:** `External Resources/adobe-agent-skills-main/` in the workspace root — a third-party AE automation toolkit. The scripts and the rules folder are both valuable assets; see notes below on what needs adaptation before use.

### What this adds to Scripture

**A seed file** (`js/seed-agent-library.js`) bundled with the plugin containing ~8–10 priority scripts as JS string constants. On first run (or if the `hs_agent_library` storage key is missing), `initLibrary()` calls a seeding function that writes them into a separate `hs_agent_library` storage key — distinct from the user's `hs_library`.

**A toggle button** in the bottom-right of the panel, visible only when the Library tab is active. Small, subtle — a "secret" button that switches the library view from user scripts to the built-in agent library. Toggle state persists in `localStorage`. Agent library scripts are visually distinguished (badge/different border) when shown.

**New `hostscript.jsx` API surface:**
- `HS_getAgentScripts()` — returns the agent library as a JSON string so Holy Agent can discover what's available
- `HS_runAgentScript(id, argsJson)` — looks up a script by ID, prepends `var args = {...};` from `argsJson`, then executes via `HS_runScript`

### Priority scripts (first wave)

These are the highest-value, lowest-complexity scripts from the source repo — selected because they cover gaps not filled by any other Holy Plastic plugin:

| ID | Source script | What it does |
|---|---|---|
| `agent_null_from_layers` | `null-from-layers.jsx` | Create null at each selected layer's position, auto-parent |
| `agent_batch_rename` | `batch-rename.jsx` | Batch rename layers by pattern/find-replace/numbered sequence |
| `agent_layer_stagger` | `layer-stagger.jsx` | Offset layer in-points by a fixed time increment |
| `agent_smart_precompose` | `smart-precompose.jsx` | Precompose selected layers, match comp size, keep position |
| `agent_fit_to_comp` | `fit-to-comp.jsx` | Scale/fit selected layers to comp bounds |
| `agent_trim_comp` | `trim-comp-to-content.jsx` | Trim comp duration to the last out-point of all layers |
| `agent_project_overview` | `project-overview.jsx` | Read-only: return comp count, footage count, project name |
| `agent_label_layers` | `label-layers.jsx` | Batch-set label colours by layer type or name pattern |

Remaining scripts (e.g. `font-replace`, `render-queue-batch`, `srt-import`) are deferred — they are more complex or less universally useful.

### ⚠️ Critical adaptation required before use

The source scripts **cannot be used as-is** via `HS_runScript`. Three things must change:

1. **Remove `#include` directives.** `#include "lib/json2.jsx"` and `#include "lib/utils.jsx"` are preprocessor directives — they work when a file is executed directly but are silently broken inside `eval()`. The utility functions must be inlined or omitted.

2. **Replace `writeResult()` / `readArgs()` with the CEP model.** The source scripts write results to `/tmp/ae-assistant-result.json` (a UNIX temp file for a CLI runner). `HS_runScript` captures the **return value** of the IIFE as `result.output`, and any `log("msg")` calls as `result.logs[]`. Scripts must be adapted to `return JSON.stringify({...})` instead of calling `writeResult()`. Arguments are injected by prepending `var args = {...};` to the script string — no `readArgs()` needed.

3. **`/tmp/` paths don't exist on Windows.** `writeResult` and `writeError` write to `/tmp/` — a UNIX path. The entire file I/O model is replaced by the return-value pattern above.

The AE logic in each script is sound and worth keeping. Only the I/O layer needs rewriting.

### Rules folder → Holy Agent system prompt

`External Resources/adobe-agent-skills-main/skills/after-effects/rules/` contains 9 markdown files documenting ES3 constraints, matchName references, indexing rules, type-checking patterns, undo group conventions, and common gotchas. This is prompt-engineering gold.

**`extendscript-fundamentals.md` alone covers:** `let`/`const`/arrow function/template literal/forEach/Object.keys forbidden syntax, 1-based vs 0-based indexing, `instanceof` type checking, `app.project.activeItem` null guard, reverse-iteration-for-deletion, and property value type reference.

These rules are incorporated into Holy Agent's system prompt when `EXEC_SCRIPT` mode is active — reducing generated-script errors substantially. This is a Holy Agent change, not a Scripture change, but it's listed here because the source material lives in the workspace.

### What is explicitly deferred

- **All 41 scripts at once.** Do the 8-10 priority scripts first. Each requires adaptation; do not bulk-copy untested.
- ~~**Macros integration.** The Macros execution loop is still undeveloped (see Phase 7 & 8 above). Do not build Holy Agent's macro routing before `HS_runMacro` exists.~~ No longer a blocker — Macros execution layer live and Holy Agent's bridge method `getMacroList()` is wired end-to-end.
- **`HS_runAgentScript` as the call path from Holy Agent.** Build this *after* the seed library exists and is tested. Holy Agent can call `HS_runScript` directly with pre-pended `var args` for the first iteration.

### ~~Open questions~~

~~- Should the toggle button show agent scripts interleaved with user scripts, or in a completely separate view? (Current plan: separate view — toggle replaces the user library display entirely when active.)~~
~~- Should agent scripts be runnable directly from the UI (run button in the built-in library view), or are they callable via Holy Agent only?~~
~~- Naming: "Agent Library"? "Built-in Scripts"? "Holy Toolkit"? Decide before building the UI label.~~

✅ **Resolved in implementation (2026-04-12):** Name is "Agent Library". View is separate — toggle replaces user library display entirely when active (`libraryMode` in `main.js`). Scripts are UI-runnable (run button present in agent library view). All three decisions confirmed in `js/seed-agent-library.js`, `js/main.js` (libraryMode toggle), and Holy Scripture ARCHITECTURE.md Global Dev Log entry 7.

### ~~Argument-entry UI for agent scripts~~

~~Bridge pipeline is fully wired end-to-end (`runAgentLibraryScript(scriptId, scriptName, argsObj)` → `HS_runAgentScript(id, argsJson)` → `$.global.__holyScriptureAgentArgs`), but `renderLibrary()` in agent mode passes `argsObj` as `undefined` — no UI surface for providing args exists.~~

✅ **Shipped 2026-04-13.** Each agent-library item now gets a ⚙ button (shown only when `argsSchema` has keys) that expands an inline `agent-args-panel`. Per schema key: `<select>` for enum strings (`|`-separated), `<input type="checkbox">` for booleans, `<input type="number">` for numbers, `<input type="text">` otherwise. Defaults drawn from schema. On ▶ run, field values are collected into `argsObj` and handed to `runAgentLibraryScript(id, name, argsObj)`. Scripts without `argsSchema` keys run with empty `{}` as before. See `Docs/features/09-agent-library.md` Dev Log entry 5.

---

## Open Design Questions

*Unresolved decisions. An agent should not make these calls unilaterally — flag them to the user.*

- **Storage Engine Migration:** If JSON export/import is built, should the primary persistence engine move to reading/writing from a local `.json` file by default instead of `localStorage`?
