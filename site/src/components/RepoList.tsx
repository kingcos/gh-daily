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
  const [readVersion, setReadVersion] = useState(0);
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
  }, [repos, hideRead, search, readVersion]);

  const handleExport = async () => {
    const md = exportMarkdown(filtered, title);
    await copyToClipboard(md);
    downloadFile(md, `${title.replace(/\s+/g, '-').toLowerCase()}.md`);
    setExportMsg('done');
    setTimeout(() => setExportMsg(''), 2000);
  };

  const toggleHideRead = () => {
    const next = !hideRead;
    setHideRead(next);
    try { localStorage.setItem('gh-daily-hide-read', next ? 'true' : 'false'); } catch {}
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {showSearch && (
          <input
            type="text"
            placeholder="搜索仓库..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)]"
          />
        )}
        <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideRead}
            onChange={toggleHideRead}
            className="rounded"
          />
          隐藏已读
        </label>
        <button
          onClick={handleExport}
          className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors"
        >
          {exportMsg ? '已导出' : '导出 MD'}
        </button>
        <span className="ml-auto text-xs text-[var(--color-text-muted)]">
          {filtered.length} 个仓库
        </span>
      </div>
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-[var(--color-text-muted)]">暂无数据</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((r) => (
            <RepoRow
              key={`${r.owner}/${r.repo}-${r.trending_type}-${r.scraped_at}`}
              repo={r}
              onReadChange={() => setReadVersion((v) => v + 1)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
