# V2: ML-Powered Policy Simulator — Deep Dive

The v1 simulator re-runs deterministic scoring functions with modified inputs. V2 replaces those heuristics with trained models that can actually predict outcomes: "if we add a bus stop here, how many fewer complaints will this corridor generate?"

This document covers what models to train, what data is available, what infrastructure is needed, and where the predictions plug into the existing frontend.

---

## The Data You Actually Have

The current pipeline aggregates everything into neighborhood-level summaries and throws away the raw records. The raw data is dramatically richer:

| Dataset | Raw Records | Raw Fields | Years | What the Pipeline Drops |
|---|---|---|---|---|
| **CSB 311** | **~1.1M** | 28 per record | 2008–2026 | Free-text explanations, resolution descriptions, caller type, department routing, ward, zip, inspection/cancel timestamps, individual geocoordinates |
| **Crime NIBRS** | ~5,660 | 22 per record | 2021–2024 | Time-of-day, NIBRS taxonomy, crime-against category, victim count, incident narrative, police district |
| **ARPA** | 12,694 txns | ~5 per record | 2021–2024 | Individual transactions, vendor details beyond top 20, project details beyond top 100 |
| **Vacancies** | ~1,200 | 17+ per parcel | snapshot | Raw violation dollar amounts, full assessor DBF fields (sale price, land value, building sqft, deed type) |
| **GTFS** | 487,961 stop-times | 10 per record | current | Arrival/departure times, headways, service day patterns, direction |
| **USDA Food** | ~50 tracts | ~60 per tract | 2019 | Race-disaggregated access, multi-threshold distances, SNAP data, senior/child metrics |

**The crown jewel is CSB 311.** 1.1 million individually geocoded, timestamped complaint records over 18 years with free-text descriptions. This is an unusually rich civic dataset — most cities have 2-3 years. The temporal depth alone enables serious forecasting.

---

## Model 1: Complaint Volume Forecasting

### What It Predicts

Given a neighborhood, category, and date range → predicted complaint volume. This is the backbone of the simulator: "if we remediate vacancies, how many fewer illegal dumping complaints should we expect?"

### Training Data

Read directly from the 19 raw CSB CSVs in `python/data/raw/csb/`. Each record has:
- `DATETIMEINIT` — when complaint was filed (full datetime)
- `DESCRIPTION` — complaint category
- `NEIGHBORHOOD` — neighborhood name
- `SRX`, `SRY` — coordinates (EPSG:3857, convert to lat/lng)
- `WARD`, `PROBZIP` — additional spatial features

Aggregate to daily counts per neighborhood per category. That gives you:
- ~79 neighborhoods × ~70 categories × ~6,500 days = millions of training rows (most zero, which is informative)
- Or aggregate to weekly/monthly for a smaller but cleaner signal

### Feature Engineering

For each (neighborhood, category, date) observation:

**Temporal features:**
- Day of week, month, quarter, year
- Holiday flag (US federal holidays)
- Days since last major weather event

**Weather features (extend Open-Meteo fetch to all years):**
- High/low temp, precipitation, snow
- Lagged 1-3 days (heavy rain → next-day pothole surge is already documented in the existing `weatherInsights()`)

**Spatial features (joined from other datasets):**
- Vacancy count in neighborhood (from `vacancies.json`)
- Vacancy triage score average
- Population, poverty rate, vacancy rate (from demographics)
- Transit stop count within 0.5mi of neighborhood centroid
- Food desert flag (any LILA tract overlapping)

**Lagged complaint features:**
- Same-category volume in this neighborhood: 7-day, 30-day, 90-day rolling averages
- Year-over-year same-month comparison
- Cross-category signal: total neighborhood complaint volume (all categories)

### Model Choice

**Prophet or NeuralProphet** for the time series component — handles seasonality, holidays, and trend changes well. The 18-year depth is more than enough for yearly seasonality detection.

**Gradient-boosted trees (XGBoost/LightGBM)** for the cross-sectional features — vacancy count, demographics, weather. These capture the nonlinear relationship between "neighborhood conditions" and "complaint volume."

**Hybrid approach:** Prophet generates the temporal baseline. XGBoost predicts residuals from the baseline using the spatial/weather/condition features. This is a standard two-stage approach in spatial-temporal forecasting.

### How It Connects to the Simulator

