# HOLY SCRIPTURE — BUILD NOTES
> Living technical reference. Updated as each phase is built.

---

## PROJECT OVERVIEW

**Plugin:** Holy Scripture
**Host:** Adobe After Effects (CEP Panel)
**Bundle ID:** `com.holyplastic.holyscripture`
**CEP Version Target:** 11.0+ (AE 2022+, broadened to [0.0, 99.9] for max compatibility)
**Brand:** HOLYPLASTIC.EXE — Techno-Brutalist (see `HOLY PLASTIC AGENT BRAND BOOK.md`)

---

## FILE STRUCTURE

```
HOLY SCRIPTURE/
├── CSXS/
│   └── manifest.xml          — CEP extension descriptor
├── css/
│   └── style.css             — Full brand implementation + CodeMirror theme
├── js/
│   ├── CSInterface.js        — Adobe CEP interface lib (pre-existing)
│   └── main.js               — All panel logic
├── jsx/
│   └── hostscript.jsx        — ExtendScript running inside AE
├── index.html                — Panel UI
└── BUILD NOTES.md            — This file
```

---

## ARCHITECTURE DECISIONS

### Editor: CodeMirror 5 (CDN)
- Loaded via cdnjs CDN in development build
- **TODO for distribution:** bundle locally under `js/lib/codemirror/`
- Custom theme `holyscripture` defined in style.css overriding CM5 class selectors
- JS mode used (ExtendScript is ES3-compatible, JS mode covers it)

### Script Execution Flow
1. User code retrieved from CodeMirror instance
2. `JSON.stringify(code)` used to safely escape for `evalScript` call
3. `csInterface.evalScript('HS_runScript(' + escaped + ')', callback)`
4. `HS_runScript` in hostscript.jsx wraps code in IIFE to allow `return` statements
5. try/catch in .jsx returns structured JSON `{ success, output, logs, error }`
6. CEP callback parses JSON, renders to inline console panel
7. Run logged to history in localStorage

### `log()` helper in ExtendScript context
- `HS_runScript` defines a `log()` function before eval
- User scripts can call `log("message")` to output to the console panel
- Logs collected in `__hsLogs[]` array and returned with result

### Storage: localStorage
- `hs_slots` — Quick Slots array
- `hs_library` — Script Library (categories + scripts)
- `hs_history` — Run log (capped at 100 entries)
- **TODO for v2:** migrate to file-based JSON via `window.cep.fs` for portability/backup

### AE Context Bar
- Polls `HS_getContext()` every 2000ms
- Returns: comp name, fps, duration, selected layer count, timecode
- Gracefully handles "no active comp" state

---

## PHASE LOG

### Phase 1 — Core (BUILT)
- [x] manifest.xml
- [x] hostscript.jsx (HS_runScript, HS_getContext)
- [x] index.html structure
- [x] style.css — full brand + CM theme
- [x] main.js — editor init, run script, inline console

### Phase 2 — Quick Slots (BUILT)
- [x] Dynamic slot add/remove
- [x] localStorage persistence
- [x] Collapse/expand per slot
- [x] Run from slot

### Phase 3 — Library (BUILT)
- [x] Save script with name + optional category
- [x] Browse & search
- [x] Run directly from library
- [x] Load into editor
- [x] Delete

### Phase 4 — History (BUILT)
- [x] Log every run with timestamp, name, success/fail
- [x] Reload into editor
- [x] Re-run directly
- [x] Clear history

### Phase 5 — AE Context Bar (BUILT)
- [x] Live comp name, fps, layer count, timecode
- [x] 2s polling interval

### Phase 6 — Script Parameters (BUILT — session 3)
- [x] Collapsible params panel below editor action bar (`#params-panel`)
- [x] Types: string, number, boolean, color
- [x] Preamble injected before user code on run
- [x] Params saved with library scripts; restored on library load
- [x] Add/remove param rows; type change resets value to sensible default

### Phase 7 — Drag-Drop .jsx Import (BUILT — session 3)
- [x] HTML5 FileReader drag-drop on `document.body`
- [x] Drop on Library tab → opens save modal pre-filled with filename
- [x] Drop on any other tab → loads into editor
- [x] Visual overlay (`body.drag-active::after`) during drag
- [x] Filters: only `.jsx` / `.js` files accepted

