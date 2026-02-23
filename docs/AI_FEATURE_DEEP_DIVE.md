# Deep Dive: Natural Language Query Engine & Policy Simulator

Two AI features that would transform this dashboard from a data viewer into an intelligent civic reasoning tool. This document covers architecture, implementation strategy, effort estimates, and the exact integration seams in the existing codebase.

---

## Feature 1: Natural Language Query Engine

### What It Does

A command bar where users type plain English and the system translates it into explorer actions — toggling layers, applying filters, selecting entities, building charts, and narrating findings. Not a chatbot in a sidebar. A **command interface** wired directly into the state machine.

**Examples:**
- "Show me crime hotspots near vacant properties" → enables crime + vacancy layers, sets crime mode to heatmap
- "Compare Downtown West to The Ville" → selects each neighborhood sequentially, generates comparison
- "Chart ARPA spending against crime trends" → opens chart builder, loads arpa-monthly dataset, adds crime overlay
- "Which neighborhoods have the worst food access?" → enables food access layer, sorts equity gap results, highlights top 5

### Architecture

```
┌──────────────────────────────────────────────────────┐
│  Command Bar (floating, ⌘K trigger)                  │
│  ┌────────────────────────────────────────────────┐  │
│  │ "show crime heatmap in wells-goodfellow"       │  │
│  └────────────────────────────────────────────────┘  │
│  Intent Display: "Enable crime layer → heatmap mode  │
│                   → select Wells-Goodfellow"         │
└──────────────┬───────────────────────────────────────┘
               │ user query
               ▼
┌──────────────────────────────────────────────────────┐
│  LLM (Claude via API or CF Workers AI)               │
│                                                      │
│  System prompt: explorer schema + available actions   │
│  Tool definitions: 7 functions (see below)           │
│  Context: current ExplorerState snapshot             │
│                                                      │
│  Output: ordered list of tool calls                  │
└──────────────┬───────────────────────────────────────┘
               │ structured tool calls
               ▼
┌──────────────────────────────────────────────────────┐
│  Action Executor                                     │
│                                                      │
│  Validates tool calls against current state          │
│  Sequences dependent actions (enable layer before    │
│  filtering it; wait for data load before charting)   │
│  Dispatches to ExplorerContext + ChartBuilderContext  │
└──────────────────────────────────────────────────────┘
```

### LLM Tool Definitions

These are the 7 functions the LLM can call. Each maps directly to existing dispatch actions:

```typescript
// 1. Layer control — enable or disable a map layer
setLayer(layer: 'complaints'|'transit'|'vacancy'|'foodAccess'|'crime'|'arpa'|'demographics', enabled: boolean)
// Implementation: reads state.layers[layer], dispatches TOGGLE_LAYER only if current !== desired
// IMPORTANT: TOGGLE_LAYER is a flip, not a set — must check state first

// 2. Filter control — set any sub-toggle
setFilter(key: keyof SubToggles, value: string | number | boolean)
// Dispatches: { type: 'SET_SUB_TOGGLE', key, value }
// Examples:
//   setFilter('crimeMode', 'heatmap')
//   setFilter('vacancyMinScore', 70)
//   setFilter('complaintsCategory', 'Potholes')
//   setFilter('demographicsMetric', 'vacancyRate')

// 3. Select an entity by type and identifier
selectEntity(entityType: 'neighborhood'|'stop'|'vacancy'|'grocery'|'foodDesert', id: string|number)
// Dispatches: { type: 'SELECT_ENTITY', entity: { type, id } }
// Note: neighborhood IDs are zero-padded ("01"–"79")
// Triggers eager load of all datasets when type === 'neighborhood'

// 4. Open the chart builder with a specific dataset and optional preset
buildChart(datasetKey: string, presetName?: string)
// Dispatches: SET_ANALYTICS_TAB('chart') + SET_DATASET + optionally APPLY_PRESET
// Must ensure required layers are enabled first (each dataset declares requiredLayers)

// 5. Toggle analytics panel visibility
showAnalytics(expanded: boolean)
// Dispatches: TOGGLE_ANALYTICS if current state !== desired

// 6. Clear the current selection
clearSelection()
// Dispatches: { type: 'CLEAR_SELECTION' }

// 7. Respond to user — for queries that need explanation, not action
respond(message: string)
// Renders text in the command bar's response area
// Used for: "What layers are active?" or "Explain the equity score"
```

### System Prompt Context

The LLM needs a compact schema of the explorer's capabilities. This is static and can be baked into the system prompt:

