# HOLYPLASTIC.EXE — TECHNO-BRUTALIST DESIGN MANIFEST

### Version 1.7 | March 2026 | Classification: MACHINE-READABLE / AGENT-READY

> **PURPOSE:** This document is the single source of truth for all UI generated under the `holyplastic.exe` brand. It converts aesthetic "vibe" into mathematical constraints. Every value herein is non-negotiable unless flagged as `[TUNABLE]`. Coding agents must treat this as a library of assets and a guide for industrial-grade improvisation.

## SECTION 1 — LOGICAL DESIGN TOKENS

### 1.1 Color System Architecture

**CRITICAL: CSS Color Variables Structure**

- All colors (except monochrome white/greys/black) are defined at the top of the CSS document
- CSS classes reference these variables and do NOT contain inline hex/rgb/hsl codes
- This allows global color changes by updating only the top-level definitions
- Variable names should NOT describe the actual color (e.g., avoid `--hp-green`) since the underlying hex value may change
- Variable names should describe the PURPOSE or ROLE (e.g., `--hp-signal-MAIN`, `--hp-danger`)

**Color Variant Pattern** For any color used on interactive elements (buttons, highlights), three variants are required:

- **MAIN** - Bright, primary state (`#FF0073`)
- **MAIN-dark** - Dark, for fills (`#640a23`)
- **MAIN-boost** - Brightest, for hover/active states (`#fdadb4`)

If additional signal colors are needed for a specific plugin, follow this three-variant pattern.

|Token Name|Hex Value|Usage Rule|
|---|---|---|
|`--hp-void`|`#000000`|Background: absolute black only.|
|`--hp-surface`|`#0A0A0A`|Elevated panel surface. Max 1 level of depth.|
|`--hp-border`|`#1A1A1A`|Default structural border. Grid lines, panel edges.|
|`--hp-border-active`|`#2E2E2E`|Border on hover/focus state (before glow activates).|
|`--hp-signal-MAIN`|`#FF0073`|Primary accent (bright state).|
|`--hp-signal-MAIN-dark`|`#640a23`|Primary accent (dark fill state).|
|`--hp-signal-MAIN-boost`|`#fdadb4`|Primary accent (brightest hover/boost state).|
|`--hp-signal-secondary-1`|`#00FFC3`|Secondary accent.|
|`--hp-signal-secondary-2`|`#FFB800`||
|`--hp-signal-white`|`#F0F0F0`|Primary text. Data readouts.|
|`--hp-signal-dim`|`#666666`|Inactive labels, placeholder text.|
|`--hp-danger`|`#FF2D2D`|System error state only. Critical failures.|
|`--hp-glow-MAIN`|`rgba(255, 0, 115, 0.15)`|Primary glow layer for box-shadow.|

### 1.2 Button Color Logic

**Stroke + Fill Buttons:**

- **Default State:** Bright stroke + dark fill + bright icon
- **Hover State:** Bright fill + boosted stroke + dark icon (inverted for contrast/legibility)

Example CSS logic:

```css
.btn-primary {
  stroke: var(--hp-signal-MAIN);
  fill: var(--hp-signal-MAIN-dark);
}

.btn-primary:hover {
  stroke: var(--hp-signal-MAIN-boost);
  fill: var(--hp-signal-MAIN);
}

.btn-primary .icon {
  fill: var(--hp-signal-MAIN);
}

.btn-primary:hover .icon {
  fill: var(--hp-signal-MAIN-dark);
}
```

### 1.3 Stroke & Geometry Tokens

|Token Name|Value|Usage|
|---|---|---|
|`--hp-stroke-hair`|`0.75px`|SVG primitive segment outlines.|
|`--hp-stroke-thin`|`1px`|Grid lines, panel borders, idle state borders.|
|`--hp-radius`|`0px`|All border-radius values.|
|`--hp-grid-layout`|`4px`|Structural padding. High-density optimization.|
|`--hp-gap-segment`|`2px`|Gap between rhombus segments (p1, p2, p3).|
|`--hp-edge-margin`|`0px`|**[GUIDE]** Top-level containers. Elements snap to edges. Internal sub-elements may use layout gaps for legibility.|

### 1.4 Motion & Texture Tokens

|Token Name|Value|Usage|
|---|---|---|
|`--hp-scanline-opacity`|`2%–5%`|CRT scanline overlay opacity.|
|`--hp-scanline-repeat`|`2px` or `4px`|Horizontal line pattern spacing.|
|`--hp-flicker-duration`|`50ms`|Sync-flicker pulse on activation.|
|`--hp-flicker-steps`|`steps(4, end)`|Step timing function for industrial refresh feel.|

## SECTION 2 — TECHNO-BRUTALIST AESTHETIC RESTORATION

### 2.1 CRT Visual Texture (Scanlines)

**Purpose:** Break the absolute void of `#000000` background with mechanical texture. Provides physical screen presence and hides banding in phosphor glows.

**Implementation:**

- Repeating 2px or 4px horizontal line pattern
- Opacity: 2%–5%
- Applied as persistent overlay across entire plugin viewport
- Should cover the full background (unlike grids, which are design elements)

```css
.crt-scanlines {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.03) 2px,
    rgba(255, 255, 255, 0.03) 4px
  );
  pointer-events: none;
  z-index: 1000;
}
```

### 2.2 Refresh/Sync Flicker

**Purpose:** Create an unstable "sync-flicker" on element activation that avoids smooth, premium UI feel in favor of industrial, hardware-limited refresh.

**Implementation:**

- 50ms opacity pulse
- Uses `steps(4, end)` timing function
- Triggers on click/activation

```css
@keyframes sync-flicker {
  0%, 100% { opacity: 1; }
  25% { opacity: 0.8; }
  50% { opacity: 1; }
  75% { opacity: 0.9; }
}

.btn-activated {
  animation: sync-flicker 50ms steps(4, end);
}
```

