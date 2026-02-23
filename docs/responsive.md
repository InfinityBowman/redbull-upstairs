# Mobile Responsiveness Audit

**Date:** 2026-02-23 (initial), updated 2026-02-23
**Scope:** Full codebase audit across layouts, explorer components, detail/analytics panels, charts, and landing/about pages.
**Target devices:** iPhone SE (375px), iPhone 14 (390px), small Android (360px), iPad (768px), iPad Pro (1024px)

---

## Executive Summary

The application now has solid mobile foundations for the core Explorer experience. The grid layout, layer panel, detail panel, command bar, and analytics panel have all been adapted for mobile via a combination of responsive breakpoints, new mobile-only components, and selective hiding of desktop-only features. The remaining gaps are mostly around touch target sizes, small text, and secondary pages (landing, about).

### What's been fixed

- Explorer grid collapses at `max-md` (768px) instead of `max-lg` (1024px)
- Layer panel replaced by a slide-in `MobileLayerDrawer` on mobile, triggered by a 44x44px `LayerFab` button
- Detail panel becomes a full-width bottom sheet (50vh) with drag handle on mobile
- Mapbox controls bumped to 44x44px on touch devices via `@media (pointer: coarse)`
- Range slider thumb increased to 24x24px on touch devices
- KPI grids changed to `grid-cols-2 sm:grid-cols-4` in all analytics components
- CommandBar correctly centers on tablets with `max-md` breakpoint
- Analytics panel and time range slider hidden on mobile (`max-md:hidden`)
- Nav AI bar hidden on mobile; compact mobile pill button added

### What still needs work

1. **Several touch targets remain below 44px** — detail close button (24px), map style toggles (~28px), CommandBar send button (~22px), PillToggle buttons (~15px)
2. **Sub-10px text** (`text-[0.55rem]` through `text-[0.65rem]`) used throughout
3. **Map legend** still fixed-width with no mobile collapse
4. **Landing page** stat ribbon doesn't stack, oversized numbers
5. **No safe-area inset support** for notched devices

---

## Resolved Issues

### ~~1. MapExplorer Grid Layout~~ — FIXED

Grid breakpoint changed from `max-lg` to `max-md` (768px). Mobile uses `max-md:grid-cols-1 max-md:grid-rows-1` — the map fills remaining space via `min-h-0`. Layer panel hidden on mobile (`md:block`).

### ~~2. Detail Panel Fixed Width~~ — FIXED

Now uses `w-[min(380px,100%)]` on desktop. On mobile (`max-md`), the panel becomes a `fixed` full-width bottom sheet at 50vh with rounded top corners, slide-up animation, and a drag handle. Renders above the map as an overlay rather than pushing content.

### ~~3. Mapbox & Slider Touch Targets~~ — PARTIALLY FIXED

`styles.css` now includes:
```css
@media (pointer: coarse) {
  .mapboxgl-ctrl-group button { width: 44px !important; height: 44px !important; }
  .layer-range-slider::-webkit-slider-thumb { width: 24px; height: 24px; }
  .layer-range-slider::-moz-range-thumb { width: 24px; height: 24px; }
}
```

Mapbox buttons meet the 44px minimum. Slider thumb improved to 24px (still under 44px). Other component-level touch targets remain unchanged (see open issues below).

### ~~4. Analytics KPI Grids~~ — FIXED

All seven analytics components now use `grid grid-cols-2 gap-2 sm:grid-cols-4`. Additionally, the entire analytics panel is hidden on mobile (`max-md:hidden`), so these only render on 768px+ screens.

### ~~5. CommandBar Positioning~~ — FIXED

Added `max-md:left-1/2 max-md:w-[min(420px,calc(100%-1rem))] max-md:-translate-x-1/2` for tablets. The `max-sm:inset-x-2 max-sm:bottom-2` fallback remains for phones.

### ~~10. LayerPanel Not Collapsible~~ — FIXED

Two new components implement a full mobile drawer pattern:
- **`LayerFab.tsx`** — 44x44px floating action button, `md:hidden`, positioned bottom-left of the map. Shows active layer count badge. Hides when detail panel is open.
- **`MobileLayerDrawer.tsx`** — Left-slide Sheet (shadcn/Radix), width `min(300px, 85vw)`. Renders the full `LayerPanel` inside with a close button.

State managed via `OPEN_MOBILE_LAYER_DRAWER` / `CLOSE_MOBILE_LAYER_DRAWER` actions in `ExplorerProvider`.

### ~~11. Navigation Touch Targets~~ — PARTIALLY FIXED

