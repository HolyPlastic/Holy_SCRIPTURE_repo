# Code Style

Read this when creating or editing HTML, CSS, or JS files.

---

## Region Markers

All HTML and CSS files use emoji `#region` / `#endregion` markers. Apply to every file.

**HTML:**
```html
<!-- ────────────────────────────────────────────── -->
<!-- #region 🟢🟢🟢 SECTION NAME
─────────────────────────────────────────────────── -->

<!-- content -->

<!-- #endregion
───────────────
─────────────────────────────────────────────────── -->
```

**CSS:**
```css
/* ────────────────────────────────────────────── */
/* #region 🎨🎨🎨 SECTION NAME
─────────────────────────────────────────────────── */

/* #endregion
───────────────
─────────────────────────────────────────────────── */
```

Rules: three identical emojis, vary emoji between sections, name in CAPS, regions stack directly (no blank lines between `#endregion` and next `#region`).

**Standard CSS section order:**
1. `🎨🎨🎨 COLOR VARIABLES`
2. `📐📐📐 LAYOUT TOKENS`
3. `🌍🌍🌍 BASE ELEMENTS`
4. `🔘🔘🔘 BUTTON STYLES`
5. `⚡️⚡️⚡️ ANIMATIONS & EFFECTS`

---

## CSS Architecture

- All colours in `:root` as `var(--holy-*)` tokens. No inline hex/rgb/hsl in classes.
- Variable names describe **slot**, not value: `--holy-primary`, not `--holy-pink`.
- Exception: monochrome values may be named descriptively (`--holy-void`, `--holy-white`).
- Three-variant pattern for every interactive element:
  ```css
  --holy-[slot]-base     /* primary state */
  --holy-[slot]-dark     /* dark fill */
  --holy-[slot]-boost    /* hover/active */
  ```
- `border-radius: 0px` everywhere. No exceptions.
- Button default: bright stroke + dark fill + bright icon.
- Button hover: bright fill + boosted stroke + dark icon.

---

## SVG

- Flat structure only — no `<g>` tags.
- Every `<svg>` gets `id="[category]-[descriptor]"`.
- `fill` / `stroke` set as attributes; overridden via CSS vars at runtime.

---

## Spacing

- Grid base unit: `4px`.
- Top-level containers: `0px` margin/padding.
- Internal sub-elements: `4px` or `8px` gaps only.
- Minimum hit target: `32×32px`.

---

## Typography

- UI / data text: `JetBrains Mono`
- Display / headers: `Arial Black`
