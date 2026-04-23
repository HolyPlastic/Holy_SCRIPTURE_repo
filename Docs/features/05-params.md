# Params

**Files:** `js/main.js` → `initParams()`
**UI Section:** Editor Params Bar (`.params-bar`)

A UI intended for injecting user-defined variables into scripts before execution. 

~~> ⚠️ **LIMITATION: UNDEVELOPED FEATURE**
> The UI for this feature exists in `index.html` and `style.css`, and basic DOM events are wired up in `main.js`, but **the logic to actually inject these parameters into the execution payload does not exist**. Do not assume parameters are currently working. See `ROADMAP.md` for the intended design.~~

---

## 5.1 UI Structure

Users can toggle the params bar visibility and add key/value input rows.
~~- The intention is that these values will eventually be prepended to the script string as variables before `evalScript` is called.
- Currently, adding or modifying parameters has zero effect on the code Cast to After Effects.~~

**Fully implemented.** `buildParamPreamble()` at `main.js:258–270` assembles `var key = value;` declarations for each defined param. `runScript()` at `main.js:382–384` prepends the preamble to code before casting. Params are also saved and restored with library entries.

---

## Open Bugs

*None.*

---

## Dev Log

- 1: Initial feature documentation. Flagged as dormant/undeveloped.

### Entry 2 — Full implementation confirmed (2026-04-12)
Doc-cleanup pass: the UNDEVELOPED FEATURE banner was stale. `buildParamPreamble()` is implemented at `main.js:258–270`; it assembles variable declarations from `state.params`. `runScript()` prepends the preamble at `main.js:382–384` — `var preamble = buildParamPreamble(); var codeToRun = preamble ? preamble + '\n\n' + trimmed : trimmed;`. Banner and dormant status line struck through above.