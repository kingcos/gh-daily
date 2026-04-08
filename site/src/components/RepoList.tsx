import { useState, useMemo } from 'react';
import type { TrendingRepo } from '../lib/types';
import { isRead } from '../lib/readStatus';
import { exportMarkdown, copyToClipboard, downloadFile } from '../lib/export';
import RepoRow from './RepoRow';

interface Props {
  repos: TrendingRepo[];
  title: string;
  showSearch?: boolean;
}

export default function RepoList({ repos, title, showSearch = false }: Props) {
  const [hideRead, setHideRead] = useState(() => {
    try { return localStorage.getItem('gh-daily-hide-read') === 'true'; } catch { return false; }
  });
  const [search, setSearch] = useState('');
  const [exportMsg, setExportMsg] = useState('');

  const filtered = useMemo(() => {
    let list = repos;
    if (hideRead) {
      list = list.filter((r) => !isRead(r.owner, r.repo));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          `${r.owner}/${r.repo}`.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [repos, hideRead, search]);

  const handleExport = async () => {
    const md = exportMarkdown(filtered, title);
    await copyToClipboard(md);
    downloadFile(md, `${title.replace(/\s+/g, '-').toLowerCase()}.md`);
    setExportMsg('Copied & downloaded!');
    setTimeout(() => setExportMsg(''), 2000);
  };

  const toggleHideRead = () => {
    const next = !hideRead;
    setHideRead(next);
    try { localStorage.setItem('gh-daily-hide-read', next ? 'true' : 'false'); } catch {}
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {showSearch && (
          <input
            type="text"
            placeholder="Search repos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        )}
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="checkbox" checked={hideRead} onChange={toggleHideRead} />
          Hide read
        </label>
        <button
          onClick={handleExport}
          className="rounded border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-surface)]"
        >
          Export MD
        </button>
        {exportMsg && <span className="text-xs text-green-600">{exportMsg}</span>}
        <span className="ml-auto text-xs text-[var(--color-text-muted)]">
          {filtered.length} repos
        </span>
      </div>
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-[var(--color-text-muted)]">No repos to show.</p>
      ) : (
        filtered.map((r) => (
          <RepoRow key={`${r.owner}/${r.repo}-${r.trending_type}-${r.scraped_at}`} repo={r} />
        ))
      )}
    </div>
  );
}
