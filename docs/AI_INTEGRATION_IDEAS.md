# AI & Agent Integration Ideas

**Direction**: Turn static civic data into a living, reasoning system — not dashboards with chatbots, but an intelligence layer that thinks about St. Louis the way an urbanist does.

---

## Showstoppers

### 1. Neighborhood Narrator

**What**: Click any neighborhood and get a dynamically generated briefing that reads like a policy memo — not stat dumps, but *prose* that connects the dots across all 8 datasets.

**Why unforgettable**: Nobody reads dashboards. People read stories. An LLM that can say "The Wells-Goodfellow area saw a 23% spike in illegal dumping complaints last month, concentrated along Natural Bridge Ave. This coincides with 14 new vacancy boardups in the same corridor — suggesting the complaints may be driven by demolition debris from LRA-owned lots, not residents. ARPA allocated $340K to this area but none went to waste management" is doing analysis no human has time to do across 8 datasets.

**Technical approach**:
- On neighborhood selection, gather all cross-dataset context (complaints, crime, vacancy triage scores, transit equity gaps, ARPA spending, demographics) — most of this is already computed in `NeighborhoodDetail` and `NeighborhoodAnalytics`
- Feed structured context to an LLM with a system prompt trained on urban planning vocabulary
- Stream the response into the detail panel as a collapsible "AI Briefing" section
- Cache briefings with a content hash of the underlying data so they only regenerate when data changes
- Let users ask follow-up questions scoped to that neighborhood's context

**Wow moment**: User clicks a neighborhood and within 2 seconds sees a paragraph that connects vacancy patterns to complaint surges to ARPA allocation gaps — insight that would take a policy analyst an afternoon.

---

### 2. Anomaly Sentinel (Background Agent)

**What**: A persistent background agent that continuously scans all datasets for anomalies, trend breaks, and cross-dataset correlations — surfacing them as notification cards on the map and in a dedicated feed.

**Why unforgettable**: Current analytics are reactive — users toggle layers and squint at charts. The sentinel *comes to you* with findings. It treats the city like a patient's vital signs and pages you when something is off.

**Technical approach**:
- Run anomaly detection on each temporal dataset:
  - **311 Complaints**: Z-score on daily counts per category per neighborhood. Flag 2+ sigma spikes.
  - **Crime**: Same pattern. Also flag category shifts (sudden uptick in a specific offense type in a historically low-crime area).
  - **ARPA**: Flag spending velocity changes (months where cumulative curve inflects sharply).
- Cross-dataset correlation engine:
  - After ARPA spending events → did complaints drop in that area? (causal lag analysis)
  - Vacancy boardup clusters → do nearby crime reports shift?
  - Transit service changes → food access score deltas?
- Surface anomalies as map markers (pulsing dots) with severity coloring
- Each anomaly card includes: what happened, where, when, hypothesized cause, and which datasets contributed
- LLM generates the human-readable explanation from the raw statistical signal

**Wow moment**: Dashboard loads and a subtle notification says "3 new findings since last week" — one is "Complaints about refuse collection in Tower Grove South jumped 340% on Tuesday — this matches the city's garbage route schedule change that went into effect Monday. 6 other neighborhoods on the same route are trending similarly."

---

### 3. Natural Language Query Engine

**What**: A search/command bar where users type questions in plain English and get instant map views, filtered datasets, and generated charts — not a chatbot window, but a *command interface* wired directly into the explorer state machine.

**Why unforgettable**: The dashboard currently requires users to know which layers to toggle, which filters to set, and which analytics to check. A query like "show me neighborhoods where crime increased but population decreased" should just *work* — toggling the right layers, applying the right filters, and generating the right chart, all from one sentence.

**Technical approach**:
- Parse natural language queries into structured intents using an LLM with function calling:
  - `toggle_layers(layers: string[])` — activate/deactivate map layers
  - `filter_data(dataset: string, field: string, operator: string, value: any)` — apply sub-toggles
  - `select_entity(type: string, query: string)` — find and select a neighborhood/stop/etc.
  - `build_chart(dataset: string, preset?: string, xAxis?: string, series?: SeriesConfig[])` — auto-generate a chart in the chart builder
  - `compare(entity_a: string, entity_b: string, metrics: string[])` — side-by-side comparison
  - `narrate(scope: string)` — trigger AI briefing for current view
- Wire function call results directly into `ExplorerProvider` dispatch actions
- Show the interpreted query ("I'll show crime choropleth + demographics overlay for population change") so users can verify intent
- History of queries persisted in session for iterative refinement