```
You control a St. Louis urban analytics dashboard. Available layers:
- complaints: 311 service requests (filters: mode choropleth/heatmap, category)
- crime: SLMPD incidents (filters: mode choropleth/heatmap, category, timeRange)
- transit: bus stops and routes (filters: stops, routes, walkshed toggles)
- vacancy: vacant properties (filters: use, owner, type, neighborhood, minScore 0-100)
- foodAccess: food desert tracts + grocery stores (filters: tracts, stores toggles)
- arpa: ARPA fund expenditures (filter: category)
- demographics: census data (filter: metric population/vacancyRate/popChange)

79 neighborhoods identified by NHD_NUM ("01" through "79").
Chart builder has 16 datasets across 6 groups.

Current state is provided with each query. Use the minimum actions needed.
Always explain what you're doing before executing.
```

The current `ExplorerState` snapshot (layers, subToggles, selected entity) is sent with each query so the LLM can reason about what's already visible.

### Required Codebase Changes

**1. Lift ChartBuilder state to a shared context**

Currently `useChartBuilder()` lives inside `ChartBuilder.tsx` as a local `useReducer`. An external agent can't dispatch into it. The fix:

```
New file: src/components/explorer/ChartBuilderProvider.tsx
- Move useReducer(chartBuilderReducer, initialState) here
- Expose ChartBuilderContext with [state, dispatch]
- Wrap in ExplorerProvider or MapExplorer
- ChartBuilder.tsx imports from context instead of local hook
```

Effort: ~30 minutes. Low risk — just moving state up one level.

**2. Add SET_LAYER action (set, not toggle)**

The current `TOGGLE_LAYER` flips a boolean. An LLM needs idempotent `SET_LAYER`:

```typescript
// Add to ExplorerAction union:
| { type: 'SET_LAYER'; layer: keyof LayerToggles; enabled: boolean }

// Reducer case:
case 'SET_LAYER':
  if (state.layers[action.layer] === action.enabled) return state
  return { ...state, layers: { ...state.layers, [action.layer]: action.enabled } }
```

Effort: 5 minutes. No risk.

**3. Add SET_ANALYTICS_TAB action**

The `activeTab` in `AnalyticsPanel.tsx` is local `useState`. An NL engine needs to programmatically switch to the chart builder tab:

```typescript
// Add to ExplorerState:
analyticsTab: string  // '' for auto, or forced tab key

// Add to ExplorerAction:
| { type: 'SET_ANALYTICS_TAB'; tab: string }
```

Effort: 10 minutes.

**4. New component: CommandBar**

The UI surface — a floating command bar triggered by `Cmd+K`:

```
src/components/explorer/CommandBar.tsx
- Floating overlay with text input
- Shows interpreted intent before executing
- Streams LLM response for explain-type queries
- History of recent commands
- Keyboard shortcut: Cmd+K to open/close
```

This is the bulk of the frontend work. Needs:
- Input with auto-focus
- Loading state while LLM processes
- Intent preview ("I'll enable crime heatmap and select Wells-Goodfellow")
- Execute/cancel buttons
- Response area for text answers

Effort: 2-4 hours for a polished implementation.

**5. API route for LLM calls**

```
src/routes/api/query.ts (TanStack Start API route)
- POST endpoint
- Receives: { query: string, state: ExplorerState }
- Calls Claude API with tool definitions + system prompt + state context
- Returns: { intent: string, actions: ToolCall[], response?: string }
- Streaming optional for longer responses
```

Needs `ANTHROPIC_API_KEY` in environment. Could alternatively use Cloudflare Workers AI for edge inference.

Effort: 1-2 hours.

**6. Action executor hook**

```
src/hooks/useQueryExecutor.ts
- Takes array of tool calls from LLM response
- Sequences them (enable layer → wait for data → apply filter → build chart)
- Handles the async gap: layer toggle triggers data fetch, some actions
  need to wait for data before proceeding (e.g., can't chart complaints
  data until csbData is loaded)
- Dispatches to both ExplorerContext and ChartBuilderContext
```

Effort: 1-2 hours. The tricky part is sequencing — some actions depend on data being loaded.

### Difficulty Assessment

| Component | Effort | Risk |
|---|---|---|
| Lift ChartBuilder state | 30 min | Low |
| SET_LAYER + SET_ANALYTICS_TAB actions | 15 min | None |
| CommandBar UI | 2-4 hrs | Medium (UX polish) |
| API route | 1-2 hrs | Low |
| Action executor with sequencing | 1-2 hrs | Medium (async timing) |
| LLM prompt engineering + testing | 2-3 hrs | Medium (iteration needed) |
| **Total** | **~1-2 days** | **Medium** |