### Phase 8 — Customizable Slot Shortcuts (BUILT — session 3)
- [x] `shortcut: null` field on each slot object
- [x] Shortcut pill button in slot header: click to record, ESC to cancel, Backspace to clear
- [x] Recording mode: next keypress (any combo) becomes the shortcut
- [x] Global keydown listener fires matching slot's run function
- [x] Visual: pill turns accent when set, orange pulse during recording

### Phase 9 — Macro Builder (BUILT — session 3)
- [x] 5th tab: MACRO (`#tab-macro`, `data-tab="macro"`)
- [x] Build chain by picking scripts from library picker dropdown + "ADD STEP"
- [x] Each step: name, drag-to-reorder, delay (ms) input, remove button
- [x] HTML5 drag-reorder within chain (no library needed)
- [x] CAST MACRO: runs steps in sequence, each awaiting callback before next
- [x] ON ERROR select: ABORT (stops on first failure) or CONTINUE
- [x] Step status indicators: running (pulse), ok (green border), error (red border)
- [x] SAVE MACRO: stores to `hs_macros` in localStorage
- [x] Saved macros list: cast-directly, load-into-builder, delete
- [x] Macro run logged to history as single grouped entry
- [x] Macro picker auto-refreshes when switching to macro tab

---

## KNOWN LIMITATIONS / FUTURE WORK

- **CDN dependency:** CodeMirror + Google Fonts loaded from CDN. Needs local bundling for offline distribution.
- **No Node.js FS:** Library stored in localStorage, not a portable file. Future: migrate to `window.cep.fs` JSON file in user's documents.
- **No .jsx import yet:** Import button is present in Library tab but file picker via CEP `openFileDialog` not yet wired — see TODO in main.js.
- **No keyboard shortcuts:** Slot keybinds (Alt+1 etc.) not yet implemented.
- **No Script Parameters:** Phase 5 (parameters injection) not yet built.
- **No Macro Builder:** Phase 7 (script chaining) not yet built.

---

## INSTALLATION (DEVELOPMENT)

1. Enable unsigned CEP extensions by setting registry key:
   - `HKEY_CURRENT_USER\SOFTWARE\Adobe\CSXS.11` → `PlayerDebugMode` = `1` (String)
   - Repeat for CSXS.12, CSXS.13 as needed for your AE version
2. Symlink or copy folder to:
   - Windows: `C:\Users\[user]\AppData\Roaming\Adobe\CEP\extensions\holy-scripture\`
3. Launch After Effects → Window → Extensions → Holy Scripture

---

## BRAND REFERENCE (QUICK)

| Token | Value | Use |
|---|---|---|
| `--hp-void` | `#000000` | Main background |
| `--hp-surface` | `#0A0A0A` | Elevated panels |
| `--hp-border` | `#1A1A1A` | Default borders |
| `--hp-signal-MAIN` | `#FF0073` | Hot pink primary |
| `--hp-signal-MAIN-dark` | `#640a23` | Dark pink fill |
| `--hp-signal-MAIN-boost` | `#fdadb4` | Hover state |
| `--hp-signal-secondary-1` | `#00FFC3` | Teal accent |
| `--hp-signal-secondary-2` | `#FFB800` | Yellow accent |
| `--hp-danger` | `#FF2D2D` | Errors |
| `--hp-signal-dim` | `#666666` | Inactive/placeholder |

> **NOTE — Design Overhaul:** The design system has been substantially revised since the original session. The live CSS no longer uses the token names above. Current design system (as of session 2):
> - Accent: `#ff2c72` (--accent, was --hp-signal-MAIN)
> - Backgrounds: base `#111214`, panel `#18191d`, surface `#20222a`, input `#0e0f12`
> - Fonts: UI = `system-ui/-apple-system/'Segoe UI'`, Mono = `'Share Tech Mono'`, Label = `'Dosis'`
> - Legacy aliases kept in `:root` for JS/CodeMirror compat
> The BRAND REFERENCE table above is now historical. See `css/style.css` for current token values.

