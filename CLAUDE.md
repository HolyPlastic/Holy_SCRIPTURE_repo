# Holy Scripture

A Techno-Brutalist Adobe After Effects CEP panel designed for writing, storing, and executing ExtendScript on the fly.

**Stack:** CEP Panel / HTML + CSS + JS + ExtendScript
**Host:** Adobe After Effects CC 2022+ (v15.0 - 99.9)

---

## Document Map

| File | Read when... |
|---|---|
| `Docs/ARCHITECTURE.md` | Touching any cross-cutting system — storage, the host bridge, shared utilities, or anything that spans multiple features. |
| `Docs/CODE_STYLE.md` | Creating or editing any HTML, CSS, or JS file. |
| `Docs/PLUGIN_SPEC.md` | You need to understand what a system is supposed to do and how it behaves. |
| `Docs/ROADMAP.md` | Creating a new feature — check it isn't already planned with a specific approach. |
| `Docs/features/` | Working on a specific feature. Each feature has its own file. Read the relevant one. |

---

## Feature Index

*Feature files are named with a two-digit prefix for sort order: `01-`, `02-`, etc.*

| File | Feature |
|---|---|
| `Docs/features/01-editor.md` | The main CodeMirror interface for writing, casting, and saving scripts. |
| `Docs/features/02-slots.md` | Quick-access script slots for fast execution. |
| `Docs/features/03-library.md` | Persistent storage area for saved scripts and categories. |
| `Docs/features/04-history.md` | Execution log with replay capability. |
| `Docs/features/05-params.md` | UI for injecting variables into scripts (Currently undeveloped). |
| `Docs/features/06-macro.md` | UI for chaining multiple scripts together (Currently undeveloped). |
| `Docs/features/07-host-context.md` | The top bar polling system that reads live After Effects comp data. |
| `Docs/features/08-drag-drop.md` | File import via drag and drop (Unfinished module / TBC). |

---

## Rules for Agents

1. **Read before writing.** Before touching a feature, read its feature doc. Before touching a cross-cutting system, read `ARCHITECTURE.md`.
2. **Dev Logs are append-only.** Never edit or remove existing Dev Log entries. Add a new numbered entry at the bottom of the relevant feature doc. Cross-cutting changes go in the `ARCHITECTURE.md` Global Dev Log.
3. **One entry per meaningful change.** If a single session changes two separate things, write two entries. Write enough to tell the next agent what changed and why — not just what.
4. **Traps are non-negotiable.** Any `⚠️ TRAP:` callout in any document describes a silent failure mode. Do not work around it or ignore it.
5. **Cross-reference, don't repeat.** If something is documented in `ARCHITECTURE.md`, link to it from the feature doc. Don't copy the content.
6. **Dev Log is history. Open Bugs is current state.** Dev Log records what changed and why. Open Bugs reflects what is broken right now. Keep them separate — a bug fix gets a Dev Log entry and a strikethrough on the bug, not just one or the other.
7. **Bugs live in feature docs.** Always log a bug in the feature doc where it surfaces, even if the root cause is cross-cutting. Note the suspected root cause inline.
8. **Resolved bugs and limitations get struck through, not deleted.** Apply `~~strikethrough~~` and add a Dev Log entry noting the fix. History must be preserved.
9. **Roadmap is not a backlog.** Items in `ROADMAP.md` are planned with specific design intent. Don't implement them differently without flagging the deviation.