The hardest part isn't the code — it's prompt engineering. Getting the LLM to reliably translate "show me the worst neighborhoods" into the right sequence of `setLayer` + `setFilter` + `selectEntity` calls requires iteration. The function calling schema makes this tractable but edge cases (ambiguous queries, multi-step reasoning) need testing.

### Interesting Extensions

- **Query chaining**: "Now filter that to just felonies" — LLM sees previous actions in conversation history and applies incremental changes
- **Explain mode**: "Why is this neighborhood scored low?" — LLM reads composite score breakdown and generates explanation
- **Bookmarkable queries**: Save query + resulting state as a shareable URL
- **Voice input**: Wire Web Speech API into the command bar for hands-free operation during presentations

---

## Feature 2: Policy Simulator

### What It Does

A "what-if" mode where users define hypothetical interventions and see projected impacts ripple through the interconnected datasets. The map, charts, and scores all update to reflect the simulated reality.

**Intervention types:**
- **Add a bus stop** → equity gap scores recalculate for affected tracts
- **Place a grocery store** → food desert scores update, transit-to-grocery connectivity rechecks
- **Remediate vacancies** → neighborhood triage scores drop, composite scores improve
- **Allocate ARPA funds** → spending appears in analytics, correlated metrics projected

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Simulator Panel (side drawer or modal)                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Interventions:                                  │   │
│  │  [+] Add bus stop at [click map]                 │   │
│  │  [+] Place grocery store at [click map]          │   │
│  │  [+] Remediate 20 worst vacancies in [hood]      │   │
│  │  [+] Allocate $500K to [category] in [hood]      │   │
│  │                                                   │   │
│  │  Active:                                          │   │
│  │  ● Bus stop at 38.63, -90.25         [remove]    │   │
│  │  ● Grocery at 38.61, -90.22          [remove]    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Run Simulation]  →  recomputes all affected scores    │
│                                                         │
│  Impact Summary (LLM-generated):                        │
│  "Adding a bus stop at Natural Bridge & Grand would     │
│   bring 2 LILA tracts above the transit access          │
│   threshold, serving ~3,400 residents..."               │
└─────────────────────────────────────────────────────────┘
```

### How It Wires Into Existing Scoring

The simulator needs to re-run existing scoring functions with modified inputs. Here's how each intervention type maps to the codebase:

#### Intervention: Add Bus Stop

**Affected function:** `computeEquityGaps()` in `src/lib/equity.ts`

Current signature:
```typescript
computeEquityGaps(foodDeserts, stops, stopStats, groceryStores) → EquityGapResult[]
```

To simulate a new stop:
1. Clone `data.stops` GeoJSON, append a new Point feature with `{ stop_id: 'sim-1', stop_name: 'Simulated Stop' }` at the clicked coordinates
2. Clone `data.stopStats`, add `{ 'sim-1': { trip_count: estimatedFrequency, routes: selectedRoutes } }`
3. Re-run `computeEquityGaps()` with the modified inputs
4. Compare before/after scores for each LILA tract
5. The scoring algorithm already handles this — it loops over all stops and checks haversine distance to each tract centroid. A new stop within 0.5mi of a tract will increase `stopsNearby` and `totalTripFrequency`, boosting the score.

**What changes on the map:** TransitLayer reads `data.stops` — if we inject the simulated stop into `data.stops`, it renders automatically. The food access choropleth (if equity scores drive it) would need the recalculated scores fed back.

#### Intervention: Place Grocery Store

**Affected function:** `computeEquityGaps()` again — specifically the `nearestGroceryDist` and `groceryAccessible` calculations.

To simulate:
1. Clone `data.groceryStores` GeoJSON, append a new Point feature at clicked location
2. Re-run `computeEquityGaps()` — the function already finds the nearest grocery for each tract
3. Tracts where the new store is closer than existing nearest will see improved `nearestGroceryDist`
4. The grocery distance scoring jumps at thresholds: 0.5mi (25pts), 1mi (15pts), 2mi (5pts) — so placing a store within 0.5mi of an underserved tract creates a dramatic score jump
5. Transit-to-grocery accessibility also rechecks — if the new store is near an existing bus stop that shares a route with a tract, `groceryAccessible` flips to true (+25pts)

**Map impact:** FoodAccessLayer renders grocery stores from `data.groceryStores` — inject the simulated store and it appears automatically.

#### Intervention: Remediate Vacancies

**Affected function:** `calculateTriageScore()` in `src/lib/scoring.ts`

Simulating vacancy remediation means removing properties from `data.vacancyData`:
1. Clone `data.vacancyData`, filter out remediated properties
2. Neighborhood-level metrics (avg triage score, count) recalculate automatically in analytics
3. The composite neighborhood score in `NeighborhoodDetail` uses `(100 - avgVacancyScore)` — fewer/better vacancies = higher score

**Caveat:** `NeighborhoodDetail.tsx` currently hardcodes mock vacancy data via `generateVacancyData()` on line 22. This must be patched to use `data.vacancyData` (or simulated overlay) instead:
```typescript
// Current (broken for simulation):
const allVacancies = useMemo(() => generateVacancyData(), [])