---

## HANDOFF — SESSION 2 (2026-03-04)

### Confirmed built and present in codebase:
- Phase 1: Editor (CodeMirror 5, custom holyscripture theme, inline console, Ctrl+Enter run)
- Phase 2: Quick Slots (+/− add/remove, collapse/expand, localStorage persistence, run from slot)
- Phase 3: Library (save with name/category, search, run/load/delete from library)
- Phase 4: History (full run log, reload to editor, re-run, clear history)
- Phase 5: AE Context Bar (live comp name, fps, layer count, timecode via 2s poll)

### Confirmed NOT yet built:
- ~~Script Parameters injection (Phase 6)~~ → **BUILT (session 3)**
- ~~Macro / Script Chaining builder (Phase 7)~~ → **BUILT (session 3)**
- ~~Slot keyboard shortcuts~~ → **BUILT — customizable, recorded per-slot (session 3)**
- ~~.jsx file import (button present in Library tab)~~ → **BUILT — drag-drop (session 3)**
- Local asset bundling (CodeMirror + Google Fonts still loaded from CDN)
- localStorage → `window.cep.fs` JSON file migration

### Design state:
- Full design overhaul completed in session 2 (new color system, typography, layout polish)
- `index.html`, `css/style.css` reflect the current design — BUILD NOTES brand table is now outdated
- Tab structure: `#tab-editor`, `#tab-slots`, `#tab-library`, `#tab-history` — all present

---

## NEXT PHASES — PLAN

### Phase 6 — Script Parameters
**Concept:** Before running a script, the user can define named key/value pairs that get injected as variables at the top of the evaluated code. This makes scripts reusable without editing code.

**Implementation:**
- UI: collapsible "Parameters" panel below the editor, with rows of [key] [type] [value] [remove]
- Types: `string`, `number`, `boolean`, `color` (hex picker)
- On run: serialize params into a preamble string like `var layerName = "BG"; var duration = 2.5;` and prepend to user code before eval
- Params saved per-library-script: when loading from library, params load with it
- "Add param" button adds a new row; remove button on each row
- Default state: panel hidden/collapsed, expands on click

**Files touched:** `index.html` (params panel markup), `css/style.css` (param row styles), `js/main.js` (param serialization + load/save logic), `jsx/hostscript.jsx` (no changes needed — preamble is prepended in JS before handoff)

**Scope notes:** Keep it simple — no type coercion validation for v1. Trust the user to match types to their script.

---

### Phase 7 — .jsx Import (Quick Win, Low Hanging)
**Concept:** Wire up the existing Import button in the Library tab to actually open a file picker and load the file into the library.

**Implementation:**
- Use `csInterface.openFileDialog()` (CEP native) to open a system file picker filtered to `.jsx, .js`
- Read the selected file via `window.cep.fs.readFile()`
- Prompt the user for a name (pre-fill with filename minus extension)
- Save to library as a new entry

**Files touched:** `js/main.js` only (import button handler already stubbed)

**Scope notes:** This is a quick win — the button is already in the UI. Should be < 50 lines of new JS.

---

### Phase 8 — Slot Keyboard Shortcuts
**Concept:** Alt+1 through Alt+8 trigger the corresponding Quick Slot's run action.

**Implementation:**
- `document.addEventListener('keydown', ...)` in main.js
- Check `e.altKey && e.key` matches '1'–'8'
- Map index to slot and call the slot's run function
- Show a brief visual flash on the slot to confirm trigger

**Files touched:** `js/main.js`

**Scope notes:** Only bind slots that exist. No UI needed — this is a pure keyboard layer.

---

### Phase 9 — Macro Builder (Marquee Feature)
**Concept:** A dedicated fifth tab where the user assembles a sequence of library scripts and runs them in order. The most distinctive feature of the plugin.

**UI:**
- New tab `#tab-macro` with tab button `#btn-tab-macro`
- Left sidebar: mini library browser (search, click to add to chain)
- Main area: vertical list of chain steps, each showing script name + optional delay input
- Drag-to-reorder (HTML5 draggable or a lightweight lib)
- "Cast Macro" button runs all steps in sequence
- Steps show live status as macro runs (pending / running / success / error indicator)
- Save macro with a name; saved macros listed below the builder

