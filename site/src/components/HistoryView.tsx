import { useState, useEffect, useMemo } from 'react';
import type { TrendingRepo, Period } from '../lib/types';
import { getDateIndex, loadDateRange } from '../lib/data';
import RepoList from './RepoList';

export default function HistoryView() {
  const [dates, setDates] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [period, setPeriod] = useState<Period>('daily');
  const [repos, setRepos] = useState<TrendingRepo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDateIndex().then((d) => {
      setDates(d);
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
      <h1 className="mb-4 text-2xl font-bold">History</h1>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm">
          From:
          <input
            type="date"
            value={toInputDate(startDate)}
            onChange={(e) => setStartDate(fromInputDate(e.target.value))}
            className="ml-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-text)]"
          />
        </label>
        <label className="text-sm">
          To:
          <input
            type="date"
            value={toInputDate(endDate)}
            onChange={(e) => setEndDate(fromInputDate(e.target.value))}
            className="ml-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-text)]"
          />
        </label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-text)]"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      {loading ? (
        <p className="py-8 text-center text-[var(--color-text-muted)]">Loading...</p>
      ) : (
        <RepoList
          repos={repos}
          title={`History ${startDate} to ${endDate} (${period})`}
          showSearch
        />
      )}
    </div>
  );
}