When a user simulates "remediate 20 vacancies in Wells-Goodfellow":
1. Current vacancy count for that neighborhood drops by 20
2. Average triage score changes
3. Feed the modified spatial features into the XGBoost residual model
4. Model predicts the change in complaint residual
5. Apply to Prophet baseline → new predicted complaint volume
6. Delta = current predicted volume minus simulated predicted volume
7. Display: "Projected reduction of ~340 complaints/year in illegal dumping and property maintenance categories"

### Effort Estimate

| Step | Work |
|---|---|
| Extend weather fetch to 2008–2026 | 2-3 hours (modify `fetch_raw.py` to loop years via Open-Meteo archive API) |
| Feature engineering pipeline | 1-2 days (new `python/models/features_csb.py`) |
| Prophet + XGBoost training | 1-2 days (new `python/models/train_complaints.py`) |
| Model export (coefficients or ONNX) | 2-3 hours |
| Inference endpoint | Half day (API route or pre-computed lookup table) |
| Frontend integration | Already done in v1 simulator UI — just swap the scoring function |
| **Total** | **~4-5 days** |

---

## Model 2: Crime Displacement / Correlation

### What It Predicts

Given a change in neighborhood conditions (new transit stop, vacancy remediation, ARPA investment) → predicted change in crime incidents by offense type.

### The Honest Caveat

Crime prediction is politically sensitive and methodologically hard. The goal is NOT "predict where crime will happen" (predictive policing). The goal is "if neighborhood conditions change, what correlations exist in the historical data?" Frame it as correlation analysis, not causal prediction.

### Training Data

The raw NIBRS file has only ~5,660 records over 2021–2024. This is thin for standalone ML. But you can enrich it:

**Approach 1: Cross-dataset panel regression.** Build a monthly panel dataset:
- Unit: (neighborhood, month)
- Target: crime incident count (total and by category)
- Features: complaint volume (from CSB), vacancy count, ARPA spending, transit accessibility, demographics
- This gives ~79 neighborhoods × ~36 months = ~2,844 panel observations

**Approach 2: Download more crime data.** SLMPD publishes annual NIBRS files going back several years. The current pipeline only fetches one file. Extending `fetch_raw.py` to grab all available years would 3-5x the crime data.

### Model Choice

**Panel regression (fixed effects)** — standard econometric approach for this kind of data. Neighborhood fixed effects control for unobserved time-invariant characteristics. Time fixed effects control for city-wide trends. The coefficient on "vacancy count" tells you: "holding everything else constant, each additional vacancy in a neighborhood is associated with X more crime incidents per month."

This isn't ML in the deep learning sense — it's applied econometrics. But it's the right tool. A gradient-boosted model on 2,844 rows with 79 cross-sectional units would overfit badly.

For the simulator, the coefficients become multipliers: remediate 20 vacancies → multiply by the vacancy coefficient → predicted crime delta.

### Effort Estimate

| Step | Work |
|---|---|
| Panel dataset construction | 1 day (join CSB, crime, vacancy, demographics by neighborhood-month) |
| Fixed-effects regression | Half day (statsmodels or linearmodels in Python) |
| Coefficient export | 1 hour (JSON lookup table) |
| Frontend integration | 2-3 hours |
| **Total** | **~2 days** |

---

## Model 3: Vacancy Triage (Replace Heuristic with Trained Model)

### What It Predicts

Given a vacant property's attributes → priority score and best-use recommendation. The current `calculateTriageScore()` uses hand-tuned weights (condition 25%, complaints 20%, etc.). A trained model could learn the weights from data.

### The Problem: No Ground Truth Labels

There's no dataset of "this vacancy was successfully remediated and here's what it became." Without labeled outcomes, you can't train a supervised model to predict "which vacancies should be prioritized."

### Workarounds

**Approach 1: Use complaint reduction as a proxy label.** If a vacancy was remediated (disappeared from the vacancy list between snapshots) and nearby complaints dropped, that's a positive outcome. Requires historical vacancy snapshots — currently only one snapshot exists.

**Approach 2: Use LRA acquisition as a proxy.** Properties acquired by the Land Reutilization Authority are presumably high-priority. The current data has `owner: 'LRA'` — if you can get historical acquisition dates, you could train a model to predict "will this property be acquired by LRA?" as a proxy for priority.

**Approach 3: Learn weights from expert rankings.** Have a domain expert rank 50-100 properties by priority. Train a learning-to-rank model (LambdaMART) on those preferences. This is the most honest approach but requires human input.

**Approach 4: Use the full assessor parcel data.** The raw parcel shapefile has fields the current pipeline ignores: sale price, land value, improvement value, building sqft, deed type, number of units. A richer feature set might reveal natural clusters that the current 6-factor heuristic misses.

### Recommendation