### 2.3 Background Grid Implementation

**Purpose:** Provide visual reference for the 4px grid system. Acts as technical scaffolding visible to the user.

**Critical Rules:**

- Grids are **design elements**, NOT full-coverage backgrounds
- Should be off-center, cropped, used abstractly
- Can be placed within specific containers
- Never fills the entire plugin background (unlike scanlines)

**SVG Implementation Example:**

```html
<svg class="hp-grid-element" xmlns="http://www.w3.org/2000/svg" style="position: absolute; bottom: 0; right: 0; width: 40%; height: 60%; z-index: 0; pointer-events: none;">
  <defs>
    <!-- 8px Layout Grid -->
    <pattern id="hp-layout-grid" width="8" height="8" patternUnits="userSpaceOnUse">
      <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#1A1A1A" stroke-width="0.5"/>
    </pattern>
    
    <!-- 32px Major Snap Grid -->
    <pattern id="hp-major-grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <rect width="32" height="32" fill="url(#hp-layout-grid)"/>
      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#2E2E2E" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background Layer -->
  <rect width="100%" height="100%" fill="#000000"/>
  <!-- Grid Layer -->
  <rect width="100%" height="100%" fill="url(#hp-major-grid)"/>
</svg>
```

### 2.4 Theme Background Element

**Purpose:** Add large-scale visual texture without creating a solid background.

**Critical Rules:**

