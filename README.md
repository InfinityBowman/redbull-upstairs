# STL Urban Analytics

A unified urban data analytics platform for the City of St. Louis, combining three hackathon prototypes — **311 Pattern Detector**, **Transit Equity Mapper**, and **Vacancy Triage** — into a single cross-dataset dashboard with a **Neighborhood Report Card** feature.

Built for the _St. Louis Sustainable Urban Innovation_ hackathon track.

## Views

### Overview Dashboard (`/`)

City-wide KPI cards, a choropleth map of complaint density, top 5 hotspot neighborhoods, and quick links into each tool view.

### 311 Pattern Detector (`/complaints`)

- Choropleth and heatmap toggle (Mapbox GL native layers)
- Category filter buttons (top 8 complaint types)
- Daily volume chart with 7-day moving average
- Horizontal bar chart of complaint categories
- Sortable neighborhood analysis table with resolution-time badges
- Hourly and day-of-week distribution charts
- Weather correlation insights (rain, temperature, next-day effects)
- Year-over-year monthly comparison (2022–2024)

### Transit Equity Mapper (`/transit`)

- Six toggleable map layers: food desert tracts, non-desert tracts, transit stops, route shapes, grocery stores, 0.5-mile walk-shed circles
- Equity gap analysis sidebar scoring each LILA census tract (0–100)
- Factors: walkable stop count, service frequency, grocery distance, transit-to-grocery connectivity
- Summary statistics on affected population

### Vacancy Triage (`/vacancy`)

- ~800 mock vacant properties rendered as data-driven circle markers
- Color-coded by triage score (red → green)
- Filter panel: best use, owner, property type, neighborhood, minimum score slider
- Click-to-inspect detail panel with score breakdown bars, recent 311 complaints, and recommended best use (housing / solar / community garden)
- Six-factor weighted scoring algorithm: condition, complaint density, lot size, ownership, proximity, tax delinquency

### Neighborhood Report Card (`/neighborhood/:id`)

- Cross-dataset profile page for any neighborhood
- Composite equity score with breakdown bars (transit access, 311 health, food access, vacancy)
- 311 panel: complaint volume, resolution time, top issues chart
- Vacancy panel: count, top rehab candidates by triage score, best-use breakdown
- Transit panel: nearby stops, serving routes, trip frequency, nearest grocery distance, food desert status
- Estimated monthly complaint trend chart

## Tech Stack

| Layer         | Technology                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| Framework     | [TanStack Start](https://tanstack.com/start) (SSR + server functions)                                           |
| Router        | [TanStack Router](https://tanstack.com/router) (file-based, type-safe)                                          |
| UI            | React 19 + Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (radix-nova)                                    |
| Map           | [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) via [react-map-gl](https://visgl.github.io/react-map-gl/) |
| Charts        | [Recharts](https://recharts.org/)                                                                               |
| Hosting       | [Cloudflare Workers](https://developers.cloudflare.com/workers/) via `@cloudflare/vite-plugin`                  |
| Data          | Static JSON/GeoJSON in `public/data/`, mock vacancy data generated at runtime                                   |
| Data Pipeline | Python 3.12 + [uv](https://docs.astral.sh/uv/) (pandas, geopandas, shapely)                                     |
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
│   ├── __root.tsx              Root layout (nav, dark theme)
│   ├── index.tsx               Overview dashboard
│   ├── complaints.tsx          311 Pattern Detector
│   ├── transit.tsx             Transit Equity Mapper
│   ├── vacancy.tsx             Vacancy Triage
│   └── neighborhood.$id.tsx   Neighborhood Report Card
├── components/
│   ├── ui/                     shadcn components
│   ├── map/
│   │   ├── MapProvider.tsx     Shared Mapbox GL wrapper (dark-v11)
│   │   └── MapLegend.tsx       Choropleth / gradient legend
│   ├── charts/
│   │   ├── TimeSeriesChart.tsx Bar + line combo chart
│   │   ├── CategoryBarChart.tsx Horizontal / vertical bar chart
│   │   ├── HourlyChart.tsx     24-hour distribution
│   │   └── YoYChart.tsx        Multi-year line chart
│   ├── KpiCard.tsx             Stat card with color accent
│   ├── HotspotList.tsx         Volume / slow-resolution hotspot list
│   └── Nav.tsx                 Top navigation
├── lib/
│   ├── types.ts                All TypeScript interfaces
│   ├── analysis.ts             Hotspot detection, weather correlation, KPIs
│   ├── equity.ts               Haversine, equity gap scoring
│   ├── scoring.ts              Vacancy triage scoring + best-use
│   ├── colors.ts               Choropleth scales, score colors
│   ├── vacancy-data.ts         Deterministic mock data generator
│   └── utils.ts                cn() helper
public/
└── data/
    ├── csb_latest.json           311 complaints aggregated (1.6 MB)
    ├── trends.json             Year-over-year + weather data (24 KB)
    ├── neighborhoods.geojson   79 neighborhood polygons (184 KB)
    ├── stops.geojson           Metro Transit stops (872 KB)
    ├── shapes.geojson          Route line geometries (620 KB)
    ├── routes.json             Bus + rail route metadata (8 KB)
    ├── stop_stats.json         Service frequency per stop (232 KB)
    ├── food_deserts.geojson    LILA census tracts (16 KB)
    └── grocery_stores.geojson  Grocery store locations (4 KB)
python/
├── pyproject.toml              uv project config + dependencies
├── .python-version             Pins Python 3.12
├── scripts/
│   ├── fetch_raw.py            Download raw datasets → data/raw/
│   └── clean_data.py           Process raw data → public/data/
├── data/raw/                   Raw downloads (gitignored)
└── notebooks/
    └── exploration.ipynb       Interactive data exploration notebook
```

## Data Sources

| Dataset                 | Source                                                             | Format                         |
| ----------------------- | ------------------------------------------------------------------ | ------------------------------ |
| 311 Service Requests    | [City of St. Louis CSB](https://www.stlouis-mo.gov/data/)          | Pre-processed JSON from CSV    |
| Neighborhood Boundaries | City of St. Louis Open Data                                        | GeoJSON                        |
| Transit (GTFS)          | [Metro Transit](https://www.metrostlouis.org/developer-resources/) | Converted from GTFS to GeoJSON |
| Food Desert Tracts      | USDA Economic Research Service (LILA definitions)                  | Simplified GeoJSON             |
| Grocery Stores          | Manual compilation + geocoding                                     | GeoJSON                        |
| Vacant Properties       | Mock data modeled on LRA inventory + CSB formats                   | Generated at runtime           |

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