Skip this for v2. The current heuristic is good enough and the lack of ground truth labels makes any ML model speculative. Revisit if historical vacancy snapshots become available.

---

## Model 4: Resolution Time Prediction

### What It Predicts

Given a new 311 complaint → predicted days to resolution. This is useful for the simulator: "if this neighborhood gets more complaints due to X, how long will they take to resolve?"

### Training Data

Every closed CSB record has `DATETIMEINIT` and `DATETIMECLOSED`. The target is `(closed - init).days`. Features:

- `DESCRIPTION` (category — strong predictor, some categories take weeks, others take days)
- `NEIGHBORHOOD` (some neighborhoods have faster resolution, probably due to staffing)
- `CALLERTYPE` (web vs. phone — proxy for urgency or documentation quality)
- `SUBMITTO` (which department was assigned)
- Day of week, month (seasonal capacity constraints)
- Current neighborhood complaint volume (backlog proxy)

This is a clean regression problem with hundreds of thousands of training examples.

### Model Choice

**LightGBM regression** — handles categorical features natively, fast to train, interpretable via SHAP. Expected to significantly outperform the current flat `avgResolutionDays` per neighborhood.

### How It Connects to the Simulator

When predicting the impact of an intervention, the resolution time model tells you not just "fewer complaints" but "the remaining complaints will also resolve faster/slower" — because changing neighborhood conditions (vacancy remediation, transit access) changes the feature vector for future complaints.

### Effort Estimate

| Step | Work |
|---|---|
| Feature extraction from raw CSB | Half day |
| LightGBM training + validation | Half day |
| SHAP analysis for interpretability | 2-3 hours |
| Export model weights | 1 hour |
| Frontend integration (predicted resolution badge in detail views) | 2-3 hours |
| **Total** | **~2 days** |

---

## Model 5: NLP on Complaint Text

### What It Does

The raw CSB data has two text fields the pipeline completely drops:
- `EXPLANATION` — citizen's free-text description of the problem
- `PUBLICRESOLUTION` — how the city resolved it

These are gold for understanding *why* complaints happen, not just *what* and *where*.

### Applications

**Topic clustering:** Run sentence embeddings (all-MiniLM-L6-v2 or similar) on EXPLANATION text, cluster with HDBSCAN. Discover complaint sub-types within categories — e.g., within "Illegal Dumping," distinguish "construction debris in alley" from "mattress on sidewalk" from "tire dumping in vacant lot." Each sub-type may correlate differently with vacancies.

**Sentiment analysis:** The EXPLANATION text carries urgency and frustration signals. "There's a HUGE pile of trash that's been there for MONTHS and nobody has done anything" vs. "small amount of debris near the curb." A sentiment model could flag high-urgency complaints for prioritization.

**Resolution analysis:** Cluster PUBLICRESOLUTION texts to understand what the city actually does. "Sent to contractor" vs. "Closed — no action needed" vs. "Property owner notified." Map resolution types to outcomes (did the complaint recur?).

**Entity extraction:** Extract specific addresses, landmarks, and infrastructure references from EXPLANATION text. "The abandoned building at 4200 Natural Bridge" → link to specific vacancy record. This creates a complaint-to-vacancy join that the current pipeline lacks entirely (the `recentComplaints` field on vacancies is currently always empty).

### How It Connects to the Simulator

Topic clusters become features for the complaint forecasting model. If "construction debris in alley" complaints correlate strongly with nearby demolition activity, then simulating "remediate 20 vacancies" should reduce that sub-cluster specifically, not all illegal dumping uniformly.

The entity extraction creates the missing complaint-to-vacancy join — allowing the simulator to say "this specific vacant building at 4200 Natural Bridge generated 47 complaints over 3 years" rather than "this neighborhood has X complaints nearby."

### Effort Estimate

| Step | Work |
|---|---|
| Text preprocessing pipeline | Half day |
| Embedding + clustering (sentence-transformers + HDBSCAN) | 1 day |
| Topic labeling (LLM-assisted) | Half day |
| Entity extraction (spaCy NER or LLM) | 1 day |
| Complaint-to-vacancy join | Half day |
| Frontend integration (topic tags on complaints, linked vacancy references) | 1 day |
| **Total** | **~4 days** |

---

## Infrastructure

### Python Model Pipeline

