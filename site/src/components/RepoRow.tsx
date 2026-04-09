import { useState } from 'react';
import type { TrendingRepo } from '../lib/types';
import { isRead, toggleRead } from '../lib/readStatus';

const LANG_COLORS: Record<string, string> = {
  Python: '#3572A5', TypeScript: '#3178c6', JavaScript: '#f1e05a',
  Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d',
  C: '#555555', Ruby: '#701516', Swift: '#F05138', Kotlin: '#A97BFF',
  Shell: '#89e051', Dart: '#00B4AB', Zig: '#ec915c', Vue: '#41b883',
  PHP: '#4F5D95', Lua: '#000080', Scala: '#c22d40', R: '#198CE7',
};

interface Props {
  repo: TrendingRepo;
  onReadChange?: () => void;
}

export default function RepoRow({ repo, onReadChange }: Props) {
  const [read, setRead] = useState(() => isRead(repo.owner, repo.repo));

  const handleToggle = () => {
    const newVal = toggleRead(repo.owner, repo.repo);
    setRead(newVal);
    onReadChange?.();
  };

  return (
    <div
      className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 transition-all hover:border-[var(--color-accent)]/30 hover:shadow-sm"
      style={{ opacity: read ? 'var(--color-read)' : 1 }}
      data-read={read ? 'true' : undefined}
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
            {repo.language && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-bg)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: LANG_COLORS[repo.language] || '#888' }}
                />
                {repo.language}
              </span>
            )}
          </div>
          {repo.description && (
            <p className="mt-1.5 text-sm text-[var(--color-text-muted)] leading-relaxed line-clamp-2">
              {repo.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1 font-medium text-[var(--color-star)]" title="周期内新增">
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>
              +{repo.stars_period.toLocaleString()}
            </span>
            <span title="总星数">{repo.total_stars.toLocaleString()} 总星数</span>
          </div>
        </div>
        <button
          onClick={handleToggle}
          className={`shrink-0 rounded-md px-2.5 py-1 text-xs transition-colors ${
            read
              ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
              : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'
          }`}
          title={read ? '标记为未读' : '标记为已读'}
        >
          {read ? '未读' : '已读'}
        </button>
      </div>
    </div>
  );
}
