import ThemeToggle from './ThemeToggle';
import { Package } from 'lucide-react';

const Header = () => {
  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
            <Package size={18} className="text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">EuroBuy</span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
