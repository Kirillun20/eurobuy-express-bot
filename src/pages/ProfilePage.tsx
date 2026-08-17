import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveUser, logout as clearCache } from '@/lib/store';
import { getOrdersByProfile, spendEuroPointsDb, getProfile } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import {
  Order, ORDER_STATUS_LABELS, ORDER_STATUS_DESCRIPTIONS, ALL_STATUSES, User,
  DELIVERY_METHODS, PAYMENT_METHODS, roundBYN, EUROPOINTS_REWARDS, EuroPointsReward,
} from '@/lib/types';
import { toast } from 'sonner';
import {
  LogOut, User as UserIcon, Package, Clock, CheckCircle2, Truck,
  ShieldCheck, MapPin, ArrowRight, ArrowLeft, Copy, ChevronDown, ChevronUp,
  Search, Gift, Coins, Tag, Sparkles, Mail, Phone as PhoneIcon, Lock, Eye, EyeOff,
  LogIn, UserPlus, Zap, Globe, Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const STATUS_ICONS: Record<string, typeof Package> = {
  pending: Clock, confirmed: CheckCircle2, purchased: ShieldCheck,
  shipped: Truck, customs: MapPin, delivered: CheckCircle2,
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-accent/10 text-accent border-accent/25',
  confirmed: 'bg-primary/10 text-primary border-primary/25',
  purchased: 'bg-primary/10 text-primary border-primary/25',
  shipped: 'bg-accent/10 text-accent border-accent/25',
  customs: 'bg-destructive/10 text-destructive border-destructive/25',
  delivered: 'bg-primary/10 text-primary border-primary/25',
};

type ProfileTab = 'orders' | 'points';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser, signOut, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [trackSearch, setTrackSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ProfileTab>('orders');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      getOrdersByProfile(user.id).then(o => { setOrders(o); setLoading(false); });
      getProfile(user.id).then(p => {
        if (p) {
          const updated = { ...user, euroPoints: p.euroPoints };
          setUser(updated);
          saveUser(updated);
        }
      });
    }
  }, [user?.id]);

  const handleAuth = async () => {
    if (!form.email || !form.password) { toast.error('Заполните все поля'); return; }
    if (form.password.length < 6) { toast.error('Пароль должен быть не менее 6 символов'); return; }
    if (!isLogin && !form.name) { toast.error('Укажите имя'); return; }
    if (!isLogin && !form.phone) { toast.error('Укажите телефон'); return; }
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) {
          toast.error(error.message === 'Invalid login credentials' ? 'Неверный email или пароль' : error.message);
        } else {
          toast.success('Вход выполнен!');
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/profile`,
            data: { name: form.name.trim(), phone: form.phone.trim() },
          },
        });
        if (error) {
          if (error.message.includes('already registered')) toast.error('Email уже зарегистрирован. Войдите.');
          else if (error.message.toLowerCase().includes('pwned') || error.message.toLowerCase().includes('compromised')) toast.error('Этот пароль был скомпрометирован. Выберите другой.');
          else toast.error(error.message);
        } else {
          toast.success('Регистрация успешна!');
        }
      }
    } catch (e: any) {
      toast.error(e?.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => { await signOut(); setOrders([]); toast.info('Вы вышли из аккаунта'); };

  const handleRedeemReward = async (reward: EuroPointsReward) => {
    if (!user) return;
    if ((user.euroPoints || 0) < reward.cost) {
      toast.error(`Недостаточно баллов. Нужно ${reward.cost}, у вас ${user.euroPoints || 0}`);
      return;
    }
    const success = await spendEuroPointsDb(user.id, reward.cost);
    if (success) {
      const updated = { ...user, euroPoints: (user.euroPoints || 0) - reward.cost };
      setUser(updated);
      saveUser(updated);
      toast.success(`🎉 Вы активировали "${reward.name}"!`);
    }
  };

  const inputClass = "bg-card border border-border h-11 rounded-xl";

  const filteredOrders = trackSearch
    ? orders.filter(o => o.trackNumber?.toLowerCase().includes(trackSearch.toLowerCase()) || o.id.includes(trackSearch))
    : orders;

  if (!user) {
    const perks = [
      { icon: Coins, title: 'ЕвроБаллы', text: '1 балл за каждые 10 BYN' },
      { icon: Truck, title: 'Трекинг', text: 'Отслеживание заказов в реальном времени' },
      { icon: Gift, title: 'Скидки', text: 'Обменивай баллы на бонусы' },
    ];

    return (
      <div className="px-4 py-6 pb-24 max-w-lg mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center mx-auto mb-4 relative"
          >
            <UserIcon size={36} className="text-primary-foreground" />
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-accent flex items-center justify-center shadow-sm">
              <Sparkles size={14} className="text-accent-foreground" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-display font-semibold text-primary">EuroBuy</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {isLogin ? 'С возвращением! Войдите в аккаунт' : 'Создайте аккаунт за 30 секунд'}
          </p>
        </motion.div>

        {/* Tab switcher */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative bg-card border border-border rounded-2xl p-1.5 mb-5 flex"
        >
          {([
            { id: true, label: 'Вход', icon: LogIn },
            { id: false, label: 'Регистрация', icon: UserPlus },
          ] as const).map(t => (
            <button
              key={String(t.id)}
              onClick={() => setIsLogin(t.id)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isLogin === t.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isLogin === t.id && (
                <motion.div
                  layoutId="auth-tab"
                  className="absolute inset-0 gradient-primary rounded-xl"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              <t.icon size={14} className="relative z-10" />
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Form card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? 'login' : 'register'}
            initial={{ opacity: 0, x: isLogin ? -15 : 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isLogin ? 15 : -15 }}
            transition={{ duration: 0.2 }}
            className="relative bg-card border border-border rounded-2xl p-5 space-y-3.5 mb-5"
          >
            {!isLogin && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <UserIcon size={12} /> Как вас зовут?
                </Label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    placeholder="Иван Иванов"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail size={12} /> Email
              </Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <PhoneIcon size={12} /> Телефон
                </Label>
                <div className="relative">
                  <PhoneIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    type="tel"
                    placeholder="+375 29 ..."
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Lock size={12} /> Пароль
              </Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className={`${inputClass} pl-10 pr-10`}
                  onKeyDown={e => e.key === 'Enter' && handleAuth()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleAuth}
              disabled={loading}
              className="w-full gradient-primary text-primary-foreground font-semibold h-12 rounded-xl border-0 mt-2 group"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Загрузка...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? <LogIn size={16} /> : <UserPlus size={16} />}
                  {isLogin ? 'Войти в аккаунт' : 'Создать аккаунт'}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center pt-1">
              {isLogin ? (
                <>Нет аккаунта? <button onClick={() => setIsLogin(false)} className="text-primary hover:underline font-medium">Зарегистрируйтесь</button></>
              ) : (
                <>Регистрируясь, вы соглашаетесь с условиями сервиса</>
              )}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Perks */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2.5"
        >
          <p className="text-[11px] text-muted-foreground text-center uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
            <Star size={11} className="text-accent fill-accent" />
            Что вы получите
            <Star size={11} className="text-accent fill-accent" />
          </p>
          {perks.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.07 }}
              className="bg-card border border-border rounded-xl p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/12 flex items-center justify-center flex-shrink-0">
                <p.icon size={18} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{p.title}</p>
                <p className="text-[11px] text-muted-foreground">{p.text}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick browse */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-5 flex items-center justify-center gap-2"
        >
          <button
            onClick={() => navigate('/calculator')}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border"
          >
            <Zap size={12} /> Калькулятор
          </button>
          <button
            onClick={() => navigate('/about')}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border"
          >
            <Globe size={12} /> О сервисе
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-20 max-w-lg mx-auto">
      {/* User card */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-lg font-display font-bold text-primary-foreground">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="font-display font-semibold">{user.name}</h2>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive rounded-xl"><LogOut size={18} /></Button>
        </div>
      </motion.div>

      {/* EuroPoints */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-accent/12 flex items-center justify-center">
              <Coins size={22} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ваши ЕвроБаллы</p>
              <p className="text-2xl font-display font-bold text-accent">{user.euroPoints || 0}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">1 балл за каждые 10 BYN</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: 'Заказов', value: orders.length },
          { label: 'В пути', value: orders.filter(o => ['shipped', 'customs'].includes(o.status)).length },
          { label: 'Доставлено', value: orders.filter(o => o.status === 'delivered').length },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-2.5 text-center">
            <div className="text-lg font-display font-bold text-primary">{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {([
          { id: 'orders' as ProfileTab, label: 'Мои заказы', icon: Package },
          { id: 'points' as ProfileTab, label: 'ЕвроБаллы', icon: Gift },
        ]).map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex-1 justify-center ${
                activeTab === tab.id ? 'gradient-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}>
              <Icon size={14} />{tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'orders' && (
          <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Поиск по трек-номеру..." value={trackSearch} onChange={e => setTrackSearch(e.target.value)} className="bg-card border border-border h-10 rounded-xl pl-10" />
            </div>

            {loading ? (
              <div className="text-center py-12 text-sm text-muted-foreground">Загрузка...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"><Package size={28} className="text-primary" /></div>
                <p className="text-sm text-muted-foreground mb-4">{trackSearch ? 'Заказ не найден' : 'У вас пока нет заказов'}</p>
                {!trackSearch && <Button onClick={() => navigate('/order')} className="gradient-primary text-primary-foreground rounded-xl border-0">Сделать заказ <ArrowRight size={16} className="ml-1.5" /></Button>}
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
                    <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                      className="bg-card border border-border rounded-xl overflow-hidden">
                      <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)} className="w-full p-4 text-left">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{order.items?.[0]?.name || order.items?.[0]?.link || 'Заказ'}{(order.items?.length || 0) > 1 && ` +${(order.items?.length || 1) - 1}`}</p>
                            <p className="text-[11px] text-muted-foreground">{order.trackNumber && `${order.trackNumber} · `}{new Date(order.createdAt).toLocaleDateString('ru-RU')}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border ${STATUS_COLORS[order.status]}`}>
                              <Icon size={11} />{ORDER_STATUS_LABELS[order.status]}
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
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-4 pb-4 space-y-4">
                              {order.trackNumber && (
                                <div className="bg-background border border-border rounded-xl p-3 flex items-center justify-between">
                                  <div><p className="text-[10px] text-muted-foreground">Трек-номер</p><p className="font-display font-bold text-primary">{order.trackNumber}</p></div>
                                  <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(order.trackNumber); toast.success('Скопировано!'); }} className="p-2 rounded-lg bg-card border border-border"><Copy size={14} className="text-muted-foreground" /></button>
                                </div>
                              )}
                              <div className="bg-background border border-border rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-1"><Icon size={14} className="text-primary" /><span className="text-xs font-semibold">{ORDER_STATUS_LABELS[order.status]}</span></div>
                                <p className="text-[11px] text-muted-foreground">{ORDER_STATUS_DESCRIPTIONS[order.status]}</p>
                                {order.estimatedDelivery && order.status !== 'delivered' && (
                                  <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1"><Clock size={10} />Ожидаемая доставка: {new Date(order.estimatedDelivery).toLocaleDateString('ru-RU')}</p>
                                )}
                              </div>

                              <div>
                                <p className="text-xs font-medium mb-3">История статусов</p>
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
                                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isCurrent ? 'gradient-primary' : isPast ? 'bg-primary/20' : 'bg-muted'}`}>
                                            <StatusIcon size={12} className={isPast ? 'text-primary-foreground' : 'text-muted-foreground'} />
                                          </div>
                                          {sIdx < ALL_STATUSES.length - 1 && <div className={`w-0.5 h-6 ${isPast ? 'bg-primary/40' : 'bg-border'}`} />}
                                        </div>
                                        <div className="pt-1">
                                          <p className={`text-xs font-medium ${isPast ? 'text-foreground' : 'text-muted-foreground'}`}>{ORDER_STATUS_LABELS[status]}</p>
                                          <p className="text-[10px] text-muted-foreground">{ORDER_STATUS_DESCRIPTIONS[status]}</p>
                                          {historyEntry && (
                                            <p className="text-[10px] text-primary/70 mt-0.5">
                                              {new Date(historyEntry.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                              {historyEntry.comment && ` · ${historyEntry.comment}`}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between"><span className="text-muted-foreground">Доставка</span><span>{dm?.name || order.deliveryMethod}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Оплата</span><span>{pm?.name || order.paymentMethod}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Товары</span><span>{order.totalPriceBYN || 0} BYN</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Сервис</span><span>{order.totalServiceBYN || 0} BYN</span></div>
                                {order.pointsEarned && order.pointsEarned > 0 && (
                                  <div className="flex justify-between text-accent"><span className="flex items-center gap-1"><Coins size={10} /> Начислено</span><span>+{order.pointsEarned}</span></div>
                                )}
                                <div className="border-t border-border pt-2 flex justify-between font-semibold"><span>Итого</span><span className="text-primary font-display">{grandTotal} BYN</span></div>
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
        )}

        {activeTab === 'points' && (
          <motion.div key="points" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="bg-card border border-border rounded-2xl p-4 mb-4">
              <h3 className="font-display font-bold text-sm mb-2 flex items-center gap-2"><Sparkles size={14} className="text-primary" />Как работают ЕвроБаллы?</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>• За каждые 50 BYN в заказе вы получаете 1 балл</p>
                <p>• Баллы начисляются автоматически</p>
                <p>• Обменивайте баллы на скидки</p>
              </div>
            </div>

            <h3 className="font-display font-bold text-lg mb-3">Обменять баллы</h3>
            <div className="space-y-3">
              {EUROPOINTS_REWARDS.map(reward => {
                const canAfford = (user.euroPoints || 0) >= reward.cost;
                return (
                  <div key={reward.id}
                    className={`bg-card border border-border rounded-xl p-4 transition-opacity ${canAfford ? '' : 'opacity-60'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${reward.type === 'delivery_discount' ? 'bg-primary/12' : 'bg-accent/12'}`}>
                          {reward.type === 'delivery_discount' ? <Truck size={18} className="text-primary" /> : <Tag size={18} className="text-accent" />}
                        </div>
                        <div><p className="text-sm font-semibold">{reward.name}</p><p className="text-[11px] text-muted-foreground">{reward.description}</p></div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm font-display font-bold text-accent mb-1"><Coins size={14} /> {reward.cost}</div>
                        <Button size="sm" disabled={!canAfford} onClick={() => handleRedeemReward(reward)}
                          className={`text-[10px] h-7 rounded-lg px-3 ${canAfford ? 'gradient-primary text-primary-foreground border-0' : 'bg-background text-muted-foreground border border-border'}`}>
                          Обменять
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-card border border-border rounded-xl p-4 mt-4 text-center">
              <Coins size={24} className="text-accent mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">У вас <span className="font-bold text-foreground">{user.euroPoints || 0}</span> ЕвроБаллов</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-6">
        <Button onClick={() => navigate('/order')} className="w-full gradient-primary text-primary-foreground font-semibold h-12 rounded-xl border-0">
          Новый заказ <ArrowRight size={16} className="ml-1.5" />
        </Button>
      </motion.div>
    </div>
  );
};

export default ProfilePage;