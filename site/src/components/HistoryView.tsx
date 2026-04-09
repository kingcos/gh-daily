import { useState, useEffect } from 'react';
import type { TrendingRepo, Period } from '../lib/types';
import { getDateIndex, loadDateRange } from '../lib/data';
import RepoList from './RepoList';

export default function HistoryView() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [period, setPeriod] = useState<Period>('daily');
  const [repos, setRepos] = useState<TrendingRepo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDateIndex().then((d) => {
      if (d.length > 0) {
        setEndDate(d[d.length - 1]);
        setStartDate(d[Math.max(0, d.length - 7)]);
      }
    });
  }, []);

  const load = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    const data = await loadDateRange(startDate, endDate, period);
    data.sort((a, b) => b.stars_period - a.stars_period);
    setRepos(data);
    setLoading(false);
  };

  useEffect(() => {
    if (startDate && endDate) load();
  }, [startDate, endDate, period]);

  const toInputDate = (d: string) => d.replace(/\//g, '-');
  const fromInputDate = (d: string) => d.replace(/-/g, '/');

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">历史回看</h1>
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">按日期范围浏览 Trending 历史数据，按涨星数排序</p>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <label className="text-sm text-[var(--color-text-muted)]">
          从
          <input
            type="date"
            value={toInputDate(startDate)}
            onChange={(e) => setStartDate(fromInputDate(e.target.value))}
            className="ml-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-sm text-[var(--color-text)]"
          />
        </label>
        <label className="text-sm text-[var(--color-text-muted)]">
          到
          <input
            type="date"
            value={toInputDate(endDate)}
            onChange={(e) => setEndDate(fromInputDate(e.target.value))}
            className="ml-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-sm text-[var(--color-text)]"
          />
        </label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-sm text-[var(--color-text)]"
        >
          <option value="daily">日榜</option>
          <option value="weekly">周榜</option>
          <option value="monthly">月榜</option>
        </select>
      </div>
      {loading ? (
        <p className="py-12 text-center text-[var(--color-text-muted)]">加载中...</p>
      ) : (
        <RepoList
          repos={repos}
          title={`历史 ${startDate} 至 ${endDate} (${period})`}
          showSearch
        />
      )}
    </div>
  );
}
