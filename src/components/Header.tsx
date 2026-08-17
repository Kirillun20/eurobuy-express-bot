import ThemeToggle from './ThemeToggle';
import { HelpCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoImg from '@/assets/logo.jpg';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40">
      {/* accent-bar: тонкая градиентная полоса primary -> gold (из макета) */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary to-accent" />

      <div className="bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          {/* Логотип + название — статичный брендинг, НЕ элемент навигации по страницам */}
          <div className="flex items-center gap-2.5">
            <img
              src={logoImg}
              alt="EuroBuy"
              className="w-8 h-8 rounded-lg object-cover shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.6)]"
            />
            <span className="font-display font-semibold text-[15px] tracking-wide text-foreground">
              EuroBuy
            </span>
          </div>

          {/* Утилитарные кнопки (не навигация по разделам) — оставлены по функционалу */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/help')}
              className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/15 transition-colors"
              aria-label="Помощь"
            >
              <HelpCircle size={15} className="text-primary" />
            </button>
            <button
              onClick={() => navigate('/about')}
              className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/15 transition-colors"
              aria-label="О сервисе"
            >
              <Info size={15} className="text-primary" />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;