The desktop `w-64` AI bar is now `md:flex hidden` (doesn't render on mobile). A compact `md:hidden` mobile AI pill button was added with `active:scale-95` touch feedback. Nav link padding (~24px height) remains unchanged.

### ~~12. AnalyticsPanel Drag Handle~~ — BYPASSED

The analytics panel is hidden on mobile (`max-md:hidden`), so the mouse-only drag handle is not a mobile concern. On desktop it remains `onMouseDown` only.

---

## Open Issues

### High Priority

#### Touch targets still below 44px

| Element | Current Size | File |
|---------|-------------|------|
| Detail panel close button | 24px (`h-6 w-6`) | `DetailPanel.tsx` |
| Map style toggle buttons | ~28px (`px-2 py-1`) | `ExplorerMap.tsx` |
| CommandBar send button | ~22px (`p-1`) | `CommandBar.tsx` |
| PillToggle buttons | ~15px (`py-[3px]`) | `LayerPanel.tsx` |
| TagButton | ~15px (`py-[3px]`) | `LayerPanel.tsx` |
| Layer select dropdowns | ~28px (`py-1.5`) | `LayerPanel.tsx` |
| Nav link buttons | ~24px (`px-2.5 py-1`) | `Nav.tsx` |
| Mobile AI pill | ~26px (`px-2.5 py-1`) | `Nav.tsx` |

**Recommendation:** Increase padding on interactive elements to meet 44px minimum, at least on touch devices.

#### Text sizes below readable threshold

| Size | Usage | Files |
|------|-------|-------|
| `text-[0.55rem]` (8.8px) | MiniKpi labels, ComparePanel "vs" | `MiniKpi.tsx`, `NeighborhoodComparePanel.tsx` |
| `text-[0.6rem]` (9.6px) | Analytics list items, badges | `ArpaAnalytics.tsx`, `NeighborhoodAnalytics.tsx` |
| `text-[0.62rem]` (9.9px) | Layer descriptions, select dropdowns | `LayerPanel.tsx`, `LandingPage.tsx` |
| `text-[0.65rem]` (10.4px) | Tab pills, route descriptions | `AnalyticsPanel.tsx`, `StopDetail.tsx` |

**Recommendation:** Establish a minimum `text-[0.7rem]` (11.2px) floor for all readable text.

#### Map legend not collapsible

`MapLegend.tsx` still uses `min-w-[155px] max-w-[190px]` with absolute positioning. On a 390px phone, the legend takes ~49% of viewport width. No collapse mechanism.

**Recommendation:** Make legend collapsible on mobile, or hide by default below 640px.

### Medium Priority

#### NeighborhoodComparePanel fixed percentages

`CompareRow` still uses rigid `w-[38%]` / `w-[24%]` / `w-[38%]` splits. Inside the mobile bottom sheet (full-width), this is workable at 390px (~148px per side) but tight. The `text-[0.55rem]` "vs" label is tiny.

#### Chart component defaults

Chart components still have hardcoded default heights (350px, 300px) and `fontSize={11}` on axes. In practice, call sites override heights to 180px in the analytics panel. The defaults only matter if charts are used outside the Explorer context.

#### MetricCard pairs in detail views

`VacancyDetail`, `StopDetail`, `GroceryDetail`, `FoodDesertDetail` use `flex gap-2` without mobile stacking. Inside the mobile bottom sheet (full-width), each card gets ~190px — functional but could be improved with `max-sm:flex-col`.

#### Landing page stat ribbon

`flex items-center gap-8` doesn't stack on mobile. `text-7xl` dataset numbers are oversized on phones.

#### Vacancy tooltip overflow

`ExplorerMap.tsx` uses `w-56` (224px) for the vacancy tooltip — can overflow on 320px screens. Should be `w-[min(224px,90vw)]`.

#### About page CTA section

`flex items-center gap-4` doesn't stack on mobile. Should add `max-sm:flex-col`.

### Low Priority

- **No safe-area inset support** — No `env(safe-area-inset-*)` for notched devices
- **CategoryBarChart YAxis width** — Fixed `width={160}` is excessive on mobile
- **HourlyChart tick interval** — `interval={2}` (12 ticks) causes overlap on narrow screens
- **ChartControls min-widths** — `min-w-[130px]` / `min-w-[140px]` consume 40%+ on small phones
- **MapProvider default height** — `h-150` (600px) hardcoded, but overridden to `h-full` in Explorer context so not a real issue currently

---

## Summary

| Status | Count | Key Areas |
|--------|-------|-----------|
| Fixed | 8 | Explorer grid, detail panel, Mapbox touch targets, KPI grids, CommandBar, layer drawer, nav AI bar, analytics panel hidden |
| Open — High | 3 | Remaining touch targets, sub-10px text, map legend |
| Open — Medium | 5 | Compare panel, chart defaults, metric cards, landing page, tooltip overflow |
| Open — Low | 5 | Safe-area insets, chart axis widths, tick intervals, chart controls, map provider height |

## Recommended Next Fixes

1. **Touch targets** — Increase padding on detail close button, CommandBar send, PillToggle, and TagButton to 44px minimum
2. **Text floor** — Audit all `text-[0.55rem]` through `text-[0.65rem]` and increase to minimum 11px
3. **Map legend** — Add collapse toggle on mobile
4. **Landing page** — Stack stat ribbon and reduce number sizes on mobile
5. **Safe-area insets** — Add `env(safe-area-inset-*)` for notched devices
