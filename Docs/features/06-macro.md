# Macro

**Files:** `js/main.js` → `initMacro()`
**UI Section:** Macro Tab (`#tab-macro`)

An interface intended for chaining multiple saved library scripts together to run sequentially.

> ⚠️ **LIMITATION: UNDEVELOPED FEATURE**
> Like Params, this tab exists purely as an interface mockup. The arrays for `state.macros` and `state.macroChain` exist in `main.js`, but the execution loop to cast them sequentially has not been built. See `ROADMAP.md` for the intended design.

---

## 6.1 Intended Behaviour

The UI allows users to select scripts from their library and add them to a sequence. It includes a "Halt on Error" toggle intended to break the chain if a script fails.
- Currently, clicking the "Run Macro" button does not execute the chain. 

---

## Open Bugs

*None — intentional limitation pending roadmap development.*

---

## Dev Log

- 1: Initial feature documentation. Flagged as dormant/undeveloped.