# STL Urban Analytics

A unified urban data analytics platform for the City of St. Louis, combining **311 complaints**, **crime data**, **transit equity**, **vacancy triage**, **food access**, **census demographics**, and **ARPA fund expenditures** into an AI-powered Map Explorer with integrated analytics.

Built for the _St. Louis Sustainable Urban Innovation_ hackathon track.

## Pages

### Landing (`/`)

Splash page introducing the platform with navigation to the main dashboards.

### Map Explorer (`/explore`)

A fullscreen, map-centric dashboard with seven toggleable data layers, an AI command bar, and integrated analytics.

#### Layout

- **Layer Panel** (left rail) — Toggle layers on/off with contextual sub-filters (choropleth/heatmap mode, category pills, transit sub-layers, vacancy dropdowns + score slider, food desert/grocery toggles)
- **Map** (center) — Mapbox GL (light-v11) with click-to-select on any entity
- **Detail Panel** (right rail) — Opens on click with entity-specific detail views, neighborhood comparison
- **Analytics Panel** (bottom drawer) — Collapsible/resizable analytics with KPI chips, per-layer analytics modules, cross-dataset neighborhood view, and a ChartBuilder
- **Command Bar** (`Cmd+K` / `Ctrl+K`) — AI-powered natural language interface for querying data, toggling layers, and generating charts

#### Data Layers

**311 Complaints** — Choropleth or heatmap of complaint density by neighborhood. Category filtering (top 8 types). Analytics: daily volume chart, hourly/weekday distribution, weather correlation, category breakdown.

**Transit** — Metro stops, route shapes, 0.5-mile walksheds. Analytics: equity gap scoring per LILA census tract (0–100) factoring walkable stops, service frequency, grocery proximity, and transit-to-grocery connectivity.

**Vacancy** — Vacant properties as scored circles (red → green). Filters: best use, owner, type, neighborhood, min score. Detail view: six-factor triage score breakdown, recent 311 complaints, recommended best use (housing / solar / garden).

**Food Access** — LILA food desert tracts and grocery store locations. Detail view: demographics, nearby transit, nearest grocery, equity score.

**Crime** — SLMPD crime incidents as choropleth (by neighborhood count) or heatmap (individual points). Category filtering by offense type. Analytics: daily volume + 7-day MA, top offenses, hourly/weekday distribution, felony and firearm counts.

**Demographics** — Census data choropleth by population, vacancy rate, or population change (2010-2020). Analytics: city-wide KPIs, most populated neighborhoods, population change chart.

**ARPA Funds** — Analytics-only layer (no map visualization). Monthly spending + cumulative line, category breakdown, top vendors and projects lists.

#### Cross-Dataset Features

- **Neighborhood click** — Eagerly loads all datasets. Detail panel shows composite equity score (transit + 311 + food + vacancy) with breakdown bars. Analytics switches to cross-dataset view with top 311 issues chart and best rehab candidates.
- **Neighborhood comparison** — Side-by-side comparison of metrics across neighborhoods.
- **ChartBuilder** — User-configurable charts from underlying datasets with multi-series support, chart type toggles, and dual-axis.

### Housing Prices (`/housing`)

Placeholder — real housing data integration in progress.

### Affected Areas (`/affected`)

Placeholder — real neighborhood impact data integration in progress.

### Population (`/population`)

Placeholder — real Census population data integration in progress.

### About (`/about`)

Project information and methodology overview.

## Tech Stack