// Fixed:
const allVacancies = data.vacancyData ?? generateVacancyData()
```

#### Intervention: Allocate ARPA Funds

This is more speculative — there's no causal model linking ARPA spending to complaint/crime reduction. Two approaches:

**Simple:** Add the allocation to `data.arpaData.monthlySpending` and `categoryBreakdown`. Analytics charts update. No outcome projection.

**With LLM:** Feed the allocation + historical spending-to-outcome correlations to an LLM. Have it estimate impact: "Based on the $800K allocated to infrastructure in Tower Grove South in 2024, which correlated with a 23% pothole complaint reduction over 6 months, a $500K allocation to the same category in Wells-Goodfellow could yield a similar reduction, equivalent to ~340 fewer complaints annually."

### Data Overlay Strategy

The cleanest approach: add a simulation layer to `ExplorerState` that merges with real data at the context boundary.

```typescript
// Add to ExplorerState:
simulation: {
  active: boolean
  interventions: Intervention[]
  // Pre-computed overlays (result of running scoring functions with modified inputs):
  stops: GeoJSONCollection | null           // real + simulated stops
  groceryStores: GeoJSONCollection | null   // real + simulated stores
  vacancyData: VacantProperty[] | null      // real minus remediated
  equityGaps: EquityGapResult[] | null      // recomputed scores
  arpaData: ArpaData | null                 // real + simulated allocations
} | null

// Intervention union type:
type Intervention =
  | { type: 'add-stop'; lat: number; lng: number; tripCount: number; routes: string[] }
  | { type: 'add-grocery'; lat: number; lng: number; name: string }
  | { type: 'remediate-vacancies'; ids: number[] }
  | { type: 'allocate-arpa'; amount: number; category: string; neighborhood?: string }
```

Modify `useData()` to merge:
```typescript
export function useData(): ExplorerData {
  const real = useContext(DataContext)
  const { state } = useExplorer()

  if (!state.simulation?.active) return real

  return {
    ...real,
    stops: state.simulation.stops ?? real.stops,
    groceryStores: state.simulation.groceryStores ?? real.groceryStores,
    vacancyData: state.simulation.vacancyData ?? real.vacancyData,
    arpaData: state.simulation.arpaData ?? real.arpaData,
  }
}
```

Every layer and analytics module downstream reads `useData()` and renders the simulated values transparently.

### Required Codebase Changes

**1. Simulation state + reducer actions**

```typescript
// New actions:
| { type: 'START_SIMULATION' }
| { type: 'END_SIMULATION' }
| { type: 'ADD_INTERVENTION'; intervention: Intervention }
| { type: 'REMOVE_INTERVENTION'; index: number }
| { type: 'SET_SIMULATION_RESULTS'; results: SimulationResults }
```

Effort: 1-2 hours for types + reducer cases.

**2. Simulation engine hook**

```
src/hooks/useSimulation.ts
- Takes: interventions[] + real ExplorerData
- Clones affected datasets
- Applies each intervention (add stop, remove vacancies, etc.)
- Re-runs scoring functions (computeEquityGaps, calculateTriageScore)
- Returns: SimulationResults (overlaid data + before/after score diffs)
- Runs in useMemo or web worker for large datasets
```

This is the core logic. It reuses `computeEquityGaps()` and `calculateTriageScore()` directly — no new algorithms needed, just modified inputs.

Effort: 3-4 hours.

**3. Modify useData() for simulation merge**

As shown above — ~20 lines of code.

Effort: 15 minutes.

**4. Fix NeighborhoodDetail mock vacancy usage**

Change line 22 of `NeighborhoodDetail.tsx` to read real data:
```typescript
const allVacancies = data.vacancyData ?? generateVacancyData()
```

Effort: 5 minutes.

**5. Simulator UI panel**

```
src/components/explorer/SimulatorPanel.tsx
- Side drawer or modal
- List of intervention types with config forms
- "Add bus stop" → map enters click-to-place mode
- "Place grocery" → same click-to-place
- "Remediate vacancies" → select neighborhood + count or pick specific properties
- "Allocate ARPA" → amount + category + optional neighborhood
- Run button triggers simulation engine
- Results summary: before/after score diffs, affected tract count, population served
```

This is the largest frontend piece.

Effort: 4-6 hours.

**6. Map interaction for placement**

When user is placing a simulated bus stop or grocery store, the map needs a special click mode:
- Cursor changes to crosshair
- Click captures lat/lng
- Renders a marker at the clicked location with "simulated" styling (dashed outline or different color)
- Existing click handler must be temporarily overridden

Effort: 1-2 hours.

**7. Before/after diff visualization**

The most impactful visual: a choropleth that shows score *changes* rather than absolute values. Green for improvements, red for degradations.

```typescript
// For each tract/neighborhood, compute:
const delta = simulatedScore - realScore
// Render as diverging color scale: red (-) → white (0) → green (+)
```

This could be a new "Simulation Diff" layer that overlays the existing choropleth.

Effort: 2-3 hours.

**8. LLM impact narrative (optional but high-value)**

After simulation runs, send the before/after diffs to an LLM:
```
Input: { interventions, affectedTracts: [{ name, scoreBefore, scoreAfter, popServed }], ... }
Output: "Adding a bus stop at Natural Bridge & Grand would bring 2 LILA tracts
         above the transit access threshold. Combined with the simulated grocery
         store on Dr. Martin Luther King Dr, an estimated 5,200 residents would
         gain transit-accessible grocery access within 30 minutes."
