import type { TrendingRepo, Period } from './types';

let dateIndex: string[] | null = null;

export async function getDateIndex(): Promise<string[]> {
  if (dateIndex) return dateIndex;
  const resp = await fetch(`${import.meta.env.BASE_URL}data/index.json`);
  dateIndex = await resp.json();
  return dateIndex!;
}

export async function loadDay(date: string, period: Period): Promise<TrendingRepo[]> {
  const url = `${import.meta.env.BASE_URL}data/${date}/${period}.json`;
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
