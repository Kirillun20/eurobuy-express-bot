import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getUser, saveUser, logout, getOrders } from '@/lib/store';
import { Order, ORDER_STATUS_LABELS, User } from '@/lib/types';
import { toast } from 'sonner';
import { LogOut, User as UserIcon, Package, Clock, CheckCircle2, Truck, ShieldCheck, MapPin } from 'lucide-react';

const STATUS_ICONS: Record<string, typeof Package> = {
  pending: Clock,
  confirmed: CheckCircle2,
  purchased: ShieldCheck,
  shipped: Truck,
  customs: MapPin,
  delivered: CheckCircle2,
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  purchased: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  customs: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(getUser());
  const [orders, setOrders] = useState<Order[]>(getOrders());
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  useEffect(() => {
    setOrders(getOrders());
  }, [user]);

  const handleAuth = () => {
    if (!form.email || !form.password) {
      toast.error('Заполните все поля');
      return;
    }
    if (!isLogin && !form.name) {
      toast.error('Укажите имя');
      return;
    }

    const newUser: User = {
      id: Date.now().toString(36),
      name: form.name || form.email.split('@')[0],
      email: form.email,
      phone: form.phone,
    };
    saveUser(newUser);
    setUser(newUser);
    toast.success(isLogin ? 'Вход выполнен!' : 'Регистрация успешна!');
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    toast.info('Вы вышли из аккаунта');
  };

  if (!user) {
    return (
      <div className="px-4 py-6 pb-20 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center mx-auto mb-4">
            <UserIcon size={28} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold">{isLogin ? 'Вход' : 'Регистрация'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? 'Войдите в личный кабинет' : 'Создайте аккаунт EuroBuy'}
          </p>
        </div>

        <div className="space-y-4">
          {!isLogin && (
            <div>
              <Label className="text-xs mb-1.5 block">Имя</Label>
              <Input placeholder="Ваше имя" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
          )}
          <div>
            <Label className="text-xs mb-1.5 block">Email</Label>
            <Input type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          {!isLogin && (
            <div>
              <Label className="text-xs mb-1.5 block">Телефон</Label>
              <Input type="tel" placeholder="+7..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          )}
          <div>
            <Label className="text-xs mb-1.5 block">Пароль</Label>
            <Input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>

          <Button onClick={handleAuth} className="w-full bg-primary hover:bg-primary/90 font-semibold">
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
          </Button>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-20 max-w-lg mx-auto">
      {/* User card */}
      <div className="bg-card rounded-2xl p-5 shadow-card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center">
              <span className="text-lg font-display font-bold text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-semibold">{user.name}</h2>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut size={18} />
          </Button>
        </div>
      </div>

      {/* Orders */}
      <h2 className="text-xl font-display font-bold mb-4">Мои заказы</h2>
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl shadow-card">
          <Package size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">У вас пока нет заказов</p>
          <Button
            onClick={() => window.location.href = '/order'}
            className="mt-4 bg-gold hover:bg-gold-dark text-accent-foreground"
          >
            Сделать заказ
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const Icon = STATUS_ICONS[order.status] || Package;
            return (
              <div key={order.id} className="bg-card rounded-xl p-4 shadow-card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {order.name || order.link}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      #{order.id} · {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${STATUS_COLORS[order.status]}`}>
                    <Icon size={12} />
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{order.quantity} шт · {order.weight} кг</span>
                  <span className="font-display font-bold text-foreground">{order.price} {order.currency}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