```

Effort: 1-2 hours (API call + prompt + rendering).

### Difficulty Assessment

| Component | Effort | Risk |
|---|---|---|
| Simulation state + actions | 1-2 hrs | Low |
| Simulation engine (reuse existing scoring) | 3-4 hrs | Medium (edge cases in cloning data) |
| useData() merge | 15 min | Low |
| Fix NeighborhoodDetail mock data | 5 min | None |
| Simulator UI panel | 4-6 hrs | Medium (UX design) |
| Map click-to-place mode | 1-2 hrs | Medium (click handler override) |
| Before/after diff layer | 2-3 hrs | Low |
| LLM impact narrative | 1-2 hrs | Low |
| **Total** | **~2-3 days** | **Medium** |

The simulator is more work than the query engine but lower *risk* — it's mostly deterministic (re-running existing scoring functions with modified inputs). The scoring functions are pure and well-tested by virtue of already powering the dashboard.

---

## Implementation Order

If building both, the recommended sequence:

### Phase 1: Shared Infrastructure (half day)
1. Lift ChartBuilder state to context (needed by both features)
2. Add `SET_LAYER` action (idempotent layer control)
3. Add `SET_ANALYTICS_TAB` action
4. Fix `NeighborhoodDetail` mock vacancy usage

### Phase 2: Natural Language Query Engine (1-1.5 days)
1. API route for LLM calls
2. Action executor hook
3. CommandBar UI
4. Prompt engineering + testing

### Phase 3: Policy Simulator (2-2.5 days)
1. Simulation state + reducer
2. Simulation engine hook
3. `useData()` merge logic
4. Simulator UI panel
5. Map click-to-place mode
6. Before/after diff visualization
7. LLM impact narrative

### Phase 4: Integration (half day)
- NL engine gains simulation commands: "What if we added a bus stop at Grand and Natural Bridge?"
- Query engine can trigger simulation mode and describe results
- Bookmarkable simulation scenarios

**Total: ~4-5 days for both features, production-quality.**

---

## Risk Factors

**API costs**: Claude API calls per query. Mitigated by caching (same query + same state = same result) and using Haiku for simple intent parsing, Sonnet/Opus only for narratives.

**Latency**: LLM round-trip adds 1-3 seconds to query execution. Mitigated by streaming (show intent immediately, execute while still generating explanation) and optimistic UI updates.

**Prompt brittleness**: LLM may misinterpret ambiguous queries. Mitigated by showing interpreted intent before executing ("I'll enable crime heatmap in Wells-Goodfellow — is that right?") and allowing cancel.

**Simulation accuracy**: The scoring functions are heuristic, not causal models. A simulated bus stop doesn't actually predict ridership or grocery access behavior. Mitigated by clear labeling ("projected impact based on scoring model, not predictive forecast") and the LLM narrative being honest about limitations.

**Data size**: Cloning `vacancyData` (5.9MB, 1000+ properties) and `stops` (871KB) for simulation is fine in-memory. `computeEquityGaps()` loops over all LILA tracts × all stops × all groceries — currently ~50 tracts × ~2000 stops × ~30 groceries = manageable. If performance is an issue, move to a Web Worker.
