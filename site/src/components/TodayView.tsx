import { useState } from 'react';
import type { TrendingRepo, Period } from '../lib/types';
import RepoList from './RepoList';

interface Props {
  daily: TrendingRepo[];
  weekly: TrendingRepo[];
  monthly: TrendingRepo[];
  date: string;
}

const TABS: { label: string; value: Period }[] = [
  { label: '日榜', value: 'daily' },
  { label: '周榜', value: 'weekly' },
  { label: '月榜', value: 'monthly' },
];

export default function TodayView({ daily, weekly, monthly, date }: Props) {
  const [tab, setTab] = useState<Period>('daily');

  const data: Record<Period, TrendingRepo[]> = { daily, weekly, monthly };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">
        今日 Trending
        <span className="ml-2 text-base font-normal text-[var(--color-text-muted)]">{date}</span>
      </h1>
      <div className="mb-5 inline-flex rounded-lg border border-[var(--color-border)] p-0.5">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-md px-4 py-1.5 text-sm transition-colors ${
              tab === t.value
                ? 'bg-[var(--color-accent)] text-white font-medium shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <RepoList repos={data[tab]} title={`Trending ${tab} — ${date}`} showSearch />
    </div>
  );
}
