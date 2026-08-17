import { Home, Calculator, ShoppingBag, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Структура пунктов без изменений: Главная (+трекинг), Калькулятор, Заказ, Профиль (+заказы)
const tabs = [
  { path: '/', icon: Home, label: 'Главная' },
  { path: '/calculator', icon: Calculator, label: 'Калькулятор' },
  { path: '/order', icon: ShoppingBag, label: 'Заказ' },
  { path: '/profile', icon: User, label: 'Профиль' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border/60">
      <div className="flex justify-around items-center py-2 px-1 max-w-lg mx-auto">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="relative flex flex-col items-center gap-1 py-1 px-4"
            >
              <span className="relative w-9 h-7 flex items-center justify-center rounded-xl">
                {active && (
                  <motion.span
                    layoutId="bottomNavHighlight"
                    className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary/20 to-primary/5 ring-1 ring-primary/15"
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
                <Icon
                  size={20}
                  strokeWidth={active ? 2.3 : 1.8}
                  className={`relative z-10 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
                />
              </span>
              <span
                className={`text-[10px] leading-none ${
                  active ? 'text-primary font-bold' : 'text-muted-foreground font-medium'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;