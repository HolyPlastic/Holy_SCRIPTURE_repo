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
