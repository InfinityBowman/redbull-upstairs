#!/usr/bin/env python3
"""
fetch_raw.py — Download all raw datasets into python/data/raw/.

Just fetches and extracts. No processing, no aggregation.
Do EDA and cleaning in notebooks.

Usage:
  cd python/
  uv run python scripts/fetch_raw.py
"""

import sys
import zipfile
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("Missing dependency: pip install requests")

ROOT = Path(__file__).resolve().parent.parent  # python/
RAW_DIR = ROOT / "data" / "raw"

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
    print(f"  📥 {url.split('/')[-1]}...", end=" ", flush=True)
    resp = requests.get(url, stream=True, timeout=120, headers=HEADERS)
    resp.raise_for_status()
    total = int(resp.headers.get("content-length", 0))
    downloaded = 0
    with open(dest, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)
            downloaded += len(chunk)
    size_mb = downloaded / 1024 / 1024
    print(f"{size_mb:.1f} MB")
    return dest


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
            print(f"  ❌ Failed: {e}")

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
