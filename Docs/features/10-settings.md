# Settings Panel

**Files:** `settings.html` (modeless colour picker panel) | `js/main.js` → `initAccentColor()`, `setAccentColor()` | `css/style.css` (CSS variable declarations, derived colour scale) | `CSXS/manifest.xml` → `com.holyplastic.holyscripture.settings`
**Trigger:** Settings cog button (`#btn-settings`) in the main panel header opens the modeless window via `cs.requestOpenExtension('com.holyplastic.holyscripture.settings', '')`.

Modeless settings panel registered as `com.holyplastic.holyscripture.settings` with `AutoVisible true` (required for CEP modeless attach). The panel runs in its own isolated CEP context and communicates with the main panel via CSEvent `holy.scripture.color.change`.

---

## 10.1 Colour Picker

The VIBE button in the settings view switches to a full-panel inline HSV colour picker. Contains:

- 2D canvas-based saturation/value spectrum
- Hue slider strip
- Hex input field
- Icon-only buttons: undo (reverts to pre-open colour), apply (persists + closes), cancel (reverts + closes)
- Favourite colour swatches (up to 8, stored in `hs_favColors`)
- Hard-locked default colour swatch (leftmost position)

Live preview fires `_broadcastColor(hex)` on every drag/input, dispatching `holy.scripture.color.change` CSEvent without persisting. `applyVibeColor(hex)` persists to `localStorage` key `hs_themeColor` only on explicit Apply.

## 10.2 Default Colour Swatch

The plugin's default accent (`#ff2c72`) is always rendered first in the favourites row as a smaller "right-half rhombus" shape — straight vertical left edge with rounded corners, same slanted right edge as the full parallelogram user-favourite swatches. Uses `DEFAULT_TAG` SVG path (viewBox `0 0 19.5 27.61`) and `.hs-fav-default` CSS class (20x27px vs 34x27px for user favourites). Click selects the default into the picker; not removable via right-click. Ensures the plugin's identity colour is never lost.

## 10.3 CSS Variable Architecture

Two-tier system mirroring Holy Expressor:

**Tier 1 — JS-managed primitives** (set by `STYLE_boot` in `<head>` and `setAccentColor()` in `main.js`):
- `--accent` — raw hex
- `--ACCENT-H`, `--ACCENT-S`, `--ACCENT-L` — HSL components
- `--ACCENT-RGB` — comma-separated RGB triplet

**Tier 2 — CSS-derived scale** (declared in `css/style.css`):
- `--accent-mid` — deep tinted background
- `--accent-offwhite` — light tinted text/highlights
- `--hp-signal-MAIN-dark` — derived from accent HSL
- `--hp-signal-MAIN-boost` — derived from accent HSL

---

## Open Bugs

*When a bug is resolved: apply `~~strikethrough~~` and add a Dev Log entry noting the fix. Do not delete.*

*(none)*

---

## Dev Log

- 1: Initial implementation. Created `settings.html` with full HSV canvas colour picker, favourite swatches, and VIBE button view switching. Registered `com.holyplastic.holyscripture.settings` as Modeless extension in `manifest.xml` with `AutoVisible true`. Added `STYLE_boot` to both `index.html` and `settings.html` to decompose stored hex (`hs_themeColor`, default `#ff2c72`) into HSL/RGB CSS primitives before first paint. Added `initAccentColor()` / `setAccentColor()` / `hexToRgb_accent()` to `js/main.js`. Added CSS vars `--accent-mid`, `--accent-offwhite` and derived `--hp-signal-MAIN-dark`, `--hp-signal-MAIN-boost` to `css/style.css`. Settings cog button (`#btn-settings`) with hexagonal SVG icon added to `index.html` header. CSEvent `holy.scripture.color.change` broadcasts live colour preview to main panel. Default accent `#ff2c72` hard-locked as a half-width "right-half rhombus" swatch at leftmost position in favourites row — always present, not removable, ensures plugin identity colour is never lost. Uses `DEFAULT_TAG` SVG path and `.hs-fav-default` class (20x27px).
