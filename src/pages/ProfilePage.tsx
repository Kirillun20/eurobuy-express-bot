import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getUser, saveUser, logout, getOrders } from '@/lib/store';
import {
  Order, ORDER_STATUS_LABELS, ALL_STATUSES, User, DELIVERY_METHODS, PAYMENT_METHODS, roundBYN,
} from '@/lib/types';
import { toast } from 'sonner';
import {
  LogOut, User as UserIcon, Package, Clock, CheckCircle2, Truck,
  ShieldCheck, MapPin, ArrowRight, ArrowLeft, Copy, ChevronDown, ChevronUp,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [trackSearch, setTrackSearch] = useState('');

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

  const filteredOrders = trackSearch
    ? orders.filter(o => o.trackNumber?.toLowerCase().includes(trackSearch.toLowerCase()) || o.id.includes(trackSearch))
    : orders;

  if (!user) {
    return (
      <div className="px-4 py-6 pb-20 max-w-lg mx-auto">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-glow-primary/10 blur-[100px] pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 glow-primary">
            <UserIcon size={28} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold">{isLogin ? 'Вход' : 'Регистрация'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? 'Войдите в личный кабинет' : 'Создайте аккаунт EuroBuy'}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative space-y-4">
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
              <Input type="tel" placeholder="+375..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} />
            </div>
          )}
          <div>
            <Label className="text-xs mb-1.5 block text-muted-foreground">Пароль</Label>
            <Input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={inputClass} />
          </div>
          <Button onClick={handleAuth} className="w-full gradient-primary glow-primary text-primary-foreground font-semibold h-12 rounded-xl border-0 hover:opacity-90">
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
          </Button>
          <button onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-20 max-w-lg mx-auto">
      {/* User card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 border-glow mb-6">
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
              {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive rounded-xl">
            <LogOut size={18} />
          </Button>
        </div>
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: 'Заказов', value: orders.length },
            { label: 'В пути', value: orders.filter(o => ['shipped', 'customs'].includes(o.status)).length },
            { label: 'Доставлено', value: orders.filter(o => o.status === 'delivered').length },
          ].map(s => (
            <div key={s.label} className="glass rounded-xl p-2.5 text-center">
              <div className="text-lg font-display font-bold text-gradient">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Search orders */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Поиск по трек-номеру..."
          value={trackSearch}
          onChange={e => setTrackSearch(e.target.value)}
          className="glass border-glow bg-transparent h-10 rounded-xl pl-10"
        />
      </div>

      {/* Orders */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <h2 className="text-xl font-display font-bold mb-4">Мои заказы</h2>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 glass rounded-2xl border-glow">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Package size={28} className="text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {trackSearch ? 'Заказ не найден' : 'У вас пока нет заказов'}
            </p>
            {!trackSearch && (
              <Button onClick={() => navigate('/order')} className="gradient-primary glow-primary text-primary-foreground rounded-xl border-0 hover:opacity-90">
                Сделать заказ <ArrowRight size={16} className="ml-1.5" />
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order, idx) => {
              const Icon = STATUS_ICONS[order.status] || Package;
              const isExpanded = expandedOrder === order.id;
              const dm = DELIVERY_METHODS.find(d => d.id === order.deliveryMethod);
              const pm = PAYMENT_METHODS.find(p => p.id === order.paymentMethod);
              const grandTotal = roundBYN((order.totalPriceBYN || 0) + (order.totalServiceBYN || 0) + (order.deliveryCostBYN || 0));

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass rounded-xl overflow-hidden hover:border-glow transition-all duration-300"
                >
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {order.items?.[0]?.name || order.items?.[0]?.link || 'Заказ'}
                          {(order.items?.length || 0) > 1 && ` +${(order.items?.length || 1) - 1}`}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[11px] text-muted-foreground">
                            {order.trackNumber && `${order.trackNumber} · `}
                            {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border ${STATUS_COLORS[order.status]}`}>
                          <Icon size={11} />
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                        {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{order.items?.length || 1} товар(ов) · {order.totalWeight || 0} кг</span>
                      <span className="font-display font-bold text-foreground text-sm">{grandTotal} BYN</span>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4">
                          {/* Track number */}
                          {order.trackNumber && (
                            <div className="glass rounded-xl p-3 flex items-center justify-between">
                              <div>
                                <p className="text-[10px] text-muted-foreground">Трек-номер</p>
                                <p className="font-display font-bold text-gradient">{order.trackNumber}</p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(order.trackNumber);
                                  toast.success('Скопировано!');
                                }}
                                className="p-2 rounded-lg glass hover:border-glow"
                              >
                                <Copy size={14} className="text-muted-foreground" />
                              </button>
                            </div>
                          )}

                          {/* Status timeline */}
                          <div>
                            <p className="text-xs font-medium mb-3">Статус доставки</p>
                            <div className="space-y-0">
                              {ALL_STATUSES.map((status, sIdx) => {
                                const StatusIcon = STATUS_ICONS[status];
                                const currentIdx = ALL_STATUSES.indexOf(order.status);
                                const isPast = sIdx <= currentIdx;
                                const isCurrent = sIdx === currentIdx;
                                const historyEntry = order.statusHistory?.find(h => h.status === status);

                                return (
                                  <div key={status} className="flex items-start gap-3">
                                    <div className="flex flex-col items-center">
                                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                        isCurrent ? 'gradient-primary glow-primary' :
                                        isPast ? 'bg-primary/20' : 'bg-muted'
                                      }`}>
                                        <StatusIcon size={12} className={isPast ? 'text-primary-foreground' : 'text-muted-foreground'} />
                                      </div>
                                      {sIdx < ALL_STATUSES.length - 1 && (
                                        <div className={`w-0.5 h-6 ${isPast ? 'bg-primary/40' : 'bg-border'}`} />
                                      )}
                                    </div>
                                    <div className="pt-1">
                                      <p className={`text-xs font-medium ${isPast ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {ORDER_STATUS_LABELS[status]}
                                      </p>
                                      {historyEntry && (
                                        <p className="text-[10px] text-muted-foreground">
                                          {new Date(historyEntry.date).toLocaleDateString('ru-RU')}
                                          {historyEntry.comment && ` · ${historyEntry.comment}`}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Items */}
                          {order.items && order.items.length > 0 && (
                            <div>
                              <p className="text-xs font-medium mb-2">Товары</p>
                              <div className="space-y-2">
                                {order.items.map((item, iIdx) => (
                                  <div key={iIdx} className="glass rounded-lg p-3">
                                    <p className="text-sm font-medium truncate">{item.name || item.link}</p>
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                      <span>{item.quantity} шт · {item.weight} кг · {item.country}</span>
                                      <span className="font-medium text-foreground">{item.priceBYN} BYN</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Details */}
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Доставка</span>
                              <span>{dm?.name || order.deliveryMethod}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Оплата</span>
                              <span>{pm?.name || order.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Стоимость товаров</span>
                              <span>{order.totalPriceBYN || 0} BYN</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Сервисный сбор</span>
                              <span>{order.totalServiceBYN || 0} BYN</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Доставка</span>
                              <span>{order.deliveryCostBYN || 0} BYN</span>
                            </div>
                            <div className="border-t border-border pt-2 flex justify-between font-semibold">
                              <span>Итого (примерно)</span>
                              <span className="text-gradient font-display">{grandTotal} BYN</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* New order button */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6">
        <Button
          onClick={() => navigate('/order')}
          className="w-full gradient-primary glow-primary text-primary-foreground font-semibold h-12 rounded-xl border-0 hover:opacity-90"
        >
          Новый заказ <ArrowRight size={16} className="ml-1.5" />
        </Button>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
