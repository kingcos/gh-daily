import { useState, useEffect } from 'react';
import type { Period, DateWindow } from '../lib/types';
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
  const [, setReadVersion] = useState(0);
  const [hideRead, setHideRead] = useState(() => {
    try { return localStorage.getItem('gh-daily-hide-read') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const dates = await getDateIndex();
        if (dates.length === 0) {
          setRepos([]);
          return;
        }
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
      } finally {
        setLoading(false);
      }
    })();
  }, [window, period]);

  const filtered = hideRead ? repos.filter((r) => !isRead(r.owner, r.repo)) : repos;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">常驻榜</h1>
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">在所选时间窗口内反复出现在 Trending 上的仓库，按上榜次数排名</p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={window}
          onChange={(e) => setWindow(Number(e.target.value) as DateWindow)}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-sm text-[var(--color-text)]"
        >
          <option value={7}>近 7 天</option>
          <option value={30}>近 30 天</option>
        </select>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-sm text-[var(--color-text)]"
        >
          <option value="daily">日榜</option>
          <option value="weekly">周榜</option>
          <option value="monthly">月榜</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideRead}
            onChange={() => {
              const next = !hideRead;
              setHideRead(next);
              try { localStorage.setItem('gh-daily-hide-read', next ? 'true' : 'false'); } catch {}
            }}
            className="rounded"
          />
          隐藏已读
        </label>
        <span className="ml-auto text-xs text-[var(--color-text-muted)]">{filtered.length} 个仓库</span>
      </div>
      {loading ? (
        <p className="py-12 text-center text-[var(--color-text-muted)]">加载中...</p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-[var(--color-text-muted)]">暂无数据</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((r) => (
            <PersistentRow
              key={`${r.owner}/${r.repo}`}
              repo={r}
              onReadChange={() => setReadVersion((v) => v + 1)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PersistentRow({ repo, onReadChange }: { repo: RepoWithCount; onReadChange?: () => void }) {
  const [read, setRead] = useState(() => isRead(repo.owner, repo.repo));

  return (
    <div
      className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 transition-all hover:border-[var(--color-accent)]/30 hover:shadow-sm"
      style={{ opacity: read ? 'var(--color-read)' : 1 }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--color-accent)] hover:underline"
            >
              <span className="text-[var(--color-text-muted)] font-normal">{repo.owner}/</span>{repo.repo}
            </a>
            <span className="inline-flex items-center rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-xs text-white font-medium">
              {repo.count} 次上榜
            </span>
            {repo.language && (
              <span className="text-xs text-[var(--color-text-muted)]">{repo.language}</span>
            )}
          </div>
          {repo.description && (
            <p className="mt-1.5 text-sm text-[var(--color-text-muted)] leading-relaxed line-clamp-2">{repo.description}</p>
          )}
          <div className="mt-2 text-xs text-[var(--color-text-muted)]">
            {repo.total_stars.toLocaleString()} 总星数
          </div>
        </div>
        <button
          onClick={() => {
            const v = toggleRead(repo.owner, repo.repo);
            setRead(v);
            onReadChange?.();
          }}
          className={`shrink-0 rounded-md px-2.5 py-1 text-xs transition-colors ${
            read
              ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
              : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'
          }`}
        >
          {read ? '未读' : '已读'}
        </button>
      </div>
    </div>
  );
}
