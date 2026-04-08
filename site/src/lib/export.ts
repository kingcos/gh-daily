import type { TrendingRepo } from './types';

export function exportMarkdown(repos: TrendingRepo[], title: string): string {
  const lines = [`# ${title}`, '', '| Repo | Description | Language | Stars (period) | Total Stars |', '|------|-------------|----------|---------------|-------------|'];
  for (const r of repos) {
    const desc = r.description.replace(/\|/g, '\\|').slice(0, 80);
    lines.push(
      `| [${r.owner}/${r.repo}](${r.url}) | ${desc} | ${r.language || '-'} | ${r.stars_period} | ${r.total_stars} |`,
    );
  }
  return lines.join('\n');
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