- Must use one of the two approved theme SVGs (see Section 3.9)
- Opacity: exactly 2%
- Fill: white (#FFFFFF)
- Stroke: NONE
- Position: **NOT centered** — must be offset, cropped (typically bottom-right)
- Used as a design element to add visual interest
- Works in conjunction with grid and scanlines for layered background

**Implementation:**

```html
<svg id="theme-bg-element" style="position: absolute; bottom: -20%; right: -15%; width: 60%; height: 60%; opacity: 0.02; z-index: 0; pointer-events: none;">
  <!-- Use either BG_Sheer_Star or BG_Holy_H from Section 3.9 -->
</svg>
```

### 2.5 Transparent Body Background

**CRITICAL:** The `<body>` background must ALWAYS be transparent to allow the After Effects UI color to show through. The plugin's visual background is composed of layered elements:

1. After Effects native UI (shows through transparent body)
2. Theme background element (2% opacity, offset)
3. Grid elements (design placement)
4. CRT scanlines (full coverage overlay)

```css
body {
  background: transparent;
}
```

## SECTION 3 — VECTOR-FIRST COMPONENT ARCHITECTURE

### 3.1 SVG Implementation Logic

Assets in the `holyplastic.exe` library are optimized for direct DOM manipulation. Agents must follow these rendering rules:

- **Flat Architecture:** `<g>` tags have been eradicated. SVGs are flattened to explicit `<path>` and `<polygon>` elements for immediate DOM accessibility and minimal payload.
    
- **Semantic IDs:** Every `<svg>` element has a unique, semantic ID format (`id="[category]-[descriptor]"`) to allow precise CSS targeting.
    
- **Placeholder Colors:** Inline hex codes (e.g., `#fff`, `#3f3f3f`) are **placeholders only**. UI components must strip or override these inline values using CSS to map them to official `holyplastic.exe` color tokens.
    
- **Color Variables in `<g>` tags:** When color variables appear in `<g>` tags, their colors are defined at the top of the CSS document and referenced by CSS classes (not inline).
    
- **Fill/Stroke Preservation:** Fills and strokes are predetermined. Some elements have one, some have both. This is intentional. **Do not add or remove fill/stroke attributes unless explicitly instructed.**
    

### 3.2 Category Roles

- **### FRIENDLY BUTTONS**
    
    - **Role:** Primary Buttons that are good for when something just needs to be obvious. Less confusing shape than other elements.
- **### RHOMBUS BUTTONS**
    
    - **Role:** Large buttons that may need a text label and so need to be wider; the paths would extend WITHOUT messing with the existing angles of each end. Smaller variant included for tight horizontal adjacency.
- **### MISC BUTTONS**
    
    - **Role:** Fun shapes with various flavors that add personality and embolden the visual language.
- **### SYMBOLS**
    
    - **Role:** Larger decorative elements and pure brand expressions.
- **### SMALL_BUTTONS**
    
    - **Role:** Standalone micro-interaction targets, primarily for checkboxes or binary toggles.
- **### ICONS**
    
    - **Role:** Internal button graphics or micro-indicators.
- **### EXTRAS**
    
    - **Role:** Small illustrative elements to be placed NEXT to a button rather than on it. Differ from icons in that they are not typically placed ON buttons.
- **### CRESTS (CRITICAL IMPLEMENTATION NOTE)**
    
    - **Role:** Complex, multi-segment structural arrays (e.g., a vertical tower of 5 interlocking buttons).
    - **Structure:** Crests are **NOT** single SVGs. To maintain web accessibility, hover states, and dynamic scaling, Crests have been exploded into individual, sequential SVGs (e.g., `crest-vertical-tower-1`, `crest-vertical-tower-2`).
    - **Implementation:** UI agents must reconstruct these in the layout by stacking the sequential SVGs inside a flex/grid container with `gap: 0px`. This preserves tight Illustrator-grade spacing while allowing each slice to act as a discrete `<button>`.
- **### THEME BACKGROUNDS**
    
    - **Role:** Large-scale background texture elements used at 2% opacity, offset and cropped for visual interest.

## SECTION 4 — SVG ASSET LIBRARY

### 4.1 FRIENDLY BUTTONS

```html
<svg id="btn-friendly-rounded" viewBox="0 0 54.95 24.12"><path d="M12.37.5h29.38c6.45,0,11.75,5.29,12.06,11.74.31,6.66-4.9,12.38-11.53,12.38H12.06C5.41,24.62.2,18.9.51,12.24.82,5.79,6.12.5,12.37.5Z" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-friendly-chamfered" viewBox="0 0 48.95 24.12"><path d="M.5,6.39L6.39.5h35.33l6.73,5.89v11.34l-5.89,5.89H6.39L.5,17.73V6.39Z" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-friendly-corners" viewBox="0 0 54.95 24.12"><path d="M47.05.5h-5.53l5.53,5.49v12.08l-5.53,5.55h-28l-5.53-5.49V6.05L13.52.5h33.53Z" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

### 4.2 RHOMBUS BUTTONS

```html
<!-- Large Rhombus Buttons (extendable width) -->
<svg id="btn-rhombus-large-p1" viewBox="0 0 41.62 24.12"><polygon points="24.12 .5 .5 12.06 24.12 23.62 41.12 23.62 41.12 .5 24.12 .5" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-rhombus-large-p2" viewBox="0 0 32.82 24.12"><polygon points=".5 .5 .5 23.62 32.32 23.62 32.32 .5 .5 .5" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-rhombus-large-p3" viewBox="0 0 41.62 24.12"><polygon points="17.5 .5 .5 .5 .5 23.62 17.5 23.62 41.12 12.06 17.5 .5" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<!-- Small Rhombus Buttons -->
<svg id="btn-rhombus-small-p1" viewBox="0 0 24.62 24.12"><polygon points="24.12 .5 .5 12.06 24.12 23.62 24.12 .5" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-rhombus-small-p2" viewBox="0 0 24.62 24.12"><polygon points="24.12 23.62 .5 12.06 24.12 .5 24.12 23.62" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

### 4.3 MISC BUTTONS

```html
<svg id="btn-misc-hexagon" viewBox="0 0 38.38 33.35"><polygon points="9.59 .5 .5 16.68 9.59 32.85 28.78 32.85 37.88 16.68 28.78 .5 9.59 .5" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-misc-octagon" viewBox="0 0 24.12 24.12"><polygon points="16.58 .5 7.54 .5 .5 7.54 .5 16.58 7.54 23.62 16.58 23.62 23.62 16.58 23.62 7.54 16.58 .5" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-misc-pentagon-up" viewBox="0 0 32.52 31.48"><polygon points="16.26 .5 .5 11.73 6.17 30.98 26.35 30.98 32.02 11.73 16.26 .5" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-misc-pentagon-down" viewBox="0 0 32.52 31.48"><polygon points="26.35 .5 6.17 .5 .5 19.75 16.26 30.98 32.02 19.75 26.35 .5" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-misc-plus-notched" viewBox="0 0 24.12 24.12"><polygon points="16.58 .5 16.58 7.54 23.62 7.54 23.62 16.58 16.58 16.58 16.58 23.62 7.54 23.62 7.54 16.58 .5 16.58 .5 7.54 7.54 7.54 7.54 .5 16.58 .5" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-misc-arrow-up" viewBox="0 0 24.12 30.54"><polygon points="12.06 .5 .5 13.51 7.54 13.51 7.54 30.04 16.58 30.04 16.58 13.51 23.62 13.51 12.06 .5" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-misc-arrow-down" viewBox="0 0 24.12 30.54"><polygon points="7.54 .5 7.54 17.03 .5 17.03 12.06 30.04 23.62 17.03 16.58 17.03 16.58 .5 7.54 .5" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-misc-chevron-right" viewBox="0 0 24.62 33.35"><polygon points="24.12 16.68 .5 .5 .5 32.85 24.12 16.68" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-misc-chevron-left" viewBox="0 0 24.62 33.35"><polygon points=".5 16.68 24.12 32.85 24.12 .5 .5 16.68" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-misc-nav-left" viewBox="0 0 30.54 24.12"><polygon points="13.51 .5 .5 12.06 13.51 23.62 30.04 23.62 30.04 .5 13.51 .5" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-misc-nav-right" viewBox="0 0 30.54 24.12"><polygon points="17.03 .5 .5 .5 .5 23.62 17.03 23.62 30.04 12.06 17.03 .5" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-misc-trapezoid-up" viewBox="0 0 32.52 24.12"><polygon points="9.59 .5 .5 23.62 32.02 23.62 22.93 .5 9.59 .5" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-misc-trapezoid-down" viewBox="0 0 32.52 24.12"><polygon points=".5 .5 9.59 23.62 22.93 23.62 32.02 .5 .5 .5" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-misc-tab-notch-left" viewBox="0 0 41.62 24.12"><polygon points="17.5 .5 .5 .5 .5 23.62 41.12 23.62 41.12 12.06 17.5 .5" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-misc-tab-notch-right" viewBox="0 0 41.62 24.12"><polygon points="24.12 .5 41.12 12.06 41.12 23.62 .5 23.62 .5 .5 24.12 .5" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-misc-house-peaked" viewBox="0 0 32.52 31.48"><polygon points=".5 30.98 .5 15.74 16.26 .5 32.02 15.74 32.02 30.98 .5 30.98" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

### 4.4 SYMBOLS

```html
<svg id="symbols-holy-h" viewBox="0 0 54.66 44.51"><path d="M30.34,22.11c.13-.17.5-.83-.53-.9-1.27.04-2.03-.07-3.3-.01-.58.03-1.28.06-1.72.48-3.84,5.03-7.2,10.45-10.94,15.56-.57.78-.85,1.33-1.92,1.41-1.73.13-3.89.05-5.66.06-1.36.01-3.03.11-4.35,0-.38-.03-1.41-.59-1.68-.86-.3-.3-.33-.81-.09-1.15L25.43.48c.31-.34.64-.54,1.12-.41.36.1,1.22.63,1.47.91,1.45,2.23,3.25,4.36,4.65,6.6.64,1.02.69,1.52.05,2.56-1.44,2.35-4.86,6.99-4.86,6.99,0,0-.29.39-.32.71-.01.14-.01.35.17.36l4.13.04s1.56-.49,2.28-1.47c2.52-3.43,4.79-7.06,7.34-10.47.42-.37.91-.53,1.46-.57,1.88-.13,4.16-.04,6.08-.06.92,0,3.61-.14,4.3.17.19.09.79.45.97.58.6.43.39,1.1.02,1.62l-25.1,36.02c-.88,1.02-1.49.14-2.38-.3-1.8-2.4-3.56-4.87-5.17-7.4" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="symbols-holy-p" viewBox="0 0 45.74 44.51"><path d="M24.16,1.31c-4.45,1.11-8.88,2.32-13.27,3.66-1.79.54-2.55,1.04-2.68,3.02-.22,3.43-.42,17.71-.41,23.88,0,4.48,0,8.97.04,13.45,0,.07-.08.13-.15.08-3.48-2.57-6.4-6.27-7.19-10.48-.76-4.07.53-9.01,2.91-12.24,3.11-4.2,8.32-7.16,13.43-8.53,7.97-2.14,15.93-1.83,23.76.77.5.16.98.36,1.42.63.79.48,1.17,1.32.98,2.22-.4,1.84-2.39,5.94-4.55,7.45-2.41,1.69-5.52,1.84-8.35,1.36-1.57-.26-3.08-.75-4.52-1.42-1.57-.74-2.98-1.83-4.04-3.21-.68-.88-.08-1.83.82-2.27,1.11-.55,2.3-.82,3.52-.97.61-.07,1.24-.1,1.85-.08.46.01.78.1.97.53.07.15.09.33.08.5-.03.31.07.61.27.84,0,0,.6.48.6.48,0,0,0,0,0,.01.1.08.25.12.41.06.22-.09.33-.22.32-.38-.06-.56-.05-1.12.08-1.66.14-.6.38-1.11.74-1.52.49-.56,1.13-.87,1.83-.96.66-.08,1.31.09,1.78.54.6.58.83,1.34.73,2.13-.09.72-.47,1.31-1.07,1.68-.64.39-1.36.6-2.11.72-1.09.16-2.19.25-3.29.26-1.33.02-2.66-.09-3.96-.37-2.78-.59-5.3-1.88-7.36-3.73-1.53-1.38-2.78-3.04-3.64-4.91-.66-1.43-1.1-2.98-1.21-4.58-.09-1.24.02-2.46.36-3.65.83-2.91,2.65-5.31,5.04-7.1C16.13,1.83,18.89.65,21.73.15c.71-.13,1.45-.18,2.18-.2,1.33-.02,2.66.15,3.94.53.5.15,1,.35,1.48.59.93.46,1.36,1.34,1.14,2.33-.22.98-.94,2.41-1.76,2.96-.66.44-1.44.61-2.2.62-.98.01-1.95-.16-2.88-.46-.47-.15-.95-.3-1.42-.46-.7-.22-.92-.8-.57-1.39.36-.61.92-1.03,1.54-1.37,1.05-.58,1.46-1.16,1.17-2.08" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="symbols-star-burst" viewBox="0 0 52.37 52.37"><polygon points="26.18 .5 31.04 21.14 51.87 26.18 31.04 31.23 26.18 51.87 21.14 31.23 .5 26.18 21.14 21.14 26.18 .5" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="symbols-star-sheer" viewBox="0 0 41.54 88.05"><path d="M41.54,44.6c-16.17,1.13-24.64,10.7-39.91,43.44,13.69-34.79,13.44-42.62,1.66-43.44C19.46,43.47,27.93,33.9,39.91.5c-13.36,32.85-13.22,42.78,1.62,44.1Z" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="symbols-crest-shield" viewBox="0 0 46.58 55.37"><path d="M23.29.5C10.02,6.56.5,13.74.5,13.74c0,0-.44,26.67,3.13,33.41C7.69,54.87,23.29,54.87,23.29,54.87c0,0,15.6,0,19.66-7.72,3.57-6.75,3.13-33.41,3.13-33.41,0,0-9.52-7.18-22.79-13.24Z" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

### 4.5 SMALL BUTTONS

```html
<svg id="btn-small-square" viewBox="0 0 14.03 14.03"><rect x=".5" y=".5" width="13.03" height="13.03" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-small-rhombus" viewBox="0 0 14.03 14.03"><rect x="2.27" y="2.27" width="9.49" height="9.49" transform="translate(7.01 -2.91) rotate(45)" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-small-circle" viewBox="0 0 14.03 14.03"><circle cx="7.01" cy="7.01" r="6.51" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-small-hexagon" viewBox="0 0 14.03 14.03"><polygon points="10.52 2.25 10.52 11.78 7.01 13.53 3.51 11.78 3.51 2.25 7.01 .5 10.52 2.25" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-small-pentagon-up" viewBox="0 0 14.03 14.03"><polygon points="7.01 .5 .5 5.01 2.76 13.53 11.27 13.53 13.53 5.01 7.01 .5" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="btn-small-pentagon-down" viewBox="0 0 14.03 14.03"><polygon points="11.27 .5 2.76 .5 .5 9.02 7.01 13.53 13.53 9.02 11.27 .5" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

### 4.6 ICONS

```html
<svg id="icons-starframe-quint" viewBox="0 0 11 11"><polygon points="5.5 .5 6.57 4.43 10.5 5.5 6.57 6.57 5.5 10.5 4.43 6.57 .5 5.5 4.43 4.43 5.5 .5" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-starframe-octo" viewBox="0 0 11 11"><polygon points="10.5 10.5 5.5 8.3 .5 10.5 2.7 5.5 .5 .5 5.5 2.7 10.5 .5 8.3 5.5 10.5 10.5" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-zig-ridge" viewBox="0 0 16.79 8"><polygon points=".5 4.87 6.35 .5 11.06 3.58 16.29 2.69 10.21 7.5 5.63 3.95 .5 4.87" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-wave-splice" viewBox="0 0 14.95 8"><path d="M12.07,4.03c-1.37.23-2.76-.23-3.72-1.23-.77-.8-1.44-1.49-1.44-1.49-.53-.76-1.83-1.12-2.55-.47L.5,4.38l1.97-.38c1.43-.28,2.9.2,3.89,1.27.89.96,1.73,1.84,1.84,1.91.63.43,1.55.43,2.05,0l4.2-3.55-2.38.4Z" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-wave-splice-tight" viewBox="0 0 14.95 8"><path d="M9.89,4.39c-1.1-1.14-2.98-3.08-2.98-3.08-.53-.76-1.83-1.12-2.55-.47L.5,4.38l4.27-.83c1.17,1.26,3.24,3.52,3.43,3.62.63.43,1.55.43,2.05,0l4.2-3.55-4.56.76Z" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-grid-diamond-core" viewBox="0 0 10.89 11"><path d="M.63,5.19L5.14.63c.17-.17.44-.17.61,0l4.52,4.57c.17.17.17.45,0,.61l-4.52,4.57c-.17.17-.44.17-.61,0L.63,5.81c-.17-.17-.17-.45,0-.61Z" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><line x1="5.45" y1=".63" x2="5.45" y2="10.37" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><line x1=".63" y1="5.5" x2="10.27" y2="5.5" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><line x1="5.45" y1="3.01" x2="5.45" y2="7.99" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><line x1="2.98" y1="5.5" x2="7.91" y2="5.5" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-bolt-solid-acute" viewBox="0 0 8.25 10"><polygon points="8.25 3 4.45 3.77 6.04 0 0 6.65 4.11 6.04 3.04 10 8.25 3" fill="#fff"/></svg>
<svg id="icons-bolt-solid-scrap" viewBox="0 0 9.19 10"><path d="M8.32,0c-.82.82-2.81,2.81-4.49,4.49l.43-1.2s.88-2.46.88-2.46C3.97,1.81,1.26,4.19.06,5.19c-.07.06-.08.04,0,0l2.33-.88c-.68,1.88-1.57,4.37-2.05,5.69l2.25-2.25,2.88-2.88c-.44,1.55-.91,3.25-1.15,4.1,1.07-.93,3.76-3.27,4.86-4.22l-2.47.97c.52-1.87,1.26-4.47,1.61-5.71Z" fill="#fff"/></svg>
<svg id="icons-bolt-solid-jagged" viewBox="0 0 13.62 10"><path d="M11.61.2c-1.03.75-3.7,2.69-5.89,4.28l.65-1.52,1.26-2.95C6,1.13,1.76,4.19.08,5.35c-.1.06-.11.04,0,0l3.75-1.2-1.15,2.69-1.32,3.09,2.72-1.98,3.95-2.86c-.6,1.81-1.28,3.87-1.62,4.91,1.45-1.04,5.69-4.09,7.21-5.17l-3.97,1.32c.66-2.01,1.55-4.69,1.96-5.95Z" fill="#fff"/></svg>
<svg id="icons-zigbolt-outline" viewBox="0 0 14.21 11"><polyline points=".5 6.26 4.97 1.78 1.84 10.5 11.84 .5 9.24 9.76 13.71 5.28" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-zigbolt-segmented" viewBox="0 0 14.21 11"><line x1="2.21" y1="10.5" x2="12.21" y2=".5" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><line x1=".5" y1="6.26" x2="4.97" y2="1.78" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><line x1="9.24" y1="9.76" x2="13.71" y2="5.28" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-diamond-solid-frame" viewBox="0 0 10.04 10.04"><path d="M5.01,1.15l3.88,3.88-3.86,3.86-3.88-3.88,3.86-3.86M5.01,0c-.16,0-.33.06-.45.19L.19,4.56c-.25.25-.25.66,0,.91l4.38,4.38c.13.13.29.19.45.19s.33-.06.45-.19l4.37-4.37c.25-.25.25-.66,0-.91L5.47.19c-.13-.13-.29-.19-.45-.19h0Z" fill="#fff"/></svg>
<svg id="icons-lens-split" viewBox="0 0 11 11"><line x1="3.59" y1="3.59" x2=".5" y2=".5" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><line x1="10.5" y1="10.5" x2="7.41" y2="7.41" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.41,3.59c-1.05-1.05-2.76-1.05-3.82,0-1.05,1.05-1.05,2.76,0,3.82,1.05,1.05,2.76,1.05,3.82,0,1.05-1.05,1.05-2.76,0-3.82Z" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-target-cross-ring" viewBox="0 0 11 11"><line x1="5.5" y1=".5" x2="5.5" y2="10.5" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><line x1=".5" y1="5.5" x2="10.5" y2="5.5" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5.5" cy="5.47" r="3.56" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-target-corner-notched" viewBox="0 0 11 11"><line x1=".5" y1="10.5" x2="2.7" y2="8.3" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><line x1="10.5" y1=".5" x2="8.3" y2="2.7" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><line x1="2.7" y1="2.7" x2=".5" y2=".5" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><line x1="8.3" y1="8.3" x2="10.5" y2="10.5" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.3,2.7h0c-1.55-1.55-4.05-1.55-5.6,0h0c-1.55,1.55-1.55,4.05,0,5.6h0c1.55,1.55,4.05,1.55,5.6,0h0c1.55-1.55,1.55-4.05,0-5.6Z" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-cross-diagonal" viewBox="0 0 11 11"><line x1="10.5" y1=".5" x2=".5" y2="10.5" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><line x1=".5" y1=".5" x2="10.5" y2="10.5" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-minus-line" viewBox="0 0 9.4 1"><line x1=".5" y1=".5" x2="8.9" y2=".5" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-plus-line" viewBox="0 0 11 11"><line x1="5.5" y1=".5" x2="5.5" y2="10.5" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><line x1=".5" y1="5.5" x2="10.5" y2="5.5" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-bars-vertical-tiered" viewBox="0 0 8.63 11"><line x1="8.13" y1="10.5" x2="8.13" y2=".5" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><line x1="4.1" y1="8.72" x2="4.1" y2="2.28" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><line x1=".5" y1="7.2" x2=".5" y2="3.8" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-bars-diagonal-tiered" viewBox="0 0 8.22 11"><line x1="7.72" y1="9.07" x2=".5" y2="1.85" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><line x1="4.2" y1="10.5" x2=".97" y2="7.27" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><line x1="7.19" y1="3.73" x2="3.96" y2=".5" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-pin-drop-wire" viewBox="0 0 6.54 8.58"><path d="M3.27,8.08L.64,3.78c-.23-.38-.18-.88.14-1.2l1.79-1.79c.38-.38,1-.38,1.38,0l1.79,1.79c.32.32.38.81.14,1.2l-2.63,4.31Z" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-cursor-sting" viewBox="0 0 9.98 9.98"><path d="M9.17,5.27l-2.69.92c-.13.05-.24.15-.28.28l-.92,2.69c-.13.38-.66.41-.83.05L.55,1.15c-.19-.39.22-.79.6-.6l8.07,3.89c.36.18.33.7-.05.83Z" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-rhombus-outline" viewBox="0 0 8.73 8.73"><rect x="1.63" y="1.63" width="5.46" height="5.46" transform="translate(4.36 -1.81) rotate(45)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-screen-and-baseline" viewBox="0 0 7.35 8.73"><rect x=".5" y=".5" width="6.35" height="4.28" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><line x1=".5" y1="8.23" x2="6.85" y2="8.23" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="icons-chevron-stack-vertical" viewBox="0 0 9.17 11"><polyline points="8.67 .5 4.59 4.71 .5 .5" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/><polyline points="8.67 6.29 4.59 10.5 .5 6.29" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

### 4.7 EXTRAS

```html
<svg id="extras-orbit-spark-ring" viewBox="0 0 7.1 8.37"><path d="M3.32,1.62l-1.05-.65c-.12-.08-.12-.2,0-.27L3.33.06c.12-.08.32-.08.45,0l1.05.65c.12.08.12.2,0,.27l-1.06.65c-.12.08-.32.08-.45,0Z" fill="#fff"/><path d="M.92,2.56l-.64.16c-.08.02-.12-.03-.1-.11l.15-.67c.02-.08.09-.16.17-.17l.64-.16c.08-.02.12.03.1.11l-.15.67c-.02.08-.09.16-.17.17Z" fill="#fff"/><circle cx="3.55" cy="4.82" r="3.05" fill="none" stroke="#fff" stroke-miterlimit="10"/></svg>
<svg id="extras-glyph-cluster-shard" viewBox="0 0 15.29 13.37"><rect x="5.25" y="4.47" width="4.31" height="4.32" rx=".64" ry=".64" transform="translate(6.86 -3.29) rotate(45)" fill="#fff"/><circle cx="12.81" cy="10.89" r="2.48" fill="#fff"/><path d="M0,0l3.75.91c.33.08.57.38.57.73v1.94c0,.41-.33.75-.75.75h-1.94c-.34,0-.64-.24-.73-.57L0,0Z" fill="#fff"/></svg>
```

### 4.8 CRESTS (Sequential Fragments)

```html
<!-- Horizontal Towers -->
<svg id="crest-horizontal-splitwing-btn-1" viewBox="0 0 63.17 12.52"><polygon points=".5 6.26 13 12.02 24.51 12.02 34.41 .5 13.75 .5 .5 6.26" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="crest-horizontal-splitwing-btn-2" viewBox="0 0 63.17 12.52"><polygon points="62.67 6.26 50.17 .5 38.74 .5 28.96 11.99 40.36 12.02 49.07 12.02 62.67 6.26" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<!-- Vertical Towers -->
<svg id="crest-vertical-tower-btn-1" viewBox="0 0 18.41 66.9"><path d="M.5,66.4v-17.4s17.41-5.68,17.41-5.68v12.81c0,2.84-1.84,5.36-4.55,6.21l-12.85,4.06Z" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="crest-vertical-tower-btn-2" viewBox="0 0 18.41 66.9"><polygon points=".5 44.99 .5 27.58 17.91 21.9 17.91 39.48 .5 44.99" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg id="crest-vertical-tower-btn-3" viewBox="0 0 18.41 66.9"><path d="M.5,23.58v-12.67c0-2.82,1.81-5.32,4.49-6.19L17.91.5v17.58S.5,23.58.5,23.58Z" fill="#3f3f3f" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

### 4.9 THEME BACKGROUNDS

**Usage:** Large-scale background elements at 2% opacity, white fill, no stroke, offset/cropped positioning.

```html
<svg id="BG_Sheer_Star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 267.42 566.59"><path id="BG_Sheer_Star_Path" d="M267.42,287.1c-104.06,7.3-158.52,68.85-256.77,279.49C96.61,355.16,95.71,291.19,0,279.49,104.06,272.19,158.52,210.65,256.77,0c-85.96,211.43-85.06,275.39,10.65,287.1Z"/></svg>

<svg id="BG_Holy_H" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 357.26 291.18"><path id="BG_Holy_H_Path" d="M198.55,144.65c.82-1.1,3.28-5.46-3.48-5.92-8.33.23-13.3-.48-21.59-.07-3.83.19-8.4.38-11.29,3.12-25.11,32.92-47.09,68.38-71.55,101.81-3.72,5.09-5.55,8.7-12.58,9.24-11.28.86-25.44.31-37.01.39-8.89.07-19.82.7-28.47,0-2.51-.2-9.22-3.84-10.96-5.6-1.95-1.97-2.14-5.29-.59-7.54L166.29,2.93c2.03-2.25,4.2-3.51,7.32-2.67,2.34.63,7.98,4.12,9.62,5.96,9.48,14.57,21.26,28.52,30.43,43.2,4.17,6.67,4.51,9.94.31,16.77-9.45,15.36-31.78,45.74-31.78,45.74,0,0-1.91,2.57-2.11,4.64-.09.94-.06,2.31,1.08,2.35l26.99.28s10.23-3.21,14.93-9.61c16.48-22.46,31.33-46.18,47.97-68.51,2.72-2.45,5.93-3.45,9.54-3.7,12.28-.87,27.19-.29,39.74-.39,6-.05,23.6-.94,28.13,1.12,1.25.57,5.19,2.95,6.34,3.79,3.89,2.84,2.54,7.21.11,10.58l-164.1,235.59c-5.78,6.67-9.72.93-15.55-1.97-11.78-15.68-23.3-31.82-33.83-48.37"/></svg>
```

## SECTION 5 — CODE STRUCTURE & ORGANIZATION

### 5.1 HTML Section Markers (Region Folding)

Structure your plugin HTML using consistent emoji-based region markers for visual clarity and IDE folding:

```html
<!-- ────────────────────────────────────────────── -->
<!-- #region 🌐🌐🌐 MAIN STUFF AT THE TOP
─────────────────────────────────────────────────── -->
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Holy Plastic</title>
  <link rel="stylesheet" href="styles.css" />
</head>

<body>
  <div class="page-frame"></div>
</body>

<!-- #endregion 
───────────────   
─────────────────────────────────────────────────── -->
<!-- #region ⚪️⚪️⚪️ SECTION NAME (lil description if needed)
─────────────────────────────────────────────────── -->
<!-- Content here -->

<!-- #endregion 
───────────────            
─────────────────────────────────────────────────── -->
<!-- #region 🟢🟢🟢 ANOTHER PANEL (does the other thing)
─────────────────────────────────────────────────── -->
```

**Rules:**

- Three identical emojis mark each region start
- Emojis can vary between sections for visual differentiation
- Each section uses the same emoji three times
- Section names should be descriptive
- Optional descriptions can be added in parentheses

### 5.2 CSS Section Markers (Region Folding)

Structure your CSS using the same emoji-based region marker system:

```css
/* ────────────────────────────────────────────── */
/* #region 🎨🎨🎨 COLOR VARIABLES
─────────────────────────────────────────────────── */
:root {
  /* Monochrome */
  --hp-void: #000000;
  --hp-surface: #0A0A0A;
  --hp-border: #1A1A1A;
  --hp-border-active: #2E2E2E;
  
  /* Signal Colors - Primary */
  --hp-signal-MAIN: #FF0073;
  --hp-signal-MAIN-dark: #640a23;
  --hp-signal-MAIN-boost: #fdadb4;
  
  /* Signal Colors - Secondary */
  --hp-signal-secondary-1: #00FFC3;
  --hp-signal-secondary-2: #FFB800;
  
  /* Text & States */
  --hp-signal-white: #F0F0F0;
  --hp-signal-dim: #666666;
  --hp-danger: #FF2D2D;
  
  /* Effects */
  --hp-glow-MAIN: rgba(255, 0, 115, 0.15);
}

/* #endregion 
───────────────   
─────────────────────────────────────────────────── */
/* #region 📐📐📐 LAYOUT TOKENS
─────────────────────────────────────────────────── */
:root {
  /* Stroke & Geometry */
  --hp-stroke-hair: 0.75px;
  --hp-stroke-thin: 1px;
  --hp-radius: 0px;
  
  /* Grid System */
  --hp-grid-layout: 4px;
  --hp-gap-segment: 2px;
  --hp-edge-margin: 0px;
  
  /* Motion & Texture */
  --hp-scanline-opacity: 0.03;
  --hp-scanline-repeat: 2px;
  --hp-flicker-duration: 50ms;
}

/* #endregion 
───────────────            
─────────────────────────────────────────────────── */
/* #region 🌍🌍🌍 BASE ELEMENTS
─────────────────────────────────────────────────── */
body {
  background: transparent;
  margin: 0;
  padding: 0;
  font-family: 'JetBrains Mono', monospace;
  color: var(--hp-signal-white);
}

/* #endregion 
───────────────            
─────────────────────────────────────────────────── */
/* #region 🔘🔘🔘 BUTTON STYLES
─────────────────────────────────────────────────── */
.btn-primary {
  stroke: var(--hp-signal-MAIN);
  fill: var(--hp-signal-MAIN-dark);
  cursor: pointer;
  transition: all var(--hp-flicker-duration) steps(4, end);
}

.btn-primary:hover {
  stroke: var(--hp-signal-MAIN-boost);
  fill: var(--hp-signal-MAIN);
}

.btn-primary .icon {
  fill: var(--hp-signal-MAIN);
}

.btn-primary:hover .icon {
  fill: var(--hp-signal-MAIN-dark);
}

/* #endregion 
───────────────            
─────────────────────────────────────────────────── */
/* #region ⚡️⚡️⚡️ ANIMATIONS & EFFECTS
─────────────────────────────────────────────────── */
@keyframes sync-flicker {
  0%, 100% { opacity: 1; }
  25% { opacity: 0.8; }
  50% { opacity: 1; }
  75% { opacity: 0.9; }
}

.btn-activated {
  animation: sync-flicker var(--hp-flicker-duration) steps(4, end);
}

.crt-scanlines {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent var(--hp-scanline-repeat),
    rgba(255, 255, 255, var(--hp-scanline-opacity)) var(--hp-scanline-repeat),
    rgba(255, 255, 255, var(--hp-scanline-opacity)) calc(var(--hp-scanline-repeat) * 2)
  );
  pointer-events: none;
  z-index: 1000;
}

