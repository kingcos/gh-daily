# gh-daily

Archive and browse GitHub Trending history with read tracking.

A Python scraper runs daily via GitHub Actions, saving trending repository data as JSON. An Astro static site lets you browse today's trending, explore history, and find persistently popular repos — with localStorage-based read/unread tracking.

## Features

- **3-hour scraping** of GitHub Trending (daily / weekly / monthly periods)
- **Three views**: Today, History (date range + filters), Persistent (most frequently trending)
- **Read tracking**: mark repos as read, visually fade them, toggle "hide read"
- **Dark mode**: auto-detects system preference, manual toggle
- **Search**: client-side filtering by repo name and description
- **Export**: current view as Markdown (clipboard + file download)
- **Offline support**: service worker caches assets and data
- **Zero cost**: GitHub Actions + GitHub Pages only

## How It Works

```
GitHub Actions (every ~3 hours, UTC cron)
  → scraper/scraper.py fetches github.com/trending
  → de-duplicates repo rows and skips write when only scraped_at changed
  → saves to data/YYYY/MM/DD/{daily,weekly,monthly}.json (Asia/Shanghai date)
  → commits to main
  → triggers site rebuild & deploy to GitHub Pages
```

## Fork & Self-Host

1. Fork this repository
2. Enable GitHub Pages in repo Settings → Pages → Source: "GitHub Actions"
3. The scraper runs automatically every ~3 hours (UTC cron)
4. Trigger a manual run: Actions → "Scrape GitHub Trending" → Run workflow
5. After the first data commit, the site deploys automatically

## Data Schema

Each JSON file (`data/YYYY/MM/DD/{daily,weekly,monthly}.json`) contains an array of:

| Field | Type | Description |
|-------|------|-------------|
| `repo` | string | Repository name |
| `owner` | string | Owner / organization |
| `description` | string | Repo description |
| `language` | string \| null | Primary programming language |
| `total_stars` | number | Total star count at scrape time |
| `stars_period` | number | Stars gained in the period (today/this week/this month) |
| `url` | string | Full GitHub URL |
| `scraped_at` | string | ISO 8601 timestamp |
| `trending_type` | string | `daily`, `weekly`, or `monthly` |
| `trending_lang` | string | Language filter (empty = all languages) |

## Project Structure

```
gh-daily/
├── scraper/              # Python scraper
│   ├── scraper.py
│   └── requirements.txt
├── data/                 # Archived JSON data (committed by Actions)
│   └── YYYY/MM/DD/
├── site/                 # Astro + React static site
│   ├── src/
│   │   ├── pages/        # Today, History, Persistent
│   │   ├── components/   # React interactive components
│   │   └── lib/          # Data loading, localStorage, export
│   └── astro.config.mjs
├── .github/workflows/
│   ├── scrape.yml        # Daily scraper
│   └── deploy.yml        # Site build & deploy
└── README.md
```

## Local Development

```bash
# Run scraper
pip install -r scraper/requirements.txt
python scraper/scraper.py

# Run site
cd site
npm install
npm run dev
```

## License

MIT
