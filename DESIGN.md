---
name: Warm Doodle Companion
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#554337'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#887365'
  outline-variant: '#dbc1b2'
  surface-tint: '#944a00'
  primary: '#944a00'
  on-primary: '#ffffff'
  primary-container: '#fb923c'
  on-primary-container: '#673200'
  inverse-primary: '#ffb783'
  secondary: '#006d36'
  on-secondary: '#ffffff'
  secondary-container: '#6dfe9c'
  on-secondary-container: '#007439'
  tertiary: '#4953bc'
  on-tertiary: '#ffffff'
  tertiary-container: '#9ca5ff'
  on-tertiary-container: '#28329c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc5'
  primary-fixed-dim: '#ffb783'
  on-primary-fixed: '#301400'
  on-primary-fixed-variant: '#713700'
  secondary-fixed: '#6dfe9c'
  secondary-fixed-dim: '#4de082'
  on-secondary-fixed: '#00210c'
  on-secondary-fixed-variant: '#005227'
  tertiary-fixed: '#e0e0ff'
  tertiary-fixed-dim: '#bdc2ff'
  on-tertiary-fixed: '#000767'
  on-tertiary-fixed-variant: '#2f3aa3'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '800'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 26px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 22px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 18px
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-pill:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  stat-counter:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.375rem
  space-sm: 0.625rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style

This design system reimagines job hunting and daily learning management from an anxiety-inducing corporate task into an encouraging, warm, hand-drawn journal companion. It blends **Neo-Brutalist structure** with **Playful Doodle / Stationery (手账)** warmth. The interface feels tactile, grounded, and gentle—like writing in a thoughtfully kept notebook with pastel gel pens, rounded stickers, and tactile washi tape.

### Core Visual Principles
- **Childlike Warmth & Tactility:** Rounded borders, gentle hard-cast offset drop shadows (`3px 3px 0px`), and soft sticker badges transform utilitarian task lists into rewarding milestones.
- **Hand-Drawn Line Art Accents:** Structural elements leverage distinct `2px` to `2.5px` ink-line contours. Playful hand-drawn doodles (twinkling star marks `✦`, spiral loops, cheerful bursts, and tape headers) introduce organic warmth without cluttering user data.
- **Clarity and Order (手账条理感):** Despite playful accents, typography scale, tabular layout logic, and task pipelines retain strict hierarchy, ensuring high focus during intensive interview and learning cycles.

## Colors

The palette departs from cold monochrome dashboards, adopting an energizing, cream-toned stationery foundation.

- **Background Canvas:** Warm Cream Milk (`#FFFDF7` / `#FEFCE8`) gives the surface a paper-like, gentle feel that reduces screen glare and fatigue.
- **Card & Sheet Surfaces:** Crisp Warm Ivory (`#FFFFFF`) with distinct ink outlines.
- **Ink & Strokes (Neutrals):** Softened Charcoal Slate (`#1E293B` primary stroke, `#475569` secondary text, `#94A3B8` muted details). Pure `#000000` is strictly avoided to maintain hand-drawn softness.
- **Accent Tints:**
  - *Sunset Peach / Tangerine (`#FB923C`, `#F87171`):* Urgent actions, key metrics, and primary action buttons.
  - *Mint Sprout Green (`#4ADE80`, `#86EFAC`):* Completed items, daily check-ins, and focus streaks.
  - *Morning Sky & Lavender (`#38BDF8`, `#818CF8`):* Communication channels, interview review sessions, and memory AI logs.
  - *Soft Butter (`#FEF08A`):* Highlight markers, sticky memo callouts, and badge backgrounds.

## Typography

Typography prioritizes warm geometry and legibility. `Plus Jakarta Sans` provides open apertures and friendly curves, lending body copy and headings an approachable character. `Space Grotesk` is paired sparingly for metadata tags, tracking numbers, and upper-case breadcrumbs to bring an organized, neo-notebook structure to the UI.

