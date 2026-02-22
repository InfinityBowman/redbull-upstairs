# Feature Ideas for STL Urban Analytics Dashboard

**Direction**: Turn a data dashboard into a **city simulation sandbox** — let users not just observe St. Louis, but test hypotheses, hear the data, and argue with the city's own numbers.

---

## Showstoppers

### 1. "What If" Simulation Mode

**What**: A mode where users can place hypothetical interventions on the map — drop a new grocery store, add a bus route, demolish a vacant building — and watch equity scores, food access metrics, and triage rankings recalculate in real-time.

**Why unforgettable**: Every civic dashboard shows you what *is*. This one shows you what *could be*. City planners stop debating in the abstract and start dragging grocery store pins onto food desert tracts to see which placement closes the most equity gaps.

**Technical challenge**: The equity gap computation (`computeEquityGaps`) already does haversine + route-matching. Extending it to accept "phantom" entities (user-placed stops, stores, demolitions) and recomputing scores live means making the scoring pipeline accept a merged real+hypothetical dataset. The hard part is keeping recalculation under 200ms so it feels like direct manipulation.

**Wow moment**: User drags a grocery store icon into a LILA tract, watches 3 neighboring tracts go from red to green as their equity scores update, and the transit analytics panel instantly recalculates which bus routes now connect residents to food.

---

### 2. Neighborhood Time-Lapse

**What**: A playback scrubber that animates the entire dashboard through time — watch complaint hotspots migrate across the city, see vacancy clusters grow and shrink, track crime waves rolling through neighborhoods quarter by quarter. Not just filtering by year — actual animated transitions with interpolation between states.

**Why unforgettable**: Static maps hide the story. Animated maps *are* the story. Watching a vacancy cluster metastasize from one block to its neighbors over 3 years is viscerally different from seeing a choropleth with a year dropdown.

**Technical challenge**: Requires pre-bucketing all temporal data into animation frames (monthly or quarterly), then interpolating fill colors and circle sizes between keyframes using `requestAnimationFrame`. The complaints and crime data already have timestamps; vacancies would need historical snapshots. Mapbox `setPaintProperty` can be called per-frame for smooth transitions.

**Wow moment**: User hits play, the map comes alive — complaint heatmaps pulse like breathing, vacancy dots bloom outward from core blight areas, and a running KPI ticker in the corner shows city-wide metrics climbing or falling. It looks like a weather radar for urban decay.

---

### 3. Neighborhood Rivalry Board

**What**: A live leaderboard that ranks all 79 neighborhoods across composite metrics (311 responsiveness, transit access, vacancy recovery, food access) with sparkline trends. Neighborhoods that improved get celebrated with upward animations. Neighborhoods that declined get flagged. Users can challenge any ranking — "I think this neighborhood is actually better/worse" — and the app explains exactly which data points drive the score, inviting the user to weight dimensions differently.

**Why unforgettable**: People care about *their* neighborhood. A leaderboard turns passive data consumption into emotional investment. "Wait, why is my neighborhood ranked 47th?" leads to genuine data exploration. The "challenge the ranking" interaction makes it participatory rather than authoritative.

**Technical challenge**: The composite scoring in `NeighborhoodDetail` already computes 4-dimension scores. Extending this to all 79 neighborhoods with user-adjustable weights means running the scoring pipeline for every neighborhood on weight change. A Web Worker would keep the UI responsive during full-city rescoring.

**Wow moment**: User slides the "transit access" weight to maximum, watches their car-dependent suburban neighborhood plummet in rankings while the near-north side neighborhoods with MetroLink access surge upward. The data doesn't lie, but the lens you choose changes everything.

---

### 4. Sonification Layer — "Listen to the City"

**What**: An audio mode that maps data dimensions to sound. Each layer gets a sound profile: complaints become percussive clicks (density = tempo, category = timbre), crime becomes low drones (severity = pitch), transit becomes rhythmic pulses (frequency = BPM), vacancies become sustained tones (triage score = dissonance). Pan your map and the soundscape shifts as you move through neighborhoods.

