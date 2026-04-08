export interface TrendingRepo {
  repo: string;
  owner: string;
  description: string;
  language: string | null;
  total_stars: number;
  stars_period: number;
  url: string;
  scraped_at: string;
  trending_type: 'daily' | 'weekly' | 'monthly';
  trending_lang: string;
}

export type Period = 'daily' | 'weekly' | 'monthly';
export type DateWindow = 7 | 30;
