# Project Findings & Assessment

## Data Authenticity

All data in the explorer is sourced from real civic APIs via the Python pipeline (14 files total):

- `public/data/csb_latest.json` / `csb_2025.json` — 311 complaints (City of STL CSB)
- `public/data/neighborhoods.geojson` — 79 neighborhood boundaries
- `public/data/crime.json` — SLMPD crime incidents
- `public/data/stops.geojson` / `shapes.geojson` / `routes.json` / `stop_stats.json` — GTFS transit
- `public/data/food_deserts.geojson` / `grocery_stores.geojson` — USDA Food Access Atlas
- `public/data/demographics.json` — Census demographics per neighborhood
- `public/data/vacancies.json` — Vacant building data
- `public/data/arpa.json` — ARPA fund expenditures
- `public/data/trends.json` — Weather and temporal trend data

### Removed (was fabricated)

The following fake/hardcoded data was removed from the project:

| Removed File | Was Used In | Why Removed |
|------|---------|-------------|
| `src/lib/price-data.ts` | `/housing` tab | Hardcoded housing prices (not from Zillow/Redfin) |
| `src/lib/population-history.ts` | `/population` tab | Static population arrays going back to 1810 |
| `src/lib/migration-data.ts` | `/population` + `/affected` tabs | Fabricated migration/affected neighborhood data |
| `src/lib/community-voices.ts` | Explorer Community Voice layer | ~40 fabricated resident quotes with fake authors |
| `src/components/explorer/insights/AIInsightNarrative.tsx` | Explorer neighborhood detail panel | "AI Insights" used seeded RNG, not actual AI |
| `src/lib/vacancy-data.ts` | Explorer (fallback only) | Mock vacancy generator fallback |

Also removed: `HousingPriceLayer`, `CommunityVoiceLayer`, `AffectedNeighborhoodsLayer`, `CommunityVoiceDetail`, `HousingPricesDashboard`, `HousingPriceHistoryChart`, `AffectedNeighborhoodsDashboard`, and the entire `src/components/population/` directory.

The `/housing`, `/affected`, and `/population` routes are now placeholder pages pending real data integration.

### Still Needed

Real data sources for the placeholder pages:
- **Housing**: Zillow ZHVI, Redfin, Census ACS rent data, or city property sales records
- **Population**: Census Decennial/ACS 5-Year data, IRS migration data
- **Affected Areas**: Derived from cross-dataset analysis once housing + population data exists

See `docs/DATA-SOURCES.md` for the full list of available data sources.

## Strengths

- **Architecture**: Clean TanStack Start + reducer-based state, lazy loading, SSR on Cloudflare Workers
- **Visual design**: Polished OKLCH color system (light + dark theme tokens defined), Geist font, motion animations — production quality
- **AI command bar**: Multi-turn agentic loop (up to 5 turns) with SSE streaming, 7 UI action tools (layer/filter/selection/analytics/chart control), 6 data retrieval tools (city summary, neighborhood detail, rankings, category breakdowns, ARPA data, food access), and a dynamic system prompt that includes current dashboard state + live KPI snapshot
- **Data pipeline**: Python scripts pulling from 6+ real civic APIs (311, SLMPD, GTFS, USDA, Census, ARPA) into 14 static JSON/GeoJSON files
- **Explorer UX**: 7 toggleable map layers, neighborhood detail with metrics, comparison mode (side-by-side neighborhood stats), interactive chart builder, resizable analytics drawer
- **Mobile experience**: Responsive grid layout collapsing at 768px, mobile layer drawer (Sheet + FAB), detail panel as bottom sheet, touch-optimized Mapbox controls, hidden analytics panel on mobile
- **Equity scoring**: Real weighted composite (0-100) factoring transit stop density, trip frequency, grocery proximity, and transit-accessible grocery connectivity via route-graph traversal
- **Vacancy triage**: Weighted scoring across condition (25%), complaint density (20%), lot size (10%), ownership/LRA status (15%), proximity (15%), tax delinquency (15%) — plus best-use determination (housing, solar, community garden)
- **Neighborhood metrics**: Centralized `computeNeighborhoodMetrics()` module shared between the detail panel and AI data tools — calculates transit/complaint/food/vacancy scores, composite score, and spatial stats per neighborhood
- **ML exploration**: Jupyter notebooks in `python/notebooks/` for crime and vacancy analysis

## Remaining Weak Spots

- **Standalone dashboards** (housing, population, affected) are placeholder stubs — need real data
- **No loading skeletons** — just "Loading data..." text, no shimmer/skeleton UI
- **No dark mode toggle** — CSS variables for `.dark` theme are fully defined but no UI toggle exists
- **No URL state sync** — all state lives in `useReducer`, lost on refresh, can't share specific views
- **AI cancel button missing from UI** — `cancel()` function is implemented in `useChat` with `AbortController`, but `CommandBar.tsx` doesn't wire it up (only `messages`, `isStreaming`, `sendMessage`, `toolCalls`, `reset` are used)
- **Remaining mobile gaps** — some touch targets below 44px (detail close, send button, pill toggles), sub-10px text throughout, map legend not collapsible (see `docs/responsive.md`)
  
## Monetization Paths

1. **SaaS for city governments / CDFIs / nonprofits** — unified civic analytics platform. Biggest opportunity, most work.
2. **Consulting/reporting tool** — neighborhood equity reports for development orgs, packaged as PDFs or embeddable widgets.
3. **White-label for other cities** — abstract data sources, sell to civic tech consultancies.
4. **Grant funding** — Knight Foundation, Bloomberg Philanthropies, Code for America. AI angle makes it timely.

## Suggested Next Steps

### If continuing as a product
1. Integrate real data for housing, population, and affected pages (see `docs/DATA-SOURCES.md`)
2. Add user auth + saved views (bookmarked neighborhoods, saved chart configs, shareable URLs)
3. Multi-city abstraction — extract STL-specific data sources into a config layer

### Quick wins
- Wire up the existing `cancel()` function from `useChat` to a stop button in `CommandBar.tsx`
- Surface a dark mode toggle (CSS variables already defined in `styles.css`)
- Add URL state sync (`?layers=crime,transit&neighborhood=15`) via TanStack Router search params
- Add loading skeleton states with shimmer animations
- Bump remaining touch targets to 44px minimum (see `docs/responsive.md` for full list)
- Increase minimum text size floor to 11px across all components
