import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTheme, setTheme } from '@/lib/store';

const ThemeToggle = () => {
  const [theme, setLocalTheme] = useState<'light' | 'dark'>(getTheme());

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  return (
    <button
      onClick={() => {
        const next = theme === 'light' ? 'dark' : 'light';
        setLocalTheme(next);
      }}
      className="p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
      aria-label="Переключить тему"
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
};

export default ThemeToggle;
