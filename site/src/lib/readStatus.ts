const STORAGE_KEY = 'gh-daily-read';
const HIDE_KEY = 'gh-daily-hide-read';

function getReadMap(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function isRead(owner: string, repo: string): boolean {
  return !!getReadMap()[`${owner}/${repo}`];
}

export function toggleRead(owner: string, repo: string): boolean {
  const map = getReadMap();
  const key = `${owner}/${repo}`;
  const newVal = !map[key];
  if (newVal) {
    map[key] = true;
  } else {
    delete map[key];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  return newVal;
}

export function getHideRead(): boolean {
  try {
    return localStorage.getItem(HIDE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setHideRead(hide: boolean): void {
  localStorage.setItem(HIDE_KEY, hide ? 'true' : 'false');
}
