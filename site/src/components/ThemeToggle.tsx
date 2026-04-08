import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('gh-daily-theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      className="rounded border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-surface)]"
      title="Toggle dark mode"
    >
      {dark ? 'Light' : 'Dark'}
    </button>
  );
}