/* #endregion 
───────────────            
─────────────────────────────────────────────────── */
```

**Rules:**

- Same emoji marker system as HTML
- Always define color variables at the top of the document
- Group related styles into logical sections
- Use CSS custom properties (variables) instead of inline values
- Maintain consistent indentation and spacing

## SECTION 6 — USABILITY GUARDRAILS

- **6.1 Hit-Box Rule:** Minimum interactive target is 32px × 32px (invisible hit area).
    
- **6.2 Contrast:** All text must meet WCAG AA.
    
- **6.3 Focus:** CRT glow serves as the primary focus indicator.
    

## SECTION 7 — AGENT SYSTEM PROMPT / RULE BOOK

```
=== HOLYPLASTIC.EXE DESIGN SYSTEM — AGENT RULE BOOK v1.7 ===

You are building UI for the holyplastic.exe brand.
Follow every rule below without deviation.

--- COLOR ARCHITECTURE ---
- Define ALL colors at the top of CSS document using :root custom properties
- CSS classes MUST reference variables (var(--hp-*)), NEVER inline hex/rgb/hsl codes
- Exception: Monochrome colors (white/black/greys) may use direct values if needed
- Interactive elements require three color variants:
  → MAIN (bright primary)
  → MAIN-dark (dark fill)
  → MAIN-boost (brightest hover)
