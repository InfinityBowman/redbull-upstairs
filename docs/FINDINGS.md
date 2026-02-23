# Project Findings & Assessment

## Data Authenticity Map

### Real Data (from Python pipeline / civic APIs)
- `public/data/csb_latest.json` / `csb_2025.json` — 311 complaints (City of STL CSB)
- `public/data/neighborhoods.geojson` — 79 neighborhood boundaries
- `public/data/crime.json` — SLMPD crime incidents
- `public/data/stops.geojson` / `shapes.geojson` / `routes.json` / `stop_stats.json` — GTFS transit
- `public/data/food_deserts.geojson` / `grocery_stores.geojson` — USDA Food Access Atlas
- `public/data/demographics.json` — Census demographics per neighborhood
- `public/data/vacancies.json` — Real vacant building data
- `public/data/arpa.json` — ARPA fund expenditures
- `public/data/trends.json` — Weather and temporal trend data

### Fabricated / Hardcoded Data

| File | Used In | What's Fake |
|------|---------|-------------|
| `src/lib/price-data.ts` | `/housing` tab | Hardcoded housing prices (not from Zillow/Redfin) |
| `src/lib/population-history.ts` | `/population` tab | Static population arrays going back to 1810 |
| `src/lib/migration-data.ts` | `/population` + `/affected` tabs | Fabricated migration/affected neighborhood data |
| `src/lib/community-voices.ts` | Explorer Community Voice layer | ~40 fabricated resident quotes with fake authors |
| `src/components/explorer/insights/AIInsightNarrative.tsx` | Explorer neighborhood detail panel | "AI Insights" uses seeded RNG, not actual AI |
| `src/lib/vacancy-data.ts` | Explorer (fallback only) | Mock vacancy generator, only used if `vacancies.json` is missing |

## Strengths

- **Architecture**: Clean TanStack Start + reducer-based state, lazy loading, SSR on Cloudflare Workers
- **Visual design**: Polished OKLCH color system, Geist font, motion animations — production quality
- **AI command bar**: Genuinely functional multi-turn tool calling with streaming and real UI manipulation
- **Data pipeline**: Python scripts pulling from 6+ real civic APIs (311, SLMPD, GTFS, USDA, Census, ARPA)
- **Explorer UX**: Layer toggles, neighborhood detail, comparison mode, chart builder, analytics drawer
- **Equity scoring**: Real weighted composite (transit + complaints + food access + vacancy)
- **Vacancy triage**: Weighted scoring (condition, complaint density, ownership, tax delinquency, proximity, lot size)

## Weak Spots

- Fabricated data in standalone tabs undermines credibility
- AIInsightNarrative is misleadingly labeled — uses seeded random, not AI
- Standalone dashboards (housing, population, affected) are thin / mostly static renders
- Mobile is an afterthought — responsive grid exists but explorer is desktop-only in practice
- No loading skeletons — just "Loading data..." text
- `LayerPanel.tsx` at 786 lines is monolithic
- No dark mode toggle exposed (CSS is defined but no UI toggle)
- No URL state sync for sharing specific views
- No abort/cancel button in AI chat UI

## Monetization Paths

1. **SaaS for city governments / CDFIs / nonprofits** — unified civic analytics platform. Biggest opportunity, most work.
2. **Consulting/reporting tool** — neighborhood equity reports for development orgs, packaged as PDFs or embeddable widgets.
3. **White-label for other cities** — abstract data sources, sell to civic tech consultancies.
4. **Grant funding** — Knight Foundation, Bloomberg Philanthropies, Code for America. AI angle makes it timely.

## Suggested Next Steps

### If continuing as a product
1. Replace all fabricated data with real sources (Zillow/Redfin API, Census API, real community input)
2. Add user auth + saved views (bookmarked neighborhoods, saved chart configs, shareable URLs)
3. Upgrade AI — switch from `z-ai/glm-5` to Claude or GPT-4o, replace fake AIInsightNarrative with real LLM analysis
4. Multi-city abstraction — extract STL-specific data sources into a config layer

### Quick wins
- Wire `AIInsightNarrative` to existing OpenRouter endpoint instead of seeded RNG
- Add crime data to neighborhood detail panel (data loaded, just not displayed)
- Surface a dark mode toggle (CSS already defined)
- Add URL state sync (`?layers=crime,transit&neighborhood=15`)
- Add cancel button to AI chat
- Add loading skeleton states
