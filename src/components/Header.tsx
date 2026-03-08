import ThemeToggle from './ThemeToggle';
import { Package, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 glass-strong"
    >
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center glow-primary">
            <Package size={17} className="text-primary-foreground" />
          </div>
          <div>
            <span className="font-display font-bold text-base tracking-tight">EuroBuy</span>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/about')}
            className="w-9 h-9 rounded-xl glass border-glow flex items-center justify-center hover:bg-primary/5 transition-colors"
          >
            <Info size={16} className="text-muted-foreground" />
          </button>
          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
