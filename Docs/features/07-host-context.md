# Host Context

**Files:** `js/main.js` → `initContextBar()`, `pollContext()` | `jsx/hostscript.jsx` → `HS_getContext()`
**UI Section:** Top Header (`.header-comp-info`)

A polling system that continuously reads the active After Effects composition state and displays it in the panel header (Comp Name, FPS, Selected Layers, Timecode).

*For how data crosses the CEP bridge, see the Host Bridge section in `Docs/ARCHITECTURE.md`.*

---

## 7.1 The Polling Loop

The panel polls After Effects every 2000ms (`CONTEXT_INTERVAL`) by calling `HS_getContext()`.
- The ExtendScript function calculates the SMPTE timecode natively based on the active comp's `time` and `frameRate`.
- It fails silently (catching errors and returning defaults) if no comp is active, or if After Effects is in a modal state that blocks ExtendScript execution.

## 7.2 Anti-Flicker Focus Logic

> ⚠️ **TRAP: AE UI Flicker**
> Calling `evalScript` continuously while a user is working inside After Effects causes the native application cursor to flicker, degrading performance. 

To solve this, the polling loop **pauses automatically** when the CEP panel loses focus.
- `window.addEventListener('blur', ...)` clears the interval.
- `window.addEventListener('focus', ...)` restarts the interval.
- **Rule:** Do not remove these focus/blur listeners, or the AE cursor flicker bug will return.

---

## Open Bugs

*None currently.*

---

## Dev Log

- 1: Initial feature documentation. Explicitly documented the blur/focus polling pause mechanism.