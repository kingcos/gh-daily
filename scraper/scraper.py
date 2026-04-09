#!/usr/bin/env python3
"""Scrape GitHub Trending and save as JSON by date."""

import json
import logging
import os
import re
import sys
from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger(__name__)

PERIODS = ["daily", "weekly", "monthly"]
BASE_URL = "https://github.com/trending"
DEFAULT_TZ = "UTC"
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


def get_scrape_timezone():
    """Return timezone configured by SCRAPER_TZ, fallback to UTC."""
    name = os.getenv("SCRAPER_TZ", DEFAULT_TZ)
    try:
        return ZoneInfo(name), name
    except ZoneInfoNotFoundError:
        log.warning("Invalid SCRAPER_TZ=%s, fallback to %s", name, DEFAULT_TZ)
        return timezone.utc, DEFAULT_TZ


def normalize_repos(repos: list[dict]) -> list[dict]:
    """Normalize repos for dedup checks (ignore scraped_at)."""
    return [{k: v for k, v in r.items() if k != "scraped_at"} for r in repos]


def has_meaningful_changes(out_path: str, repos: list[dict]) -> bool:
    """Return True if repo payload changed meaningfully vs existing JSON file."""
    if not os.path.exists(out_path):
        return True

    try:
        with open(out_path, encoding="utf-8") as f:
            existing = json.load(f)
    except Exception:
        return True

    return normalize_repos(existing) != normalize_repos(repos)


def scrape_trending(period: str, now_iso: str) -> list[dict]:
    """Scrape trending repos for a given period (daily/weekly/monthly)."""
    url = f"{BASE_URL}?since={period}"
    log.info("Fetching %s", url)

    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    rows = soup.select("article.Box-row")
    log.info("Found %d repos for %s", len(rows), period)
    if not rows:
        raise RuntimeError(
            f"No trending repos found for {period}; GitHub markup may have changed."
        )

    repos = []
    seen = set()

    for row in rows:
        link = row.select_one("h2 a")
        if not link:
            continue

        href = link["href"].strip()
        parts = href.strip("/").split("/")
        if len(parts) < 2:
            continue
        owner, repo = parts[0], parts[1]
        key = f"{owner}/{repo}".lower()
        if key in seen:
            log.warning("Duplicate repo in %s results, skipping %s/%s", period, owner, repo)
            continue
        seen.add(key)

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
                "scraped_at": now_iso,
                "trending_type": period,
                "trending_lang": "",
            }
        )

    return repos


def main():
    tz, tz_name = get_scrape_timezone()
    now = datetime.now(tz)
    date_str = now.strftime("%Y/%m/%d")
    now_iso = now.isoformat()
    log.info("Scrape clock: %s (%s)", now_iso, tz_name)
    base_dir = os.path.join(os.path.dirname(__file__), "..", "data", date_str)
    os.makedirs(base_dir, exist_ok=True)

    success = True
    for period in PERIODS:
        try:
            repos = scrape_trending(period, now_iso)
            if not repos:
                raise RuntimeError(f"Scrape returned 0 repos for {period}")

            out_path = os.path.join(base_dir, f"{period}.json")
            if has_meaningful_changes(out_path, repos):
                with open(out_path, "w", encoding="utf-8") as f:
                    json.dump(repos, f, ensure_ascii=False, indent=2)
                log.info("Wrote %d repos to %s", len(repos), out_path)
            else:
                log.info("No meaningful change for %s, skip writing %s", period, out_path)

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
