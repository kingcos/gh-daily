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
      <h1 className="mb-1 text-2xl font-bold">今日 Trending — {date}</h1>
      <div className="mb-4 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded px-3 py-1 text-sm ${
              tab === t.value
                ? 'bg-[var(--color-accent)] text-white'
                : 'border border-[var(--color-border)] hover:bg-[var(--color-surface)]'
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
