import type { TrendingRepo, Period } from './types';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

let dateIndex: string[] | null = null;

export async function getDateIndex(): Promise<string[]> {
  if (dateIndex) return dateIndex;
  try {
    const resp = await fetch(`${base}/data/index.json`, { cache: 'no-store' });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    dateIndex = data;
    return dateIndex;
  } catch {
    return [];
  }
}

export async function loadDay(date: string, period: Period): Promise<TrendingRepo[]> {
  const url = `${base}/data/${date}/${period}.json`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return [];
    return await resp.json();
  } catch {
    return [];
  }
}

export async function loadDateRange(
  startDate: string,
  endDate: string,
  period: Period,
): Promise<TrendingRepo[]> {
  const dates = await getDateIndex();
  const filtered = dates.filter((d) => d >= startDate && d <= endDate);
  const results = await Promise.all(filtered.map((d) => loadDay(d, period)));
  return results.flat();
}
