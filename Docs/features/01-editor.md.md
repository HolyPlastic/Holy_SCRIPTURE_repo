# Editor

**Files:** `js/main.js` | `jsx/hostscript.jsx`
**UI Section:** Editor Tab (`#tab-editor`)

The main landing page of the plugin. It provides a CodeMirror-powered interface for writing, executing (Casting), and saving ExtendScript. This is the primary point of interaction for the user.

*For how code is executed in After Effects, see the Host Bridge section in `Docs/ARCHITECTURE.md`.*

---

## 1.1 CodeMirror Integration

The text editor is powered by CodeMirror 5, loaded via CDN in development (planned for local bundling in distribution). 
- It uses the JavaScript mode (since ExtendScript is ES3-compatible).
- The theme (`holyscripture`) is entirely custom-defined in `css/style.css` to match the Techno-Brutalist brand guidelines.

## 1.2 Casting Scripts

Clicking "Cast Script" reads the raw string content directly from the active CodeMirror instance.
- The string is safely escaped using `JSON.stringify()` before crossing the CEP bridge.
- The execution result (Success, Return Value, Logs, Error) is automatically captured and sent to the History tab.

## 1.3 Saving

Users can save the current editor content to the Library directly from this tab.
- Clicking **✚ SAVE** opens a three-choice save options modal: **Overwrite** (available when a library entry is currently loaded), **Save As New** (opens the name/category modal), and **Export .JSX to Holy Storage** (writes a `.jsx` file to `%APPDATA%\Roaming\Holy Storage\Holy_Scripture\` via ExtendScript).
- A **Quick Overwrite** button (`↑ OVERWRITE`) appears in the script identity bar whenever the editor has an active library entry loaded and the content has been modified.
- The save flow is handled via `storage` abstraction — see `ARCHITECTURE.md` for dual-write behaviour.

## 1.4 Script Identity Bar

A persistent bar above the CodeMirror instance displays the name of the currently loaded library script (or `UNSAVED` if none). An asterisk (`*`) is appended to the name whenever `state.isDirty` is true. A dropdown selector allows switching between all library entries without navigating to the Library tab; loading a new entry while `isDirty` is true triggers the unsaved-changes confirmation modal.

---

## Open Bugs

*None currently.*

---

## Dev Log

- 1: Initial feature documentation.
- 2: Added script identity bar (`#editor-script-header`) above the editor. Tracks `state.activeScript` (set on load or save) and `state.isDirty` (set on any CodeMirror change, cleared on load/save). Save button now opens a three-choice options modal instead of directly opening the name modal. Quick Overwrite button added inline in the identity bar. Unsaved-changes guard added to `loadLibraryScriptToEditor()` — shows custom HTML modal, never native `confirm()`. Header reorganised: context bar (comp name, fps, layers, timecode) moved into the main `#header` row alongside branding.