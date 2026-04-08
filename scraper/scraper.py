#!/usr/bin/env python3
"""Scrape GitHub Trending and save as JSON by date."""

import json
import logging
import os
import re
import sys
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger(__name__)

PERIODS = ["daily", "weekly", "monthly"]
BASE_URL = "https://github.com/trending"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}


def parse_stars(text: str) -> int:
    """Parse star count string like '8,703' into int."""
    return int(text.strip().replace(",", ""))


def parse_period_stars(text: str) -> int:
    """Parse '686 stars today' into 686."""
    match = re.search(r"([\d,]+)", text)
    if match:
        return int(match.group(1).replace(",", ""))
    return 0


def scrape_trending(period: str) -> list[dict]:
    """Scrape trending repos for a given period (daily/weekly/monthly)."""
    url = f"{BASE_URL}?since={period}"
    log.info("Fetching %s", url)

    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    rows = soup.select("article.Box-row")
    log.info("Found %d repos for %s", len(rows), period)

    now = datetime.now(timezone.utc).isoformat()
    repos = []

    for row in rows:
        link = row.select_one("h2 a")
        if not link:
            continue

        href = link["href"].strip()
        parts = href.strip("/").split("/")
        if len(parts) < 2:
            continue
        owner, repo = parts[0], parts[1]

        desc_el = row.select_one("p")
        description = desc_el.get_text(strip=True) if desc_el else ""

        lang_el = row.select_one("[itemprop=programmingLanguage]")
        language = lang_el.get_text(strip=True) if lang_el else None

        stars_el = row.select_one("a[href*=stargazers]")
        total_stars = parse_stars(stars_el.get_text()) if stars_el else 0

        period_el = row.select_one("span.d-inline-block.float-sm-right")
        stars_period = 0
        if period_el:
            stars_period = parse_period_stars(period_el.get_text())
        else:
            log.warning("No stars_period for %s/%s", owner, repo)

        repos.append(
            {
                "repo": repo,
                "owner": owner,
                "description": description,
                "language": language,
                "total_stars": total_stars,
                "stars_period": stars_period,
                "url": f"https://github.com/{owner}/{repo}",
                "scraped_at": now,
                "trending_type": period,
                "trending_lang": "",
            }
        )

    return repos


def main():
    date_str = datetime.now(timezone.utc).strftime("%Y/%m/%d")
    base_dir = os.path.join(os.path.dirname(__file__), "..", "data", date_str)
    os.makedirs(base_dir, exist_ok=True)

    success = True
    for period in PERIODS:
        try:
            repos = scrape_trending(period)
            out_path = os.path.join(base_dir, f"{period}.json")
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(repos, f, ensure_ascii=False, indent=2)
            log.info("Wrote %d repos to %s", len(repos), out_path)

            # Validate: all entries must have stars_period
            empty = [r for r in repos if r["stars_period"] == 0]
            if empty:
                log.warning(
                    "%d repos with stars_period=0 in %s: %s",
                    len(empty),
                    period,
                    [f"{r['owner']}/{r['repo']}" for r in empty],
                )
        except Exception:
            log.exception("Failed to scrape %s", period)
            success = False

    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