**Execution logic:**
- Run each script in sequence via `csInterface.evalScript()`, awaiting callback before proceeding to next
- Optional delay between steps (ms input per step)
- On any step failure: show error, offer "continue anyway" or "abort" choice
- Macro run logged to history as a single grouped entry

**Files touched:** `index.html` (new tab), `css/style.css` (macro builder styles), `js/main.js` (macro state, execution engine, drag-reorder)

**Scope notes:** This is the biggest remaining feature. Suggest building the UI and static execution first, then adding save/load and drag-reorder as polish passes.

---

### Phase 10 — Storage Migration (Infra)
**Concept:** Move library and slots from localStorage to a JSON file on disk, making data portable and backupable.

**Implementation:**
- Use `window.cep.fs.readFile()` / `writeFile()` to read/write a `holy-scripture-data.json` in the user's Documents folder or the extension's own data directory
- On first load: check for file, fall back to localStorage if not present, migrate on first write
- On every save: write to file (async, silent)

**Files touched:** `js/main.js` (storage layer abstraction — wrap localStorage get/set behind a `storage.get()/set()` interface first, then swap the implementation)

**Scope notes:** Do the abstraction layer first so the swap is clean. History can stay in localStorage (it's ephemeral by nature).

---

### Build Order Recommendation

| Priority | Phase | Effort | Value |
|---|---|---|---|
| 1 | Phase 7 — .jsx Import | Low | High (closes an open UI promise) |
| 2 | Phase 8 — Slot Shortcuts | Low | Medium |
| 3 | Phase 6 — Script Parameters | Medium | High |
| 4 | Phase 9 — Macro Builder | High | Very High (marquee feature) |
| 5 | Phase 10 — Storage Migration | Medium | Medium (infra, needed for sharing/backup) |


---



**Implemented:**

- **.txt drag‑drop support**  
  The drag‑drop file import now accepts `.txt` files alongside `.jsx`/`.js`. Dropping a `.txt` file loads its contents into the editor (or saves to library if dropped on the Library tab). The overlay text has been updated to `DROP .JSX / .TXT HERE`.

- **Console panel collapsible**  
  Added a toggle button (▼/▶) to the OUTPUT header. Clicking collapses the output pane to just the header bar, reclaiming vertical space. Default height reduced from 120px → 80px. Collapsing also refreshes CodeMirror so it fills the reclaimed space.

- **UI density reduction**  
  Padding and font sizes were trimmed throughout to make the interface less cramped:
  - Header: 6px → 4px padding, brand font 13px → 11px
  - Tab bar: 6px → 4px vertical padding
  - CAST SCRIPT / SAVE bar: 8px → 6px padding
  - Slots toolbar, History toolbar: 6px → 4px padding

- **Polling fix (AE cursor flicker)**  
  The 2‑second polling for AE context (`HS_getContext`) now pauses when the CEP panel loses focus (`window blur`), and resumes on focus. This eliminates unnecessary `evalScript` calls while working in After Effects, stopping the cursor flicker and UI redraws that were previously caused by the plugin.

- **Tooltips**  
  Added `title` attributes to key UI elements for better discoverability:  
  CAST SCRIPT, SAVE, + ADD param, collapse param, collapse output, CLEAR, all 5 tab buttons, + ADD SLOT, IMPORT .JSX.

**Files updated:** `main.js`, `index.html`, `style.css`, `dragdrop.js` (drag overlay text), and others as needed.

**Next steps:**  
The plugin now feels more compact and responsive. Future work can focus on the remaining planned phases (Script Parameters, Macro Builder, etc.) as outlined in the **NEXT PHASES** section.

- **Phase 7 — Drag-Drop .jsx Import (BUILT)*  
  - Filters: `.jsx`, `.js`, **and `.txt`** files accepted.  
  - Visual overlay text now reads `DROP .JSX / .TXT HERE`.

- ~~Polling causing AE cursor flicker~~ → **Fixed in session 4** – polling now pauses when panel is out of focus.

---
