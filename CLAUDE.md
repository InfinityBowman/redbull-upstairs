# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev            # Dev server on http://localhost:3000
pnpm build          # Production build (.output/ for Node, dist/ for CF Workers)
pnpm test           # Run tests (vitest run)
pnpm lint           # ESLint
pnpm format         # Prettier
pnpm check          # Prettier --write + ESLint --fix
pnpm deploy         # Build + deploy to Cloudflare Workers
pnpm data:fetch     # Download raw datasets → python/data/raw/
pnpm data:clean     # Process raw → public/data/ (frontend-ready)
pnpm data:sync      # Install Python deps (uv sync)
pnpm data:pipeline  # Full pipeline: sync + fetch + clean
```

## Environment

Requires a `.env` file with `VITE_MAPBOX_TOKEN=pk.xxx` (Mapbox public access token) and optionally `OPENROUTER_API_KEY` for AI command bar. See `.env.example`.

### Python / uv

The `python/` directory contains a uv-managed Python project for data pipelines and analysis notebooks.

```bash
cd python/
uv sync                              # Install deps into .venv
uv run python scripts/fetch_raw.py   # Download raw datasets → data/raw/
uv run python scripts/clean_data.py  # Process raw → public/data/ (frontend-ready)
uv run jupyter lab                   # Launch notebooks
```

Dependencies are declared in `python/pyproject.toml`. Python 3.12 is pinned via `python/.python-version`.

## Architecture

This is a St. Louis urban analytics dashboard combining three hackathon prototypes into one cross-dataset platform. Built with **TanStack Start** (SSR) + **TanStack Router** (file-based routing), React 19, Tailwind CSS v4, and deployed to **Cloudflare Workers**.

### Routing

File-based routing via TanStack Router. Route tree is auto-generated in `src/routeTree.gen.ts` — do not edit manually. Two layout groups: `_bare` (no nav, used for landing) and `_app` (nav shell).

- `/` — Landing page (`_bare` layout)
- `/explore` — Unified Map Explorer (fullscreen map with layer toggles, detail panel, analytics drawer, AI command bar)
- `/housing` — Housing Prices (placeholder — needs real data source)
- `/affected` — Affected Neighborhoods (placeholder — needs real data source)
- `/population` — Population trends (placeholder — needs real data source)
- `/about` — About page
- `/api/chat` — AI chat server endpoint (POST, uses OpenRouter)

### Data Flow

All data lives in `public/data/` as static JSON/GeoJSON files. `ExplorerProvider` manages all state via `useReducer` and data fetching via `useState` + lazy loading. Base datasets (neighborhoods, routes, grocery stores) load on mount; layer-specific datasets load on toggle. Expensive computations are memoized with `useMemo`.

Key datasets: `csb_latest.json` (311 complaints), `neighborhoods.geojson` (79 boundaries), `stops.geojson`/`shapes.geojson`/`routes.json` (transit GTFS), `food_deserts.geojson`, `grocery_stores.geojson`, `crime.json` (SLMPD crime incidents), `arpa.json` (ARPA fund expenditures), `demographics.json` (census demographics by neighborhood), `vacancies.json` (vacant building data).

The data pipeline is split into two scripts: `python/scripts/fetch_raw.py` downloads raw datasets into `python/data/raw/`, and `python/scripts/clean_data.py` processes them into the JSON/GeoJSON files in `public/data/`.

### Code Organization

- `src/routes/` — `_bare/index.tsx` (landing), `_app/explore.tsx` (Map Explorer), `_app/housing.tsx`, `_app/affected.tsx`, `_app/population.tsx`, `_app/about.tsx`, `api/chat.ts` (AI endpoint)
- `src/components/explorer/` — Core app: `MapExplorer.tsx` (CSS grid layout), `ExplorerProvider.tsx` (state + data), `ExplorerMap.tsx` (Mapbox canvas + click handler), `LayerPanel.tsx` (left rail), `DetailPanel.tsx` (right rail), `AnalyticsPanel.tsx` (bottom drawer), `CommandBar.tsx` (AI chat), `TimeRangeSlider.tsx` (temporal filter)
- `src/components/explorer/layers/` — Map layers: `NeighborhoodBaseLayer`, `ComplaintsLayer`, `CrimeLayer`, `TransitLayer`, `VacancyLayer`, `FoodAccessLayer`, `DemographicsLayer`, `StandaloneNeighborhoodLayer`
- `src/components/explorer/detail/` — Entity detail views: `NeighborhoodDetail`, `NeighborhoodComparePanel`, `VacancyDetail`, `StopDetail`, `GroceryDetail`, `FoodDesertDetail`, `useNeighborhoodMetrics` hook
- `src/components/explorer/analytics/` — Analytics modules: `ComplaintsAnalytics`, `CrimeAnalytics`, `TransitAnalytics`, `VacancyAnalytics`, `ArpaAnalytics`, `DemographicsAnalytics`, `NeighborhoodAnalytics`, `MiniKpi`, `chart-builder/` (ChartCanvas, ChartControls, useChartBuilder)
- `src/components/landing/` — `LandingPage`
- `src/components/about/` — `AboutPage`
- `src/components/map/` — `MapProvider` (Mapbox wrapper), `MapLegend`
- `src/components/charts/` — Reusable charts: `TimeSeriesChart`, `CategoryBarChart`, `HourlyChart`, `WeekdayChart`, `WeatherInsights`
- `src/components/ui/` — shadcn/ui primitives
- `src/lib/` — Business logic: `analysis.ts` (hotspot detection, weather correlation), `equity.ts` (haversine, equity scoring), `scoring.ts` (vacancy triage), `colors.ts` (choropleth scales), `types.ts` (all interfaces), `explorer-types.ts` (state/action types), `chart-datasets.ts` (ChartBuilder datasets), `neighborhood-metrics.ts`
- `src/lib/ai/` — AI system: `system-prompt.ts`, `tools.ts`, `use-chat.ts`, `action-executor.ts`, `data-executor.ts`, `kpi-snapshot.ts`, `neighborhood-resolver.ts`, `command-bar-events.ts`

### Map Setup

Maps use Mapbox GL via `react-map-gl`. The shared wrapper is `MapProvider` centered on STL (38.635, -90.245, zoom 11.5) with light-v11 style. Layers are rendered using `<Source>` and `<Layer>` components. Click handling uses `queryRenderedFeatures` with priority ordering (vacancy > stops > grocery > food desert > neighborhood).

## Documentation

When adding features, changing project structure, or modifying commands, update **both** `CLAUDE.md` and `README.md` to keep them in sync. `README.md` is the public-facing doc (project overview, setup instructions, project structure tree). `CLAUDE.md` is the AI-facing doc (architecture, conventions, code organization).

## Conventions

- **Imports**: Use `@/` path alias (maps to `src/`)
- **Components**: PascalCase filenames. shadcn/ui uses radix-nova style with HugeIcons
- **Styling**: Tailwind classes only, dark mode via OKLCH custom properties in `src/styles.css`
- **Types**: All interfaces in `src/lib/types.ts`
- **Neighborhood IDs**: Zero-padded NHD_NUM strings ("01", "02", etc.) used as keys across datasets
