import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTheme, setTheme } from '@/lib/store';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
  const [theme, setLocalTheme] = useState<'light' | 'dark'>(getTheme());

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      onClick={() => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setLocalTheme(next);
      }}
      className="relative p-2.5 rounded-xl glass hover:border-glow transition-all duration-300"
      aria-label="Переключить тему"
    >
      {theme === 'dark' ? <Sun size={18} className="text-foreground" /> : <Moon size={18} className="text-foreground" />}
    </motion.button>
  );
};

export default ThemeToggle;
