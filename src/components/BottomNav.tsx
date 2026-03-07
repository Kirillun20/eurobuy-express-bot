import { Home, Calculator, ShoppingBag, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="relative flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition-all duration-300"
            >
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 1.8}
                className={`relative z-10 transition-colors duration-300 ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span className={`relative z-10 text-[10px] font-medium transition-colors duration-300 ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}>
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