```
python/
├── models/
│   ├── features_csb.py        # Feature engineering from raw CSB + weather + demographics
│   ├── features_crime.py      # Panel dataset construction
│   ├── train_complaints.py    # Prophet + XGBoost complaint forecasting
│   ├── train_resolution.py    # LightGBM resolution time prediction
│   ├── train_crime_panel.py   # Fixed-effects crime regression
│   ├── nlp_complaints.py      # Text embedding, clustering, entity extraction
│   └── export/
│       ├── complaint_model.json      # Prophet params + XGBoost weights
│       ├── resolution_model.json     # LightGBM weights
│       ├── crime_coefficients.json   # Panel regression coefficients
│       ├── topic_clusters.json       # Cluster labels + centroids
│       └── complaint_vacancy_join.json  # Entity-extracted links
```

### Serving Options

**Option A: Pre-computed lookup tables.** Export model predictions for every (neighborhood, category, month) combination as a static JSON file. The simulator reads from the table instead of running inference. This is the simplest approach and works for the panel regression coefficients and complaint forecasts.

Pros: No server-side inference, works on CF Workers, instant response.
Cons: Can't handle arbitrary "what-if" inputs — only pre-computed scenarios.

**Option B: Lightweight inference endpoint.** Deploy a FastAPI or Hono server that loads model weights and runs predictions on demand. The simulator sends the modified feature vector, the server returns predicted values.

Pros: Handles arbitrary scenarios, single source of truth.
Cons: Needs a server (not just static hosting), adds latency.

**Option C: Client-side inference.** Export models to ONNX Runtime for Web. Run inference directly in the browser. XGBoost and LightGBM models are small enough (KB–low MB) for this.

Pros: No server needed, works offline, instant response.
Cons: ONNX WASM runtime adds ~2MB to bundle, browser memory constraints for large models.

**Recommendation:** Start with Option A (pre-computed tables) for complaint forecasts and crime coefficients. Use Option B only for the NLP pipeline (text processing is too heavy for the browser). The complaint model would pre-compute predictions for every (neighborhood × category × month) tuple — that's 79 × 70 × 12 = ~66,360 rows, easily fits in a single JSON file.

### Extending the Data Pipeline

The current `pnpm data:pipeline` runs `fetch_raw.py` → `clean_data.py`. Add a third step:

```bash
pnpm data:train     # Train models on raw data → export weights/tables to public/data/models/
pnpm data:pipeline  # Now: sync → fetch → clean → train
```

Models retrain whenever raw data is refreshed. Exported artifacts are static files served alongside the existing JSON/GeoJSON.

---

## Frontend Integration Points

### Where Predictions Appear

**1. Simulator impact panel** (existing v1 UI) — swap deterministic scores for model predictions:
- Before: "Removing 20 vacancies changes the average triage score from 62 to 45"
- After: "Removing 20 vacancies is projected to reduce illegal dumping complaints by ~340/year (±80) based on the 2008–2025 complaint model, with the strongest effect in the first 6 months"

**2. Neighborhood detail** — add a "Forecast" section:
- Predicted complaint volume for next 3 months (Prophet trend + seasonal)
- Predicted resolution time for new complaints (LightGBM)
- Confidence intervals shown as shaded ranges on the time series chart

**3. Vacancy detail** — add complaint linkage:
- "This property has been mentioned in 47 complaint descriptions since 2019" (from NLP entity extraction)
- Linked complaint records with topic labels

**4. Analytics panels** — add forecast overlay to existing time series charts:
- Toggle "Show Forecast" on the daily complaints chart
- Dashed line extending beyond current data with confidence band
- Same for crime daily chart

**5. Chart builder** — add forecast datasets:
- `complaints-forecast`: predicted daily/monthly counts per neighborhood
- `crime-forecast`: predicted monthly counts with confidence intervals
- Users can chart forecasts alongside actuals

### Data Flow

```
public/data/models/
├── complaint_forecast.json     # Pre-computed: {neighborhood: {category: {month: predicted_count}}}
├── complaint_model_meta.json   # Model metadata: training period, accuracy metrics, feature importance
├── resolution_predictions.json # Pre-computed: {neighborhood: {category: predicted_days}}
├── crime_coefficients.json     # Panel regression: {feature: coefficient} lookup
├── topic_clusters.json         # NLP: {cluster_id: {label, keywords, count, top_neighborhoods}}
└── complaint_vacancy_links.json # NLP: {vacancy_id: [{complaint_text, date, cluster}]}
```

These load lazily like existing datasets — fetched when the user opens the simulator or forecast view.

---

## Accuracy Expectations

Being honest about what to expect:

| Model | Expected Performance | Why |
|---|---|---|
| Complaint forecasting | R² ~0.6-0.75 for monthly aggregates | Strong seasonality + weather signal. Daily is noisier. 18 years of data is unusually good. |
| Resolution time | RMSE ~3-5 days | Category is the dominant predictor. Neighborhood adds marginal lift. Outliers (100+ day cases) hurt RMSE. |
| Crime panel regression | Significant coefficients for vacancy and complaint counts | Small N (2,844 panel rows) limits power. Effects will be real but confidence intervals wide. |
| NLP topic clustering | 15-25 coherent clusters from the top 10 complaint categories | Complaint text is short and formulaic — clustering will work but many records will be near-duplicates. |
| Entity extraction (complaint → vacancy) | ~30-50% match rate | Only complaints that mention specific addresses will link. Many complaints describe symptoms ("trash in alley") not locations. |

The complaint forecasting model will be the most reliable because it has the most data and the strongest signal (seasonality, weather). The crime model will have real but uncertain effects. The NLP will produce useful clusters but imperfect linkage.

**What to show users:** Always display confidence intervals or uncertainty ranges. Never present a point prediction as fact. The LLM narrative should say "projected to reduce by 250-430 complaints" not "will reduce by 340."

---

## Implementation Order

### Phase 1: Complaint Forecasting (5 days)
This is the highest-value, most feasible model. It has the most data, the clearest signal, and the most direct connection to the simulator.

1. Extend weather data fetch to 2008–2026 (Open-Meteo archive API)
2. Build feature engineering pipeline from raw CSB CSVs
3. Train Prophet + XGBoost hybrid model
4. Export pre-computed forecast table
5. Add forecast overlay to complaint time series chart
6. Wire into simulator: vacancy remediation → feature change → complaint delta

### Phase 2: Resolution Time Model (2 days)
Quick win — clean regression problem, immediately useful.

1. Extract features from raw CSB (category, neighborhood, calendar, backlog)
2. Train LightGBM
3. Export predictions per (neighborhood, category)
4. Show predicted resolution time in complaint analytics and neighborhood detail

### Phase 3: Crime Correlation Panel (2 days)
Moderate value — limited data but important for the simulator narrative.

1. Build monthly panel dataset joining crime, CSB, vacancy, demographics
2. Run fixed-effects regression
3. Export coefficients
4. Wire into simulator: intervention → coefficient × delta → predicted crime change

### Phase 4: NLP Complaint Text Analysis (4 days)
High effort but creates the missing complaint-to-vacancy link.

1. Text preprocessing on 1.1M EXPLANATION fields
2. Sentence embeddings + HDBSCAN clustering
3. LLM-assisted topic labeling
4. Entity extraction for address matching
5. Build complaint-vacancy join table
6. Frontend: topic tags, linked complaints on vacancy detail

### Total: ~13 days of Python/ML work + ~3 days of frontend integration

This is real ML engineering work — not a weekend project. But the data quality and volume justify it. Most civic dashboards have 2 years of aggregated data. You have 18 years of individual records with geocoordinates and free text. That's rare.

---

## Dependencies

Current `python/pyproject.toml` already includes `scikit-learn`, `pandas`, `geopandas`, `shapely`. You'd add:

```toml
[project.optional-dependencies]
ml = [
  "prophet",           # Time series forecasting
  "lightgbm",          # Gradient-boosted trees
  "xgboost",           # Alternative gradient boosting
  "sentence-transformers",  # Text embeddings for NLP
  "hdbscan",           # Density-based clustering
  "shap",              # Model interpretability
  "linearmodels",      # Panel regression with fixed effects
  "spacy",             # NER for entity extraction
]
```

Kept as an optional dependency group so the base `uv sync` doesn't pull in PyTorch.

---

## What NOT to Build

**Real-time prediction API.** The data updates infrequently (CSB yearly, crime quarterly). Pre-computed tables refreshed during `data:pipeline` are sufficient. Don't over-engineer a live inference server.

**Deep learning.** The data is tabular and the relationships are well-understood (seasonality, spatial correlation, weather). Gradient-boosted trees and Prophet will outperform neural networks here. Deep learning is for when you have millions of images or sequences, not structured civic data.

**Causal inference claims.** The panel regression finds correlations, not causation. Don't claim "remediating vacancies causes crime to drop." Claim "historically, neighborhoods with fewer vacancies have had lower crime, controlling for demographics and time trends." The LLM narrative must be careful with this language.

**Predictive policing features.** Even though the crime data supports spatial prediction, building a "predict where crime will happen" feature is ethically fraught and politically toxic. The simulator should answer "what happens if conditions change" — not "where should we send police."