**Example queries**:
- "Which neighborhoods have the worst food access and highest vacancy rates?"
- "Compare Downtown West to The Ville on crime and complaints"
- "Chart monthly ARPA spending against crime trends — are they correlated?"
- "Find vacant lots owned by LRA with triage scores above 70 near transit stops"

**Wow moment**: User types "where should the city invest next?" and the system toggles vacancy + ARPA + demographics, highlights the top 5 neighborhoods by composite need score, and generates a brief with recommended investment rationale.

---

### 4. Policy Simulator

**What**: A "what-if" mode where users can simulate interventions — add a bus route, allocate ARPA funds to a neighborhood, remediate a cluster of vacancies — and see projected impacts ripple through the interconnected datasets.

**Why unforgettable**: Every other civic dashboard shows you what *is*. This shows you what *could be*. Decision-makers don't just need data — they need a sandbox to test hypotheses before committing resources.

**Technical approach**:
- Define intervention types:
  - **Transit**: Add/remove a bus stop or route → recalculate equity gaps for affected tracts
  - **Vacancy**: Mark properties as remediated → recalculate neighborhood triage scores, expected complaint reduction
  - **ARPA**: Allocate hypothetical budget to a category/area → project impact based on historical spending-to-outcome correlations
  - **Food Access**: Place a hypothetical grocery store → recalculate food desert scores
- Use existing scoring functions (`computeEquityGaps`, `computeTriageScore`, composite neighborhood score) with modified inputs
- LLM generates the narrative impact assessment: "Adding a bus stop at X would bring 3 LILA tracts above the transit access threshold, potentially serving 4,200 residents who currently have no grocery-accessible transit route"
- Visual diff on map: show before/after choropleth with intervention effects highlighted
- Save and share simulation scenarios

**Wow moment**: A city council member drags a hypothetical bus stop onto the map and instantly sees 3 food desert tracts turn from red to yellow, with a generated memo they can bring to the next meeting.

---

## Quick Wins

### 5. Smart Chart Suggestions

**What**: When the user opens the Chart Builder, an LLM analyzes currently active layers and selected entities to suggest the 3 most interesting charts — not random presets, but context-aware recommendations.

**Why unforgettable**: The chart builder already has 19 datasets and presets, but users don't know which combinations are interesting. The AI acts as a data analyst colleague saying "hey, you've got complaints and crime both on — want to see if they correlate by neighborhood?"

**Technical approach**:
- On chart builder tab activation, collect current context: active layers, selected entity, visible time range
- Send to LLM with the full dataset registry metadata (not the data itself — just field names, descriptions, group info)
- Return 3 suggestions as preset-like cards: title, description, and pre-configured dataset + series
- One-click to apply any suggestion
- Suggestions refresh when context changes (new layer toggled, new entity selected)

**Wow moment**: User toggles on ARPA and Crime layers, opens Chart Builder, and sees "Suggested: Monthly crime incidents vs cumulative ARPA spending — see if investment correlates with safety improvements."

---

### 6. Auto-Generated Insights on Analytics Panels

**What**: Each analytics module (Complaints, Crime, Transit, etc.) gets a small "Insights" section that dynamically generates 2-3 bullet points summarizing the most notable patterns in the current data.

**Why unforgettable**: Users currently see charts and KPIs but have to interpret them. A one-liner like "Wednesday sees 40% more complaints than weekends — likely driven by business-hour reporting" turns a bar chart into actionable knowledge.

**Technical approach**:
- After each analytics module computes its KPIs and chart data, serialize the key metrics
- Feed to a fast LLM (Haiku-class) with a tight system prompt: "You are a civic data analyst. Given these metrics, produce 2-3 one-sentence insights. Focus on surprising patterns, outliers, and actionable observations."
- Render as subtle text below the charts, styled as analyst annotations
- Cache per data snapshot to avoid redundant calls

**Wow moment**: Crime analytics shows "Firearm incidents cluster between 10PM–2AM on weekends, with The Ville and Wells-Goodfellow accounting for 34% of all incidents — a geographically concentrated problem that could respond to targeted intervention."

---

### 7. Complaint Triage Classifier

**What**: When viewing 311 complaint data, an LLM classifies complaints into urgency tiers and suggests which city department should handle them — effectively building an AI-powered dispatch system from historical resolution data.

**Technical approach**:
- Use `csbData.neighborhoods[].topCategories` and resolution time data
- Train (or prompt-engineer) a classifier that maps complaint category + neighborhood + time-of-day to:
  - Urgency tier (critical / standard / low)
  - Predicted resolution time (based on historical averages for that category + neighborhood)
  - Recommended department routing
