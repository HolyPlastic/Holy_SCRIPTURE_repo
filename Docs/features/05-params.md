# Params

**Files:** `js/main.js` → `initParams()`
**UI Section:** Editor Params Bar (`.params-bar`)

A UI intended for injecting user-defined variables into scripts before execution. 

> ⚠️ **LIMITATION: UNDEVELOPED FEATURE**
> The UI for this feature exists in `index.html` and `style.css`, and basic DOM events are wired up in `main.js`, but **the logic to actually inject these parameters into the execution payload does not exist**. Do not assume parameters are currently working. See `ROADMAP.md` for the intended design.

---

## 5.1 UI Structure

Users can toggle the params bar visibility and add key/value input rows.
- The intention is that these values will eventually be prepended to the script string as variables before `evalScript` is called.
- Currently, adding or modifying parameters has zero effect on the code Cast to After Effects.

---

## Open Bugs

*None — intentional limitation pending roadmap development.*

---

## Dev Log

- 1: Initial feature documentation. Flagged as dormant/undeveloped.