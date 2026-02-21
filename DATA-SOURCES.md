# Data Sources Quick Reference

All publicly available datasets relevant to STL Urban Analytics. Sources marked **In Use** are already integrated via `scripts/download-data.py` and served from `public/data/`.

## Currently Integrated

| Dataset | URL | Format | Output File(s) |
|---|---|---|---|
| 311 Requests (bulk) | `stlouis-mo.gov/data/upload/data-files/csb.zip` | CSV per year in ZIP | `csb_2024.json`, `trends.json` |
| Neighborhood Boundaries | `static.stlouis-mo.gov/open-data/planning/neighborhoods/neighborhoods.zip` | Shapefile | `neighborhoods.geojson` |
| Metro GTFS | `metrostlouis.org/Transit/google_transit.zip` | GTFS (CSV in ZIP) | `stops.geojson`, `shapes.geojson`, `routes.json`, `stop_stats.json` |
| USDA Food Atlas | `ers.usda.gov/data-products/food-access-research-atlas` | XLSX | `food_deserts.geojson` |
| Census TIGER Tracts | `www2.census.gov/geo/tiger/TIGER2022/TRACT/tl_2022_29_tract.zip` | Shapefile | Merged into `food_deserts.geojson` |
| Grocery Stores | Embedded in `download-data.py` | Hardcoded (23 stores) | `grocery_stores.geojson` |
| Weather (Open-Meteo) | `archive-api.open-meteo.com/v1/archive` | JSON API | Merged into `trends.json` |

**Note:** Vacancy data is mock — generated deterministically at runtime in `src/lib/vacancy-data.ts`. No real vacant property dataset is currently integrated.

---

## Available — Not Yet Integrated

### Vacancy & Property (replace mock data)

| Dataset | URL | Format | Auth |
|---|---|---|---|
| Vacant Buildings API | `stlcitypermits.com/API/VacantBuilding/` | JSON | No |
| Building Inspections API | `stlcitypermits.com/API/` | JSON | No |
| LRA Inventory | `dynamic.stlouis-mo.gov/opendata/downloads.cfm` → `lra_public.zip` | MS Access | No |
| Parcel Data | Same portal → `prcl.zip` | MS Access/DBF | No |
| Property Sales | Same portal → `prclsale.zip` | MS Access | No |
| Building Permits | Same portal → `prmemp.zip`, `prmbdo.zip` | MS Access | No |

### 311 (enhanced)

| Dataset | URL | Format | Auth |
|---|---|---|---|
| 311 API (live queries) | `stlouis-mo.gov/powernap/stlouis/api.cfm` | Open311 JSON | API key |

### Transit (realtime)

| Dataset | URL | Format | Auth |
|---|---|---|---|
| Metro Realtime | `metrostlouis.org/developer-resources/` | GTFS-RT (protobuf) | No |

### Safety & Health

| Dataset | URL | Format | Auth |
|---|---|---|---|
| Crime Data | `stlouis-mo.gov/data/datasets/dataset.cfm?id=69` | CSV | No |
| Lead Poisoning | `stlouis-mo.gov/data/datasets/dataset.cfm?id=79` | Report/CSV | No |

### Environmental & Infrastructure

| Dataset | URL | Format | Auth |
|---|---|---|---|
| FEMA Flood Hazard | `msc.fema.gov` / OpenFEMA API | GeoJSON/Shapefile | No |
| NREL Solar | `developer.nrel.gov/api/solar/` | JSON API | Free key |

### Demographics

| Dataset | URL | Format | Auth |
|---|---|---|---|
| Census ACS | `api.census.gov` | JSON API | Free key |
| NOAA Weather | `ncei.noaa.gov/cdo-web/api/v2/` | JSON API | Free token |

---

## Notes

### MS Access files

The City of St. Louis open data portal serves several datasets as MS Access `.mdb`/`.accdb` files. To process these in the Python pipeline:

```bash
pip install mdbtools  # or brew install mdbtools on macOS
mdb-export lra_public.mdb TableName > output.csv
```

Alternatively, use `pyodbc` or `pandas` with `sqlalchemy` + an Access driver.

### St. Louis geography constants

- City FIPS: `29510` (state=29, county=510)
- Center: 38.635, -90.245
- 79 neighborhoods identified by zero-padded `NHD_NUM` ("01"–"79")
- Census tracts prefixed with `29510`

### API keys

| Service | Signup |
|---|---|
| 311 Open311 API | Request via City of St. Louis |
| Census ACS | `api.census.gov/data/key_signup.html` |
| NOAA CDO | `ncdc.noaa.gov/cdo-web/token` |
| NREL Solar | `developer.nrel.gov/signup/` |
| Open-Meteo | None required (already in use) |