- Display as an enhanced complaints analytics sub-panel
- Could also flag "stuck" complaints — ones open longer than 2x the average for their category

---

### 8. Equity Gap Report Generator

**What**: One-click export of a comprehensive equity analysis report for any neighborhood or set of neighborhoods — formatted as a professional PDF/document with maps, charts, cross-dataset findings, and AI-generated recommendations.

**Technical approach**:
- Collect all equity-related metrics: food access scores, transit equity gaps, vacancy density, demographic indicators, ARPA allocation per capita
- Generate contextual maps (screenshots of current map view with relevant layers)
- LLM writes executive summary, findings sections, and recommendations
- Template-based layout with charts embedded inline
- Useful for grant applications, council presentations, community meetings

---

## Wild Cards

### 9. City Digital Twin with Temporal Scrubbing

**What**: A time slider that lets users scrub through historical data and watch the city evolve — complaints rising and falling, vacancies appearing and disappearing, crime patterns shifting, ARPA money flowing. Combined with an LLM that narrates the timeline like a documentary voiceover.

**Why unforgettable**: Transforms the dashboard from a snapshot tool into a time machine. Users can *watch* a neighborhood decline or recover and understand the sequence of events that led there.

**Technical challenge**: Requires temporal indexing across all datasets (most already have date fields). The real challenge is interpolation — vacancy data isn't daily, so the system needs to model state transitions. LLM narration needs to track what changed between frames and generate meaningful commentary about cause-and-effect relationships.

**Wow moment**: User scrubs from January to December and watches a neighborhood's complaint heatmap intensify, then sees ARPA funding arrive in April, and watches the heatmap cool down by August — with the narrator saying "Following the $1.2M infrastructure investment in April, complaint volume in this corridor dropped 45% over 4 months, with pothole reports showing the steepest decline."

---

### 10. Adversarial Red Team Mode

**What**: An AI agent that argues *against* the dashboard's conclusions. When the composite neighborhood score says "this area is improving," the red team agent tries to poke holes: "The composite score rose 12 points, but this is entirely driven by the transit access component after a new bus stop was added. Crime is actually up 8%, vacancy count unchanged, and ARPA funding for this area expired last quarter. The improvement may be temporary."

**Why unforgettable**: Every analytics tool has confirmation bias baked in — you see what the metrics show. A devil's advocate agent forces critical thinking and prevents bad policy decisions based on misleading aggregates.

**Technical approach**:
- Triggered on neighborhood detail view or when viewing composite scores
- Agent receives all component scores and their deltas
- System prompt instructs it to find contradictions, decompose aggregates, identify confounders, and question causation
- Output is a short "counterpoint" panel that appears alongside the main analysis
- Styled differently (maybe a subtle red accent) to distinguish it as adversarial

---

### 11. Community Voice Synthesis

**What**: Integrate public comment data, 311 complaint text descriptions, and social media mentions to create an AI-generated "community voice" layer — a qualitative overlay on the quantitative map. Click a neighborhood and hear what residents are actually saying, synthesized from hundreds of complaint descriptions into thematic summaries.

**Why unforgettable**: Numbers tell you *what*. Words tell you *why*. A neighborhood might show 500 complaints, but the synthesis reveals "residents are frustrated about the same abandoned building on Delmar that's been reported 47 times with no action — it's become a symbol of city neglect."

**Technical challenge**: Requires NLP on complaint description text (currently only categories are aggregated, not free text). Would need to extend `clean_data.py` to preserve and cluster complaint descriptions. LLM summarizes clusters into thematic narratives with sentiment analysis. Privacy-conscious — no PII in outputs.

---

## Architectural Recommendations

### API Layer
Most of these features need a backend API for LLM calls. Options:
- **Cloudflare Workers AI** — already deploying to CF Workers, natural fit for edge inference
- **Anthropic API directly** — Claude for complex reasoning (narration, policy simulation, cross-dataset analysis), Haiku for fast insights
- **Hybrid** — fast insights via edge, complex reasoning via API with streaming

### Context Window Strategy
The datasets are large but the *analysis results* are small. Don't send raw data to the LLM — send the computed KPIs, scores, and anomaly signals. The existing memoized computations in analytics modules are perfect context sources.

### Caching & Cost Control
- Hash data snapshots → cache LLM responses per hash
- Insights and narrations only regenerate when underlying data changes
- Use streaming for longer responses (briefings, reports)
- Tier LLM usage: Haiku for bullets/insights, Sonnet for narration, Opus for policy simulation

### Progressive Enhancement
Ship features as opt-in layers so the dashboard works fully without AI. The core analytics remain rule-based and deterministic. AI features enhance but don't replace.
