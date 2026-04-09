import { useState } from 'react';
import type { TrendingRepo } from '../lib/types';
import { isRead, toggleRead } from '../lib/readStatus';

const LANG_COLORS: Record<string, string> = {
  Python: '#3572A5', TypeScript: '#3178c6', JavaScript: '#f1e05a',
  Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d',
  C: '#555555', Ruby: '#701516', Swift: '#F05138', Kotlin: '#A97BFF',
  Shell: '#89e051', Dart: '#00B4AB', Zig: '#ec915c',
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
      className="flex items-start gap-3 border-b border-[var(--color-border)] px-2 py-3 transition-opacity"
      style={{ opacity: read ? 'var(--color-read)' : 1 }}
      data-read={read ? 'true' : undefined}
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
          {repo.language && (
            <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] shrink-0">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: LANG_COLORS[repo.language] || '#888' }}
              />
              {repo.language}
            </span>
          )}
        </div>
        {repo.description && (
          <p className="mt-1 text-sm text-[var(--color-text-muted)] line-clamp-2">
            {repo.description}
          </p>
        )}
        <div className="mt-1 flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
          <span title="Stars gained in period">+{repo.stars_period.toLocaleString()}</span>
          <span title="Total stars">{repo.total_stars.toLocaleString()} total</span>
        </div>
      </div>
      <button
        onClick={handleToggle}
        className="shrink-0 rounded px-2 py-1 text-xs border border-[var(--color-border)] hover:bg-[var(--color-surface)]"
        title={read ? 'Mark as unread' : 'Mark as read'}
      >
        {read ? 'Unread' : 'Read'}
      </button>
    </div>
  );
}