- **Numerals & Metrics:** Large metrics (`stat-counter`) use bold ink rendering, reminiscent of stamped dates in a study journal.
- **Section Headers:** Accompanied by mini uppercase subtitles (`label-caps`) that ground the playful aesthetic in clear navigational hierarchy.

## Layout & Spacing

The layout is built upon an organized 12-column responsive grid with ample white/cream space to keep high-stress information legible and calm.

- **Desktop (>= 1024px):** Fixed left navigation rail (240px) with fluid modular canvas. Grid uses `1.25rem` gutters and `2rem` page margins.
- **Tablet (768px - 1023px):** Compact collapsible sidebar (72px icons) with 8-column layout.
- **Mobile (< 768px):** Single-column stacked cards, bottom navigation dock, `1rem` outer canvas margin, and `0.75rem` gap between interactive modules.

## Elevation & Depth

Rather than blurry, photorealistic shadows, this design system uses **Tactile Solid-Offset Shadows (Sticker & Paper Depth)**.

- **Card Elevation:** Solid ink offset `box-shadow: 3px 3px 0px #1E293B;` paired with a crisp `2px solid #1E293B` border.
- **Interactive Hover & Push:**
  - Resting: `transform: translate(0px, 0px); box-shadow: 3px 3px 0px #1E293B;`
  - Hover: `transform: translate(-1px, -1px); box-shadow: 4px 4px 0px #1E293B;`
  - Active / Pressed: `transform: translate(2px, 2px); box-shadow: 1px 1px 0px #1E293B;`
- **Adhesive Washi Tape Elements:** Memo headers and quote panels occasionally feature semi-transparent rectangular tape tabs (`rgba(254, 240, 138, 0.7)` with slight -2deg or +2deg rotation) fixed at card top centers.

## Shapes

The shape vocabulary emphasizes soft curves that feel friendly and tactile.

- **Container Radii:** Standard cards and dialog frames utilize `18px` to `22px` radii, creating a rounded, friendly silhouette.
- **Interactive Controls:** Buttons and status chips adopt pill outlines (`9999px`) or ultra-rounded capsules (`12px` to `16px`).
- **Playful Asymmetry:** Milestone badges and doodle frames feature slight organic curvature to convey a hand-illustrated stationery charm.

## Components

### Buttons
- **Primary Button ("Jelly Stamp"):** Filled with Sunset Peach (`#FB923C`), outlined with `2.5px solid #1E293B`, and grounded by a `3px 3px 0px #1E293B` shadow. Includes white bold text with an accompanying star `✦` or arrow `→` icon.
- **Secondary / Ghost Button:** Cream background (`#FFFFFF`), `2px solid #1E293B` stroke, black ink text, depressing inward on hover.

### Cards & Panels
- **Doodle Metric Cards:** White canvas bordered by `2px solid #1E293B` with `20px` border-radius. Top-right corners hold hand-drawn icon accents (sparkles, check circles, or graduation caps).
- **Daily Focus Callout Card:** Accentuated with a soft pastel top-border bar (`4px` height) or a mini washi-tape badge pinned over the top border.

### Status Chips & Pills (Stickers)
- Rendered like collectible planner stickers: `padding: 4px 10px`, pill-shaped (`9999px`), `1.5px solid #1E293B` boundary, accompanied by pastel fills (Mint Green for passed/completed, Sunset Coral for urgent, Lavender for review).

### Inputs & Checkboxes
- **Inputs:** Crisp `#FFFFFF` fill with `2px solid #1E293B`, subtle interior padding (`12px 16px`), and rounded corners (`14px`). Focus state illuminates with a soft yellow halo (`0 0 0 3px #FEF08A`).
- **Checkboxes:** Thick `2px` stroke, rounded corners (`6px`). On active check, displays a hand-drawn spring-loaded green tick animation.

### Lists & Progress Bars
- **Task List:** Individual items rest inside lightweight pill rows with dotted or thin solid dividers.
- **Progress Trackers:** Rounded capsule tracks (`12px` height) with a visible `2px` ink border and segment fill resembling candy stripes or solid gouache paint.