| Layer         | Technology                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| Framework     | [TanStack Start](https://tanstack.com/start) (SSR + server functions)                                           |
| Router        | [TanStack Router](https://tanstack.com/router) (file-based, type-safe)                                          |
| UI            | React 19 + Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (radix-nova)                                    |
| Map           | [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) via [react-map-gl](https://visgl.github.io/react-map-gl/) |
| Charts        | [Recharts](https://recharts.org/)                                                                               |
| Hosting       | [Cloudflare Workers](https://developers.cloudflare.com/workers/) via `@cloudflare/vite-plugin`                  |
| AI            | [OpenRouter](https://openrouter.ai/) API via server function + tool-use chat                                    |
| Data          | Static JSON/GeoJSON in `public/data/` from civic APIs                                                           |
| Data Pipeline | Python 3.12 + [uv](https://docs.astral.sh/uv/) (pandas, geopandas, shapely)                                     |
| ML            | OLS regression models for housing/neighborhood predictions                                                      |
| Analysis      | Jupyter notebooks with matplotlib + folium                                                                      |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- A [Mapbox](https://account.mapbox.com/) public access token
- [uv](https://docs.astral.sh/uv/) (for the Python data pipeline and notebooks)

### Install

```sh
pnpm install
```

### Configure

Create a `.env` file (see `.env.example`):

```
VITE_MAPBOX_TOKEN=pk.your_mapbox_public_token_here
OPENROUTER_API_KEY=sk-or-...   # Optional: enables AI command bar
```

### Develop

```sh
pnpm dev
```

Opens at [http://localhost:3000](http://localhost:3000).

### Build

```sh
pnpm build
```

Production output goes to `.output/` (Node) or `dist/` (Cloudflare Workers).

### Deploy to Cloudflare Workers

```sh
npx wrangler login   # one-time auth
pnpm deploy
```

### Data Pipeline & Notebooks

The `python/` directory contains a uv-managed Python project for fetching/processing datasets and interactive analysis.

```sh
cd python/
uv sync                                # Install deps into .venv
uv run python scripts/fetch_raw.py     # Download raw datasets → data/raw/
uv run python scripts/clean_data.py    # Process raw → public/data/ (frontend-ready)
uv run jupyter lab                     # Launch Jupyter for exploration notebooks
```

## Project Structure

```
src/
├── routes/
│   ├── __root.tsx                Root layout
│   ├── _bare.tsx                 Bare layout (no nav)
│   ├── _bare/index.tsx           Landing page
│   ├── _app.tsx                  App layout (nav shell)
│   ├── _app/
│   │   ├── explore.tsx           Map Explorer
│   │   ├── housing.tsx           Housing Prices (placeholder)
│   │   ├── affected.tsx          Affected Neighborhoods (placeholder)
│   │   ├── population.tsx        Population (placeholder)
│   │   └── about.tsx             About page
│   └── api/chat.ts              AI chat server endpoint
├── components/
│   ├── explorer/
│   │   ├── MapExplorer.tsx       Top-level CSS grid layout
│   │   ├── ExplorerProvider.tsx  State (useReducer) + data fetching
│   │   ├── ExplorerMap.tsx       Mapbox canvas + click handler
│   │   ├── LayerPanel.tsx        Left rail: layer toggles + sub-filters
│   │   ├── DetailPanel.tsx       Right rail: entity detail dispatch
│   │   ├── AnalyticsPanel.tsx    Bottom drawer: collapsible analytics
│   │   ├── CommandBar.tsx        AI chat overlay (Cmd+K)
│   │   ├── TimeRangeSlider.tsx   Temporal data filtering
│   │   ├── layers/
│   │   │   ├── NeighborhoodBaseLayer.tsx
│   │   │   ├── ComplaintsLayer.tsx
│   │   │   ├── CrimeLayer.tsx
│   │   │   ├── TransitLayer.tsx
│   │   │   ├── VacancyLayer.tsx
│   │   │   ├── FoodAccessLayer.tsx
│   │   │   ├── DemographicsLayer.tsx
│   │   │   └── StandaloneNeighborhoodLayer.tsx
│   │   ├── detail/
│   │   │   ├── NeighborhoodDetail.tsx      Composite score + cross-dataset
│   │   │   ├── NeighborhoodComparePanel.tsx Neighborhood comparison
│   │   │   ├── useNeighborhoodMetrics.ts   Metrics computation hook
│   │   │   ├── VacancyDetail.tsx           Triage score breakdown
│   │   │   ├── StopDetail.tsx              Stop info + routes
│   │   │   ├── GroceryDetail.tsx           Store + nearest desert
│   │   │   └── FoodDesertDetail.tsx        Demographics + equity score
│   │   ├── analytics/
│   │   │   ├── ComplaintsAnalytics.tsx     311 charts + KPIs
│   │   │   ├── CrimeAnalytics.tsx         Crime charts + KPIs
│   │   │   ├── TransitAnalytics.tsx       Equity gap list
│   │   │   ├── VacancyAnalytics.tsx       Score distribution
│   │   │   ├── ArpaAnalytics.tsx          ARPA spending charts
│   │   │   ├── DemographicsAnalytics.tsx  Census data charts
│   │   │   ├── NeighborhoodAnalytics.tsx  Cross-dataset view
│   │   │   ├── MiniKpi.tsx                Compact KPI display
│   │   │   └── chart-builder/
│   │   │       ├── ChartCanvas.tsx        Chart rendering
│   │   │       ├── ChartControls.tsx      Chart config UI
│   │   │       └── useChartBuilder.tsx    Chart state hook
│   ├── landing/
│   │   └── LandingPage.tsx       Splash / landing page
│   ├── about/
│   │   └── AboutPage.tsx         About / methodology
│   ├── map/
│   │   ├── MapProvider.tsx       Shared Mapbox GL wrapper (light-v11)
│   │   └── MapLegend.tsx         Choropleth / gradient legend
│   ├── charts/
│   │   ├── TimeSeriesChart.tsx   Bar + line combo chart
│   │   ├── CategoryBarChart.tsx  Horizontal / vertical bar chart
│   │   ├── HourlyChart.tsx       24-hour distribution
│   │   ├── WeekdayChart.tsx      Day-of-week distribution
│   │   └── WeatherInsights.tsx   Weather correlation panel
│   ├── ui/                       shadcn components
│   └── Nav.tsx                   Top navigation bar
├── lib/
│   ├── types.ts                  Domain interfaces
│   ├── explorer-types.ts         State, actions, data context types
│   ├── analysis.ts               Hotspot detection, weather correlation
│   ├── equity.ts                 Haversine, equity gap scoring
│   ├── scoring.ts                Vacancy triage scoring + best-use
│   ├── colors.ts                 Choropleth scales, score colors
│   ├── chart-datasets.ts         ChartBuilder dataset registry
│   ├── neighborhood-metrics.ts   Neighborhood metric calculations
│   ├── utils.ts                  cn() helper
│   └── ai/
│       ├── system-prompt.ts      AI system prompt construction
│       ├── tools.ts              AI tool definitions
│       ├── use-chat.ts           Chat hook (streaming + tool calls)
│       ├── action-executor.ts    Executes AI-generated map actions
│       ├── data-executor.ts      Executes AI data queries
│       ├── kpi-snapshot.ts       Builds KPI context for AI
│       ├── neighborhood-resolver.ts Resolves neighborhood queries
│       └── command-bar-events.ts Event bus for command bar toggle
public/
└── data/
    ├── csb_latest.json           311 complaints aggregated (1.6 MB)
    ├── csb_2025.json             2025 311 complaints
    ├── trends.json               Year-over-year + weather data (24 KB)
    ├── neighborhoods.geojson     79 neighborhood polygons (184 KB)
    ├── stops.geojson             Metro Transit stops (872 KB)
    ├── shapes.geojson            Route line geometries (620 KB)
    ├── routes.json               Bus + rail route metadata (8 KB)
    ├── stop_stats.json           Service frequency per stop (232 KB)
    ├── food_deserts.geojson      LILA census tracts (16 KB)
    ├── grocery_stores.geojson    Grocery store locations (4 KB)
    ├── crime.json                SLMPD crime incidents
    ├── arpa.json                 ARPA fund expenditures
    ├── demographics.json         Census demographics by neighborhood
    └── vacancies.json            Real vacant building data
python/
├── pyproject.toml                uv project config + dependencies
├── .python-version               Pins Python 3.12
├── scripts/
│   ├── fetch_raw.py              Download raw datasets → data/raw/
│   └── clean_data.py             Process raw data → public/data/
├── data/raw/                     Raw downloads (gitignored)
├── notebooks/
│   ├── raw_data.ipynb            Interactive data exploration
│   ├── exploration.ipynb         Data exploration notebook
│   └── ml.ipynb                  Machine learning notebook
└── training/
    ├── ols.py                    OLS regression training script
    ├── model2_codebook.json      Model variable codebook
    ├── crosssectional_*.csv      Cross-sectional train/test data
    └── panel_*.csv               Panel train/test/full data
```

## Data Sources

| Dataset                 | Source                                                             | Format                         |
| ----------------------- | ------------------------------------------------------------------ | ------------------------------ |
| 311 Service Requests    | [City of St. Louis CSB](https://www.stlouis-mo.gov/data/)          | Pre-processed JSON from CSV    |
| Neighborhood Boundaries | City of St. Louis Open Data                                        | GeoJSON                        |
| Transit (GTFS)          | [Metro Transit](https://www.metrostlouis.org/developer-resources/) | Converted from GTFS to GeoJSON |
| Food Desert Tracts      | USDA Economic Research Service (LILA definitions)                  | Simplified GeoJSON             |
| Grocery Stores          | Manual compilation + geocoding                                     | GeoJSON                        |
| Vacant Properties       | City of STL Vacant Building List                                   | JSON                           |
| Crime Incidents         | [SLMPD](https://www.slmpd.org/crime_stats.shtml) NIBRS data       | Pre-processed JSON from CSV    |
| ARPA Expenditures       | [City of STL Open Data](https://www.stlouis-mo.gov/)              | JSON API                       |
| Census Demographics     | City of STL Planning Dept neighborhood census pages                | Scraped HTML → JSON            |

## Algorithms

### Vacancy Triage Score (0–100)

Six weighted factors:

| Factor                | Weight | Logic                                               |
| --------------------- | ------ | --------------------------------------------------- |
| Condition             | 25%    | Inverse of 1–5 rating (condemned = 100)             |
| 311 Complaint Density | 20%    | Nearby count / 20, capped at 100                    |
| Lot Size              | 10%    | sq ft / 10,000, capped at 100                       |
| Ownership             | 15%    | LRA=100, City=70, Private=scaled by tax delinquency |
| Proximity             | 15%    | Pre-computed distance to occupied properties        |
| Tax Delinquency       | 15%    | Years / 10, capped at 100                           |

Best-use determination scores each property for housing, solar, and garden fitness independently and picks the highest.

### Transit Equity Score (0–100)

Per LILA census tract:

- Up to 30 pts for walkable transit stops (within 0.5 mi)
- Up to 20 pts for service frequency
- Up to 25 pts for grocery store proximity
- 25 pts if a direct bus route connects the tract to a grocery store

### 311 Hotspot Detection

- **Volume hotspots**: neighborhoods with >2x the city-wide average complaint count
- **Resolution hotspots**: neighborhoods with >1.5x average resolution time and >200 complaints

## License

Hackathon project — not licensed for production use. Data is sourced from public datasets; see individual source documentation for terms.
