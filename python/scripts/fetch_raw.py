#!/usr/bin/env python3
"""
fetch_raw.py — Download all raw datasets into python/data/raw/.

Just fetches and extracts. No processing, no aggregation.
Do EDA and cleaning in notebooks.

Usage:
  cd python/
  uv run python scripts/fetch_raw.py
"""

import json
import os
import re
import sys
import zipfile
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("Missing dependency: pip install requests")

ROOT = Path(__file__).resolve().parent.parent  # python/
RAW_DIR = ROOT / "data" / "raw"
YEAR = int(os.environ.get("DATA_YEAR", "2025"))

SOURCES = {
    "csb": {
        "url": "https://www.stlouis-mo.gov/data/upload/data-files/csb.zip",
        "desc": "311 CSB complaints (all years, CSV)",
    },
    "neighborhoods": {
        "url": "https://static.stlouis-mo.gov/open-data/planning/neighborhoods/neighborhoods.zip",
        "desc": "Neighborhood boundary shapefiles",
    },
    "gtfs": {
        "url": "https://www.metrostlouis.org/Transit/google_transit.zip",
        "desc": "Metro Transit GTFS feed",
    },
    "usda_food": {
        "url": "https://www.ers.usda.gov/media/5626/food-access-research-atlas-data-download-2019.xlsx",
        "desc": "USDA Food Access Research Atlas (2019)",
    },
    "tiger_tracts": {
        "url": "https://www2.census.gov/geo/tiger/TIGER2024/TRACT/tl_2024_29_tract.zip",
        "desc": "Census TIGER/Line tract boundaries (Missouri, 2024)",
    },
}

HEADERS = {"User-Agent": "Mozilla/5.0 (STL Urban Analytics data pipeline)"}


def download(url: str, dest: Path) -> Path:
    print(f"  \U0001f4e5 {url.split('/')[-1]}...", end=" ", flush=True)
    resp = requests.get(url, stream=True, timeout=120, headers=HEADERS)
    resp.raise_for_status()
    downloaded = 0
    with open(dest, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)
            downloaded += len(chunk)
    size_mb = downloaded / 1024 / 1024
    print(f"{size_mb:.1f} MB")
    return dest


def fetch_crime() -> None:
    """Download SLMPD crime CSV. Try multiple URL patterns."""
    crime_dir = RAW_DIR / "crime"
    crime_dir.mkdir(parents=True, exist_ok=True)

    # Try common URL patterns for SLMPD crime data
    url_patterns = [
        f"https://www.slmpd.org/images/Neighborhood_Crime_Stats_{YEAR}.CSV",
        f"https://www.slmpd.org/images/Neighborhood_Crime_Stats_{YEAR}.csv",
        f"https://www.slmpd.org/images/NIBRS{YEAR}.CSV",
        f"https://www.slmpd.org/images/NIBRS{YEAR}.csv",
    ]

    for url in url_patterns:
        try:
            print(f"  Trying {url.split('/')[-1]}...")
            dest = crime_dir / url.split("/")[-1]
            download(url, dest)
            print(f"  Got crime data from {url}")
            return
        except Exception:
            continue

    # Fallback: scrape the SLMPD crime reports page for download links
    print("  Direct URLs failed, scraping SLMPD crime page...")
    try:
        resp = requests.get(
            "https://www.slmpd.org/crime_stats.shtml",
            timeout=30,
            headers=HEADERS,
        )
        resp.raise_for_status()
        # Find CSV links
        csv_links = re.findall(r'href="([^"]*(?:NIBRS|Crime)[^"]*\.(?:csv|CSV))"', resp.text)
        if not csv_links:
            csv_links = re.findall(r'href="([^"]*\.(?:csv|CSV))"', resp.text)

        for link in csv_links:
            if not link.startswith("http"):
                link = f"https://www.slmpd.org/{link.lstrip('/')}"
            try:
                dest = crime_dir / link.split("/")[-1]
                download(link, dest)
                return
            except Exception:
                continue
    except Exception as e:
        print(f"  Scraping failed: {e}")

    print("  WARNING: Could not download crime data. Place CSV manually in python/data/raw/crime/")


def fetch_arpa() -> None:
    """Download ARPA expenditures JSON from City of STL."""
    print("  Fetching ARPA expenditures JSON...")
    url = "https://www.stlouis-mo.gov/customcf/endpoints/arpa/expenditures.cfm?format=json"
    try:
        resp = requests.get(url, timeout=60, headers=HEADERS)
        resp.raise_for_status()
        data = resp.json()
        dest = RAW_DIR / "arpa.json"
        with open(dest, "w") as f:
            json.dump(data, f)
        print(f"  Saved {dest.name} ({dest.stat().st_size // 1024} KB)")
    except Exception as e:
        print(f"  Failed to fetch ARPA data: {e}")


