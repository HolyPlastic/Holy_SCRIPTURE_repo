# History

**Files:** `js/main.js` | `jsx/hostscript.jsx`
**UI Section:** History Tab (`#tab-history` / Log)

An execution log that records every script Cast from the Editor, Slots, or Library. It captures success/failure states, return values, errors, and custom logs.

*For the JSON return format from AE, see the Host Bridge section in `Docs/ARCHITECTURE.md`.*

---

## 4.1 Logging Execution

Every time a script resolves via the Host Bridge, a new entry is prepended to the `hs_history` array in `localStorage`.
- **Success:** Displays the return value and any output from the injected `log()` function.
- **Failure:** Displays the ExtendScript error name, message, and line number.
- **Cap:** The history array is hard-capped at 100 entries (`MAX_HISTORY`). When entry 101 is added, the oldest entry is deleted.

## 4.2 Replay

Users can click a "Replay" or "Rerun" button on any history item to immediately re-execute that exact code payload. This does not load the code back into the Editor.

---

## Open Bugs

*None currently.*

---

## Dev Log

- 1: Initial feature documentation. Documented the 100-entry max cap.