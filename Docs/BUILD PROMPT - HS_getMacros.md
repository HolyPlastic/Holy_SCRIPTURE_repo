# BUILD PROMPT: HS_getMacros

**Task:** Implement `HS_getMacros()` in `jsx/hostscript.jsx`

---

## Purpose

Returns a list of all saved macros from Holy Scripture storage so Holy Agent can discover and offer macro execution to users.

---

## Function Signature

```javascript
function HS_getMacros()
```

**Parameters:** None.

**Return:** JSON string:
```json
{
  "success": true,
  "macros": [
    {
      "id": "macro_1742849200000",
      "name": "RENDER SETUP",
      "stepCount": 3,
      "onError": "abort",
      "created": 1742849200000
    }
  ]
}
```

---

## Implementation Notes

1. Load macros from `HS_loadData("hs_macros")` — same storage key used by the macro UI in `main.js`
2. Parse the stored JSON, default to empty array if null/malformed
3. Map each macro to the structure above:
   - `id`: string, the macro's unique identifier
   - `name`: string, user-assigned macro name
   - `stepCount`: number, count of steps in `macro.steps` array
   - `onError`: string, `"abort"` or `"continue"`
   - `created`: number, Unix timestamp of creation
4. Return `success: false` only on catastrophic failure (e.g., storage read error); otherwise return `success: true` with empty `macros` array if none exist

---

## Existing Reference

- `HS_getAgentScripts()` at `jsx/hostscript.jsx:315` — identical pattern for agent script discovery
- Macro storage format documented in `Docs/features/06-macro.md`

---

## Agent Bridge Contract

This function is part of the Holy Agent orchestration surface. The return shape must be stable so Holy Agent can reliably parse macro lists for the user.
