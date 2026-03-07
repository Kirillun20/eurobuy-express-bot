import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getUser, saveUser, logout, getOrders } from '@/lib/store';
import { Order, ORDER_STATUS_LABELS, User } from '@/lib/types';
import { toast } from 'sonner';
import { LogOut, User as UserIcon, Package, Clock, CheckCircle2, Truck, ShieldCheck, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const STATUS_ICONS: Record<string, typeof Package> = {
  pending: Clock, confirmed: CheckCircle2, purchased: ShieldCheck,
  shipped: Truck, customs: MapPin, delivered: CheckCircle2,
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  purchased: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  shipped: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  customs: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(getUser());
  const [orders, setOrders] = useState<Order[]>(getOrders());
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  useEffect(() => { setOrders(getOrders()); }, [user]);

  const handleAuth = () => {
    if (!form.email || !form.password) { toast.error('Заполните все поля'); return; }
    if (!isLogin && !form.name) { toast.error('Укажите имя'); return; }
    const newUser: User = {
      id: Date.now().toString(36),
      name: form.name || form.email.split('@')[0],
      email: form.email, phone: form.phone,
    };
    saveUser(newUser);
    setUser(newUser);
    toast.success(isLogin ? 'Вход выполнен!' : 'Регистрация успешна!');
  };

  const handleLogout = () => { logout(); setUser(null); toast.info('Вы вышли из аккаунта'); };

  const inputClass = "glass border-glow bg-transparent h-11 rounded-xl";

  if (!user) {
    return (
      <div className="px-4 py-6 pb-20 max-w-lg mx-auto">
        {/* Glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-glow-primary/10 blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative text-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 glow-primary">
            <UserIcon size={28} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold">{isLogin ? 'Вход' : 'Регистрация'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? 'Войдите в личный кабинет' : 'Создайте аккаунт EuroBuy'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative space-y-4"
        >
          {!isLogin && (
            <div>
              <Label className="text-xs mb-1.5 block text-muted-foreground">Имя</Label>
              <Input placeholder="Ваше имя" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} />
            </div>
          )}
          <div>
            <Label className="text-xs mb-1.5 block text-muted-foreground">Email</Label>
            <Input type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputClass} />
          </div>
          {!isLogin && (
            <div>
              <Label className="text-xs mb-1.5 block text-muted-foreground">Телефон</Label>
              <Input type="tel" placeholder="+7..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} />
            </div>
          )}
          <div>
            <Label className="text-xs mb-1.5 block text-muted-foreground">Пароль</Label>
            <Input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={inputClass} />
          </div>

          <Button
            onClick={handleAuth}
            className="w-full gradient-primary glow-primary text-primary-foreground font-semibold h-12 rounded-xl border-0 hover:opacity-90 transition-opacity"
          >
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
          </Button>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-20 max-w-lg mx-auto">
      {/* User card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 border-glow mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center glow-primary">
              <span className="text-lg font-display font-bold text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-display font-semibold">{user.name}</h2>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive rounded-xl"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </motion.div>

      {/* Orders */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-display font-bold mb-4">Мои заказы</h2>
        {orders.length === 0 ? (
          <div className="text-center py-16 glass rounded-2xl border-glow">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Package size={28} className="text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">У вас пока нет заказов</p>
            <Button
              onClick={() => navigate('/order')}
              className="gradient-primary glow-primary text-primary-foreground rounded-xl border-0 hover:opacity-90"
            >
              Сделать заказ <ArrowRight size={16} className="ml-1.5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, idx) => {
              const Icon = STATUS_ICONS[order.status] || Package;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass rounded-xl p-4 hover:border-glow transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{order.name || order.link}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        #{order.id} · {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border ${STATUS_COLORS[order.status]}`}>
                      <Icon size={11} />
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{order.quantity} шт · {order.weight} кг</span>
                    <span className="font-display font-bold text-foreground text-sm">{order.price} {order.currency}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ProfilePage;