**Why unforgettable**: Nobody has heard what food insecurity *sounds like*. Moving from a thriving neighborhood (harmonious, rhythmic transit pulses, sparse complaint clicks) to a distressed one (dissonant vacancy drones, rapid complaint percussion, silence where transit should be) creates an emotional understanding that no chart can match.

**Technical challenge**: Web Audio API with spatial audio tied to map viewport. Each visible feature within the current bounds contributes to the mix. The challenge is making it musical rather than cacophonous — quantizing to a scale, using reverb and filtering to create atmosphere rather than noise. Tone.js would handle the synthesis.

**Wow moment**: User enables audio, zooms into a food desert. The transit pulses fade to silence, a low vacancy drone swells, and complaint clicks accelerate. They pan east toward a grocery store — the drone fades, a gentle chime marks the store, transit rhythm returns. They *heard* the food desert boundary.

---

### 5. Adversarial Narrator — "The City Argues Back"

**What**: An AI narrator that watches what you're looking at and generates contextual, opinionated commentary. Not neutral tooltips — provocative observations. "You've been staring at vacancy data in Ward 3 for 2 minutes. Did you know the city spent $4.2M in ARPA funds within a mile of here, but vacancy rates haven't budged?" It connects dots across datasets that users wouldn't think to cross-reference, and it occasionally plays devil's advocate against obvious conclusions.

**Why unforgettable**: Most dashboards are silent. This one has a voice, and that voice has *opinions* backed by data. It turns solo exploration into a dialogue. It catches the confirmation bias that plagues data analysis — you think you see a pattern, and the narrator says "actually, controlling for population density, this neighborhood is average."

**Technical challenge**: Requires tracking user attention (viewport center, selected entity, dwell time, layer combination) and generating cross-dataset observations. Could use a local rule engine for common patterns (ARPA spending vs outcome correlation, demographic-controlled comparisons) before falling back to LLM generation for novel observations. The hard part is tone — snarky enough to be engaging, rigorous enough to be trusted.

**Wow moment**: User selects a neighborhood, reads the composite score, thinks "this area needs more transit." The narrator chimes in: "Adding a bus route here would serve 340 residents — but rerouting the #70 two blocks south would serve 1,200 and connect 3 food desert tracts to the Schnucks on Grand. The math isn't close."

---

## Quick Wins

### 6. Deep Link Everything — Shareable Dashboard States

**What**: Encode the full dashboard state (active layers, sub-filters, selected entity, map viewport, analytics tab, time range) into URL search params. Every state becomes a shareable link. Add a "Share this view" button that copies a URL and generates a preview card image via `html2canvas`.

**Why unforgettable**: A city council member can email a link that opens *exactly* the view they're discussing — the crime heatmap for 2024 in the Dutchtown neighborhood with the vacancy layer overlay. No more "go to the dashboard and click these 7 things."

**Technical challenge**: TanStack Router already supports search params. The challenge is serializing the full `ExplorerState` (17 sub-toggles, slider values, selected entity) into a compact URL without it becoming 500 characters. A base64-encoded compressed state blob would work, with human-readable params for the most common dimensions (layer, neighborhood, year).

**Wow moment**: User finds a striking pattern, hits share, pastes the link in Slack. Recipient opens it and sees the exact same view — layers, filters, selection, viewport, everything.

---

### 7. Keyboard-Driven Command Palette

**What**: Hit `Cmd+K` to open a command palette that lets you type natural-language queries: "show crime in Dutchtown 2023", "compare vacancy rates north vs south", "food deserts near MetroLink", "what changed in 2024". The palette fuzzy-matches neighborhoods, layers, metrics, and actions, and can compose multi-step operations from a single query.

**Why unforgettable**: Power users can navigate the entire dashboard without touching the mouse. Searching "Wells Goodfellow vacancies" instantly selects the neighborhood, enables the vacancy layer, and opens the detail panel. It's faster than any UI could be.

