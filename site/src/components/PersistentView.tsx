import { useState, useEffect } from 'react';
import type { TrendingRepo, Period, DateWindow } from '../lib/types';
import { getDateIndex, loadDateRange } from '../lib/data';
import { isRead, toggleRead } from '../lib/readStatus';

interface RepoWithCount {
  owner: string;
  repo: string;
  description: string;
  language: string | null;
  url: string;
  total_stars: number;
  count: number;
}

export default function PersistentView() {
  const [window, setWindow] = useState<DateWindow>(7);
  const [period, setPeriod] = useState<Period>('daily');
  const [repos, setRepos] = useState<RepoWithCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [hideRead, setHideRead] = useState(() => {
    try { return localStorage.getItem('gh-daily-hide-read') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const dates = await getDateIndex();
      if (dates.length === 0) { setLoading(false); return; }
      const end = dates[dates.length - 1];
      const start = dates[Math.max(0, dates.length - window)];
      const all = await loadDateRange(start, end, period);

      const countMap = new Map<string, RepoWithCount>();
      for (const r of all) {
        const key = `${r.owner}/${r.repo}`;
        const existing = countMap.get(key);
        if (existing) {
          existing.count++;
          if (r.total_stars > existing.total_stars) existing.total_stars = r.total_stars;
        } else {
          countMap.set(key, {
            owner: r.owner, repo: r.repo, description: r.description,
            language: r.language, url: r.url, total_stars: r.total_stars, count: 1,
          });
        }
      }

      const sorted = [...countMap.values()].sort((a, b) => b.count - a.count || b.total_stars - a.total_stars);
      setRepos(sorted);
      setLoading(false);
    })();
  }, [window, period]);

  const filtered = hideRead ? repos.filter((r) => !isRead(r.owner, r.repo)) : repos;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Persistent Trending</h1>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={window}
          onChange={(e) => setWindow(Number(e.target.value) as DateWindow)}
          className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-text)]"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-text)]"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={hideRead}
            onChange={() => {
              const next = !hideRead;
              setHideRead(next);
              try { localStorage.setItem('gh-daily-hide-read', next ? 'true' : 'false'); } catch {}
            }}
          />
          Hide read
        </label>
        <span className="ml-auto text-xs text-[var(--color-text-muted)]">{filtered.length} repos</span>
      </div>
      {loading ? (
        <p className="py-8 text-center text-[var(--color-text-muted)]">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-[var(--color-text-muted)]">No repos to show.</p>
      ) : (
        filtered.map((r) => (
          <PersistentRow key={`${r.owner}/${r.repo}`} repo={r} />
        ))
      )}
    </div>
  );
}

function PersistentRow({ repo }: { repo: RepoWithCount }) {
  const [read, setRead] = useState(() => isRead(repo.owner, repo.repo));

  return (
    <div
      className="flex items-start gap-3 border-b border-[var(--color-border)] px-2 py-3 transition-opacity"
      style={{ opacity: read ? 'var(--color-read)' : 1 }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--color-accent)] hover:underline truncate"
          >
            {repo.owner}/{repo.repo}
          </a>
          <span className="shrink-0 rounded bg-[var(--color-accent)] px-1.5 py-0.5 text-xs text-white font-medium">
            {repo.count}x
          </span>
          {repo.language && (
            <span className="text-xs text-[var(--color-text-muted)] shrink-0">{repo.language}</span>
          )}
        </div>
        {repo.description && (
          <p className="mt-1 text-sm text-[var(--color-text-muted)] line-clamp-2">{repo.description}</p>
        )}
        <div className="mt-1 text-xs text-[var(--color-text-muted)]">
          {repo.total_stars.toLocaleString()} total stars
        </div>
      </div>
      <button
        onClick={() => { const v = toggleRead(repo.owner, repo.repo); setRead(v); }}
        className="shrink-0 rounded px-2 py-1 text-xs border border-[var(--color-border)] hover:bg-[var(--color-surface)]"
      >
        {read ? 'Unread' : 'Read'}
      </button>
    </div>
  );
}