def fetch_demographics() -> None:
    """Scrape neighborhood census pages from City of STL (all 79 neighborhoods)."""
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        print("  WARNING: beautifulsoup4 not installed, skipping demographics")
        return

    print("  Scraping 79 neighborhood census pages (2020 + 2010)...")
    base_url = "https://www.stlouis-mo.gov/government/departments/planning/research/census/data/neighborhoods/neighborhood.cfm"
    all_data = {}

    for num in range(1, 80):
        nhd_id = str(num).zfill(2)
        page_data = {}

        for year in (2020, 2010):
            url = f"{base_url}?number={num}&censusYear={year}"
            try:
                resp = requests.get(url, timeout=30, headers=HEADERS)
                resp.raise_for_status()
                soup = BeautifulSoup(resp.text, "lxml")

                if year == 2020:
                    h1 = soup.find("h1")
                    name = h1.get_text(strip=True) if h1 else f"Neighborhood {nhd_id}"
                    name = re.sub(r"\s*-\s*Census\s*Data.*", "", name).strip()
                    page_data["name"] = name
                    tables = soup.find_all("table")
                    page_data["tables_found"] = len(tables)

                text_content = soup.get_text(separator="\n")
                page_data[f"text_{year}"] = text_content[:5000]
                # Keep backward compat: "text" key is the 2020 data
                if year == 2020:
                    page_data["text"] = text_content[:5000]

            except Exception as e:
                print(f"    Failed NHD {nhd_id} ({year}): {e}")

        all_data[nhd_id] = page_data

        if num % 10 == 0:
            print(f"    Scraped {num}/79 neighborhoods...")

    dest = RAW_DIR / "demographics.json"
    with open(dest, "w") as f:
        json.dump(all_data, f, indent=2)
    print(f"  Saved {dest.name} ({len(all_data)} neighborhoods, {dest.stat().st_size // 1024} KB)")


def fetch_vacancies() -> None:
    """Download vacant building data from City of STL APIs + parcel shapefile."""
    vacancy_dir = RAW_DIR / "vacancies"
    vacancy_dir.mkdir(parents=True, exist_ok=True)

    # 1. Fetch vacancy overview from the live API (keyed by parcel HANDLE)
    print("  Fetching vacancy overview from stlcitypermits.com API...")
    try:
        resp = requests.get(
            "https://www.stlcitypermits.com/API/VacantBuilding/GetVacantBuildingOverview",
            timeout=120,
            headers=HEADERS,
        )
        resp.raise_for_status()
        data = resp.json()
        dest = vacancy_dir / "vacancy_overview.json"
        with open(dest, "w") as f:
            json.dump(data, f)
        print(f"  Saved {dest.name} ({len(data)} parcels, {dest.stat().st_size // 1024} KB)")
    except Exception as e:
        print(f"  Failed to fetch vacancy overview: {e}")

    # 2. Download parcel shapefile (has address + geometry, keyed by HANDLE)
    parcel_url = "https://static.stlouis-mo.gov/open-data/ASSESSOR/PARCELS.zip"
    parcel_dest = RAW_DIR / "PARCELS.zip"
    if not parcel_dest.exists():
        print("  Downloading parcel shapefile...")
        try:
            download(parcel_url, parcel_dest)
            extract_dir = RAW_DIR / "parcels"
            extract_dir.mkdir(exist_ok=True)
            with zipfile.ZipFile(parcel_dest) as zf:
                zf.extractall(extract_dir)
            files = list(extract_dir.rglob("*"))
            print(f"  Extracted {sum(1 for f in files if f.is_file())} files to parcels/")
        except Exception as e:
            print(f"  Failed to download parcel shapefile: {e}")
    else:
        print("  Parcel shapefile already downloaded")


def main():
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 50)
    print("  Fetching raw datasets")
    print(f"  Output: {RAW_DIR}")
    print("=" * 50)

    for name, info in SOURCES.items():
        print(f"\n{info['desc']}")
        url = info["url"]
        filename = url.split("/")[-1]
        dest = RAW_DIR / filename

        try:
            download(url, dest)

            # Auto-extract zips into a subfolder
            if dest.suffix == ".zip":
                extract_dir = RAW_DIR / name
                extract_dir.mkdir(exist_ok=True)
                with zipfile.ZipFile(dest) as zf:
                    zf.extractall(extract_dir)
                contents = list(extract_dir.rglob("*"))
                files = [f for f in contents if f.is_file()]
                print(f"  Extracted {len(files)} files to {name}/")

        except Exception as e:
            print(f"  Failed: {e}")

    # New sources with custom fetch logic
    custom_sources = [
        ("SLMPD Crime Data", fetch_crime),
        ("ARPA Fund Expenditures", fetch_arpa),
        ("Neighborhood Demographics", fetch_demographics),
        ("Vacant Building List", fetch_vacancies),
    ]

    for desc, fn in custom_sources:
        print(f"\n{desc}")
        try:
            fn()
        except Exception as e:
            print(f"  Failed: {e}")

    # Summary
    print("\n" + "=" * 50)
    print("  Raw data:")
    print("=" * 50)
    for item in sorted(RAW_DIR.iterdir()):
        if item.is_dir():
            files = list(item.rglob("*"))
            file_count = sum(1 for f in files if f.is_file())
            total_size = sum(f.stat().st_size for f in files if f.is_file())
            print(f"  {item.name + '/':<40} {file_count} files, {total_size // 1024:>6} KB")
        else:
            print(f"  {item.name:<40} {item.stat().st_size // 1024:>6} KB")


if __name__ == "__main__":
    main()