**Technical challenge**: Needs a semantic parser that maps free-text to state actions. A lightweight approach: tokenize the query, match tokens against a dictionary of neighborhoods (79), layers (7), metrics, years, and actions (show/hide/compare/filter), then dispatch the appropriate sequence of reducer actions. For "compare" queries, open a split view or overlay.

**Wow moment**: User opens palette, types "worst food access", instantly flies to the lowest-scoring food desert tract with the equity analysis open. 3 seconds from question to answer.

---

### 8. Anomaly Alerts — "Something Changed Here"

**What**: An always-running anomaly detector that flags neighborhoods where metrics deviate significantly from their historical trend or peer group. A subtle pulse animation on the map marks anomalous areas. Click the pulse to see: "311 complaints in this neighborhood jumped 340% this month vs the 12-month average. The spike is driven by 'Vacant Building' complaints concentrated on these 3 blocks."

**Why unforgettable**: Instead of users hunting for patterns, the dashboard hunts for them. It's the difference between a telescope and an alarm system. The anomaly detector surfaces the stories that matter most — the neighborhood that's rapidly improving, the block that just tipped into crisis.

**Technical challenge**: Z-score computation over monthly time series for each metric per neighborhood. The interesting part is peer-group comparison — anomalies relative to similar neighborhoods (by demographics, density) are more meaningful than raw deviations. This could run in a Web Worker on page load and update the map with pulsing overlay markers.

**Wow moment**: User opens the dashboard and immediately sees 3 pulsing dots. One is a neighborhood where vacancy complaints tripled — they click through and discover a new cluster of abandoned buildings that appeared in the last quarter. The data found the story before the user even looked.

---

### 9. Split-Screen Neighborhood Comparison

**What**: Select two neighborhoods and enter a split-screen mode — two side-by-side mini-maps with synchronized layers, plus a comparison table showing every metric head-to-head with difference indicators and percentile ranks. Scroll down for overlaid time series (both neighborhoods on the same chart, different colors).

**Why unforgettable**: Comparison is how humans make sense of data. "Is this number good or bad?" only has meaning relative to something else. A dedicated comparison mode makes the implicit explicit and turns "I think neighborhood X is worse than Y" into a testable claim.

**Technical challenge**: Two synchronized Mapbox instances with linked interactions (pan one, the other follows). The comparison table needs every metric from every dataset computed for both neighborhoods — reusing the composite scoring pipeline but exposed as a flat table. Recharts can overlay two series trivially.

**Wow moment**: User compares their neighborhood to the one across the highway. Side by side, they see identical crime rates but wildly different transit access scores. The data reveals that the highway isn't just a physical barrier — it's an equity boundary.

---

### 10. 311 Complaint Submission Tracker

**What**: For any neighborhood or address, show a "lifecycle" view of recent 311 complaints: filed date, category, current status, days open, resolution date. Color-code by response time (green < 7 days, yellow < 30, red > 30). Add a "responsiveness score" — how fast does the city actually respond in this area vs the city average?

**Why unforgettable**: It answers the question every resident has: "If I file a complaint, will anything actually happen?" A responsiveness heatmap showing which neighborhoods get fast city action and which get ignored is politically explosive data presented matter-of-factly.

**Technical challenge**: The CSB data already includes status and dates. Computing resolution time requires parsing `DATETIMECLOSED - DATETIMEINIT`. The heatmap of responsiveness is just another choropleth — average resolution days per neighborhood. The lifecycle view is a simple timeline component.

**Wow moment**: User sees their neighborhood has a 45-day average response time while the neighborhood 2 miles away averages 8 days. Same complaint type, same severity, 5x difference. The dashboard doesn't editorialize — the numbers speak.

---

## Wild Cards

### 11. "Walk This Neighborhood" — Street-Level Data Tour

**What**: A guided, street-by-street flythrough mode. Pick a neighborhood, and the map animates along its streets at walking pace, pausing at points of interest: vacant buildings with their triage cards, bus stops with frequency data, food desert boundaries, complaint hotspots. The camera tilts to 60 degrees for a pseudo-3D perspective. Optional narration (TTS) reads out observations at each stop.

