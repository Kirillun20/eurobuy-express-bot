import ThemeToggle from './ThemeToggle';
import { HelpCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import logoImg from '@/assets/logo.jpg';

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
          <img src={logoImg} alt="EuroBuy" className="w-9 h-9 rounded-xl object-cover" />
          <div>
            <span className="font-display text-base" style={{ fontWeight: 900, letterSpacing: '0.01em' }}>EuroBuy</span>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/help')}
            className="w-9 h-9 rounded-xl glass border-glow flex items-center justify-center hover:bg-primary/5 transition-colors"
          >
            <HelpCircle size={16} className="text-muted-foreground" />
          </button>
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
