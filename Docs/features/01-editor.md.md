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
- This triggers a custom HTML/CSS modal (`#modal-overlay`) to input the script name and category.
- **Note:** Currently, there is no "Quick Overwrite" or auto-save if a script was loaded from the library. Saving creates a new entry or overwrites purely based on name matching (this is flagged for improvement in `ROADMAP.md`).

---

## Open Bugs

*None currently.*

---

## Dev Log

- 1: Initial feature documentation.