**Why unforgettable**: It transforms abstract data into a virtual walking tour. A city council member who's never been to a neighborhood can "walk" it in 90 seconds and understand the lived experience. It's Google Street View meets urban analytics.

**Technical challenge**: Requires computing a walking path through the neighborhood (use the road network or simplify with a boustrophedon pattern across the bounding box), then animating the Mapbox camera along it with `flyTo` chains. Pausing at data-rich locations means pre-computing "interest scores" along the path and inserting waypoints. Mapbox's `setCamera` with pitch/bearing creates the fly-through effect.

**Wow moment**: User hits "Walk" on a food desert neighborhood. The camera swoops down to street level, glides past 4 vacant lots (each flashing its triage score), pauses at an empty intersection where a grocery store could be, then pans to show the nearest bus stop — 0.8 miles away, with 12 daily trips. The user *felt* the distance.

---

### 12. Data Graffiti — Community Annotation Layer

**What**: A public annotation layer where anyone can drop pins with text, photos, or voice notes on the map. "This vacant lot has been dumped on for 3 years" with a photo. "This bus stop has no shelter and it floods." "This corner store closed last month." Annotations are upvotable and time-stamped. The result is a lived-experience layer that sits alongside the official data.

**Why unforgettable**: Official datasets are always 6-18 months stale. Community annotations are real-time ground truth. The tension between "the data says X" and "residents say Y" is where the most important conversations happen. This makes the dashboard a living document, not a static report.

**Technical challenge**: Needs a lightweight backend (Cloudflare D1 + R2 for storage). Moderation is the real challenge — could use upvote thresholds for visibility, time-decay for relevance, and community flagging. The map layer renders annotations as a separate source with clustering for zoom levels.

**Wow moment**: City official opens the dashboard, sees 47 community annotations clustered on one block — all reporting illegal dumping near a vacant building that the official data shows as "low priority." The annotation cluster overrides the triage score. The data just got fact-checked by the people who live there.

---

### 13. Budget Allocator Game Mode

**What**: Give the user a fixed budget ($10M, matching real ARPA allocation) and let them allocate it across intervention types: demolish vacant buildings ($X each), add bus routes ($Y/mile), open grocery stores ($Z each), fund 311 response teams ($W/year). After allocation, the simulation runs and shows projected impact on equity scores, food access, transit coverage, and vacancy rates. Leaderboard of allocations ranked by total equity improvement per dollar.

**Why unforgettable**: It gamifies urban planning. Turns "the city should do something" into "here's exactly what I'd do with the money and here's the projected outcome." The leaderboard creates a competitive incentive to find the most efficient allocation, and the best community-submitted allocations become genuine policy proposals.

**Technical challenge**: Combines the "What If" simulation engine with a constraint optimizer. Each intervention type needs a cost model and an impact model (how much does one grocery store improve equity scores within 1 mile?). The impact models can be derived from the existing scoring functions — a new grocery store within 0.5mi of a food desert tract would change its equity score by a computable amount.

**Wow moment**: User discovers that demolishing 20 vacant buildings costs the same as one new bus route, but the bus route improves equity scores for 8x more residents. They reorganize their budget, submit it to the leaderboard, and see they've cracked the top 10 most efficient allocations. Urban planning just became a strategy game.

---

## Consider Removing

- **Map style switcher** (dark/satellite/streets): 95% of users will never switch from light. The satellite view in particular adds no analytical value for this dataset. The 4 style buttons consume prime map real estate. Consider hiding behind an overflow menu or removing entirely.

- **Weather correlation in complaints analytics**: It's a clever insight but it's a dead end — users can't act on "rainy days have more complaints." The space would be better used for the responsiveness/resolution analysis that actually has policy implications.

- **Demographics layer as a standalone toggle**: Population and vacancy rate data is more useful when it's contextual (shown in neighborhood detail) than when it's a separate choropleth layer competing for visual attention. Consider folding it into the neighborhood detail panel and freeing up a layer slot.