- Button color states:
  → Default: Bright stroke + Dark fill + Bright icon
  → Hover: Bright fill + Boosted stroke + Dark icon (inverted for legibility)
- If plugin needs additional signal colors, follow the same three-variant pattern

--- SVG ARCHITECTURE ---
- Library: Use Section 4 as foundation and inspiration for all SVG components
- Placeholders: Map #fff → --hp-signal-MAIN and #3f3f3f → --hp-surface via CSS
- Flat structure: No <g> tags, explicit <path> and <polygon> elements only
- Semantic IDs: Every SVG has id="[category]-[descriptor]" format
- Fill/Stroke: PRESERVE existing attributes unless explicitly changing variant type
- Crests: Stack sequential SVG slices in flex/grid containers with gap: 0px
- Rhombus: 3-segment assembly (p1, p2, p3) with 2px gap between segments

--- BACKGROUND LAYER STACK (Bottom → Top) ---
Layer 1: Transparent <body> (After Effects UI shows through)
Layer 2: Theme background element
        → Uses BG_Sheer_Star OR BG_Holy_H from Section 4.9
        → Opacity: exactly 2%
        → Fill: white (#FFFFFF), Stroke: NONE
        → Position: NOT centered—offset to bottom-right, cropped
        → Purpose: Large-scale texture, not solid background
Layer 3: Grid elements (SVG patterns from Section 2.3)
        → Design elements, NOT full coverage
        → Positioned off-center, cropped, abstract placement
        → Optional: can be placed within specific containers
Layer 4: CRT scanlines (full viewport overlay)
        → Full coverage, unlike grids
        → 2px or 4px horizontal repeating pattern
        → Opacity: 2–5%
        → z-index: 1000, pointer-events: none

--- MOTION & TEXTURE ---
- CRT Scanlines: repeating-linear-gradient, 2-5% opacity, covers entire viewport
- Sync-flicker: 50ms animation on button activation using steps(4, end)
- Avoid smooth transitions—use stepped timing for industrial feel
- Grid backgrounds: Positioned as design elements, NOT full-coverage overlays

--- SPACING & DENSITY ---
- Philosophy: Extreme compactness, industrial-density feel
- Top-level containers: Default to 0px margin/padding (snap to edges)
- Internal sub-elements: May use layout gaps (4px, 8px) for legibility
- Grid system: 4px base unit for structural alignment
- Segment gaps: 2px between rhombus button parts
- Border radius: Always 0px (no rounded corners)

--- CODE STRUCTURE ---
- Use emoji-based region markers for both HTML and CSS
- Three identical emojis per section (e.g., 🎨🎨🎨 COLOR VARIABLES)
- Organize logically: Colors → Layout → Base → Components → Effects
- Add descriptive section names, optional brief descriptions in parentheses
- Maintain consistent indentation and clear visual separation

--- TYPOGRAPHY ---
- Data/UI text: JetBrains Mono (monospace)
- Display/Headers: Arial Black (bold, impactful)
- Color: --hp-signal-white (primary), --hp-signal-dim (inactive/placeholder)

--- HIT TARGETS & ACCESSIBILITY ---
- Minimum interactive target: 32px × 32px (invisible hit area if needed)
- Text contrast: Must meet WCAG AA standards
- Focus indicator: CRT glow effect (--hp-glow-MAIN as box-shadow)
- Semantic HTML: Use proper button/input elements with ARIA when needed
```

## APPENDIX — QUICK REFERENCE CARD

```
COLORS      void #000000 | surface #0A0A0A | border #1A1A1A
            MAIN #FF0073 | MAIN-dark #640a23 | MAIN-boost #fdadb4
            SEC-1 #00FFC3 | WARN #FFB800 

GRID        4px snap | 4px layout | 8px section | 2px segment gap

TYPE        JetBrains Mono (data) | Arial Black (display)

MOTION      Scanlines: 2-4px @ 2-5% opacity
            Flicker: 50ms steps(4, end)

BACKGROUND  1. Transparent body
            2. Theme element @ 2% opacity (offset)
            3. Grid elements (design placement)
            4. CRT scanlines (full coverage)
```

_holyplastic.exe Design Manifest v1.7 — March 2026_